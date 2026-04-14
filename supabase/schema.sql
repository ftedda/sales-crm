-- Sales CRM Database Schema
-- Run this in your Supabase SQL Editor
-- Org-based RLS (team data sharing)

-- Grants: only postgres and service_role get blanket access.
-- authenticated gets per-table grants below. anon gets nothing.
alter default privileges in schema public grant all on tables to postgres, service_role;

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
  tier integer default 1 check (tier between 1 and 4),
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
-- Per-table grants (authenticated only, anon gets nothing)
-- ============================================================
grant select, insert, update, delete on public.contacts to authenticated;
grant select, insert, update, delete on public.contact_activities to authenticated;
grant select, insert, update, delete on public.weekly_actions to authenticated;
grant select on public.organizations to authenticated;
grant select on public.org_members to authenticated;
grant usage on all sequences in schema public to authenticated;

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

-- Restrict function access to authenticated only
revoke execute on function public.ensure_user_org(uuid) from anon, public;
revoke execute on function public.get_user_org(uuid) from anon, public;
revoke execute on function public.is_org_member(uuid) from anon, public;
grant execute on function public.ensure_user_org(uuid) to authenticated;
grant execute on function public.get_user_org(uuid) to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;

-- ============================================================
-- Org-based RLS policies (authenticated role only)
-- ============================================================

-- organizations (read-only)
create policy "authenticated_select_organizations" on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

-- org_members (read-only)
create policy "authenticated_select_org_members" on public.org_members
  for select to authenticated
  using (public.is_org_member(org_id));

-- contacts (CRUD with user_id enforcement)
create policy "authenticated_select_contacts" on public.contacts
  for select to authenticated
  using (public.is_org_member(org_id));
create policy "authenticated_insert_contacts" on public.contacts
  for insert to authenticated
  with check (public.is_org_member(org_id) and user_id = auth.uid());
create policy "authenticated_update_contacts" on public.contacts
  for update to authenticated
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id) and user_id = auth.uid());
create policy "authenticated_delete_contacts" on public.contacts
  for delete to authenticated
  using (public.is_org_member(org_id));

-- contact_activities (CRUD with user_id enforcement)
create policy "authenticated_select_contact_activities" on public.contact_activities
  for select to authenticated
  using (public.is_org_member(org_id));
create policy "authenticated_insert_contact_activities" on public.contact_activities
  for insert to authenticated
  with check (public.is_org_member(org_id) and user_id = auth.uid());
create policy "authenticated_update_contact_activities" on public.contact_activities
  for update to authenticated
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id) and user_id = auth.uid());
create policy "authenticated_delete_contact_activities" on public.contact_activities
  for delete to authenticated
  using (public.is_org_member(org_id));

-- weekly_actions (CRUD with user_id enforcement)
create policy "authenticated_select_weekly_actions" on public.weekly_actions
  for select to authenticated
  using (public.is_org_member(org_id));
create policy "authenticated_insert_weekly_actions" on public.weekly_actions
  for insert to authenticated
  with check (public.is_org_member(org_id) and user_id = auth.uid());
create policy "authenticated_update_weekly_actions" on public.weekly_actions
  for update to authenticated
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id) and user_id = auth.uid());
create policy "authenticated_delete_weekly_actions" on public.weekly_actions
  for delete to authenticated
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
