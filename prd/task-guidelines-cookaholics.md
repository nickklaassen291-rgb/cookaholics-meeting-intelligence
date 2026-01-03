# Task Guidelines: Cookaholics Meeting Intelligence

## Coding Standards

### File Structure
```
/pages
  /api          # API routes
  /admin        # Admin-only pages
  /meetings     # Meeting pages
  /actions      # Action items pages
  /reports      # Reports pages
/components
  /ui           # shadcn components
  /layout       # Layout components (Sidebar, Topbar)
  /meetings     # Meeting-specific components
  /actions      # Action item components
/convex
  /schema.ts    # Database schema
  /meetings.ts  # Meeting queries/mutations
  /actions.ts   # Action item queries/mutations
  /users.ts     # User queries/mutations
/lib
  /whisper.ts   # Whisper API integration
  /claude.ts    # Claude API integration
  /utils.ts     # Utility functions
```

### Naming Conventions
- Components: PascalCase (MeetingCard.tsx)
- Functions: camelCase (getMeetingById)
- Files: kebab-case for pages (meeting-detail.tsx)
- Database tables: PascalCase (Meetings, ActionItems)

### Component Guidelines
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use TypeScript for all components

## Git Workflow

### Branch Strategy
1. `main` — Production (live op cookaholics-meetings.com)
2. `staging` — Staging (staging.cookaholics-meetings.com)
3. Feature branches from staging: `feature/task-2-meeting-management`

### Commit Messages
Format: `type: description`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring
- `style:` Styling changes
- `docs:` Documentation
- `test:` Tests

Examples:
- `feat: add meeting calendar view`
- `fix: resolve audio upload timeout`
- `refactor: extract transcription logic to hook`

### Workflow Per Feature
1. Create branch from staging: `git checkout -b feature/task-X-description`
2. Build feature
3. Test on localhost
4. Run `/security` check
5. Run `/ship` (lint, build, test, commit, push)
6. Create PR to staging
7. Review on staging URL
8. Merge to staging
9. Test on staging
10. Create PR from staging to main
11. Merge to main (production)
12. Run `/pull` to sync local

## Security Requirements

### After Every Feature
Run: `/security`

Check for:
- No API keys in frontend code
- All routes require authentication
- Department-based data access enforced
- File uploads validated and sanitized
- No SQL injection (Convex handles this)

### Authentication Rules
- All pages except landing require auth
- Admin pages require admin role
- Department pages check department membership
- API routes validate session

### Data Access Rules
- Users see only their department's meetings (unless MT)
- MT sees all departments
- Action items visible to: owner, department head, MT
- Reports: department reports to department, MT reports to MT

## AI Integration Guidelines

### Whisper API
- Always set language to 'nl' (Dutch)
- Handle files up to 25MB
- Timeout: 5 minutes for long recordings
- Store transcription immediately after success

### Claude API
- Use claude-sonnet-4-20250514 for summaries (cost-effective)
- Use structured prompts with clear sections
- Request JSON output for action items
- Include meeting context in prompt

### Prompt Template Example
```
Je bent een assistent die meeting notulen verwerkt voor Cookaholics.

Meeting type: {type}
Afdeling: {department}
Datum: {date}
Aanwezigen: {attendees}

Transcriptie:
{transcription}

Genereer:
1. Samenvatting (max 5 bullets, Nederlands)
2. Besproken onderwerpen
3. Genomen besluiten
4. Actiepunten in JSON: [{"beschrijving": "", "eigenaar": "", "deadline": ""}]
5. Rode vlaggen of escalaties (indien aanwezig)
```

## Testing Requirements

### Before Shipping
1. Test on localhost
2. Test all user flows manually
3. Check mobile responsiveness
4. Verify auth works correctly
5. Test with real audio file

### Test Scenarios Per Feature
- Happy path
- Error states
- Empty states
- Loading states
- Permission denied states

## Performance Guidelines

### Audio Files
- Max file size: 100MB
- Compress before upload if possible
- Stream audio playback (don't load full file)
- Clean up old audio files (retention policy)

### Database Queries
- Use indexes on frequently queried fields
- Paginate large lists
- Cache report data

### UI Performance
- Lazy load meeting transcriptions
- Virtual scroll for long lists
- Skeleton loaders during fetch

## Deployment Checklist

### Before Production Deploy
- [ ] All tests passing
- [ ] Security check passed
- [ ] Environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Error tracking configured
- [ ] Tested on staging

### Environment Variables Required
```
# Convex
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# OpenAI (Whisper)
OPENAI_API_KEY=

# Anthropic (Claude)
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=
```
