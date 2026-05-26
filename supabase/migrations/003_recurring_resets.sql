-- Add recurring reset fields to rhanks
alter table rhanks
  add column if not exists reset_schedule text check (reset_schedule in ('weekly','monthly')) default null,
  add column if not exists last_reset_at  timestamptz default null;
