create or replace function public.record_my_security_change(p_event_type text, p_title text, p_body text, p_metadata jsonb default '{}'::jsonb)
returns public.security_alerts
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare uid uuid := auth.uid(); result public.security_alerts;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if p_event_type not in ('app_lock_changed','biometric_changed','two_factor_changed','suspicious_activity','password_changed','recovery_changed') then raise exception 'Unsupported security event'; end if;
  insert into public.security_alerts(user_id,event_type,severity,title,body,ip_address,user_agent,email,metadata)
  select uid,p_event_type,'warning',p_title,p_body,public.current_auth_ip(),public.current_auth_user_agent(),u.email,coalesce(p_metadata,'{}'::jsonb)
  from auth.users u where u.id=uid returning * into result;
  return result;
end; $$;
revoke all on function public.record_my_security_change(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.record_my_security_change(text,text,text,jsonb) to authenticated;