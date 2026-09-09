-- Market-integrity guardrails for Space Coins.
-- Prices, reserves, market cap, volume and holder count are server-owned state.
-- Creator clients may edit presentation metadata, but cannot manufacture market state.

begin;

create index if not exists space_coin_ticks_coin_created_at_idx
  on public.space_coin_ticks (coin_id, created_at desc);

create index if not exists space_coin_trades_coin_created_at_idx
  on public.space_coin_trades (coin_id, created_at desc);

create index if not exists space_coin_trades_coin_closed_at_idx
  on public.space_coin_trades (coin_id, closed_at desc)
  where closed_at is not null;

create or replace function public.space_coin_rolling_volume(p_coin_id uuid)
returns numeric
language sql
volatile
set search_path = public, pg_temp
as $function$
  select
    coalesce((
      select sum(t.notional)
      from public.space_coin_trades t
      where t.coin_id = p_coin_id
        and t.status in ('open', 'closed', 'filled')
        and t.created_at >= clock_timestamp() - interval '24 hours'
    ), 0)
    + coalesce((
      select sum(t.close_notional)
      from public.space_coin_trades t
      where t.coin_id = p_coin_id
        and t.status = 'closed'
        and t.close_notional is not null
        and t.closed_at >= clock_timestamp() - interval '24 hours'
    ), 0);
$function$;

revoke all on function public.space_coin_rolling_volume(uuid) from public, anon, authenticated;

drop function if exists public.space_coin_market_state_guard();
create function public.space_coin_market_state_guard()
returns trigger
language plpgsql
set search_path = public, auth, pg_temp
as $function$
declare
  v_holders integer;
begin
  if tg_op = 'INSERT' then
    -- Creation clients may provide presentation metadata and total supply, but all
    -- live market state is initialized deterministically by the database.
    new.current_price := new.initial_price;
    new.price_change_24h := 0;
    new.market_cap := new.total_supply * new.initial_price;
    new.volume_24h := 0;
    new.holder_count := 0;
    new.token_reserve := new.total_supply * 0.5;
    new.quote_reserve := new.token_reserve * new.initial_price;
  elsif current_user = 'authenticated' then
    -- Only SECURITY DEFINER market/close RPCs and trusted service writers may change
    -- price/reserve fields. A normal authenticated client cannot spoof the market.
    if new.creator_id is distinct from old.creator_id
       or new.total_supply is distinct from old.total_supply
       or new.initial_price is distinct from old.initial_price
       or new.current_price is distinct from old.current_price
       or new.price_change_24h is distinct from old.price_change_24h
       or new.market_cap is distinct from old.market_cap
       or new.volume_24h is distinct from old.volume_24h
       or new.holder_count is distinct from old.holder_count
       or new.token_reserve is distinct from old.token_reserve
       or new.quote_reserve is distinct from old.quote_reserve then
      raise exception 'Market state is server-owned and can only change through the trading engine';
    end if;
  end if;

  select count(*)::integer into v_holders
  from public.space_coin_accounts a
  where coalesce(nullif(a.token_balances ->> new.id::text, '')::numeric, 0) > 0;

  if tg_op = 'UPDATE' then
    new.volume_24h := public.space_coin_rolling_volume(new.id);
    new.holder_count := coalesce(v_holders, 0);
  else
    new.volume_24h := 0;
    new.holder_count := 0;
  end if;

  return new;
end;
$function$;

revoke all on function public.space_coin_market_state_guard() from public, anon, authenticated;

drop trigger if exists trg_space_coin_market_state_guard on public.space_coins;
create trigger trg_space_coin_market_state_guard
before insert or update on public.space_coins
for each row execute function public.space_coin_market_state_guard();

commit;
