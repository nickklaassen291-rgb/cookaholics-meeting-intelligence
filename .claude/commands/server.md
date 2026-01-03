# Start Development Server

Start the Next.js development server and Convex backend together.

## Commands to run:

1. In terminal 1, start Convex:
```bash
npx convex dev
```

2. In terminal 2, start Next.js:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## Notes:
- Convex dev server watches for schema changes and auto-syncs
- Next.js hot-reloads on file changes
- Make sure your .env.local file has all required environment variables
