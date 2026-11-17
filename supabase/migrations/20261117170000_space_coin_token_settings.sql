-- Persist and enforce creator-managed settings for the RainX Space Coin market.
begin;

alter table public.space_coins
  add column if not exists is_visible boolean not null default true;

create table if not exists public.space_coin_settings (
  coin_id uuid primary key references public.space_coins(id) on delete cascade,
  buy_fee_bps integer not null default 0 check (buy_fee_bps between 0 and 1000),
  sell_fee_bps integer not null default 0 check (sell_fee_bps between 0 and 1000),
  creator_fee_bps integer not null default 0 check (creator_fee_bps between 0 and 1000),
  max_transaction_pct numeric check (max_transaction_pct is null or max_transaction_pct between 0.0001 and 100),
  max_wallet_pct numeric check (max_wallet_pct is null or max_wallet_pct between 0.0001 and 100),
  trading_enabled boolean not null default true,
  whitelist_enabled boolean not null default false,
  blacklist_enabled boolean not null default false,
  whitelist_user_ids uuid[] not null default '{}',
  blacklist_user_ids uuid[] not null default '{}',
  updated_at timestamptz not null default clock_timestamp()
);

alter table public.space_coin_settings enable row level security;
revoke all on table public.space_coin_settings from public, anon, authenticated;

create table if not exists public.space_coin_fee_ledger (
  id bigserial primary key,
  coin_id uuid not null references public.space_coins(id) on delete cascade,
  trade_id uuid not null references public.space_coin_trades(id) on delete cascade,
  phase text not null check (phase in ('open', 'close')),
  trader_user_id uuid not null,
  creator_user_id uuid not null,
  platform_fee numeric not null default 0 check (platform_fee >= 0),
  creator_fee numeric not null default 0 check (creator_fee >= 0),
  created_at timestamptz not null default clock_timestamp(),
  unique (trade_id, phase)
);

alter table public.space_coin_fee_ledger enable row level security;
revoke all on table public.space_coin_fee_ledger from public, anon, authenticated;
grant select on table public.space_coin_fee_ledger to authenticated;
create policy space_coin_fee_ledger_creator_read
  on public.space_coin_fee_ledger for select to authenticated
  using (creator_user_id = auth.uid());

