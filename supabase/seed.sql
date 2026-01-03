-- Series B Command Center - Demo Data Seed Functions
-- Run this entire file in Supabase SQL Editor to create the seed functions
--
-- USAGE:
-- 1. Run this file to create the functions
-- 2. Get your user ID: SELECT id FROM auth.users WHERE email = 'your@email.com';
-- 3. Seed data: SELECT seed_demo_data('your-user-uuid');
-- 4. Clear data: SELECT clear_all_user_data('your-user-uuid');

-- ============================================================================
-- SEED DEMO DATA FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION seed_demo_data(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  investor_count INT;
BEGIN
  -- Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Check if user already has investors (prevent duplicate seeding)
  SELECT COUNT(*) INTO investor_count FROM public.investors WHERE user_id = target_user_id;
  IF investor_count > 0 THEN
    RAISE EXCEPTION 'User already has data. Run clear_all_user_data() first.';
  END IF;

  -- ========================================
  -- INVESTORS (16 total - all stages/tiers)
  -- ========================================
  INSERT INTO public.investors (user_id, firm, contact, email, phone, intro_source, tier, stage, first_contact_date, last_contact_date, next_action, next_action_date, data_room_access, engagement_score, notes, pass_reason)
  VALUES
    -- Tier 1: Must Have (4 investors)
    (target_user_id, 'Sequoia Capital', 'Sarah Chen', 'schen@sequoia.com', '+1-650-555-0101', 'Board intro from John', '1 - Must Have', 'In Diligence', '2025-12-15', '2026-01-02', 'Send financial model update', '2026-01-05', true, 85, 'Very interested in quantum computing angle. Deep tech partner assigned.', NULL),
    (target_user_id, 'Andreessen Horowitz', 'Marc Williams', 'mwilliams@a16z.com', '+1-650-555-0102', 'Cold outreach via LinkedIn', '1 - Must Have', 'Term Sheet', '2025-11-20', '2026-01-01', 'Review term sheet terms', '2026-01-03', true, 95, 'Strong conviction. Wants to lead. $25M lead, $160M pre.', NULL),
    (target_user_id, 'Accel Partners', 'David Kim', 'dkim@accel.com', '+1-650-555-0103', 'Conference meeting at TechCrunch', '1 - Must Have', 'Engaged', '2025-12-01', '2025-12-28', 'Schedule partner meeting', '2026-01-07', false, 70, 'Interested but needs more traction data.', NULL),
    (target_user_id, 'Coatue Management', 'Daniel Brown', 'dbrown@coatue.com', '+1-212-555-0104', 'CEO network intro', '1 - Must Have', 'Contacted', '2026-01-01', '2026-01-01', 'Await meeting confirmation', '2026-01-04', false, 35, 'Tiger cub with tech focus. Fast movers.', NULL),

    -- Tier 2: Strong Fit (8 investors)
    (target_user_id, 'Index Ventures', 'Elena Rodriguez', 'erodriguez@indexventures.com', '+44-20-555-0201', 'Warm intro from portfolio CEO', '2 - Strong Fit', 'Contacted', '2026-01-02', '2026-01-02', 'Follow up on intro email', '2026-01-05', false, 40, 'New partner focused on deep tech. European perspective.', NULL),
    (target_user_id, 'Lightspeed Venture', 'Michael Chang', 'mchang@lsvp.com', '+1-650-555-0202', 'Investor event networking', '2 - Strong Fit', 'Engaged', '2025-12-10', '2025-12-20', 'Send customer references', '2026-01-04', true, 65, 'Wants to see more enterprise traction. Good chemistry.', NULL),
    (target_user_id, 'Bessemer Venture Partners', 'Jennifer Liu', 'jliu@bvp.com', '+1-650-555-0203', 'Existing investor intro', '2 - Strong Fit', 'In Diligence', '2025-11-15', '2025-12-30', 'Technical diligence call', '2026-01-06', true, 80, 'Running full diligence process. Anti-dilution focus.', NULL),
    (target_user_id, 'General Catalyst', 'Robert Taylor', 'rtaylor@gc.com', '+1-617-555-0204', 'Direct outreach', '2 - Strong Fit', 'Closing', '2025-10-01', '2026-01-01', 'Finalize docs', '2026-01-08', true, 90, 'Term sheet signed, working on docs. $20M at $140M pre.', NULL),
    (target_user_id, 'NEA', 'Amanda Foster', 'afoster@nea.com', '+1-650-555-0205', NULL, '2 - Strong Fit', 'Target List', NULL, NULL, 'Research and prep intro', NULL, false, 0, 'Large fund, need to find right partner. Healthcare angle?', NULL),
    (target_user_id, 'Insight Partners', 'Rachel Green', 'rgreen@insight.com', '+1-212-555-0206', NULL, '2 - Strong Fit', 'Target List', NULL, NULL, 'Research team focus', NULL, false, 0, 'Growth stage, may be early for us but worth exploring.', NULL),
    (target_user_id, 'IVP', 'Michelle Lee', 'mlee@ivp.com', '+1-650-555-0207', 'Board member intro', '2 - Strong Fit', 'Passed', '2025-10-15', '2025-11-30', NULL, NULL, false, 25, 'Good meetings but timing not right.', 'Timing - revisit Series C'),
    (target_user_id, 'Tiger Global', 'Kevin Zhang', 'kzhang@tiger.com', '+1-212-555-0208', 'Conference intro', '2 - Strong Fit', 'Target List', NULL, NULL, 'Find warm intro path', NULL, false, 0, 'Returned to market, moving fast on deep tech.', NULL),

    -- Tier 3: Opportunistic (4 investors)
    (target_user_id, 'Founders Fund', 'Peter Walsh', 'pwalsh@ff.com', '+1-415-555-0301', 'Twitter DM', '3 - Opportunistic', 'Contacted', '2025-12-20', '2025-12-20', 'Wait for response', '2026-01-10', false, 30, 'Long shot but high conviction if interested. Thiel connection.', NULL),
    (target_user_id, 'Greylock Partners', 'Lisa Anderson', 'landerson@greylock.com', '+1-650-555-0302', 'Conference intro', '3 - Opportunistic', 'Passed', '2025-11-01', '2025-12-01', NULL, NULL, false, 20, 'Good conversation but not their current focus.', 'Not investing in deep tech currently'),
    (target_user_id, 'Kleiner Perkins', 'Susan Martinez', 'smartinez@kp.com', '+1-650-555-0303', 'Portfolio company referral', '3 - Opportunistic', 'Engaged', '2025-12-05', '2025-12-22', 'Send updated deck', '2026-01-05', false, 55, 'Partner exploring quantum space. Newer to sector.', NULL),
    (target_user_id, 'Battery Ventures', 'Tom Wilson', 'twilson@battery.com', '+1-617-555-0304', 'Previous relationship', '3 - Opportunistic', 'Closed', '2025-08-01', '2025-12-15', NULL, NULL, true, 100, 'Previous investor, participating $5M in round. Strong advocate.', NULL);

  -- ========================================
  -- EMAILS (30 total - all 14 types)
  -- ========================================
  INSERT INTO public.emails (user_id, investor, type, subject, sent_date, sent_by, opened, clicked, replied, reply_date, notes)
  VALUES
    -- Pre-Launch Phase (Types 1-3)
    (target_user_id, 'Sequoia Capital', 'Catching Up', 'Quick catch up on progress', '2025-11-15', 'CEO', true, false, true, '2025-11-17', 'Sarah responded positively, wants to stay close'),
    (target_user_id, 'Andreessen Horowitz', 'Quick Question', 'Quick question on deep tech thesis', '2025-11-18', 'CEO', true, true, true, '2025-11-19', 'Marc interested in learning more about our approach'),
    (target_user_id, 'Accel Partners', 'The Heads Up', 'Upcoming Series B announcement', '2025-11-25', 'CEO', true, false, true, '2025-11-27', 'David wants to be included in process'),
    (target_user_id, 'Index Ventures', 'Catching Up', 'Following up from TechCrunch', '2025-12-01', 'CEO', true, false, false, NULL, 'No response yet - will follow up'),
    (target_user_id, 'Lightspeed Venture', 'Quick Question', 'Enterprise quantum use cases', '2025-12-05', 'CEO', true, true, true, '2025-12-06', 'Michael very engaged on enterprise angle'),

    -- Launch Phase (Types 4-6)
    (target_user_id, 'Sequoia Capital', 'Official Outreach', 'Series B - Quantum Computing Opportunity', '2025-12-15', 'CEO', true, true, true, '2025-12-16', 'Scheduled intro call immediately'),
    (target_user_id, 'Andreessen Horowitz', 'Official Outreach', 'Series B Process - Deep Tech Leader', '2025-12-10', 'CEO', true, true, true, '2025-12-11', 'Very interested, fast-tracked to partner meeting'),
    (target_user_id, 'Lightspeed Venture', 'Official Outreach', 'Series B Opportunity', '2025-12-12', 'CEO', true, false, true, '2025-12-14', 'Wants more info on enterprise pipeline'),
    (target_user_id, 'Bessemer Venture Partners', 'Official Outreach', 'Series B - Your Next Quantum Investment', '2025-12-08', 'CEO', true, true, true, '2025-12-09', 'Enthusiastic response, assigned deal lead'),
    (target_user_id, 'General Catalyst', 'Traction Update', 'December metrics update', '2025-12-20', 'CEO', true, true, true, '2025-12-21', 'Impressed with growth, accelerated timeline'),
    (target_user_id, 'Coatue Management', 'Official Outreach', 'Introduction - Quantum Series B', '2026-01-01', 'CEO', true, false, false, NULL, 'Just sent, awaiting response'),
    (target_user_id, 'Kleiner Perkins', 'Traction Update', 'Q4 Highlights', '2025-12-22', 'CEO', true, false, true, '2025-12-23', 'Partner wants to discuss further'),
    (target_user_id, 'Founders Fund', 'Official Outreach', 'Deep Tech Series B', '2025-12-20', 'CEO', false, false, false, NULL, 'Cold outreach, no open yet'),
    (target_user_id, 'NEA', 'Scheduling Push', 'Following up - meeting request', '2025-12-28', 'CEO', true, false, false, NULL, 'Awaiting response'),
    (target_user_id, 'Index Ventures', 'Scheduling Push', 'Hoping to connect this week', '2026-01-02', 'CEO', false, false, false, NULL, 'Just sent'),

    -- Roadshow Phase (Types 7-10)
    (target_user_id, 'Sequoia Capital', 'Post-Meeting Follow-Up', 'Great meeting today - next steps', '2025-12-18', 'CEO', true, true, true, '2025-12-18', 'Moving to diligence, assigned tech partner'),
    (target_user_id, 'Andreessen Horowitz', 'Post-Meeting Follow-Up', 'Partner meeting follow-up', '2025-12-20', 'CEO', true, true, true, '2025-12-20', 'Preparing term sheet internally'),
    (target_user_id, 'Bessemer Venture Partners', 'Process Update', 'Diligence timeline update', '2025-12-25', 'CEO', true, false, true, '2025-12-26', 'On track for January decision'),
    (target_user_id, 'Lightspeed Venture', 'Customer Win', 'New Fortune 500 customer signed', '2025-12-28', 'CEO', true, true, true, '2025-12-29', 'Very excited about enterprise traction'),
    (target_user_id, 'Accel Partners', 'Partner Meeting Request', 'Request for partner meeting', '2025-12-30', 'CEO', true, false, false, NULL, 'Pending response'),
    (target_user_id, 'General Catalyst', 'Process Update', 'Documentation status', '2025-12-30', 'CEO', true, false, true, '2025-12-31', 'Moving forward on legal docs'),
    (target_user_id, 'Sequoia Capital', 'Customer Win', 'Major enterprise deal closed', '2025-12-30', 'CEO', true, true, true, '2025-12-31', 'Strengthened conviction, expediting process'),
    (target_user_id, 'Bessemer Venture Partners', 'Partner Meeting Request', 'Full partnership meeting', '2026-01-02', 'CEO', true, false, false, NULL, 'Key milestone - awaiting confirmation'),

    -- Close Phase (Types 11-14)
    (target_user_id, 'Andreessen Horowitz', 'Timeline Clarity', 'Decision timeline discussion', '2025-12-28', 'CEO', true, true, true, '2025-12-28', 'Term sheet coming within days'),
    (target_user_id, 'Andreessen Horowitz', 'Term Sheet Received', 'Thank you for term sheet', '2026-01-01', 'CEO', true, true, true, '2026-01-01', 'Reviewing terms with counsel'),
    (target_user_id, 'General Catalyst', 'Timeline Clarity', 'Closing timeline', '2025-12-28', 'CEO', true, false, true, '2025-12-29', 'Aligned on closing by mid-January'),
    (target_user_id, 'Greylock Partners', 'Graceful Close', 'Thank you for your time', '2025-12-05', 'CEO', true, false, true, '2025-12-06', 'Polite decline acknowledgment, door open for future'),
    (target_user_id, 'IVP', 'Graceful Close', 'Appreciate the consideration', '2025-12-01', 'CEO', true, false, true, '2025-12-02', 'Will reconnect for Series C'),
    (target_user_id, 'Battery Ventures', 'Final Call', 'Participation confirmation', '2025-12-10', 'CEO', true, true, true, '2025-12-10', 'Confirmed $5M participation'),
    (target_user_id, 'Sequoia Capital', 'Timeline Clarity', 'Process timeline alignment', '2026-01-02', 'CEO', true, false, false, NULL, 'Just sent');

  -- ========================================
  -- MEETINGS (15 total - past and future)
  -- ========================================
  INSERT INTO public.meetings (user_id, investor, date, time, type, attendees_us, attendees_them, location, prep_status, topics, notes, follow_up, follow_up_owner, follow_up_due)
  VALUES
    -- Past meetings (8)
    (target_user_id, 'Sequoia Capital', '2025-12-18', '10:00', 'Intro Call (30 min)', 'CEO, CTO', 'Sarah Chen', 'Zoom', 'Complete', 'Company overview, market opportunity, tech differentiation', 'Very engaged, asked deep questions about tech moat. Wants to move fast.', 'Send technical whitepaper', 'CTO', '2025-12-20'),
    (target_user_id, 'Andreessen Horowitz', '2025-12-20', '14:00', 'Partner Meeting', 'CEO, CTO, CFO', 'Marc Williams, Chris Dixon', 'In-person Menlo Park', 'Complete', 'Full pitch, financials deep dive, team background', 'Extremely positive. Chris very bullish on quantum. Discussing term sheet internally.', 'Prepare for term sheet negotiation', 'CEO', '2026-01-02'),
    (target_user_id, 'Bessemer Venture Partners', '2025-12-22', '11:00', 'Deep Dive (60 min)', 'CEO, CTO', 'Jennifer Liu, Tech Partner', 'Zoom', 'Complete', 'Technology deep dive, IP review, roadmap', 'Technical due diligence starting. They like our patent portfolio.', 'Connect with tech diligence team', 'CTO', '2025-12-28'),
    (target_user_id, 'Lightspeed Venture', '2025-12-20', '09:00', 'Intro Call (30 min)', 'CEO', 'Michael Chang', 'Zoom', 'Complete', 'Initial introduction, market sizing', 'Interested in enterprise angle. Wants customer references.', 'Send customer case studies', 'CEO', '2025-12-22'),
    (target_user_id, 'Kleiner Perkins', '2025-12-22', '15:00', 'Intro Call (30 min)', 'CEO', 'Susan Martinez', 'Coffee - Palo Alto', 'Complete', 'Informal discussion, thesis alignment', 'Good rapport, she is building quantum thesis. Wants to learn more.', 'Send updated deck', 'CEO', '2025-12-27'),
    (target_user_id, 'General Catalyst', '2025-12-15', '13:00', 'Term Sheet Discussion', 'CEO, CFO', 'Robert Taylor, Legal', 'Zoom', 'Complete', 'Term sheet review, key terms negotiation', 'Aligned on major terms. Working through anti-dilution details.', 'Review legal docs with counsel', 'CFO', '2025-12-20'),
    (target_user_id, 'Battery Ventures', '2025-12-10', '10:30', 'Deep Dive (60 min)', 'CEO, CTO', 'Tom Wilson', 'In-person Boston', 'Complete', 'Existing investor update, round participation', 'Confirmed $5M participation. Very supportive of direction.', NULL, NULL, NULL),
    (target_user_id, 'Accel Partners', '2025-12-28', '16:00', 'Deep Dive (60 min)', 'CEO, CTO', 'David Kim, Principal', 'Zoom', 'Complete', 'Technical and market deep dive', 'Good meeting, wants full partner intro. Concerned about competition.', 'Prepare competitive analysis', 'CEO', '2026-01-05'),

    -- Future meetings (7)
    (target_user_id, 'Sequoia Capital', '2026-01-06', '14:00', 'Diligence Call', 'CTO', 'Sarah Chen, Tech Partner', 'Zoom', 'In Progress', 'Technical architecture review, scalability', NULL, NULL, NULL, NULL),
    (target_user_id, 'Andreessen Horowitz', '2026-01-03', '11:00', 'Term Sheet Discussion', 'CEO, CFO', 'Marc Williams, Legal', 'Zoom', 'In Progress', 'Term sheet review and negotiation', NULL, NULL, NULL, NULL),
    (target_user_id, 'Bessemer Venture Partners', '2026-01-08', '10:00', 'Partner Meeting', 'CEO, CTO, CFO', 'Jennifer Liu, Full Partnership', 'In-person Boston', 'Not Started', 'Final partnership presentation, Q&A', NULL, NULL, NULL, NULL),
    (target_user_id, 'Accel Partners', '2026-01-10', '09:30', 'Partner Meeting', 'CEO, CTO', 'David Kim, Partners', 'In-person SF', 'Not Started', 'Full pitch to partnership', NULL, NULL, NULL, NULL),
    (target_user_id, 'Lightspeed Venture', '2026-01-05', '15:00', 'Customer Reference', 'CEO', 'Michael Chang, Associate', 'Zoom', 'In Progress', 'Customer reference calls intro', NULL, NULL, NULL, NULL),
    (target_user_id, 'Index Ventures', '2026-01-07', '10:00', 'Intro Call (30 min)', 'CEO', 'Elena Rodriguez', 'Zoom', 'Not Started', 'Initial pitch, European market', NULL, NULL, NULL, NULL),
    (target_user_id, 'Coatue Management', '2026-01-08', '14:30', 'Intro Call (30 min)', 'CEO', 'Daniel Brown', 'Zoom', 'Not Started', 'Company introduction, growth metrics', NULL, NULL, NULL, NULL);

  -- ========================================
  -- MATERIALS (12 - with varied statuses)
  -- ========================================
  DELETE FROM public.materials WHERE user_id = target_user_id;
  INSERT INTO public.materials (user_id, name, tier, status, owner, last_updated, location)
  VALUES
    -- Tier 1: Essential (3)
    (target_user_id, 'Executive Summary (2 pages)', '1', 'Complete', 'CEO', '2025-12-20', 'Google Drive/Investor Materials'),
    (target_user_id, 'High-Level Metrics Snapshot', '1', 'Complete', 'CFO', '2025-12-28', 'Google Drive/Investor Materials'),
    (target_user_id, 'Team Overview', '1', 'Complete', 'CEO', '2025-12-15', 'Google Drive/Investor Materials'),

    -- Tier 2: Important (4)
    (target_user_id, 'Full Pitch Deck', '2', 'Complete', 'CEO', '2025-12-30', 'Google Drive/Investor Materials'),
    (target_user_id, 'Detailed Financial Model', '2', 'In Review', 'CFO', '2026-01-02', 'Google Drive/Financials'),
    (target_user_id, 'Customer Case Studies', '2', 'In Progress', 'VP Sales', '2025-12-28', NULL),
    (target_user_id, 'Product Roadmap', '2', 'Complete', 'CTO', '2025-12-22', 'Google Drive/Product'),

    -- Tier 3: Deep Dive (5)
    (target_user_id, 'Cap Table & Ownership', '3', 'Complete', 'CFO', '2025-12-20', 'Carta'),
    (target_user_id, 'Cohort Analysis & Unit Economics', '3', 'In Progress', 'CFO', '2025-12-30', NULL),
    (target_user_id, 'Sample Customer Contracts', '3', 'In Review', 'Legal', '2026-01-01', NULL),
    (target_user_id, 'Reference Customer List', '3', 'Not Started', 'VP Sales', NULL, NULL),
    (target_user_id, 'Legal Structure & Agreements', '3', 'In Progress', 'Legal', '2025-12-28', NULL);

  -- ========================================
  -- TERM SHEETS (3 - different valuations)
  -- ========================================
  INSERT INTO public.term_sheets (user_id, investor, date_received, lead_amount, total_round, pre_money, board_seats, pro_rata, terms, expiration, status)
  VALUES
    (target_user_id, 'Andreessen Horowitz', '2026-01-01', 25, 40, 160, '1 new board seat, 1 observer', true, 'Standard a16z terms. 1x non-participating preferred. 20% option pool post-money. No-shop 30 days.', '2026-01-15', 'Under Review'),
    (target_user_id, 'General Catalyst', '2025-12-28', 20, 35, 140, '1 new board seat', true, 'Founder-friendly terms. 1x participating capped at 3x. 15% option pool. Pro-rata for all existing investors.', '2026-01-10', 'Negotiating'),
    (target_user_id, 'Battery Ventures', '2025-12-20', 5, 40, 150, 'Existing board seat', true, 'Pro-rata participation from Series A. Super pro-rata to maintain 10% ownership.', NULL, 'Accepted');

  -- ========================================
  -- WEEKLY ACTIONS (8 - various statuses)
  -- ========================================
  INSERT INTO public.weekly_actions (user_id, action, owner, due, priority, status)
  VALUES
    (target_user_id, 'Review a16z term sheet with legal counsel', 'CEO', '2026-01-03', 'High', 'Not Started'),
    (target_user_id, 'Prepare Sequoia technical diligence materials', 'CTO', '2026-01-05', 'High', 'Not Started'),
    (target_user_id, 'Update financial model with Q4 actuals', 'CFO', '2026-01-04', 'High', 'Not Started'),
    (target_user_id, 'Schedule reference calls for Lightspeed', 'VP Sales', '2026-01-06', 'Medium', 'Not Started'),
    (target_user_id, 'Draft counter-proposal for GC term sheet', 'CEO', '2026-01-05', 'High', 'Not Started'),
    (target_user_id, 'Prepare BVP partner meeting presentation', 'CEO', '2026-01-07', 'Medium', 'Not Started'),
    (target_user_id, 'Send updated metrics to Index Ventures', 'CFO', '2026-01-04', 'Low', 'Complete'),
    (target_user_id, 'Follow up with Coatue on meeting confirmation', 'CEO', '2026-01-03', 'Medium', 'Complete');

  -- ========================================
  -- RETURN SUMMARY
  -- ========================================
  SELECT json_build_object(
    'success', true,
    'investors_created', (SELECT COUNT(*) FROM public.investors WHERE user_id = target_user_id),
    'emails_created', (SELECT COUNT(*) FROM public.emails WHERE user_id = target_user_id),
    'meetings_created', (SELECT COUNT(*) FROM public.meetings WHERE user_id = target_user_id),
    'materials_created', (SELECT COUNT(*) FROM public.materials WHERE user_id = target_user_id),
    'term_sheets_created', (SELECT COUNT(*) FROM public.term_sheets WHERE user_id = target_user_id),
    'weekly_actions_created', (SELECT COUNT(*) FROM public.weekly_actions WHERE user_id = target_user_id)
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- CLEAR ALL USER DATA FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION clear_all_user_data(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  inv_count INT;
  email_count INT;
  meeting_count INT;
  material_count INT;
  ts_count INT;
  action_count INT;
BEGIN
  -- Count before deletion
  SELECT COUNT(*) INTO inv_count FROM public.investors WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO email_count FROM public.emails WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO meeting_count FROM public.meetings WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO material_count FROM public.materials WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO ts_count FROM public.term_sheets WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO action_count FROM public.weekly_actions WHERE user_id = target_user_id;

  -- Delete all user data from all tables
  DELETE FROM public.weekly_actions WHERE user_id = target_user_id;
  DELETE FROM public.term_sheets WHERE user_id = target_user_id;
  DELETE FROM public.materials WHERE user_id = target_user_id;
  DELETE FROM public.meetings WHERE user_id = target_user_id;
  DELETE FROM public.emails WHERE user_id = target_user_id;
  DELETE FROM public.investors WHERE user_id = target_user_id;

  SELECT json_build_object(
    'success', true,
    'message', 'All user data cleared',
    'deleted', json_build_object(
      'investors', inv_count,
      'emails', email_count,
      'meetings', meeting_count,
      'materials', material_count,
      'term_sheets', ts_count,
      'weekly_actions', action_count
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION seed_demo_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_all_user_data(UUID) TO authenticated;

-- ============================================================================
-- USAGE EXAMPLES (run these separately after creating functions)
-- ============================================================================

-- Get your user ID:
-- SELECT id FROM auth.users WHERE email = 'your@email.com';
-- Or if logged in:
-- SELECT auth.uid();

-- Seed demo data:
-- SELECT seed_demo_data('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- Clear all data:
-- SELECT clear_all_user_data('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
