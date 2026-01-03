# Tasks: Cookaholics Meeting Intelligence

## Task 1.0: Project Setup & Foundation
**Goal:** Basis project opzetten met auth en database

### 1.1 Initialize Next.js Project
- Create new Next.js project with Pages Router
- Install dependencies: Tailwind v3, shadcn
- Setup folder structure
- Configure ESLint and Prettier

### 1.2 Setup Convex Database
- Initialize Convex project
- Create database schema for: Users, Departments, Meetings, ActionItems
- Setup Convex file storage for audio files
- Configure environment variables

### 1.3 Setup Clerk Authentication
- Create Clerk application
- Configure sign-in/sign-up flows
- Setup organization with departments as groups
- Create roles: admin, department_head, member
- Add JWT template for Convex

### 1.4 Create Base Layout
- Sidebar component with navigation
- Topbar with search and user menu
- Responsive layout (desktop + mobile)
- Department-based navigation

### 1.5 Seed Initial Data
- Create 4 departments (Keuken, Sales, Marketing, MT)
- Add meeting types with default durations
- Setup admin user

---

## Task 2.0: Meeting Management
**Goal:** CRUD voor meetings met agenda view

### 2.1 Create Meeting Schema
- Meeting model with: type, title, date, duration, departments, attendees
- Relations to departments and users
- Status field: scheduled, completed, processed

### 2.2 Agenda Calendar View
- Calendar component (week/month view)
- Color coding per department
- Click to view meeting details
- Filter by department, type

### 2.3 Create Meeting Form
- Select meeting type (auto-fills duration)
- Select department(s) - multi-select for cross-afdeling
- Select attendees from department members
- Date/time picker
- Recurring meeting option (daily/weekly/monthly)

### 2.4 Meeting Detail Page
- Meeting info header
- Attendees list with presence toggle
- Status indicator
- Edit/delete functionality
- Placeholder sections for: audio, transcription, summary, action items

### 2.5 Meeting List Views
- All meetings list with filters
- Per-department meeting overview
- Upcoming meetings widget for dashboard

---

## Task 3.0: Audio Upload & Transcription
**Goal:** Upload audio en transcribeer via Whisper

### 3.1 Audio Upload Component
- Drag & drop upload zone
- File type validation (mp3, m4a, wav)
- Upload progress indicator
- Store in Convex file storage

### 3.2 Whisper API Integration
- Create API route for transcription
- Send audio to Whisper API
- Handle Dutch language setting
- Store transcription in database

### 3.3 Transcription Display
- Show transcription text in meeting detail
- Timestamps (if available)
- Copy transcription button
- Loading state during processing

### 3.4 Audio Player
- Play uploaded audio in browser
- Playback controls (play, pause, speed)
- Sync with transcription (nice-to-have)

### 3.5 Error Handling
- Handle upload failures
- Handle transcription failures
- Retry mechanism
- User feedback for errors

---

## Task 4.0: AI Summarization & Extraction
**Goal:** Claude verwerkt transcriptie naar bruikbare output

### 4.1 Claude API Integration
- Create API route for AI processing
- Setup prompt templates
- Handle API errors and retries
- Rate limiting consideration

### 4.2 Meeting Summary Generation
- Generate 5-bullet summary
- Extract key topics discussed
- Identify decisions made
- Store summary in database

### 4.3 Action Item Extraction
- Extract action items from transcription
- Identify: description, owner (if mentioned), deadline (if mentioned)
- Create ActionItem records linked to meeting
- Handle ambiguous assignments

### 4.4 Red Flag Detection
- Identify escalations mentioned
- Flag blockers or issues
- Tag meetings with red flags
- Show in MT overview

### 4.5 Processing Pipeline
- Automatic trigger after transcription completes
- Processing status indicator
- Manual re-process option
- Queue system for multiple uploads

---

## Task 5.0: Action Items Management
**Goal:** Track en beheer actiepunten

### 5.1 Action Items Schema
- Model: description, owner, deadline, status, meeting source
- Status enum: open, in_progress, done
- Relations to users and meetings

### 5.2 Action Items List View
- List all action items
- Filter: status, owner, department, deadline
- Sort: deadline, created date, status
- Bulk status update

### 5.3 Personal Action Items
- "My Action Items" view for logged-in user
- Grouped by: overdue, today, this week, later
- Quick status toggle
- Link to source meeting

### 5.4 Action Item Detail
- Full description
- Edit owner/deadline
- Status history
- Comments (optional v1)

### 5.5 Overdue Handling
- Visual indicator for overdue items
- Overdue items summary per user
- Surface in department/MT reports

---

## Task 6.0: Meeting Scripts & Templates
**Goal:** Gestructureerde meeting openings voor betere AI parsing

