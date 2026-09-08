-- Security hardening: real auth sessions, login history, and security alerts.
create extension if not exists pgcrypto;

alter table public.auth_login_events
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists location text;

alter table public.user_device_sessions
  add column if not exists location text;

create table if not exists public.security_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('new_login','pin_changed','pin_disabled','biometric_changed','app_lock_changed','two_factor_changed','suspicious_activity','password_changed','recovery_changed')),
  severity text not null default 'info' check (severity in ('info','warning','critical')),
  title text not null,
  body text not null,
  ip_address text,
  location text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  email text,
  email_status text not null default 'pending' check (email_status in ('pending','sent','failed','not_configured')),
  created_at timestamptz not null default now()
);

alter table public.security_alerts enable row level security;
revoke all on public.security_alerts from anon, authenticated;
drop policy if exists security_alerts_select_own on public.security_alerts;
create policy security_alerts_select_own on public.security_alerts for select to authenticated using (user_id = auth.uid());

drop index if exists public.auth_login_events_user_created_idx;
create index if not exists auth_login_events_user_created_idx on public.auth_login_events(user_id, created_at desc);
create index if not exists security_alerts_user_created_idx on public.security_alerts(user_id, created_at desc);

create or replace function public.current_auth_ip()
returns text
language sql stable security definer set search_path = public, auth, pg_temp
as $$
  select coalesce(inet_client_addr()::text, (select s.ip::text from auth.sessions s where s.id = nullif(auth.jwt()->>'session_id','')::uuid and s.user_id = auth.uid()));
$$;

create or replace function public.current_auth_user_agent()
returns text
language sql stable security definer set search_path = public, auth, pg_temp
as $$
  select coalesce((select s.user_agent from auth.sessions s where s.id = nullif(auth.jwt()->>'session_id','')::uuid and s.user_id = auth.uid()), auth.jwt()->>'user_agent');
$$;

create or replace function public.get_my_login_history()
returns table(id uuid, created_at timestamptz, ip_address text, user_agent text, device_id text, platform text, device_name text, model text, os_version text, app_version text, location text)
language sql security definer set search_path = public, auth, pg_temp
as $$
  select e.id, e.created_at, e.ip_address, e.user_agent, e.device_id, e.platform, e.device_name, e.model, e.os_version, e.app_version, e.location
  from public.auth_login_events e
  where e.user_id = auth.uid()
  order by e.created_at desc
  limit 50;
$$;

drop function if exists public.get_my_auth_sessions();

create or replace function public.get_my_auth_sessions()
returns table(session_id uuid, created_at timestamptz, updated_at timestamptz, expires_at timestamptz, user_agent text, ip_address text, location text, revoked boolean, is_current boolean)
language sql security definer set search_path = public, auth, pg_temp
as $$
  select s.id, s.created_at, s.updated_at, s.not_after, s.user_agent, s.ip::text,
         null::text, false, s.id = nullif(auth.jwt()->>'session_id','')::uuid
  from auth.sessions s
  where s.user_id = auth.uid() and (s.not_after is null or s.not_after > now())
  order by s.updated_at desc
  limit 20;
$$;

create or replace function public.register_my_device_session(p_device_id text, p_platform text, p_device_name text default null, p_manufacturer text default null, p_model text default null, p_os_version text default null, p_app_version text default null)
returns public.user_device_sessions
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare result public.user_device_sessions; current_session uuid := nullif(auth.jwt()->>'session_id','')::uuid; current_ip text := public.current_auth_ip();
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.user_device_sessions(user_id, device_id, session_id, platform, device_name, manufacturer, model, os_version, app_version, ip_address, first_seen_at, last_seen_at, last_login_at, active, created_at, updated_at)
  values (auth.uid(), p_device_id, coalesce(current_session, gen_random_uuid()), p_platform, p_device_name, p_manufacturer, p_model, p_os_version, p_app_version, current_ip, now(), now(), now(), true, now(), now())
  on conflict (user_id, device_id) do update set session_id = coalesce(excluded.session_id, public.user_device_sessions.session_id), platform = excluded.platform, device_name = excluded.device_name, manufacturer = excluded.manufacturer, model = excluded.model, os_version = excluded.os_version, app_version = excluded.app_version, ip_address = coalesce(excluded.ip_address, public.user_device_sessions.ip_address), last_seen_at = now(), last_login_at = now(), active = true, updated_at = now()
  returning * into result;
  return result;
