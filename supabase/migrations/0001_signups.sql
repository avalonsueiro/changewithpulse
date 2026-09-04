-- Pulse waitlist signups.
--
-- Every read and write goes through the service-role key from server-only
-- route handlers. RLS is enabled with no policies, so the anon and
-- authenticated roles can see nothing even if the anon key leaks.

create table if not exists public.signups (
  id                      uuid primary key default gen_random_uuid(),
  email                   text not null,
  status                  text not null default 'pending'
                            check (status in ('pending', 'confirmed', 'unsubscribed')),
  source                  text,
  referrer                text,
  utm                     jsonb,
  confirm_token_hash      text,
  confirm_sent_at         timestamptz,
  confirmed_at            timestamptz,
  unsubscribe_token_hash  text not null,
  ip_hash                 text,
  user_agent              text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.signups is
  'Waitlist email addresses. Tokens are stored as SHA-256 hashes; ip_hash is a salted digest, never a raw address.';

-- Case-insensitive uniqueness. The application lowercases before writing, but
-- this index is the actual guarantee against duplicates.
create unique index if not exists signups_email_key
  on public.signups (lower(email));

-- Admin dashboard orders by newest first.
create index if not exists signups_created_at_idx
  on public.signups (created_at desc);

-- Rate limiter counts recent rows for one hashed IP.
create index if not exists signups_ip_hash_recent_idx
  on public.signups (ip_hash, created_at desc)
  where ip_hash is not null;

-- Token lookups on confirm and unsubscribe. Partial, because the vast majority
-- of rows have a spent (nulled) confirm token.
create index if not exists signups_confirm_token_hash_idx
  on public.signups (confirm_token_hash)
  where confirm_token_hash is not null;

create index if not exists signups_unsubscribe_token_hash_idx
  on public.signups (unsubscribe_token_hash);

-- Dashboard status counts.
create index if not exists signups_status_idx
  on public.signups (status);

-- Keep updated_at honest without relying on every caller to set it.
--
-- SECURITY INVOKER, not DEFINER. Postgres grants EXECUTE to PUBLIC on every
-- new function, so a SECURITY DEFINER function living in `public` is callable
-- by anon and authenticated and runs with the owner's privileges — which for
-- a table this locked down would be the one way in. This only stamps a
-- timestamp during a trigger; it needs no elevation at all.
--
-- The empty search_path is still worth keeping: it stops a caller-controlled
-- path from resolving now() or any other reference to a shadowing object.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists signups_set_updated_at on public.signups;
create trigger signups_set_updated_at
  before update on public.signups
  for each row
  execute function public.set_updated_at();

alter table public.signups enable row level security;

-- No policies are defined on purpose: with RLS enabled and zero policies,
-- anon and authenticated are denied everything. service_role bypasses RLS.

-- Belt and braces. RLS already denies every row to these roles, but revoking
-- the grants as well means the table is inaccessible through the Data API
-- even if a policy is ever added by accident. This table is only ever reached
-- by the service-role key from server-only route handlers.
revoke all on public.signups from anon, authenticated;
