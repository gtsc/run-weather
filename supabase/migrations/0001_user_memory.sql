create table if not exists public.user_memory (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  content    text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.user_memory enable row level security;

create policy "Users read own memory"
  on public.user_memory for select
  using (auth.uid() = user_id);

create policy "Users upsert own memory"
  on public.user_memory for insert
  with check (auth.uid() = user_id);

create policy "Users update own memory"
  on public.user_memory for update
  using (auth.uid() = user_id);
