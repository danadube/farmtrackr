# Database Setup - Production Fix

## ⚠️ Current Issue
Production deployment is using SQLite, but **Vercel doesn't support file-based databases**. That's why you're not seeing contacts in production.

## ✅ Quick Fix (5 minutes)

### Step 1: Add Vercel Prisma Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `farmtrackr-web` project
3. Click the **Storage** tab
4. Click **Create Database** → Select **Prisma Postgres** (this is the best option!)
5. Name it `farmtrackr-db` and click **Create**
6. Vercel will automatically:
   - Add `POSTGRES_PRISMA_URL` environment variable
   - Add `POSTGRES_URL_NON_POOLING` environment variable
   - Set up the database connection

### Step 2: Set DATABASE_URL Environment Variable

In the same Vercel project:
1. Go to **Settings** → **Environment Variables**
2. You should see `POSTGRES_PRISMA_URL` already added automatically
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Copy the value from `POSTGRES_PRISMA_URL` (click "Reveal" to see it)
   - **Environments**: Check all (Production, Preview, Development)
4. Click **Save**

> **Note**: For Prisma, we use `POSTGRES_PRISMA_URL` which includes connection pooling. This is automatically set when you create Prisma Postgres, but we also set `DATABASE_URL` to match it for compatibility.

### Step 3: Run Database Migrations

In your terminal:

```bash
cd farmtrackr-web

# Set the DATABASE_URL to your production database
export DATABASE_URL="your-postgres-connection-string-here"

# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy
```

Or you can run migrations via Vercel CLI:
```bash
vercel env pull .env.local  # Pull environment variables
npx prisma migrate deploy
```

### Step 4: Import Your Local Data

Your 14 contacts are exported to `contacts_export.json`. Import them:

```bash
# Make sure DATABASE_URL points to production
export DATABASE_URL="your-postgres-connection-string"

# Run the import script
npm run import-data
```

## 🔄 After Setup

Once PostgreSQL is configured:
1. New deployments will automatically connect to PostgreSQL
2. All 14 contacts will be imported
3. Future contacts will persist correctly

## 💡 For Local Development

You can either:
- **Option A**: Use the same PostgreSQL database (connect to production DB)
- **Option B**: Use a local PostgreSQL instance
- **Option C**: Use SQLite locally (requires schema changes - not recommended)

**Recommended**: Use Option A for consistency and easier testing.

## 📝 Verification

After setup, check your production site - you should see all 14 contacts!

