-- Entry reactions: emoji stamps on score entries
create table if not exists entry_reactions (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid not null references entries(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  emoji       text not null check (emoji in ('🔥','👏','💪','🏆','😱')),
  created_at  timestamptz not null default now(),
  -- one reaction per (entry, user, emoji) tuple
  unique (entry_id, user_id, emoji)
);

-- Allow anyone to read; only authenticated users can insert/delete their own
alter table entry_reactions enable row level security;

create policy "reactions_select" on entry_reactions for select using (true);
create policy "reactions_insert" on entry_reactions for insert with check (auth.uid() = user_id);
create policy "reactions_delete" on entry_reactions for delete using (auth.uid() = user_id);
