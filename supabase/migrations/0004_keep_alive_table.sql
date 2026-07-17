-- Dedicated table for the keep-alive cron (src/server/keepAlive.ts).
-- A read-only `select` against user_memory reached Postgres successfully
-- (confirmed via Supabase's own request logs) but did not stop the
-- project from being flagged for pausing — Supabase's inactivity check
-- appears to require write activity, not just reads. This table exists
-- solely to be upserted into on a schedule; it holds no app data.
create table if not exists public.keep_alive (
  id         boolean primary key default true,
  pinged_at  timestamptz not null default now(),
  constraint keep_alive_single_row check (id)
);

alter table public.keep_alive enable row level security;

-- No policies: only service_role (which bypasses RLS) may touch this table.
grant select, insert, update on public.keep_alive to service_role;
