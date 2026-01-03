# Cookaholics Meeting Intelligence

AI-powered meeting intelligence system for Cookaholics. Automatically transcribe, summarize, and extract action items from department meetings.

## Features

- **Dutch Transcription** - Accurate Dutch speech-to-text via OpenAI Whisper
- **AI Summaries** - Concise 5-bullet summaries via Claude AI
- **Action Items** - Automatic extraction with owners and deadlines
- **Red Flag Detection** - Identify escalations and issues automatically
- **Weekly Reports** - Automated digests for departments and MT
- **Department Dashboards** - Keuken, Sales, Marketing, and MT views

## Tech Stack

- **Framework**: Next.js 16 (Pages Router)
- **Database**: Convex
- **Auth**: Clerk
- **AI**: OpenAI Whisper + Anthropic Claude
- **Email**: Resend
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Hosting**: Vercel

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Start Convex (Terminal 1)
npx convex dev

# Start Next.js (Terminal 2)
npm run dev
```

## Project Structure

```
├── components/
│   ├── layout/          # Sidebar, Topbar, Layout
│   └── ui/              # shadcn components
├── convex/
│   ├── schema.ts        # Database schema
│   ├── departments.ts   # Department queries/mutations
│   ├── meetings.ts      # Meeting queries/mutations
│   ├── actionItems.ts   # Action item queries/mutations
│   └── users.ts         # User queries/mutations
├── pages/
│   ├── api/             # API routes
│   ├── dashboard/       # Dashboard pages
│   ├── meetings/        # Meeting pages
│   └── ...
├── lib/                 # Utility functions
├── prd/                 # Product requirements docs
└── .claude/commands/    # Claude Code workflow commands
```

## Documentation

- [PRD](./prd/prd-cookaholics-meeting-intelligence.md) - Product requirements
- [Tasks](./prd/tasks-cookaholics-meeting-intelligence.md) - Implementation tasks
- [Guidelines](./prd/task-guidelines-cookaholics.md) - Coding standards

## Git Workflow

1. `main` - Production
2. `staging` - Staging environment
3. `feature/*` - Feature branches from staging

See [task-guidelines](./prd/task-guidelines-cookaholics.md) for details.

## License

Private - Cookaholics
