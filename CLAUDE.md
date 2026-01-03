# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Architecture

Series B Command Center is a React + Vite fundraising tracker with Supabase backend (optional - falls back to localStorage).

### Data Flow

```
App.jsx
  └── useData hook (src/hooks/useData.js)
        ├── Supabase client (if configured)
        └── localStorage fallback
```

**`useData` hook** (`src/hooks/useData.js`): Central data management hook that:
- Loads data from Supabase (if authenticated) or localStorage
- Provides CRUD operations for all entities: investors, emails, meetings, materials, termSheets, weeklyActions
- Each operation updates both Supabase (if available) and localStorage as backup
- Returns `{ data, loading, error, ...operations }`

**`supabase.js`** (`src/lib/supabase.js`): Conditional Supabase client - exports `null` if credentials not configured, allowing local-only usage.

### Component Structure

All components are in `src/components/` and receive data + operations as props from App.jsx:
- **Dashboard**: Metrics, timeline, pipeline visualization, weekly actions
- **Pipeline**: Investor CRM with stage tracking
- **Emails**: 14-email sequence tracker
- **Meetings**: Meeting scheduler with follow-ups
- **Materials**: Fundraise materials checklist (Tier 1/2/3)
- **TermSheets**: Term sheet comparison

### Database Schema

`supabase/schema.sql` defines 6 tables with Row Level Security (users only see own data):
- investors, emails, meetings, materials, term_sheets, weekly_actions
- All tables have `user_id` foreign key to `auth.users`

### Environment Variables

Required for Supabase integration (optional - app works without):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Key Patterns

- **Dual storage**: Always saves to localStorage as backup, even with Supabase
- **Conditional auth**: Shows Auth component only when Supabase is configured and user not logged in
- **Optimistic UI**: Local state updated immediately, Supabase syncs in background
- **Stage-based pipeline**: Investors progress through: Target List → Contacted → Engaged → In Diligence → Term Sheet → Closing → Closed (or Passed)
