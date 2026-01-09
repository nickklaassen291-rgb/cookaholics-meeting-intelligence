# Deployment Guide - Cookaholics Meeting Intelligence

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cookaholics/meeting-intelligence)

---

## Prerequisites

Before deploying, ensure you have accounts set up for:

1. **Vercel** - https://vercel.com (hosting)
2. **Convex** - https://convex.dev (database)
3. **Clerk** - https://clerk.com (authentication)
4. **Groq** - https://groq.com (transcription)
5. **Anthropic** - https://anthropic.com (AI summarization)
6. **Resend** - https://resend.com (email delivery)

---

## Step 1: Convex Setup

### 1.1 Create Production Deployment

```bash
# Login to Convex
npx convex login

# Create production deployment
npx convex deploy --prod
```

### 1.2 Note Your Credentials

From the Convex dashboard (https://dashboard.convex.dev):
- `CONVEX_DEPLOYMENT` - e.g., `prod:your-project-name`
- `NEXT_PUBLIC_CONVEX_URL` - e.g., `https://your-project.convex.cloud`

### 1.3 Configure Clerk Integration in Convex

In the Convex dashboard:
1. Go to Settings > Environment Variables
2. Add `CLERK_JWT_ISSUER_DOMAIN` with your Clerk domain

---

## Step 2: Clerk Setup

### 2.1 Create Application

1. Go to https://dashboard.clerk.com
2. Create new application
3. Enable Email and Google sign-in (optional)

### 2.2 Configure JWT Template for Convex

1. Go to JWT Templates
2. Create template named "convex"
3. Use this template:

```json
{
  "sub": "{{user.id}}"
}
```

### 2.3 Note Your Credentials

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - from API Keys
- `CLERK_SECRET_KEY` - from API Keys
- `CLERK_JWT_ISSUER_DOMAIN` - from your Clerk frontend API domain

---

## Step 3: API Keys

### 3.1 Groq (Transcription)

1. Go to https://console.groq.com/keys
2. Create API key
3. Note: `GROQ_API_KEY`

### 3.2 Anthropic (AI Summarization)

1. Go to https://console.anthropic.com/settings/keys
2. Create API key
3. Note: `ANTHROPIC_API_KEY`

### 3.3 Resend (Email)

1. Go to https://resend.com/api-keys
2. Create API key
3. Note: `RESEND_API_KEY`
4. **Important**: Add and verify your domain in Resend

---

## Step 4: Vercel Deployment

### 4.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your Git repository
3. Select "Next.js" as framework

### 4.2 Configure Environment Variables

Add ALL of these environment variables in Vercel:

| Variable | Description |
|----------|-------------|
| `CONVEX_DEPLOYMENT` | Production Convex deployment ID |
| `NEXT_PUBLIC_CONVEX_URL` | Convex cloud URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer URL |
| `GROQ_API_KEY` | Groq API key for Whisper |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `RESEND_API_KEY` | Resend API key for emails |
| `NEXT_PUBLIC_APP_URL` | Your production URL (e.g., https://app.cookaholics.nl) |
| `CRON_API_KEY` | Random secret for cron jobs |

### 4.3 Deploy

Click "Deploy" and wait for the build to complete.

### 4.4 Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain (e.g., `app.cookaholics.nl`)
3. Follow DNS configuration instructions

---

## Step 5: Post-Deployment Setup

### 5.1 Initialize Database

After first deployment, run these commands to seed initial data:

```bash
# Set production environment
export CONVEX_DEPLOYMENT=prod:your-project

# Seed departments
npx convex run departments:seed

# Seed meeting types
npx convex run meetingTypes:seed

# Seed meeting scripts
npx convex run meetingScripts:seed
```

Or use the setup page: `https://your-domain/setup`

### 5.2 Create Admin User

1. Sign up via the app
2. In Convex dashboard, manually set user role to "admin"

### 5.3 Configure Cron Jobs (Optional)

For automated email reminders, set up a cron job (e.g., via Vercel Cron or external service):

```
# Daily at 8:00 AM
GET https://your-domain.vercel.app/api/send-reminders?apiKey=YOUR_CRON_API_KEY
```

---

## Environment Variables Checklist

```bash
# Required for all functionality
CONVEX_DEPLOYMENT=prod:xxxxx
NEXT_PUBLIC_CONVEX_URL=https://xxxxx.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_JWT_ISSUER_DOMAIN=https://xxxxx.clerk.accounts.dev
GROQ_API_KEY=gsk_xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=https://app.cookaholics.nl
CRON_API_KEY=random-secret-string
```

---

## Troubleshooting

### Build Fails

1. Check all environment variables are set
2. Verify Convex deployment is active
3. Check build logs for specific errors

### Authentication Not Working

1. Verify Clerk keys are correct
2. Check JWT template is configured in Clerk
3. Ensure `CLERK_JWT_ISSUER_DOMAIN` matches Clerk dashboard

### Transcription Fails

1. Verify `GROQ_API_KEY` is valid
2. Check audio file size (max 100MB)
3. Check Groq usage limits

### Emails Not Sending

1. Verify domain is configured in Resend
2. Check `RESEND_API_KEY` is valid
3. Verify "From" email domain matches Resend domain

---

## Pilot Rollout Plan

### Phase 1: Marketing Team (Week 1)

1. Onboard Marketing team (5-10 users)
2. Train on:
   - Creating meetings
   - Uploading audio
   - Reviewing summaries
   - Managing action items
3. Collect feedback daily

### Phase 2: Sales Team (Week 2)

1. Address Phase 1 feedback
2. Onboard Sales team
3. Enable cross-department features

### Phase 3: Kitchen Team (Week 3)

1. Onboard Kitchen team
2. Enable department reports

### Phase 4: Full Rollout (Week 4)

1. Enable MT reports
2. Full organization access
3. Automated weekly reports

---

## Support

For issues or questions:
- Create GitHub issue
- Contact: support@cookaholics.nl
