-- Series B Command Center Database Schema
-- Run this in your Supabase SQL Editor
-- Updated: org-based RLS (team data sharing)

-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ============================================================
-- Organization tables
-- ============================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists public.org_members (
  id bigserial primary key,
  org_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- ============================================================
-- Data tables
-- ============================================================

-- Investors table
create table if not exists public.investors (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
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
  org_id uuid references public.organizations(id) not null,
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
  org_id uuid references public.organizations(id) not null,
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
  org_id uuid references public.organizations(id) not null,
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
  org_id uuid references public.organizations(id) not null,
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
  org_id uuid references public.organizations(id) not null,
  action text not null,
  owner text,
  due date,
  priority text default 'Medium',
  status text default 'Not Started',
  created_at timestamptz default now()
);

-- References table (for reference coordination)
create table if not exists public.references (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
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
  org_id uuid references public.organizations(id) not null,
  investor_id bigint references public.investors(id) on delete cascade not null,
  investor_firm text not null,
  activity_type text not null, -- 'stage_change', 'note', 'email', 'meeting', 'created'
  description text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- Cap Table Shareholders (founders and existing investors)
create table if not exists public.cap_table_shareholders (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
  name text not null,
  shares numeric not null,
  type text not null default 'Common', -- 'Common' or 'Preferred'
  category text not null default 'founder', -- 'founder' or 'investor'
  round text, -- e.g., 'Seed', 'Series A' (for investors)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Cap Table Option Pool Settings (one per org)
create table if not exists public.cap_table_options (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null unique,
  allocated numeric default 0,
  unallocated numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Weekly Snapshots table (for tracking week-over-week changes)
create table if not exists public.weekly_snapshots (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
  week_start date not null,
  week_end date not null,
  -- Stage counts
  stage_target_list integer default 0,
  stage_contacted integer default 0,
  stage_engaged integer default 0,
  stage_in_diligence integer default 0,
  stage_term_sheet integer default 0,
  stage_closing integer default 0,
  stage_closed integer default 0,
  stage_passed integer default 0,
  -- Activity counts
  emails_sent integer default 0,
  emails_replied integer default 0,
  meetings_held integer default 0,
  new_investors integer default 0,
  -- Rates
  response_rate numeric,
  win_rate numeric,
  created_at timestamptz default now(),
  unique(org_id, week_start)
);

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.investors enable row level security;
alter table public.emails enable row level security;
alter table public.meetings enable row level security;
alter table public.materials enable row level security;
alter table public.term_sheets enable row level security;
alter table public.weekly_actions enable row level security;
alter table public.references enable row level security;
alter table public.investor_activities enable row level security;
alter table public.cap_table_shareholders enable row level security;
alter table public.cap_table_options enable row level security;
alter table public.weekly_snapshots enable row level security;

-- ============================================================
-- Org-based RLS policies
-- Members of the same organization can see/edit all org data
-- ============================================================

-- organizations: members can view their orgs
create policy "Org members can view organizations" on public.organizations for select
  using (exists (select 1 from public.org_members where org_members.org_id = organizations.id and org_members.user_id = auth.uid()));

-- org_members: members can view members of their orgs
create policy "Org members can view org_members" on public.org_members for select
  using (exists (select 1 from public.org_members om where om.org_id = org_members.org_id and om.user_id = auth.uid()));

-- investors
create policy "Org members can select investors" on public.investors for select
  using (exists (select 1 from public.org_members where org_members.org_id = investors.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert investors" on public.investors for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = investors.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update investors" on public.investors for update
  using (exists (select 1 from public.org_members where org_members.org_id = investors.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete investors" on public.investors for delete
  using (exists (select 1 from public.org_members where org_members.org_id = investors.org_id and org_members.user_id = auth.uid()));

-- emails
create policy "Org members can select emails" on public.emails for select
  using (exists (select 1 from public.org_members where org_members.org_id = emails.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert emails" on public.emails for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = emails.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update emails" on public.emails for update
  using (exists (select 1 from public.org_members where org_members.org_id = emails.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete emails" on public.emails for delete
  using (exists (select 1 from public.org_members where org_members.org_id = emails.org_id and org_members.user_id = auth.uid()));

-- meetings
create policy "Org members can select meetings" on public.meetings for select
  using (exists (select 1 from public.org_members where org_members.org_id = meetings.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert meetings" on public.meetings for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = meetings.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update meetings" on public.meetings for update
  using (exists (select 1 from public.org_members where org_members.org_id = meetings.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete meetings" on public.meetings for delete
  using (exists (select 1 from public.org_members where org_members.org_id = meetings.org_id and org_members.user_id = auth.uid()));

-- materials
create policy "Org members can select materials" on public.materials for select
  using (exists (select 1 from public.org_members where org_members.org_id = materials.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert materials" on public.materials for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = materials.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update materials" on public.materials for update
  using (exists (select 1 from public.org_members where org_members.org_id = materials.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete materials" on public.materials for delete
  using (exists (select 1 from public.org_members where org_members.org_id = materials.org_id and org_members.user_id = auth.uid()));

-- term_sheets
create policy "Org members can select term_sheets" on public.term_sheets for select
  using (exists (select 1 from public.org_members where org_members.org_id = term_sheets.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert term_sheets" on public.term_sheets for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = term_sheets.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update term_sheets" on public.term_sheets for update
  using (exists (select 1 from public.org_members where org_members.org_id = term_sheets.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete term_sheets" on public.term_sheets for delete
  using (exists (select 1 from public.org_members where org_members.org_id = term_sheets.org_id and org_members.user_id = auth.uid()));

-- weekly_actions
create policy "Org members can select weekly_actions" on public.weekly_actions for select
  using (exists (select 1 from public.org_members where org_members.org_id = weekly_actions.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert weekly_actions" on public.weekly_actions for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = weekly_actions.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update weekly_actions" on public.weekly_actions for update
  using (exists (select 1 from public.org_members where org_members.org_id = weekly_actions.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete weekly_actions" on public.weekly_actions for delete
  using (exists (select 1 from public.org_members where org_members.org_id = weekly_actions.org_id and org_members.user_id = auth.uid()));

-- references
create policy "Org members can select references" on public.references for select
  using (exists (select 1 from public.org_members where org_members.org_id = references.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert references" on public.references for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = references.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update references" on public.references for update
  using (exists (select 1 from public.org_members where org_members.org_id = references.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete references" on public.references for delete
  using (exists (select 1 from public.org_members where org_members.org_id = references.org_id and org_members.user_id = auth.uid()));

-- investor_activities
create policy "Org members can select investor_activities" on public.investor_activities for select
  using (exists (select 1 from public.org_members where org_members.org_id = investor_activities.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert investor_activities" on public.investor_activities for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = investor_activities.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update investor_activities" on public.investor_activities for update
  using (exists (select 1 from public.org_members where org_members.org_id = investor_activities.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete investor_activities" on public.investor_activities for delete
  using (exists (select 1 from public.org_members where org_members.org_id = investor_activities.org_id and org_members.user_id = auth.uid()));

-- cap_table_shareholders
create policy "Org members can select cap_table_shareholders" on public.cap_table_shareholders for select
  using (exists (select 1 from public.org_members where org_members.org_id = cap_table_shareholders.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert cap_table_shareholders" on public.cap_table_shareholders for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = cap_table_shareholders.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update cap_table_shareholders" on public.cap_table_shareholders for update
  using (exists (select 1 from public.org_members where org_members.org_id = cap_table_shareholders.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete cap_table_shareholders" on public.cap_table_shareholders for delete
  using (exists (select 1 from public.org_members where org_members.org_id = cap_table_shareholders.org_id and org_members.user_id = auth.uid()));

-- cap_table_options
create policy "Org members can select cap_table_options" on public.cap_table_options for select
  using (exists (select 1 from public.org_members where org_members.org_id = cap_table_options.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert cap_table_options" on public.cap_table_options for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = cap_table_options.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update cap_table_options" on public.cap_table_options for update
  using (exists (select 1 from public.org_members where org_members.org_id = cap_table_options.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete cap_table_options" on public.cap_table_options for delete
  using (exists (select 1 from public.org_members where org_members.org_id = cap_table_options.org_id and org_members.user_id = auth.uid()));

-- weekly_snapshots
create policy "Org members can select weekly_snapshots" on public.weekly_snapshots for select
  using (exists (select 1 from public.org_members where org_members.org_id = weekly_snapshots.org_id and org_members.user_id = auth.uid()));
create policy "Org members can insert weekly_snapshots" on public.weekly_snapshots for insert
  with check (exists (select 1 from public.org_members where org_members.org_id = weekly_snapshots.org_id and org_members.user_id = auth.uid()));
create policy "Org members can update weekly_snapshots" on public.weekly_snapshots for update
  using (exists (select 1 from public.org_members where org_members.org_id = weekly_snapshots.org_id and org_members.user_id = auth.uid()));
create policy "Org members can delete weekly_snapshots" on public.weekly_snapshots for delete
  using (exists (select 1 from public.org_members where org_members.org_id = weekly_snapshots.org_id and org_members.user_id = auth.uid()));

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_org_members_org_id on public.org_members(org_id);
create index if not exists idx_org_members_user_id on public.org_members(user_id);
create index if not exists idx_investors_user_id on public.investors(user_id);
create index if not exists idx_investors_org_id on public.investors(org_id);
create index if not exists idx_emails_user_id on public.emails(user_id);
create index if not exists idx_emails_org_id on public.emails(org_id);
create index if not exists idx_meetings_user_id on public.meetings(user_id);
create index if not exists idx_meetings_org_id on public.meetings(org_id);
create index if not exists idx_materials_user_id on public.materials(user_id);
create index if not exists idx_materials_org_id on public.materials(org_id);
create index if not exists idx_term_sheets_user_id on public.term_sheets(user_id);
create index if not exists idx_term_sheets_org_id on public.term_sheets(org_id);
create index if not exists idx_weekly_actions_user_id on public.weekly_actions(user_id);
create index if not exists idx_weekly_actions_org_id on public.weekly_actions(org_id);
create index if not exists idx_references_user_id on public.references(user_id);
create index if not exists idx_references_org_id on public.references(org_id);
create index if not exists idx_investor_activities_user_id on public.investor_activities(user_id);
create index if not exists idx_investor_activities_org_id on public.investor_activities(org_id);
create index if not exists idx_investor_activities_investor_id on public.investor_activities(investor_id);
create index if not exists idx_cap_table_shareholders_user_id on public.cap_table_shareholders(user_id);
create index if not exists idx_cap_table_shareholders_org_id on public.cap_table_shareholders(org_id);
create index if not exists idx_cap_table_options_user_id on public.cap_table_options(user_id);
create index if not exists idx_cap_table_options_org_id on public.cap_table_options(org_id);
create index if not exists idx_weekly_snapshots_user_id on public.weekly_snapshots(user_id);
create index if not exists idx_weekly_snapshots_org_id on public.weekly_snapshots(org_id);
create index if not exists idx_weekly_snapshots_week_start on public.weekly_snapshots(week_start);

-- ============================================================
-- Triggers
-- ============================================================

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

-- Trigger for cap_table_shareholders
create trigger update_cap_table_shareholders_updated_at
  before update on public.cap_table_shareholders
  for each row
  execute function update_updated_at_column();

-- Trigger for cap_table_options
create trigger update_cap_table_options_updated_at
  before update on public.cap_table_options
  for each row
  execute function update_updated_at_column();
