-- ========================================================
-- Supabase SQL Table Setup for Poland Top Universities Bot
-- Run this in Supabase SQL Editor (1-Click Setup)
-- ========================================================

create table if not exists ptu_database (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table ptu_database enable row level security;

-- Policy to allow full access for bot operations
create policy "Allow bot access to ptu_database"
on ptu_database
for all
using (true)
with check (true);