create or replace function public.get_space_coin_settings(p_coin_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_coin public.space_coins;
  v_settings public.space_coin_settings;
begin
  if auth.uid() is null then raise exception 'Sign in to manage token settings'; end if;
  select * into v_coin
  from public.space_coins
  where id = p_coin_id and creator_id = auth.uid()
  for share;
  if v_coin.id is null then raise exception 'Creator coin not found'; end if;

  insert into public.space_coin_settings (coin_id)
  values (v_coin.id)
  on conflict (coin_id) do nothing;

  select * into v_settings
  from public.space_coin_settings
  where coin_id = v_coin.id;

  return jsonb_build_object('coin', to_jsonb(v_coin), 'settings', to_jsonb(v_settings));
end;
$function$;

create or replace function public.update_space_coin_settings(
  p_coin_id uuid,
  p_token_info jsonb,
  p_settings jsonb,
  p_is_visible boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_coin public.space_coins;
  v_settings public.space_coin_settings;
  v_name text;
  v_symbol text;
  v_description text;
  v_buy_fee_bps integer;
  v_sell_fee_bps integer;
  v_creator_fee_bps integer;
  v_max_transaction_pct numeric;
  v_max_wallet_pct numeric;
  v_trading_enabled boolean;
  v_whitelist_enabled boolean;
  v_blacklist_enabled boolean;
  v_whitelist_user_ids uuid[];
  v_blacklist_user_ids uuid[];
  v_old_symbol text;
begin
  if auth.uid() is null then raise exception 'Sign in to manage token settings'; end if;
  select * into v_coin
  from public.space_coins
  where id = p_coin_id and creator_id = auth.uid()
  for update;
  if v_coin.id is null then raise exception 'Creator coin not found'; end if;
  if jsonb_typeof(coalesce(p_token_info, '{}'::jsonb)) <> 'object'
     or jsonb_typeof(coalesce(p_settings, '{}'::jsonb)) <> 'object' then
    raise exception 'Invalid settings payload';
  end if;

  v_name := coalesce(nullif(trim(p_token_info->>'name'), ''), v_coin.name);
  v_symbol := upper(coalesce(nullif(trim(p_token_info->>'symbol'), ''), v_coin.symbol));
  v_description := coalesce(p_token_info->>'description', v_coin.description, '');
  if char_length(v_name) > 60 then raise exception 'Token name must be 60 characters or fewer'; end if;
  if char_length(v_symbol) < 2 or char_length(v_symbol) > 12 or v_symbol !~ '^[A-Z0-9]+$' then
    raise exception 'Token symbol must contain 2–12 letters or numbers';
  end if;
  if char_length(v_description) > 500 then raise exception 'Description must be 500 characters or fewer'; end if;

  insert into public.space_coin_settings (coin_id)
  values (v_coin.id)
  on conflict (coin_id) do nothing;
  select * into v_settings from public.space_coin_settings where coin_id = v_coin.id for update;

  v_buy_fee_bps := coalesce(nullif(p_settings->>'buy_fee_bps', '')::integer, v_settings.buy_fee_bps);
  v_sell_fee_bps := coalesce(nullif(p_settings->>'sell_fee_bps', '')::integer, v_settings.sell_fee_bps);
  v_creator_fee_bps := coalesce(nullif(p_settings->>'creator_fee_bps', '')::integer, v_settings.creator_fee_bps);
  if v_buy_fee_bps not between 0 and 1000 or v_sell_fee_bps not between 0 and 1000 or v_creator_fee_bps not between 0 and 1000 then
    raise exception 'Each fee must be between 0%% and 10%%';
  end if;

  if p_settings ? 'max_transaction_pct' then
    v_max_transaction_pct := nullif(p_settings->>'max_transaction_pct', '')::numeric;
  else
    v_max_transaction_pct := v_settings.max_transaction_pct;
  end if;
  if p_settings ? 'max_wallet_pct' then
    v_max_wallet_pct := nullif(p_settings->>'max_wallet_pct', '')::numeric;
  else
    v_max_wallet_pct := v_settings.max_wallet_pct;
  end if;
  if (v_max_transaction_pct is not null and v_max_transaction_pct not between 0.0001 and 100)
     or (v_max_wallet_pct is not null and v_max_wallet_pct not between 0.0001 and 100) then
    raise exception 'Limits must be greater than 0%% and no more than 100%%';
  end if;

  v_trading_enabled := coalesce(nullif(p_settings->>'trading_enabled', '')::boolean, v_settings.trading_enabled);
  v_whitelist_enabled := coalesce(nullif(p_settings->>'whitelist_enabled', '')::boolean, v_settings.whitelist_enabled);
  v_blacklist_enabled := coalesce(nullif(p_settings->>'blacklist_enabled', '')::boolean, v_settings.blacklist_enabled);
  v_whitelist_user_ids := v_settings.whitelist_user_ids;
  v_blacklist_user_ids := v_settings.blacklist_user_ids;

  if p_settings ? 'whitelist_user_ids' then
    if jsonb_typeof(p_settings->'whitelist_user_ids') <> 'array' or jsonb_array_length(p_settings->'whitelist_user_ids') > 500 then
      raise exception 'Whitelist must be an array with at most 500 account IDs';
    end if;
    select coalesce(array_agg(value::uuid), '{}'::uuid[]) into v_whitelist_user_ids
    from jsonb_array_elements_text(p_settings->'whitelist_user_ids') as entry(value);
  end if;
  if p_settings ? 'blacklist_user_ids' then
    if jsonb_typeof(p_settings->'blacklist_user_ids') <> 'array' or jsonb_array_length(p_settings->'blacklist_user_ids') > 500 then
      raise exception 'Blacklist must be an array with at most 500 account IDs';
    end if;
    select coalesce(array_agg(value::uuid), '{}'::uuid[]) into v_blacklist_user_ids
    from jsonb_array_elements_text(p_settings->'blacklist_user_ids') as entry(value);
  end if;

  v_old_symbol := v_coin.symbol;
  update public.space_coins
  set name = v_name,
      symbol = v_symbol,
      description = v_description,
      is_visible = coalesce(p_is_visible, true),
      updated_at = clock_timestamp()
  where id = v_coin.id
  returning * into v_coin;

  -- Normalize legacy symbol-keyed balances before changing the symbol.
  if v_old_symbol is distinct from v_symbol then
    update public.space_coin_accounts a
    set token_balances = (coalesce(a.token_balances, '{}'::jsonb) - v_old_symbol)
      || jsonb_build_object(
        v_coin.id::text,
        coalesce(nullif(a.token_balances->>v_coin.id::text, '')::numeric, 0)
          + coalesce(nullif(a.token_balances->>v_old_symbol, '')::numeric, 0)
      ),
      updated_at = clock_timestamp()
    where coalesce(a.token_balances, '{}'::jsonb) ? v_old_symbol;
  end if;

  update public.space_coin_settings
  set buy_fee_bps = v_buy_fee_bps,
      sell_fee_bps = v_sell_fee_bps,
      creator_fee_bps = v_creator_fee_bps,
      max_transaction_pct = v_max_transaction_pct,
      max_wallet_pct = v_max_wallet_pct,
      trading_enabled = v_trading_enabled,
      whitelist_enabled = v_whitelist_enabled,
      blacklist_enabled = v_blacklist_enabled,
      whitelist_user_ids = v_whitelist_user_ids,
      blacklist_user_ids = v_blacklist_user_ids,
      updated_at = clock_timestamp()
  where coin_id = v_coin.id
  returning * into v_settings;

  return jsonb_build_object('coin', to_jsonb(v_coin), 'settings', to_jsonb(v_settings));
end;
$function$;

create or replace function public.enforce_space_coin_trade_settings()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_total_supply numeric;
  v_symbol text;
  v_trading_enabled boolean;
  v_max_transaction_pct numeric;
  v_max_wallet_pct numeric;
  v_whitelist_enabled boolean;
  v_blacklist_enabled boolean;
  v_whitelist_user_ids uuid[];
  v_blacklist_user_ids uuid[];
  v_balances jsonb;
  v_balance numeric;
begin
  select c.total_supply, c.symbol,
         coalesce(s.trading_enabled, true),
         s.max_transaction_pct, s.max_wallet_pct,
         coalesce(s.whitelist_enabled, false), coalesce(s.blacklist_enabled, false),
         coalesce(s.whitelist_user_ids, '{}'::uuid[]), coalesce(s.blacklist_user_ids, '{}'::uuid[])
  into v_total_supply, v_symbol, v_trading_enabled,
       v_max_transaction_pct, v_max_wallet_pct,
       v_whitelist_enabled, v_blacklist_enabled, v_whitelist_user_ids, v_blacklist_user_ids
  from public.space_coins c
  left join public.space_coin_settings s on s.coin_id = c.id
  where c.id = new.coin_id
  for update of c;
  if v_total_supply is null then raise exception 'Coin not found'; end if;

  if not v_trading_enabled then raise exception 'Trading is paused for this Space Coin'; end if;
  if v_max_transaction_pct is not null and new.quantity > v_total_supply * v_max_transaction_pct / 100 then
    raise exception 'Order exceeds this coin’s maximum transaction size';
  end if;
  if v_blacklist_enabled and new.user_id = any(v_blacklist_user_ids) then
    raise exception 'This RainX account is blocked from trading this coin';
  end if;
  if v_whitelist_enabled and not (new.user_id = any(v_whitelist_user_ids)) then
    raise exception 'This coin is limited to allowlisted RainX accounts';
  end if;

  if new.side = 'buy' and v_max_wallet_pct is not null then
    select token_balances into v_balances
    from public.space_coin_accounts
    where id = new.account_id and user_id = new.user_id;
    v_balance := coalesce(
      nullif(v_balances->>new.coin_id::text, '')::numeric,
      nullif(v_balances->>v_symbol, '')::numeric,
      0
    );
    if v_balance > v_total_supply * v_max_wallet_pct / 100 then
      raise exception 'Order would exceed this coin’s maximum wallet size';
    end if;
  end if;
  return new;
end;
$function$;

revoke all on function public.enforce_space_coin_trade_settings() from public, anon, authenticated;
drop trigger if exists trg_enforce_space_coin_trade_settings on public.space_coin_trades;
create trigger trg_enforce_space_coin_trade_settings
before insert on public.space_coin_trades
for each row execute function public.enforce_space_coin_trade_settings();

create or replace function public.apply_space_coin_trade_fees()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_creator_id uuid;
  v_buy_fee_bps integer;
  v_sell_fee_bps integer;
  v_creator_fee_bps integer;
  v_platform_bps integer;
  v_gross numeric;
  v_platform_fee numeric;
  v_creator_fee numeric;
  v_total_fee numeric;
  v_balance numeric;
  v_phase text;
  v_fee_side text;
begin
  select c.creator_id,
         coalesce(s.buy_fee_bps, 0), coalesce(s.sell_fee_bps, 0), coalesce(s.creator_fee_bps, 0)
  into v_creator_id, v_buy_fee_bps, v_sell_fee_bps, v_creator_fee_bps
  from public.space_coins c
  left join public.space_coin_settings s on s.coin_id = c.id
  where c.id = new.coin_id;
  if v_creator_id is null then raise exception 'Coin not found'; end if;

  if tg_op = 'INSERT' then
    v_phase := 'open';
    v_gross := coalesce(new.notional, 0);
    v_fee_side := new.side;
  else
    v_phase := 'close';
    v_gross := coalesce(new.close_notional, new.close_price * new.quantity, 0);
    v_fee_side := case when new.side = 'buy' then 'sell' else 'buy' end;
  end if;
  if v_fee_side = 'buy' then v_platform_bps := v_buy_fee_bps;
  else v_platform_bps := v_sell_fee_bps;
  end if;

  v_platform_fee := round(v_gross * v_platform_bps / 10000, 8);
  v_creator_fee := round(v_gross * v_creator_fee_bps / 10000, 8);
  v_total_fee := v_platform_fee + v_creator_fee;
  if v_total_fee <= 0 then return new; end if;

  if v_phase = 'open' then
    update public.space_coin_accounts
    set cash_balance = cash_balance - v_total_fee,
        updated_at = clock_timestamp()
    where id = new.account_id and cash_balance >= v_total_fee
    returning cash_balance into v_balance;
    if v_balance is null then raise exception 'Insufficient balance to pay this coin’s trading fee'; end if;
  else
    -- Do not strand an existing position: closing remains possible even if the
    -- close fee temporarily takes the account below zero.
    update public.space_coin_accounts
    set cash_balance = cash_balance - v_total_fee,
        updated_at = clock_timestamp()
    where id = new.account_id
    returning cash_balance into v_balance;
    if v_balance is null then raise exception 'Trading account not found'; end if;
  end if;

  if v_creator_fee > 0 then
    insert into public.space_coin_accounts (user_id, account_key, mode, cash_balance, token_balances)
    values (v_creator_id, new.mode || ':' || v_creator_id::text, new.mode, 0, '{}'::jsonb)
    on conflict (account_key) do nothing;
    update public.space_coin_accounts
    set cash_balance = cash_balance + v_creator_fee,
        updated_at = clock_timestamp()
    where account_key = new.mode || ':' || v_creator_id::text;
  end if;

  insert into public.space_coin_fee_ledger (
    coin_id, trade_id, phase, trader_user_id, creator_user_id, platform_fee, creator_fee
  ) values (
    new.coin_id, new.id, v_phase, new.user_id, v_creator_id, v_platform_fee, v_creator_fee
  ) on conflict (trade_id, phase) do nothing;
  return new;
end;
$function$;

revoke all on function public.apply_space_coin_trade_fees() from public, anon, authenticated;
drop trigger if exists trg_space_coin_fees_on_open on public.space_coin_trades;
create trigger trg_space_coin_fees_on_open
after insert on public.space_coin_trades
for each row execute function public.apply_space_coin_trade_fees();
drop trigger if exists trg_space_coin_fees_on_close on public.space_coin_trades;
create trigger trg_space_coin_fees_on_close
after update of status on public.space_coin_trades
for each row
when (old.status is distinct from 'closed' and new.status = 'closed')
execute function public.apply_space_coin_trade_fees();

revoke all on function public.get_space_coin_settings(uuid) from public, anon;
revoke all on function public.update_space_coin_settings(uuid, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.get_space_coin_settings(uuid) to authenticated;
grant execute on function public.update_space_coin_settings(uuid, jsonb, jsonb, boolean) to authenticated;

commit;
