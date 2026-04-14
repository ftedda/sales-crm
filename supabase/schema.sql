-- Sales CRM Database Schema
-- Run this in your Supabase SQL Editor
-- Org-based RLS (team data sharing)

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

-- Contacts table (CRM entries - people/companies the CEO is selling to)
create table if not exists public.contacts (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
  name text not null,
  company text,
  email text,
  phone text,
  title text,
  deal_value numeric,
  stage text default 'Lead',
  source text,
  priority text default 'Medium',
  next_follow_up date,
  next_follow_up_note text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contact Activities table (timeline tracking per contact)
create table if not exists public.contact_activities (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
  contact_id bigint references public.contacts(id) on delete cascade not null,
  contact_name text not null,
  activity_type text not null, -- 'stage_change', 'note', 'created', 'follow_up'
  description text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

-- Actions table (tasks/to-dos, optionally linked to a contact)
create table if not exists public.weekly_actions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  org_id uuid references public.organizations(id) not null,
  action text not null,
  owner text,
  due date,
  priority text default 'Medium',
  status text default 'Not Started',
  contact_id bigint references public.contacts(id) on delete set null,
  contact_name text,
  tags text,
  created_at timestamptz default now()
);

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================

alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_activities enable row level security;
alter table public.weekly_actions enable row level security;

-- ============================================================
-- SECURITY DEFINER helper functions (bypass RLS)
-- ============================================================

-- Resolve a user's org_id (used by frontend on login)
create or replace function public.get_user_org(p_user_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select org_id from org_members where user_id = p_user_id limit 1;
$$;

-- Check if current user is a member of the given org
create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from org_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

-- ============================================================
-- Org-based RLS policies
-- ============================================================

-- organizations
create policy "Org members can view organizations" on public.organizations for select
  using (public.is_org_member(id));

-- org_members
create policy "Org members can view org_members" on public.org_members for select
  using (public.is_org_member(org_id));

-- contacts
create policy "Org members can select contacts" on public.contacts for select
  using (public.is_org_member(org_id));
create policy "Org members can insert contacts" on public.contacts for insert
  with check (public.is_org_member(org_id));
create policy "Org members can update contacts" on public.contacts for update
  using (public.is_org_member(org_id));
create policy "Org members can delete contacts" on public.contacts for delete
  using (public.is_org_member(org_id));

-- contact_activities
create policy "Org members can select contact_activities" on public.contact_activities for select
  using (public.is_org_member(org_id));
create policy "Org members can insert contact_activities" on public.contact_activities for insert
  with check (public.is_org_member(org_id));
create policy "Org members can update contact_activities" on public.contact_activities for update
  using (public.is_org_member(org_id));
create policy "Org members can delete contact_activities" on public.contact_activities for delete
  using (public.is_org_member(org_id));

-- weekly_actions
create policy "Org members can select weekly_actions" on public.weekly_actions for select
  using (public.is_org_member(org_id));
create policy "Org members can insert weekly_actions" on public.weekly_actions for insert
  with check (public.is_org_member(org_id));
create policy "Org members can update weekly_actions" on public.weekly_actions for update
  using (public.is_org_member(org_id));
create policy "Org members can delete weekly_actions" on public.weekly_actions for delete
  using (public.is_org_member(org_id));

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_org_members_org_id on public.org_members(org_id);
create index if not exists idx_org_members_user_id on public.org_members(user_id);
create index if not exists idx_contacts_user_id on public.contacts(user_id);
create index if not exists idx_contacts_org_id on public.contacts(org_id);
create index if not exists idx_contacts_stage on public.contacts(stage);
create index if not exists idx_contact_activities_org_id on public.contact_activities(org_id);
create index if not exists idx_contact_activities_contact_id on public.contact_activities(contact_id);
create index if not exists idx_weekly_actions_org_id on public.weekly_actions(org_id);
create index if not exists idx_weekly_actions_contact_id on public.weekly_actions(contact_id);

-- ============================================================
-- Triggers
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_contacts_updated_at
  before update on public.contacts
  for each row
  execute function update_updated_at_column();

-- ============================================================
-- Auto-onboarding function
-- ============================================================

-- Ensures every authenticated user gets linked to the "Quside" org.
-- Solves the chicken-and-egg RLS problem where new users can't create their own membership.
create or replace function public.ensure_user_org(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  -- Check if user already has an org
  select org_id into v_org_id from org_members where user_id = p_user_id limit 1;
  if v_org_id is not null then
    return v_org_id;
  end if;

  -- Find or create the "Quside" organization
  select id into v_org_id from organizations where name = 'Quside' limit 1;
  if v_org_id is null then
    insert into organizations (name) values ('Quside') returning id into v_org_id;
  end if;

  -- Add user as org member
  insert into org_members (org_id, user_id) values (v_org_id, p_user_id)
    on conflict (org_id, user_id) do nothing;

  return v_org_id;
end;
$$;
