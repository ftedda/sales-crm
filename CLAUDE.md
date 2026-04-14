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

Sales CRM is a React + Vite personal/sales CRM with Supabase backend (optional - falls back to localStorage).

### Data Flow

```
App.jsx
  └── useData hook (src/hooks/useData.js)
        ├── Supabase client (if configured)
        └── localStorage fallback
```

**`useData` hook** (`src/hooks/useData.js`): Central data management hook that:
- Loads data from Supabase (if authenticated) or localStorage
- Provides CRUD operations for: contacts, weeklyActions, contactActivities
- Each operation updates both Supabase (if available) and localStorage as backup
- Returns `{ data, loading, error, ...operations }`

**`supabase.js`** (`src/lib/supabase.js`): Conditional Supabase client - exports `null` if credentials not configured, allowing local-only usage.

### Component Structure

All components are in `src/components/` and receive data + operations as props from App.jsx:
- **Dashboard**: Key metrics (pipeline value, contacts, closed won), pipeline by stage chart, needs attention list, upcoming follow-ups, recent actions
- **Pipeline**: Contact CRM table with expandable rows, inline stage changes, deal values, engagement indicators, follow-up tracking. Stages: Lead > Qualified > Proposal > Negotiation > Closed Won / Closed Lost
- **Actions**: Task list with tags, due dates, contact linking, status filters
- **ContactTimeline**: Chronological activity feed modal per contact with quick notes and action creation

### Database Schema

`supabase/schema.sql` defines 3 data tables + 2 org tables with Row Level Security:
- `contacts` - CRM entries with name, company, deal_value, stage, follow-up dates
- `contact_activities` - Timeline events per contact (notes, stage changes, created)
- `weekly_actions` - Tasks/to-dos optionally linked to contacts
- `organizations`, `org_members` - Multi-tenant org support

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
- **Stage-based pipeline**: Contacts progress through: Lead > Qualified > Proposal > Negotiation > Closed Won / Closed Lost
- **Engagement tracking**: Heat indicators (Hot/Active/Warm/Cooling/Cold) based on activity recency
- **Follow-up management**: Date-based follow-ups with overdue detection and dashboard alerts
