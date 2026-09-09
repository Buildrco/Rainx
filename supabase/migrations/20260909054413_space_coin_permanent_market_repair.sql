-- Permanent Space Coin market repair.
-- 1) Preserve and remove the corrupted RXC test-market rows.
-- 2) Rebuild virtual account balances from surviving positions.
-- 3) Prevent any client from changing a position's original side.
-- 4) Keep tick writes authoritative: coin creation seeds its first tick through a SECURITY DEFINER RPC.
-- 5) Make new trades explicitly use the current liquidity engine version.

begin;

create table if not exists public.space_coin_trade_repair_archive (
  archived_at timestamptz not null default clock_timestamp(),
  reason text not null,
  trade jsonb not null
);

create table if not exists public.space_coin_tick_repair_archive (
  archived_at timestamptz not null default clock_timestamp(),
  reason text not null,
  tick jsonb not null
);

revoke all on table public.space_coin_trade_repair_archive from public, anon, authenticated;
revoke all on table public.space_coin_tick_repair_archive from public, anon, authenticated;

insert into public.space_coin_trade_repair_archive(reason, trade)
select
  'RXC market/account corruption repair 2026-09-09',
  to_jsonb(t)
from public.space_coin_trades t
join public.space_coins c on c.id = t.coin_id
where upper(c.symbol) = 'RXC';

insert into public.space_coin_tick_repair_archive(reason, tick)
select
  'RXC chart corruption repair 2026-09-09',
  to_jsonb(t)
from public.space_coin_ticks t
join public.space_coins c on c.id = t.coin_id
where upper(c.symbol) = 'RXC';

-- RXC is the only market containing the giant legacy quantities/duplicate test rows
-- found during the audit. Resetting only this market removes false price history without
-- touching the separate HLC market or unrelated RainX data.
delete from public.space_coin_trades t
using public.space_coins c
where t.coin_id = c.id and upper(c.symbol) = 'RXC';

delete from public.space_coin_ticks t
using public.space_coins c
where t.coin_id = c.id and upper(c.symbol) = 'RXC';

-- Rebuild virtual accounts from their remaining open/closed positions. This removes
-- cash/token contamination left by deleted RXC test trades while preserving other coins.
do $do$
declare
  a record;
  tr record;
  v_cash numeric;
  v_balances jsonb;
  v_key text;
  v_existing numeric;
  v_delta numeric;
  v_close_delta numeric;
begin
  for a in
    select id from public.space_coin_accounts order by id
  loop
    v_cash := 10000;
    v_balances := '{}'::jsonb;

    for tr in
      select coin_id, side, quantity, notional, status, close_notional
      from public.space_coin_trades
      where account_id = a.id
        and status in ('open', 'closed')
      order by created_at asc, id asc
    loop
      if tr.side = 'buy' then
        v_cash := v_cash - coalesce(tr.notional, 0);
        v_delta := coalesce(tr.quantity, 0);
      else
        v_cash := v_cash + coalesce(tr.notional, 0);
        v_delta := -coalesce(tr.quantity, 0);
      end if;

      v_key := tr.coin_id::text;
      v_existing := coalesce(nullif(v_balances ->> v_key, '')::numeric, 0);
      v_balances := jsonb_set(v_balances, array[v_key], to_jsonb(greatest(0, v_existing + v_delta)), true);

      if tr.status = 'closed' and tr.close_notional is not null then
        if tr.side = 'buy' then
          v_cash := v_cash + tr.close_notional;
          v_close_delta := -coalesce(tr.quantity, 0);
        else
          v_cash := v_cash - tr.close_notional;
          v_close_delta := coalesce(tr.quantity, 0);
        end if;
        v_existing := coalesce(nullif(v_balances ->> v_key, '')::numeric, 0);
        v_balances := jsonb_set(v_balances, array[v_key], to_jsonb(greatest(0, v_existing + v_close_delta)), true);
      end if;
    end loop;

    update public.space_coin_accounts
    set cash_balance = greatest(0, v_cash),
        token_balances = v_balances,
        updated_at = clock_timestamp()
    where id = a.id;
  end loop;
end;
$do$;

update public.space_coins
set initial_price = greatest(initial_price, 0.000000000001),
    current_price = greatest(initial_price, 0.000000000001),
    price_change_24h = 0,
    market_cap = total_supply * greatest(initial_price, 0.000000000001),
    volume_24h = 0,
    holder_count = 0,
    token_reserve = total_supply * 0.5,
    quote_reserve = total_supply * 0.5 * greatest(initial_price, 0.000000000001),
    updated_at = clock_timestamp()
where upper(symbol) = 'RXC';

insert into public.space_coin_ticks (coin_id, price, open, high, low, close)
select id, initial_price, initial_price, initial_price, initial_price, initial_price
from public.space_coins
where upper(symbol) = 'RXC';

-- Calculate holder counts from the rebuilt account balances.
update public.space_coins c
set holder_count = (
  select count(*)
  from public.space_coin_accounts a
  where coalesce(nullif(a.token_balances ->> c.id::text, '')::numeric, 0) > 0
);

create or replace function public.space_coin_seed_initial_tick(
  p_coin_id uuid,
  p_price numeric
)
returns public.space_coin_ticks
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_coin public.space_coins;
  v_tick public.space_coin_ticks;
begin
  if auth.uid() is null then raise exception 'Sign in to create a Space Coin'; end if;
  if p_price is null or p_price <= 0 then raise exception 'Price must be positive'; end if;

  select * into v_coin
  from public.space_coins
  where id = p_coin_id
    and creator_id = auth.uid()
    and status = 'live'
  for update;

  if v_coin.id is null then raise exception 'Coin not found'; end if;
  if abs(p_price - v_coin.current_price) > greatest(v_coin.current_price * 0.000001, 0.000000000001) then
    raise exception 'Initial tick price does not match the market price';
  end if;

  insert into public.space_coin_ticks(coin_id, price, open, high, low, close)
  values (v_coin.id, v_coin.current_price, v_coin.current_price, v_coin.current_price, v_coin.current_price, v_coin.current_price)
  returning * into v_tick;
  return v_tick;
end;
$function$;

revoke execute on function public.space_coin_seed_initial_tick(uuid, numeric) from public, anon;
grant execute on function public.space_coin_seed_initial_tick(uuid, numeric) to authenticated;

-- Direct authenticated tick insertion would let a client manufacture chart prices.
-- Trade/close RPCs are SECURITY DEFINER and can continue to write authoritative ticks.
drop policy if exists space_coin_ticks_authenticated_insert on public.space_coin_ticks;

alter table public.space_coin_trades
  alter column engine_version set default 3;

create or replace function public.lock_space_coin_position_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.id <> old.id
     or new.account_id <> old.account_id
     or new.user_id is distinct from old.user_id
     or new.coin_id <> old.coin_id
     or new.mode <> old.mode
     or new.side <> old.side
     or new.quantity <> old.quantity
     or new.price <> old.price
     or new.notional <> old.notional
     or new.created_at <> old.created_at then
    raise exception 'Position identity is immutable; a Buy position cannot become a Sell position';
  end if;

  if old.status = 'closed' and new.status <> 'closed' then
    raise exception 'Closed positions cannot be reopened';
  end if;

  return new;
end;
$function$;

revoke all on function public.lock_space_coin_position_identity() from public, anon, authenticated;

drop trigger if exists trg_lock_space_coin_position_identity on public.space_coin_trades;
create trigger trg_lock_space_coin_position_identity
before update on public.space_coin_trades
for each row execute function public.lock_space_coin_position_identity();

commit;
