-- Series B Command Center Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Investors table
create table if not exists public.investors (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  firm text not null,
  contact text,
  email text,
  phone text,
  intro_source text,
  tier text default '2 - Strong Fit',
  stage text default 'Target List',
  first_contact_date date,
  last_contact_date date,
  next_action text,
  next_action_date date,
  data_room_access boolean default false,
  engagement_score integer,
  notes text,
  pass_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Emails table
create table if not exists public.emails (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  investor text not null,
  type text not null,
  subject text,
  sent_date date,
  sent_by text,
  opened boolean default false,
  clicked boolean default false,
  replied boolean default false,
  reply_date date,
  notes text,
  created_at timestamptz default now()
);

-- Meetings table
create table if not exists public.meetings (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  investor text not null,
  date date not null,
  time time,
  type text,
  attendees_us text,
  attendees_them text,
  location text,
  prep_status text default 'Not Started',
  topics text,
  notes text,
  follow_up text,
  follow_up_owner text,
  follow_up_due date,
  created_at timestamptz default now()
);

-- Materials table
create table if not exists public.materials (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  tier text not null,
  status text default 'Not Started',
  owner text,
  last_updated timestamptz,
  location text,
  created_at timestamptz default now()
);

-- Term Sheets table
create table if not exists public.term_sheets (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  investor text not null,
  date_received date,
  lead_amount numeric,
  total_round numeric,
  pre_money numeric,
  board_seats text,
  pro_rata boolean,
  terms text,
  expiration date,
  status text default 'Received',
  created_at timestamptz default now()
);

-- Weekly Actions table
create table if not exists public.weekly_actions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  owner text,
  due date,
  priority text default 'Medium',
  status text default 'Not Started',
  created_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table public.investors enable row level security;
alter table public.emails enable row level security;
alter table public.meetings enable row level security;
alter table public.materials enable row level security;
alter table public.term_sheets enable row level security;
alter table public.weekly_actions enable row level security;

-- Create policies - users can only see/edit their own data
create policy "Users can view own investors" on public.investors for select using (auth.uid() = user_id);
create policy "Users can insert own investors" on public.investors for insert with check (auth.uid() = user_id);
create policy "Users can update own investors" on public.investors for update using (auth.uid() = user_id);
create policy "Users can delete own investors" on public.investors for delete using (auth.uid() = user_id);

create policy "Users can view own emails" on public.emails for select using (auth.uid() = user_id);
create policy "Users can insert own emails" on public.emails for insert with check (auth.uid() = user_id);
create policy "Users can update own emails" on public.emails for update using (auth.uid() = user_id);
create policy "Users can delete own emails" on public.emails for delete using (auth.uid() = user_id);

create policy "Users can view own meetings" on public.meetings for select using (auth.uid() = user_id);
create policy "Users can insert own meetings" on public.meetings for insert with check (auth.uid() = user_id);
create policy "Users can update own meetings" on public.meetings for update using (auth.uid() = user_id);
create policy "Users can delete own meetings" on public.meetings for delete using (auth.uid() = user_id);

create policy "Users can view own materials" on public.materials for select using (auth.uid() = user_id);
create policy "Users can insert own materials" on public.materials for insert with check (auth.uid() = user_id);
create policy "Users can update own materials" on public.materials for update using (auth.uid() = user_id);
create policy "Users can delete own materials" on public.materials for delete using (auth.uid() = user_id);

create policy "Users can view own term_sheets" on public.term_sheets for select using (auth.uid() = user_id);
create policy "Users can insert own term_sheets" on public.term_sheets for insert with check (auth.uid() = user_id);
create policy "Users can update own term_sheets" on public.term_sheets for update using (auth.uid() = user_id);
create policy "Users can delete own term_sheets" on public.term_sheets for delete using (auth.uid() = user_id);

create policy "Users can view own weekly_actions" on public.weekly_actions for select using (auth.uid() = user_id);
create policy "Users can insert own weekly_actions" on public.weekly_actions for insert with check (auth.uid() = user_id);
create policy "Users can update own weekly_actions" on public.weekly_actions for update using (auth.uid() = user_id);
create policy "Users can delete own weekly_actions" on public.weekly_actions for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_investors_user_id on public.investors(user_id);
create index if not exists idx_emails_user_id on public.emails(user_id);
create index if not exists idx_meetings_user_id on public.meetings(user_id);
create index if not exists idx_materials_user_id on public.materials(user_id);
create index if not exists idx_term_sheets_user_id on public.term_sheets(user_id);
create index if not exists idx_weekly_actions_user_id on public.weekly_actions(user_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for investors table
create trigger update_investors_updated_at
  before update on public.investors
  for each row
  execute function update_updated_at_column();
