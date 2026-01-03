# Cookaholics Meeting Intelligence - Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm installed
- Git installed

## 1. Convex Setup

1. Create a Convex account at https://dashboard.convex.dev
2. Run the Convex development server:
   ```bash
   npx convex dev
   ```
3. Follow the prompts to:
   - Log in to Convex
   - Create a new project (or link existing)
   - This will populate your `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`

## 2. Clerk Setup

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Go to "JWT Templates" and create a template called "convex":
   - Claims should include: `sub`, `email`, `name`
4. Copy the JWT issuer domain (looks like: `https://xxx.clerk.accounts.dev`)
5. Add to `.env.local`:
   ```
   CLERK_JWT_ISSUER_DOMAIN=https://xxx.clerk.accounts.dev
   ```

Your Clerk keys are already in `.env.local`:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## 3. OpenAI Setup (for Whisper transcription)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-xxx
   ```

## 4. Anthropic Setup (for Claude summarization)

1. Go to https://console.anthropic.com
2. Create a new API key
3. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxx
   ```

## 5. Resend Setup (for email reports)

1. Go to https://resend.com
2. Create an account and verify your domain
3. Create an API key
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxx
   ```

## 6. Start Development

After setting up all services:

```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Next.js
npm run dev
```

The app will be available at http://localhost:3000

## 7. Seed Initial Data

After Convex is running, seed the initial data by running these in the Convex dashboard or via a script:

```javascript
// In Convex dashboard Functions tab, run:
departments.seed()
meetingTypes.seed()
```

## Environment Variables Checklist

Your `.env.local` should have:

- [x] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - already set
- [x] `CLERK_SECRET_KEY` - already set
- [ ] `CLERK_JWT_ISSUER_DOMAIN` - from Clerk JWT Templates
- [ ] `CONVEX_DEPLOYMENT` - auto-set by `npx convex dev`
- [ ] `NEXT_PUBLIC_CONVEX_URL` - auto-set by `npx convex dev`
- [ ] `OPENAI_API_KEY` - for Whisper transcription
- [ ] `ANTHROPIC_API_KEY` - for Claude summarization
- [ ] `RESEND_API_KEY` - for email reports

## Troubleshooting

### Build fails with "Cannot find module './_generated/server'"
Run `npx convex dev` first to generate the Convex types.

### Authentication not working
1. Check that Clerk keys are correct
2. Verify JWT template is set up in Clerk dashboard
3. Check that `CLERK_JWT_ISSUER_DOMAIN` is set

### Transcription not working
1. Check OpenAI API key is valid
2. Check you have credits in your OpenAI account
