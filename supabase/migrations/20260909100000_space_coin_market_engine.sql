-- Make Space Coin pricing quote-aware and keep all account/market changes atomic.
-- Existing trades are preserved. The repair below only reconciles the stored
-- market snapshot with capital represented by still-open positions.

begin;

alter table public.space_coin_trades
  add column if not exists engine_version integer not null default 1;

alter table public.space_coin_trades
  add column if not exists close_notional numeric;

update public.space_coin_trades
set close_notional = close_price * quantity
where close_notional is null
  and close_price is not null
  and status = 'closed';

-- Repair the stored snapshot without rewriting any historical trade prices.
-- Open buy notional adds quote capital to the market capitalization; open sell
-- notional removes it. This is the same deterministic flow model used below.
create temporary table _space_coin_market_repair on commit drop as
select
  c.id,
  c.current_price as old_price,
  greatest(
    c.initial_price * c.total_supply,
    c.initial_price * c.total_supply
      + coalesce(sum(
          case
            when t.status in ('open', 'filled') and t.side = 'buy' then t.notional
            when t.status in ('open', 'filled') and t.side = 'sell' then -t.notional
            else 0
          end
        ), 0)
  ) as repaired_market_cap
from public.space_coins c
left join public.space_coin_trades t on t.coin_id = c.id
group by c.id, c.current_price, c.initial_price, c.total_supply;

insert into public.space_coin_ticks (coin_id, price, open, high, low, close)
select
  r.id,
  r.repaired_market_cap / c.total_supply,
  r.old_price,
  greatest(r.old_price, r.repaired_market_cap / c.total_supply),
  least(r.old_price, r.repaired_market_cap / c.total_supply),
  r.repaired_market_cap / c.total_supply
from _space_coin_market_repair r
join public.space_coins c on c.id = r.id
where r.old_price is distinct from r.repaired_market_cap / c.total_supply;

update public.space_coins c
set current_price = r.repaired_market_cap / c.total_supply,
    market_cap = r.repaired_market_cap,
    volume_24h = coalesce((
      select sum(
        coalesce(t.notional, 0)
        + case
            when t.status = 'closed'
              then coalesce(t.close_notional, t.close_price * t.quantity, 0)
            else 0
          end
      )
      from public.space_coin_trades t
      where t.coin_id = c.id
        and t.created_at >= now() - interval '24 hours'
    ), 0),
    updated_at = now()
from _space_coin_market_repair r
where c.id = r.id;

