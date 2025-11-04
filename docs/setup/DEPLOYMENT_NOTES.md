# FarmTrackr Deployment Notes

## ⚠️ Database Configuration Issue

**Current Status:** The app uses SQLite locally, which works for development but **does not work on Vercel** serverless functions.

### The Problem
- SQLite files don't persist in Vercel's serverless environment
- Each deployment creates a fresh environment
- No DATABASE_URL is configured for production

### Solutions

#### Option 1: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Copy the `POSTGRES_PRISMA_URL` connection string
4. Update Prisma schema to use PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Run migrations: `npx prisma migrate deploy`
6. Set environment variable in Vercel: `DATABASE_URL` = the connection string

#### Option 2: External Database (Alternative)
- Use Supabase, Neon, or Railway PostgreSQL
- Set `DATABASE_URL` environment variable in Vercel

#### Option 3: Temporary Fix - Import via API
- Use the `/api/admin/seed` endpoint after deployment
- This will populate the database from Google Sheets
- Still requires a persistent database to work

### Current Local Setup
- Local database: `prisma/dev.db` (SQLite)
- Contains: 14 Cielo contacts
- This works locally but doesn't sync to production

### Next Steps
1. Set up Vercel Postgres (or another PostgreSQL provider)
2. Update Prisma schema for PostgreSQL
3. Run production migrations
4. Seed production database via `/api/admin/seed` endpoint

