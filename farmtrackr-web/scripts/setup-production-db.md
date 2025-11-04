# Production Database Setup Guide

## The Problem
Production is currently using SQLite which doesn't work on Vercel (read-only filesystem). We need to set up PostgreSQL for production.

## Quick Setup Steps

### 1. Set Up Vercel Postgres

In Vercel Dashboard:
1. Go to your project: `farmtrackr-web`
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a name (e.g., `farmtrackr-db`)
6. Select a region
7. Click **Create**

### 2. Configure Environment Variable

Vercel will automatically add `POSTGRES_URL` and `POSTGRES_PRISMA_URL` environment variables.

**Add to Vercel Environment Variables:**
- Variable: `DATABASE_URL`
- Value: Copy from `POSTGRES_PRISMA_URL` (it's already set by Vercel)
- Environment: Production, Preview, Development

### 3. Run Prisma Migrations

After setting up the database, run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

Or in Vercel, migrations run automatically during build if you have `POSTINSTALL_SCRIPT` set.

### 4. Import Existing Data

After migrations, import your local data using the import script:

```bash
npm run import-data
```

## Alternative: Use External PostgreSQL

If you prefer an external PostgreSQL provider (Neon, Supabase, Railway):

1. Create a PostgreSQL database
2. Get the connection string
3. Add `DATABASE_URL` environment variable in Vercel
4. Run migrations
5. Import data

## For Local Development

For local development, you can either:
- Use the same PostgreSQL database (recommended for testing)
- Create a separate local PostgreSQL instance
- Or temporarily switch back to SQLite for local only (not recommended for consistency)

