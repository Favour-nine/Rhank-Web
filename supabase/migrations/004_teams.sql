-- Teams: group members within a token rhank
create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  rhank_id   uuid not null references rhanks(id) on delete cascade,
  name       text not null,
  color      text not null default '#ffffff',
  created_at timestamptz not null default now()
);

alter table teams enable row level security;
create policy "teams_select" on teams for select using (true);
create policy "teams_insert" on teams for insert with check (true);
create policy "teams_update" on teams for update using (true);
create policy "teams_delete" on teams for delete using (true);

-- Add team reference to members (nullable — members without a team are unassigned)
alter table members
  add column if not exists team_id uuid references teams(id) on delete set null;