create or replace function public.execute_space_coin_trade(
  p_account_key text,
  p_mode text,
  p_coin_id uuid,
  p_side text,
  p_quantity numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_account public.space_coin_accounts;
  v_coin public.space_coins;
  v_trade public.space_coin_trades;
  v_balance_key text;
  v_balances jsonb;
  v_existing_balance numeric;
  v_next_balance numeric;
  v_execution_price numeric;
  v_notional numeric;
  v_floor_market_cap numeric;
  v_market_cap numeric;
  v_market_price numeric;
  v_reference_price numeric;
  v_volume_24h numeric;
  v_now timestamptz := clock_timestamp();
begin
  if auth.uid() is null then raise exception 'Sign in to trade'; end if;
  if p_mode not in ('demo', 'real') then raise exception 'Invalid account mode'; end if;
  if p_side not in ('buy', 'sell') then raise exception 'Invalid trade side'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Lot size must be positive'; end if;
  if trim(p_account_key) <> p_mode || ':' || auth.uid()::text then
    raise exception 'Invalid trading account';
  end if;

  -- The coin row is the market lock. Every order for a coin serializes here.
  select * into v_coin
  from public.space_coins
  where id = p_coin_id and status = 'live'
  for update;
  if v_coin.id is null then raise exception 'Coin not found'; end if;

  select * into v_account
  from public.space_coin_accounts
  where account_key = trim(p_account_key)
    and user_id = auth.uid()
    and mode = p_mode
  for update;
  if v_account.id is null then
    insert into public.space_coin_accounts(user_id, account_key, mode)
    values (auth.uid(), trim(p_account_key), p_mode)
    returning * into v_account;
  end if;

  v_execution_price := v_coin.current_price;
  v_notional := v_execution_price * p_quantity;
  if p_side = 'buy' and v_account.cash_balance < v_notional then
    raise exception 'Insufficient account balance';
  end if;

  v_balances := coalesce(v_account.token_balances, '{}'::jsonb);
  v_balance_key := case
    when v_balances ? v_coin.id::text then v_coin.id::text
    when v_balances ? v_coin.symbol then v_coin.symbol
    else v_coin.id::text
  end;
  v_existing_balance := coalesce(nullif(v_balances ->> v_balance_key, '')::numeric, 0);
  if p_side = 'sell' and v_existing_balance < p_quantity then
    raise exception 'Insufficient token balance';
  end if;

  v_next_balance := case
    when p_side = 'buy' then v_existing_balance + p_quantity
    else v_existing_balance - p_quantity
  end;
  v_balances := jsonb_set(v_balances, array[v_balance_key], to_jsonb(v_next_balance), true);

  update public.space_coin_accounts
  set cash_balance = case
        when p_side = 'buy' then v_account.cash_balance - v_notional
        else v_account.cash_balance + v_notional
      end,
      token_balances = v_balances,
      updated_at = v_now
  where id = v_account.id;

  insert into public.space_coin_trades(
    account_id, user_id, coin_id, mode, side, quantity, price, notional,
    status, engine_version
  )
  values (
    v_account.id, auth.uid(), v_coin.id, p_mode, p_side, p_quantity,
    v_execution_price, v_notional, 'open', 2
  )
  returning * into v_trade;

  -- Market capitalization is the quote-capital depth. A buy adds its actual
  -- USD notional; a sell removes it. No random movement or arbitrary cap.
  v_floor_market_cap := v_coin.initial_price * v_coin.total_supply;
  v_market_cap := greatest(
    v_floor_market_cap,
    v_coin.current_price * v_coin.total_supply
      + case when p_side = 'buy' then v_notional else -v_notional end
  );
  v_market_price := v_market_cap / v_coin.total_supply;

  insert into public.space_coin_ticks(coin_id, price, open, high, low, close)
  values (
    v_coin.id,
    v_market_price,
    v_execution_price,
    greatest(v_execution_price, v_market_price),
    least(v_execution_price, v_market_price),
    v_market_price
  );

  select close into v_reference_price
  from public.space_coin_ticks
  where coin_id = v_coin.id
    and created_at <= v_now - interval '24 hours'
  order by created_at desc
  limit 1;
  v_reference_price := coalesce(v_reference_price, v_coin.initial_price);

  select coalesce(sum(
    coalesce(t.notional, 0)
      + case
          when t.status = 'closed'
            then coalesce(t.close_notional, t.close_price * t.quantity, 0)
          else 0
        end
  ), 0)
  into v_volume_24h
  from public.space_coin_trades t
  where t.coin_id = v_coin.id
    and t.created_at >= v_now - interval '24 hours';

  update public.space_coins
  set current_price = v_market_price,
      price_change_24h = case
        when v_reference_price > 0
          then ((v_market_price - v_reference_price) / v_reference_price) * 100
        else 0
      end,
      market_cap = v_market_cap,
      volume_24h = v_volume_24h,
      updated_at = v_now
  where id = v_coin.id;

  return jsonb_build_object(
    'trade_id', v_trade.id,
    'account_id', v_account.id,
    'mode', p_mode,
    'side', p_side,
    'lot_quantity', p_quantity,
    'token_quantity', p_quantity,
    'execution_price', v_execution_price,
    'price', v_execution_price,
    'resulting_market_price', v_market_price,
    'market_price', v_market_price,
    'notional', v_notional,
    'account_balance', case
      when p_side = 'buy' then v_account.cash_balance - v_notional
      else v_account.cash_balance + v_notional
    end,
    'cash_balance', case
      when p_side = 'buy' then v_account.cash_balance - v_notional
      else v_account.cash_balance + v_notional
    end,
    'token_balance', v_next_balance,
    'token_balances', v_balances,
    'symbol', v_coin.symbol
  );
end;
$function$;

create or replace function public.close_space_coin_trade(
  p_trade_id uuid,
  p_close_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_trade public.space_coin_trades;
  v_account public.space_coin_accounts;
  v_coin public.space_coins;
  v_balance_key text;
  v_balances jsonb;
  v_existing_balance numeric;
  v_next_balance numeric;
  v_opening_cash numeric;
  v_execution_price numeric;
  v_close_notional numeric;
  v_pnl numeric;
  v_new_balance numeric;
  v_floor_market_cap numeric;
  v_market_cap numeric;
  v_market_price numeric;
  v_reference_price numeric;
  v_volume_24h numeric;
  v_updated_trade public.space_coin_trades;
  v_now timestamptz := clock_timestamp();
begin
  if auth.uid() is null then raise exception 'Sign in to close an order'; end if;

  select * into v_trade
  from public.space_coin_trades
  where id = p_trade_id and user_id = auth.uid()
  for update;
  if v_trade.id is null then raise exception 'Order not found'; end if;
  if coalesce(v_trade.status, 'open') <> 'open' then
    raise exception 'Order is already closed';
  end if;

  select * into v_coin
  from public.space_coins
  where id = v_trade.coin_id and status = 'live'
  for update;
  if v_coin.id is null then raise exception 'Coin not found'; end if;

  select * into v_account
  from public.space_coin_accounts
  where id = v_trade.account_id and user_id = auth.uid()
  for update;
  if v_account.id is null then raise exception 'Trading account not found'; end if;

  -- The server price is authoritative; the legacy argument is ignored.
  v_execution_price := v_coin.current_price;
  v_close_notional := v_execution_price * v_trade.quantity;
  v_pnl := case
    when v_trade.side = 'buy' then v_close_notional - v_trade.notional
    else v_trade.notional - v_close_notional
  end;

  v_balances := coalesce(v_account.token_balances, '{}'::jsonb);
  v_balance_key := case
    when v_balances ? v_coin.id::text then v_coin.id::text
    when v_balances ? v_coin.symbol then v_coin.symbol
    else v_coin.id::text
  end;
  v_existing_balance := coalesce(nullif(v_balances ->> v_balance_key, '')::numeric, 0);

  if v_trade.engine_version >= 2 then
    if v_trade.side = 'buy' and v_existing_balance < v_trade.quantity then
      raise exception 'Insufficient token balance for close';
    end if;
    if v_trade.side = 'sell' and v_account.cash_balance < v_close_notional then
      raise exception 'Insufficient account balance for close';
    end if;
    v_next_balance := case
      when v_trade.side = 'buy' then v_existing_balance - v_trade.quantity
      else v_existing_balance + v_trade.quantity
    end;
    v_new_balance := case
      when v_trade.side = 'buy' then v_account.cash_balance + v_close_notional
      else v_account.cash_balance - v_close_notional
    end;
  else
    -- Legacy positions were opened with collateral debited for both sides.
    v_next_balance := case
      when v_trade.side = 'buy' and v_existing_balance >= v_trade.quantity
        then v_existing_balance - v_trade.quantity
      when v_trade.side = 'sell' then v_existing_balance + v_trade.quantity
      else v_existing_balance
    end;
    v_new_balance := case
      when v_trade.side = 'buy' then v_account.cash_balance + v_close_notional
      else v_account.cash_balance + v_trade.notional + v_pnl
    end;
  end if;

  v_balances := jsonb_set(v_balances, array[v_balance_key], to_jsonb(v_next_balance), true);
  update public.space_coin_accounts
  set cash_balance = v_new_balance,
      token_balances = v_balances,
      updated_at = v_now
  where id = v_account.id;

  update public.space_coin_trades
  set status = 'closed',
      close_price = v_execution_price,
      close_notional = v_close_notional,
      closed_at = v_now
  where id = v_trade.id
  returning * into v_updated_trade;

  -- Closing a buy is sell flow; closing a sell is buy flow.
  v_floor_market_cap := v_coin.initial_price * v_coin.total_supply;
  v_market_cap := greatest(
    v_floor_market_cap,
    v_coin.current_price * v_coin.total_supply
      + case when v_trade.side = 'buy' then -v_close_notional else v_close_notional end
  );
  v_market_price := v_market_cap / v_coin.total_supply;

  insert into public.space_coin_ticks(coin_id, price, open, high, low, close)
  values (
    v_coin.id,
    v_market_price,
    v_execution_price,
    greatest(v_execution_price, v_market_price),
    least(v_execution_price, v_market_price),
    v_market_price
  );

  select close into v_reference_price
  from public.space_coin_ticks
  where coin_id = v_coin.id
    and created_at <= v_now - interval '24 hours'
  order by created_at desc
  limit 1;
  v_reference_price := coalesce(v_reference_price, v_coin.initial_price);

  select coalesce(sum(
    coalesce(t.notional, 0)
      + case
          when t.status = 'closed'
            then coalesce(t.close_notional, t.close_price * t.quantity, 0)
          else 0
        end
  ), 0)
  into v_volume_24h
  from public.space_coin_trades t
  where t.coin_id = v_coin.id
    and t.created_at >= v_now - interval '24 hours';

  update public.space_coins
  set current_price = v_market_price,
      price_change_24h = case
        when v_reference_price > 0
          then ((v_market_price - v_reference_price) / v_reference_price) * 100
        else 0
      end,
      market_cap = v_market_cap,
      volume_24h = v_volume_24h,
      updated_at = v_now
  where id = v_coin.id;

  return jsonb_build_object(
    'trade', to_jsonb(v_updated_trade),
    'trade_id', v_updated_trade.id,
    'pnl', v_pnl,
    'execution_price', v_execution_price,
    'closing_price', v_execution_price,
    'resulting_market_price', v_market_price,
    'market_price', v_market_price,
    'notional', v_close_notional,
    'account_balance', v_new_balance,
    'cash_balance', v_new_balance,
    'token_balance', v_next_balance,
    'token_balances', v_balances,
    'closed_at', v_now
  );
end;
$function$;

-- No client can directly write an arbitrary authoritative price.
revoke execute on function public.record_space_coin_tick(uuid, numeric) from anon, authenticated;

commit;