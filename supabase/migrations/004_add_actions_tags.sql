-- Add investor linking and tags to weekly_actions
ALTER TABLE public.weekly_actions
  ADD COLUMN IF NOT EXISTS investor_id bigint REFERENCES public.investors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS investor_firm text,
  ADD COLUMN IF NOT EXISTS tags text;

-- Index for filtering actions by investor
CREATE INDEX IF NOT EXISTS idx_weekly_actions_investor_id ON public.weekly_actions(investor_id);
