-- Authoritative prices are written only by the trade/close RPCs.
revoke execute on function public.record_space_coin_tick(uuid, numeric)
  from public, anon, authenticated;
grant execute on function public.record_space_coin_tick(uuid, numeric)
  to service_role;