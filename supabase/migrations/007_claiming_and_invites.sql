-- Score entry claiming: link a logged-in user to an entry they submitted
alter table entries
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- Invite links: unique token on rhanks so owners can share a direct join URL
alter table rhanks
  add column if not exists invite_token text unique;