### 6.1 Meeting Script Schema
- Script per meeting type
- Sections: opening, review previous actions, agenda, new actions, close
- Sample phrases for voorzitter

### 6.2 Script Management UI
- View scripts per meeting type
- Edit scripts (admin only)
- Preview formatted script

### 6.3 Script Display Before Meeting
- Show script when starting a meeting
- Printable version
- Checklist format

### 6.4 AI Prompt Optimization
- Include script structure in AI prompt
- Better extraction based on expected format
- Handle deviations gracefully

---

## Task 7.0: Reporting Engine
**Goal:** Geautomatiseerde rapportages per week/maand

### 7.1 Report Schema
- Report model: type, date_range, department, content
- Types: weekly_department, weekly_mt, monthly_department, monthly_mt

### 7.2 Weekly Department Report Generation
- Aggregate all meetings in week
- Compile: summaries, decisions, new action items, completed items, open items
- Generate narrative summary via Claude
- Store report

### 7.3 Weekly MT Digest Generation
- Aggregate department reports
- Extract highlights per department
- Compile red flags and escalations
- Cross-department themes
- Action items needing attention

### 7.4 Report Viewing UI
- Report list per type
- Report detail view
- Historical reports archive
- Compare periods (optional)

### 7.5 Email Delivery
- Resend integration
- Email template for reports
- Schedule: weekly on Monday morning
- Monthly on first Monday of month

### 7.6 Report Settings
- Configure recipients per report type
- Email preferences (digest vs individual)
- Notification settings

---

## Task 8.0: Search & Discovery
**Goal:** Doorzoek alle meeting content

### 8.1 Full-Text Search
- Search across transcriptions
- Search across summaries
- Search action items
- Results with context snippets

### 8.2 Search UI
- Search bar in topbar
- Search results page
- Filter results by: type, date, department
- Highlight matches

### 8.3 AI-Powered Search (v1.1)
- Natural language queries
- "Wat hebben we besproken over X?"
- "Alle besluiten over pricing"
- Semantic search via embeddings

---

## Task 9.0: Dashboard & Overview
**Goal:** Startscherm met key info

### 9.1 Dashboard Layout
- Today's meetings
- My action items (due soon)
- Recent activity feed
- Quick upload button

### 9.2 Department Dashboard
- Department-specific view
- All meetings this week
- Open action items
- Team members

### 9.3 MT Dashboard
- All departments overview
- Red flags/escalations
- Key metrics placeholder
- Recent reports

---

## Task 10.0: Notifications & Reminders
**Goal:** Proactieve herinneringen

### 10.1 Email Notifications
- Action item deadline reminder (day before)
- Overdue action item notification
- New action item assigned

### 10.2 In-App Notifications
- Notification center in topbar
- Unread indicator
- Mark as read

### 10.3 Notification Preferences
- Per-user settings
- Email vs in-app preferences
- Frequency settings

---

## Task 11.0: Testing & Security
**Goal:** Production-ready maken

### 11.1 Security Audit
- Run security prompt on all code
- Validate auth on all routes
- Check data access permissions
- Audit file upload handling

### 11.2 Role-Based Access Control
- Verify department-based data access
- Admin-only functions protected
- MT can see all, others see own department

### 11.3 Error Handling
- Global error boundary
- API error handling
- User-friendly error messages
- Error logging

### 11.4 Performance
- Optimize queries
- Lazy loading for large lists
- Audio file handling optimization

---

## Task 12.0: Deployment & Rollout
**Goal:** Live zetten en pilots starten

### 12.1 Vercel Setup
- Create Vercel project
- Configure environment variables
- Setup custom domain
- Configure preview/production environments

### 12.2 Production Database
- Create production Convex deployment
- Migrate schema
- Setup production env vars in Vercel

### 12.3 Pilot: Marketing
- Onboard Marketing team
- Train on upload process
- Monitor first week
- Gather feedback

### 12.4 Iterate & Expand
- Address feedback
- Roll out to Sales
- Roll out to Keuken
- Enable MT reports

---

## Priority Order (MoSCoW)

### Must Have (Week 1-4)
- [x] Task 1.0: Project Setup
- [ ] Task 2.0: Meeting Management
- [ ] Task 3.0: Audio Upload & Transcription
- [ ] Task 4.0: AI Summarization
- [ ] Task 5.0: Action Items (basic)

### Should Have (Week 5-8)
- [ ] Task 6.0: Meeting Scripts
- [ ] Task 7.0: Reporting Engine
- [ ] Task 9.0: Dashboard

### Could Have (Week 9-12)
- [ ] Task 8.0: Search
- [ ] Task 10.0: Notifications

### Won't Have (v1)
- [ ] Task 8.3: AI-Powered Search
- [ ] Calendar integrations
- [ ] Video support
