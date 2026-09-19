create table if not exists public.vita_voice_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.vita_voice_rate_limits enable row level security;

revoke all on table public.vita_voice_rate_limits from anon, authenticated;
grant all on table public.vita_voice_rate_limits to service_role;

create or replace function public.consume_voice_rate_limit()
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_window_started_at timestamptz;
  v_request_count integer;
  v_now timestamptz := clock_timestamp();
  v_limit constant integer := 8;
  v_window_seconds constant integer := 60;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into public.vita_voice_rate_limits as limits (
    user_id,
    window_started_at,
    request_count,
    updated_at
  )
  values (v_user_id, v_now, 1, v_now)
  on conflict (user_id) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
        then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
        then 1
      else limits.request_count + 1
    end,
    updated_at = v_now
  returning limits.window_started_at, limits.request_count
    into v_window_started_at, v_request_count;

  return query select
    v_request_count <= v_limit,
    case
      when v_request_count <= v_limit then 0
      else greatest(1, ceil(extract(epoch from (
        v_window_started_at + make_interval(secs => v_window_seconds) - v_now
      )))::integer)
    end;
end;
$$;

revoke all on function public.consume_voice_rate_limit() from public, anon;
grant execute on function public.consume_voice_rate_limit() to authenticated;

comment on function public.consume_voice_rate_limit() is
  'Atomic authenticated limiter for Aeternum Vita voice token issuance.';
