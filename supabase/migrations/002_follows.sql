-- Rhank follows: users subscribe to a leaderboard for digest emails
create table if not exists rhank_follows (
  id         uuid primary key default gen_random_uuid(),
  rhank_id   uuid not null references rhanks(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (rhank_id, user_id)
);

alter table rhank_follows enable row level security;

create policy "follows_select" on rhank_follows for select using (auth.uid() = user_id);
create policy "follows_insert" on rhank_follows for insert with check (auth.uid() = user_id);
create policy "follows_delete" on rhank_follows for delete using (auth.uid() = user_id);
