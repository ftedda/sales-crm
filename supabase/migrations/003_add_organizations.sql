-- Migration: Add organizations + team-based RLS
-- Run this in your Supabase SQL Editor
-- This replaces per-user RLS with org-membership-based RLS so team members share data.

BEGIN;

-- ============================================================
-- 1. Create organization tables
-- ============================================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.org_members (
  id bigserial PRIMARY KEY,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON public.org_members(org_id);
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);

-- Enable RLS on org tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Add org_id column to all data tables
-- ============================================================

ALTER TABLE public.investors ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.emails ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.meetings ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.materials ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.term_sheets ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.weekly_actions ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public."references" ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.investor_activities ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.cap_table_shareholders ADD COLUMN org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.cap_table_options ADD COLUMN org_id uuid REFERENCES public.organizations(id);

-- Create weekly_snapshots (never existed yet) with org_id from the start
CREATE TABLE IF NOT EXISTS public.weekly_snapshots (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id uuid REFERENCES public.organizations(id) NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  stage_target_list integer DEFAULT 0,
  stage_contacted integer DEFAULT 0,
  stage_engaged integer DEFAULT 0,
  stage_in_diligence integer DEFAULT 0,
  stage_term_sheet integer DEFAULT 0,
  stage_closing integer DEFAULT 0,
  stage_closed integer DEFAULT 0,
  stage_passed integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  emails_replied integer DEFAULT 0,
  meetings_held integer DEFAULT 0,
  new_investors integer DEFAULT 0,
  response_rate numeric,
  win_rate numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, week_start)
);
ALTER TABLE public.weekly_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. Data migration: create default org, add members, backfill
-- ============================================================

-- Create default organization
INSERT INTO public.organizations (id, name) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Quside'
);

-- Add all existing auth.users to the default org
INSERT INTO public.org_members (org_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM auth.users
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Backfill org_id on all existing rows
UPDATE public.investors SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.emails SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.meetings SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.materials SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.term_sheets SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.weekly_actions SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public."references" SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.investor_activities SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.cap_table_shareholders SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;
UPDATE public.cap_table_options SET org_id = '00000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;

-- Make org_id NOT NULL now that all rows are backfilled
ALTER TABLE public.investors ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.emails ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.meetings ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.materials ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.term_sheets ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.weekly_actions ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public."references" ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.investor_activities ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.cap_table_shareholders ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE public.cap_table_options ALTER COLUMN org_id SET NOT NULL;

-- ============================================================
-- 4. Update unique constraints
-- ============================================================

-- cap_table_options: one option pool config per org (not per user)
ALTER TABLE public.cap_table_options DROP CONSTRAINT IF EXISTS cap_table_options_user_id_key;
ALTER TABLE public.cap_table_options ADD CONSTRAINT cap_table_options_org_id_key UNIQUE (org_id);

-- ============================================================
-- 5. Add org_id indexes on all data tables
-- ============================================================

CREATE INDEX idx_investors_org_id ON public.investors(org_id);
CREATE INDEX idx_emails_org_id ON public.emails(org_id);
CREATE INDEX idx_meetings_org_id ON public.meetings(org_id);
CREATE INDEX idx_materials_org_id ON public.materials(org_id);
CREATE INDEX idx_term_sheets_org_id ON public.term_sheets(org_id);
CREATE INDEX idx_weekly_actions_org_id ON public.weekly_actions(org_id);
CREATE INDEX idx_references_org_id ON public."references"(org_id);
CREATE INDEX idx_investor_activities_org_id ON public.investor_activities(org_id);
CREATE INDEX idx_cap_table_shareholders_org_id ON public.cap_table_shareholders(org_id);
CREATE INDEX idx_cap_table_options_org_id ON public.cap_table_options(org_id);
CREATE INDEX idx_weekly_snapshots_org_id ON public.weekly_snapshots(org_id);
CREATE INDEX idx_weekly_snapshots_week_start ON public.weekly_snapshots(week_start);

-- ============================================================
-- 6. Drop all old per-user RLS policies
-- ============================================================

-- investors
DROP POLICY IF EXISTS "Users can view own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can insert own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can update own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can delete own investors" ON public.investors;

-- emails
DROP POLICY IF EXISTS "Users can view own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can insert own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can update own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can delete own emails" ON public.emails;

-- meetings
DROP POLICY IF EXISTS "Users can view own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can insert own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON public.meetings;

-- materials
DROP POLICY IF EXISTS "Users can view own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can insert own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can update own materials" ON public.materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON public.materials;

-- term_sheets
DROP POLICY IF EXISTS "Users can view own term_sheets" ON public.term_sheets;
DROP POLICY IF EXISTS "Users can insert own term_sheets" ON public.term_sheets;
DROP POLICY IF EXISTS "Users can update own term_sheets" ON public.term_sheets;
DROP POLICY IF EXISTS "Users can delete own term_sheets" ON public.term_sheets;

-- weekly_actions
DROP POLICY IF EXISTS "Users can view own weekly_actions" ON public.weekly_actions;
DROP POLICY IF EXISTS "Users can insert own weekly_actions" ON public.weekly_actions;
DROP POLICY IF EXISTS "Users can update own weekly_actions" ON public.weekly_actions;
DROP POLICY IF EXISTS "Users can delete own weekly_actions" ON public.weekly_actions;

-- references (quoted - reserved word)
DROP POLICY IF EXISTS "Users can view own references" ON public."references";
DROP POLICY IF EXISTS "Users can insert own references" ON public."references";
DROP POLICY IF EXISTS "Users can update own references" ON public."references";
DROP POLICY IF EXISTS "Users can delete own references" ON public."references";

-- investor_activities
DROP POLICY IF EXISTS "Users can view own investor_activities" ON public.investor_activities;
DROP POLICY IF EXISTS "Users can insert own investor_activities" ON public.investor_activities;
DROP POLICY IF EXISTS "Users can update own investor_activities" ON public.investor_activities;
DROP POLICY IF EXISTS "Users can delete own investor_activities" ON public.investor_activities;

-- cap_table_shareholders
DROP POLICY IF EXISTS "Users can view own cap_table_shareholders" ON public.cap_table_shareholders;
DROP POLICY IF EXISTS "Users can insert own cap_table_shareholders" ON public.cap_table_shareholders;
DROP POLICY IF EXISTS "Users can update own cap_table_shareholders" ON public.cap_table_shareholders;
DROP POLICY IF EXISTS "Users can delete own cap_table_shareholders" ON public.cap_table_shareholders;

-- cap_table_options
DROP POLICY IF EXISTS "Users can view own cap_table_options" ON public.cap_table_options;
DROP POLICY IF EXISTS "Users can insert own cap_table_options" ON public.cap_table_options;
DROP POLICY IF EXISTS "Users can update own cap_table_options" ON public.cap_table_options;
DROP POLICY IF EXISTS "Users can delete own cap_table_options" ON public.cap_table_options;

-- ============================================================
-- 7. Create new org-based RLS policies
-- ============================================================

-- Helper: check if current user is a member of the given org
-- (inlined in each policy for clarity and to avoid function-based RLS overhead)

-- organizations: members can view their orgs
CREATE POLICY "Org members can view organizations"
  ON public.organizations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = organizations.id AND org_members.user_id = auth.uid()));

