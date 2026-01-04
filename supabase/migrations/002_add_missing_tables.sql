-- Migration: Add missing tables (references, investor_activities, cap_table_shareholders, cap_table_options)
-- Run this in your Supabase SQL Editor

-- References table (for reference coordination)
create table if not exists public.references (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  customerName text not null,
  company text not null,
  email text,
  phone text,
  relationship text,
  requestedBy text,
  scheduledDate date,
  status text default 'Requested',
  feedbackNotes text,
  created_at timestamptz default now()
);

-- Investor Activities table (for timeline tracking)
create table if not exists public.investor_activities (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  investor_id bigint references public.investors(id) on delete cascade not null,
  investor_firm text not null,
  activity_type text not null,
  description text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- Cap Table Shareholders (founders and existing investors)
create table if not exists public.cap_table_shareholders (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  shares numeric not null,
  type text not null default 'Common',
  category text not null default 'founder',
  round text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cap Table Option Pool Settings
create table if not exists public.cap_table_options (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  allocated numeric default 0,
  unallocated numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on new tables
alter table public.references enable row level security;
alter table public.investor_activities enable row level security;
alter table public.cap_table_shareholders enable row level security;
alter table public.cap_table_options enable row level security;

-- RLS Policies for references
create policy "Users can view own references" on public.references for select using (auth.uid() = user_id);
create policy "Users can insert own references" on public.references for insert with check (auth.uid() = user_id);
create policy "Users can update own references" on public.references for update using (auth.uid() = user_id);
create policy "Users can delete own references" on public.references for delete using (auth.uid() = user_id);

-- RLS Policies for investor_activities
create policy "Users can view own investor_activities" on public.investor_activities for select using (auth.uid() = user_id);
create policy "Users can insert own investor_activities" on public.investor_activities for insert with check (auth.uid() = user_id);
create policy "Users can update own investor_activities" on public.investor_activities for update using (auth.uid() = user_id);
create policy "Users can delete own investor_activities" on public.investor_activities for delete using (auth.uid() = user_id);

-- RLS Policies for cap_table_shareholders
create policy "Users can view own cap_table_shareholders" on public.cap_table_shareholders for select using (auth.uid() = user_id);
create policy "Users can insert own cap_table_shareholders" on public.cap_table_shareholders for insert with check (auth.uid() = user_id);
create policy "Users can update own cap_table_shareholders" on public.cap_table_shareholders for update using (auth.uid() = user_id);
create policy "Users can delete own cap_table_shareholders" on public.cap_table_shareholders for delete using (auth.uid() = user_id);

-- RLS Policies for cap_table_options
create policy "Users can view own cap_table_options" on public.cap_table_options for select using (auth.uid() = user_id);
create policy "Users can insert own cap_table_options" on public.cap_table_options for insert with check (auth.uid() = user_id);
create policy "Users can update own cap_table_options" on public.cap_table_options for update using (auth.uid() = user_id);
create policy "Users can delete own cap_table_options" on public.cap_table_options for delete using (auth.uid() = user_id);

-- Indexes for better performance
create index if not exists idx_references_user_id on public.references(user_id);
create index if not exists idx_investor_activities_user_id on public.investor_activities(user_id);
create index if not exists idx_investor_activities_investor_id on public.investor_activities(investor_id);
create index if not exists idx_cap_table_shareholders_user_id on public.cap_table_shareholders(user_id);
create index if not exists idx_cap_table_options_user_id on public.cap_table_options(user_id);

-- Function to update updated_at timestamp (if not exists)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
drop trigger if exists update_cap_table_shareholders_updated_at on public.cap_table_shareholders;
create trigger update_cap_table_shareholders_updated_at
  before update on public.cap_table_shareholders
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_cap_table_options_updated_at on public.cap_table_options;
create trigger update_cap_table_options_updated_at
  before update on public.cap_table_options
  for each row
  execute function update_updated_at_column();
