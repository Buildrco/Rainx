-- Keep Space Coins responsive on native devices and establish the RXC baseline.
create index if not exists space_coin_ticks_coin_created_at_idx
  on public.space_coin_ticks (coin_id, created_at desc);

create index if not exists space_coin_trades_coin_user_created_at_idx
  on public.space_coin_trades (coin_id, user_id, created_at desc);

alter table public.space_coins
  alter column initial_price set default 0.01,
  alter column current_price set default 0.01;

update public.space_coins
set initial_price = 0.01,
    current_price = 0.01,
    price_change_24h = 0,
    market_cap = total_supply * 0.01,
    updated_at = now()
where upper(symbol) = 'RXC';

insert into public.space_coin_ticks (coin_id, price, open, high, low, close)
select id, 0.01, 0.01, 0.01, 0.01, 0.01
from public.space_coins
where upper(symbol) = 'RXC';