-- org_members: members can view members of their orgs
CREATE POLICY "Org members can view org_members"
  ON public.org_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid()));

-- investors
CREATE POLICY "Org members can select investors" ON public.investors FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investors.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert investors" ON public.investors FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investors.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update investors" ON public.investors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investors.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete investors" ON public.investors FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investors.org_id AND org_members.user_id = auth.uid()));

-- emails
CREATE POLICY "Org members can select emails" ON public.emails FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = emails.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert emails" ON public.emails FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = emails.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update emails" ON public.emails FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = emails.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete emails" ON public.emails FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = emails.org_id AND org_members.user_id = auth.uid()));

-- meetings
CREATE POLICY "Org members can select meetings" ON public.meetings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = meetings.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert meetings" ON public.meetings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = meetings.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update meetings" ON public.meetings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = meetings.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete meetings" ON public.meetings FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = meetings.org_id AND org_members.user_id = auth.uid()));

-- materials
CREATE POLICY "Org members can select materials" ON public.materials FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = materials.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert materials" ON public.materials FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = materials.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update materials" ON public.materials FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = materials.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete materials" ON public.materials FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = materials.org_id AND org_members.user_id = auth.uid()));

-- term_sheets
CREATE POLICY "Org members can select term_sheets" ON public.term_sheets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = term_sheets.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert term_sheets" ON public.term_sheets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = term_sheets.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update term_sheets" ON public.term_sheets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = term_sheets.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete term_sheets" ON public.term_sheets FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = term_sheets.org_id AND org_members.user_id = auth.uid()));

-- weekly_actions
CREATE POLICY "Org members can select weekly_actions" ON public.weekly_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_actions.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert weekly_actions" ON public.weekly_actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_actions.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update weekly_actions" ON public.weekly_actions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_actions.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete weekly_actions" ON public.weekly_actions FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_actions.org_id AND org_members.user_id = auth.uid()));

-- references (quoted - reserved word)
CREATE POLICY "Org members can select references" ON public."references" FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = "references".org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert references" ON public."references" FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = "references".org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update references" ON public."references" FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = "references".org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete references" ON public."references" FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = "references".org_id AND org_members.user_id = auth.uid()));

-- investor_activities
CREATE POLICY "Org members can select investor_activities" ON public.investor_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investor_activities.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert investor_activities" ON public.investor_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investor_activities.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update investor_activities" ON public.investor_activities FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investor_activities.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete investor_activities" ON public.investor_activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = investor_activities.org_id AND org_members.user_id = auth.uid()));

-- cap_table_shareholders
CREATE POLICY "Org members can select cap_table_shareholders" ON public.cap_table_shareholders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_shareholders.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert cap_table_shareholders" ON public.cap_table_shareholders FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_shareholders.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update cap_table_shareholders" ON public.cap_table_shareholders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_shareholders.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete cap_table_shareholders" ON public.cap_table_shareholders FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_shareholders.org_id AND org_members.user_id = auth.uid()));

-- cap_table_options
CREATE POLICY "Org members can select cap_table_options" ON public.cap_table_options FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_options.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert cap_table_options" ON public.cap_table_options FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_options.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update cap_table_options" ON public.cap_table_options FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_options.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete cap_table_options" ON public.cap_table_options FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = cap_table_options.org_id AND org_members.user_id = auth.uid()));

-- weekly_snapshots
CREATE POLICY "Org members can select weekly_snapshots" ON public.weekly_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_snapshots.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can insert weekly_snapshots" ON public.weekly_snapshots FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_snapshots.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can update weekly_snapshots" ON public.weekly_snapshots FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_snapshots.org_id AND org_members.user_id = auth.uid()));
CREATE POLICY "Org members can delete weekly_snapshots" ON public.weekly_snapshots FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.org_members WHERE org_members.org_id = weekly_snapshots.org_id AND org_members.user_id = auth.uid()));

-- ============================================================
-- 8. Helper function to resolve user's org (bypasses RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_org(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM org_members WHERE user_id = p_user_id LIMIT 1;
$$;

COMMIT;