end;
$$;

create or replace function public.record_my_login_event(p_device_id text, p_platform text, p_device_name text default null, p_manufacturer text default null, p_model text default null, p_os_version text default null, p_app_version text default null)
returns public.auth_login_events
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare result public.auth_login_events; current_ip text := public.current_auth_ip(); current_ua text := public.current_auth_user_agent();
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into result from public.auth_login_events where user_id = auth.uid() and device_id = p_device_id and created_at > now() - interval '5 minutes' order by created_at desc limit 1;
  if result.id is not null then return result; end if;
  insert into public.auth_login_events(user_id, device_id, platform, device_name, manufacturer, model, os_version, app_version, ip_address, user_agent)
  values (auth.uid(), p_device_id, p_platform, p_device_name, p_manufacturer, p_model, p_os_version, p_app_version, current_ip, current_ua)
  returning * into result;
  insert into public.security_alerts(user_id, event_type, severity, title, body, ip_address, user_agent, email, metadata)
  select auth.uid(), 'new_login', 'info', 'New sign-in to RainX', 'A new device signed in to your RainX account.', current_ip, current_ua, u.email, jsonb_build_object('device_id', p_device_id, 'platform', p_platform, 'device_name', p_device_name, 'model', p_model)
  from auth.users u where u.id = auth.uid();
  return result;
end;
$$;

create or replace function public.set_my_pin(p_pin text)
returns jsonb language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare uid uuid := auth.uid(); normalized text := trim(coalesce(p_pin,'')); result jsonb;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if normalized !~ '^[0-9]{4,6}$' then raise exception 'PIN must contain 4 to 6 digits'; end if;
  insert into public.user_pin_credentials(user_id,pin_hash,pin_length,failed_attempts,last_failed_at,locked_until,updated_at) values(uid,extensions.crypt(normalized,extensions.gen_salt('bf',12)),length(normalized),0,null,null,now()) on conflict(user_id) do update set pin_hash=excluded.pin_hash,pin_length=excluded.pin_length,failed_attempts=0,last_failed_at=null,locked_until=null,updated_at=now();
  insert into public.security_alerts(user_id,event_type,severity,title,body,ip_address,user_agent,email,metadata) select uid,'pin_changed','warning','RainX PIN changed','Your RainX PIN was changed.',public.current_auth_ip(),public.current_auth_user_agent(),u.email,jsonb_build_object('pin_length',length(normalized)) from auth.users u where u.id=uid;
  return jsonb_build_object('saved',true,'pin_length',length(normalized));
end; $$;

create or replace function public.delete_my_pin(p_pin text)
returns jsonb language plpgsql security definer set search_path = public, auth, pg_temp as $$
declare uid uuid := auth.uid(); result jsonb;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  result := public.verify_my_pin(p_pin);
  if coalesce((result->>'success')::boolean,false) is not true then return result; end if;
  delete from public.user_pin_credentials where user_id=uid;
  insert into public.security_alerts(user_id,event_type,severity,title,body,ip_address,user_agent,email) select uid,'pin_disabled','warning','RainX PIN disabled','Your RainX PIN lock was disabled.',public.current_auth_ip(),public.current_auth_user_agent(),u.email from auth.users u where u.id=uid;
  return jsonb_build_object('deleted',true);
end; $$;

revoke all on function public.get_my_login_history() from public, anon, authenticated;
revoke all on function public.current_auth_ip() from public, anon, authenticated;
revoke all on function public.current_auth_user_agent() from public, anon, authenticated;
grant execute on function public.get_my_login_history() to authenticated;
grant execute on function public.get_my_auth_sessions() to authenticated;
grant execute on function public.register_my_device_session(text,text,text,text,text,text,text) to authenticated;
grant execute on function public.record_my_login_event(text,text,text,text,text,text,text) to authenticated;
grant execute on function public.set_my_pin(text) to authenticated;
grant execute on function public.delete_my_pin(text) to authenticated;
