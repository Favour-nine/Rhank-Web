-- Entry moderation: owners can enable a moderation queue for score rhanks
alter table entries
  add column if not exists status text not null default 'approved'
    check (status in ('pending','approved','rejected'));

-- Add moderation_enabled flag to rhanks (only relevant for score type)
alter table rhanks
  add column if not exists moderation_enabled boolean not null default false;
