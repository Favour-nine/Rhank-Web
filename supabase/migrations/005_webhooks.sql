-- Webhooks: fire POST requests when events happen on a rhank
create table if not exists webhooks (
  id         uuid primary key default gen_random_uuid(),
  rhank_id   uuid not null references rhanks(id) on delete cascade,
  url        text not null,
  events     text[] not null default '{"entry.created","member.approved"}',
  secret     text not null default gen_random_uuid()::text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table webhooks enable row level security;
create policy "webhooks_owner" on webhooks using (
  rhank_id in (select id from rhanks where user_id = auth.uid())
);
