# Series B Command Center

A complete fundraising tracker for managing your Series B from start to close.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Series+B+Command+Center)

## Features

- **Dashboard** - Key metrics, timeline, pipeline visualization, weekly actions
- **Pipeline** - Track investors through stages (Target → Contacted → Engaged → Diligence → Term Sheet → Close)
- **Emails** - Log all investor communications with the 14-email sequence framework
- **Meetings** - Schedule and document investor meetings with follow-ups
- **Materials** - Checklist for all fundraise materials (Tier 1/2/3)
- **Term Sheets** - Track and compare incoming term sheets

## Quick Start

### Option 1: Local Development (No Backend)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/series-b-tracker.git
cd series-b-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Data will be saved to localStorage (browser only).

### Option 2: With Supabase (Team Collaboration)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to initialize

2. **Run the Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase/schema.sql`
   - Run the SQL to create all tables

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start the App**
   ```bash
   npm install
   npm run dev
   ```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or use: vercel env add VITE_SUPABASE_URL
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

## Project Structure

```
series-b-tracker/
├── src/
│   ├── components/
│   │   ├── Auth.jsx         # Login/signup
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── Pipeline.jsx     # Investor pipeline
│   │   ├── Emails.jsx       # Email tracker
│   │   ├── Meetings.jsx     # Meeting scheduler
│   │   ├── Materials.jsx    # Materials checklist
│   │   └── TermSheets.jsx   # Term sheet tracker
│   ├── hooks/
│   │   └── useData.js       # Data management hook
│   ├── lib/
│   │   └── supabase.js      # Supabase client
│   ├── App.jsx              # Main app
│   ├── main.jsx             # Entry point
│   └── index.css            # Styles
├── supabase/
│   └── schema.sql           # Database schema
├── .env.example             # Environment template
├── package.json
└── README.md
```

## Using with Claude Code

This project is designed to be extended with Claude Code. Here are some prompts to try:

```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Start Claude Code in your project
cd series-b-tracker
claude
```

**Example prompts:**

- "Add real-time sync so my team sees updates instantly"
- "Add email notifications when an investor moves to Term Sheet stage"
- "Integrate with Google Calendar to sync meetings"
- "Add a Slack webhook to post daily pipeline summaries"
- "Add data export to Google Sheets"
- "Add a mobile-optimized view"

## Fundraise Framework

This app is built around a structured Series B timeline:

| Phase | Timing | Focus |
|-------|--------|-------|
| **Preparation** | Jan-Feb | Investor warming, narrative setup |
| **Roadshow** | Mar-Apr | First meetings, deep dives |
| **Term Sheets** | May | Receive and negotiate terms |
| **Close** | Jun-Jul | Legal docs, wire |

### Stage Gates

- **G1 Response**: 5 business days to reply
- **G2 First Meeting**: 7 days to schedule
- **G3 Deep Dive**: 10 days to request data room
- **G4 Diligence**: 3 weeks to complete
- **G5 Term Sheet**: 2 weeks from intent

### Email Sequence

1. Catching Up
2. Quick Question
3. The Heads Up
4. Official Outreach
5. Traction Update
6. Scheduling Push
7. Post-Meeting Follow-Up
8. Process Update
9. Customer Win
10. Partner Meeting Request
11. Timeline Clarity
12. Term Sheet Received
13. Final Call
14. Graceful Close

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Routing**: React Router

## License

MIT

## Support

For questions or feature requests, open an issue or reach out to the team.

---

Built for founders running high-velocity fundraises. Good luck with your Series B! 🚀
