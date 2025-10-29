# Quick Fix: Set Up Production Database

## The Issue
The production app has no database configured. SQLite doesn't work on Vercel serverless.

## Quick Solution: Vercel Postgres

### Step 1: Create Postgres Database in Vercel
1. Go to: https://vercel.com/dashboard
2. Select your `farmtrackr-web` project
3. Click "Storage" tab
4. Click "Create Database"
5. Choose "Postgres" → "Create"

### Step 2: Get Connection String
1. After creation, you'll see connection strings
2. Copy the `POSTGRES_PRISMA_URL` value

### Step 3: Update Prisma Schema
Change `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Changed from sqlite
  url      = env("DATABASE_URL")
}
```

### Step 4: Set Environment Variable
1. In Vercel project → Settings → Environment Variables
2. Add: `DATABASE_URL` = (the POSTGRES_PRISMA_URL you copied)
3. Select: Production, Preview, Development

### Step 5: Deploy & Migrate
```bash
npm run build
npx prisma migrate deploy
vercel --prod
```

### Step 6: Seed Production Database
Visit or call:
```
POST https://your-app.vercel.app/api/admin/seed
```

Or use the Google Sheets import feature in the app UI.

---

## Alternative: Use External PostgreSQL
- Supabase (free tier): https://supabase.com
- Neon (free tier): https://neon.tech
- Railway (free tier): https://railway.app

Then set `DATABASE_URL` in Vercel to the connection string.

