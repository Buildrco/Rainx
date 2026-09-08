-- Applied migration: secure_pin_credentials

create extension if not exists pgcrypto;

create table if not exists public.user_pin_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  pin_length smallint not null check (pin_length between 4 and 6),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  last_failed_at timestamptz,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_pin_credentials enable row level security;

revoke all on table public.user_pin_credentials from anon, authenticated;

drop policy if exists "Users can view their own PIN credential" on public.user_pin_credentials;
drop policy if exists "Users can insert their own PIN credential" on public.user_pin_credentials;
drop policy if exists "Users can update their own PIN credential" on public.user_pin_credentials;
drop policy if exists "Users can delete their own PIN credential" on public.user_pin_credentials;

create or replace function public.get_my_pin_status()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  credential public.user_pin_credentials;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  select * into credential from public.user_pin_credentials where user_id = uid;
  return jsonb_build_object(
    'pin_exists', credential.user_id is not null,
    'pin_length', case when credential.user_id is null then null else credential.pin_length end,
    'locked_until', case when credential.locked_until is not null and credential.locked_until > now() then credential.locked_until else null end
  );
end;
$$;

create or replace function public.set_my_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  normalized text := trim(coalesce(p_pin, ''));
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if normalized !~ '^[0-9]{4,6}$' then raise exception 'PIN must contain 4 to 6 digits'; end if;
  insert into public.user_pin_credentials(user_id, pin_hash, pin_length, failed_attempts, last_failed_at, locked_until, updated_at)
  values (uid, crypt(normalized, gen_salt('bf', 12)), length(normalized), 0, null, null, now())
  on conflict (user_id) do update set
    pin_hash = excluded.pin_hash,
    pin_length = excluded.pin_length,
    failed_attempts = 0,
    last_failed_at = null,
    locked_until = null,
    updated_at = now();
  return jsonb_build_object('saved', true, 'pin_length', length(normalized));
end;
$$;

create or replace function public.verify_my_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  credential public.user_pin_credentials;
  normalized text := trim(coalesce(p_pin, ''));
  attempts integer;
  lock_until timestamptz;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into credential from public.user_pin_credentials where user_id = uid for update;
  if credential.user_id is null then
    return jsonb_build_object('success', false, 'remaining_attempts', 0, 'locked_until', null);
  end if;
  if credential.locked_until is not null and credential.locked_until > now() then
    return jsonb_build_object('success', false, 'remaining_attempts', 0, 'locked_until', credential.locked_until);
  end if;
  if credential.last_failed_at is null or credential.last_failed_at < now() - interval '15 minutes' then
    attempts := 0;
  else
    attempts := credential.failed_attempts;
  end if;
  if normalized ~ '^[0-9]{4,6}$' and crypt(normalized, credential.pin_hash) = credential.pin_hash then
    update public.user_pin_credentials
      set failed_attempts = 0, last_failed_at = null, locked_until = null, updated_at = now()
      where user_id = uid;
    return jsonb_build_object('success', true, 'remaining_attempts', 5, 'locked_until', null);
  end if;
  attempts := attempts + 1;
  if attempts >= 5 then
    lock_until := now() + interval '15 minutes';
    update public.user_pin_credentials
      set failed_attempts = attempts, last_failed_at = now(), locked_until = lock_until, updated_at = now()
      where user_id = uid;
    return jsonb_build_object('success', false, 'remaining_attempts', 0, 'locked_until', lock_until);
  end if;
  update public.user_pin_credentials
    set failed_attempts = attempts, last_failed_at = now(), locked_until = null, updated_at = now()
    where user_id = uid;
  return jsonb_build_object('success', false, 'remaining_attempts', 5 - attempts, 'locked_until', null);
end;
$$;

create or replace function public.delete_my_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  result := public.verify_my_pin(p_pin);
  if coalesce((result->>'success')::boolean, false) is not true then
    return result;
  end if;
  delete from public.user_pin_credentials where user_id = uid;
  return jsonb_build_object('deleted', true);
end;
$$;

grant execute on function public.get_my_pin_status() to authenticated;
grant execute on function public.set_my_pin(text) to authenticated;
grant execute on function public.verify_my_pin(text) to authenticated;
grant execute on function public.delete_my_pin(text) to authenticated;
