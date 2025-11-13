# Database Connection Fix - Quick Guide

## ⚠️ Error Message
"Database connection failed. Please check your DATABASE_URL environment variable and ensure the database server is running."

## ✅ Solution: Set Up Database in Vercel

### Step 1: Create Prisma Postgres Database in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `farmtrackr-web` project
3. Click the **Storage** tab (or **Add-ons** in older Vercel UI)
4. Click **Create Database** → Select **Prisma Postgres**
5. Name it `farmtrackr-db` and click **Create**
6. Vercel will automatically add:
   - `POSTGRES_PRISMA_URL` (connection string with pooling)
   - `POSTGRES_URL_NON_POOLING` (direct connection)

### Step 2: Set DATABASE_URL Environment Variable

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Copy the value from `POSTGRES_PRISMA_URL` (click "Reveal" to see it)
     - It should look like: `postgresql://user:password@host:5432/database?pgbouncer=true&connection_limit=1`
   - **Environments**: Check all (Production, Preview, Development)
3. Click **Save**

### Step 3: Run Database Migrations

After setting the environment variable, you need to run migrations to create the database tables:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Pull environment variables
vercel env pull .env.local

# Run migrations
cd farmtrackr-web
npx prisma migrate deploy
```

**Option B: Using Prisma Studio (Alternative)**
```bash
# Set DATABASE_URL locally
export DATABASE_URL="your-postgres-connection-string"

# Run migrations
npx prisma migrate deploy
```

### Step 4: Verify Connection

1. Redeploy your application in Vercel (or wait for automatic redeploy)
2. Check the application - the database connection error should be gone
3. You can verify by checking the logs in Vercel dashboard

## 🔍 Troubleshooting

### If you still see connection errors:

1. **Check Environment Variables in Vercel:**
   - Go to Settings → Environment Variables
   - Verify `DATABASE_URL` is set for Production environment
   - Make sure the value matches `POSTGRES_PRISMA_URL`

2. **Check Database Status:**
   - Go to Storage tab in Vercel
   - Verify the database is "Active" and not paused

3. **Check Connection String Format:**
   - Should start with `postgresql://`
   - Should include `pgbouncer=true` for connection pooling
   - Should not have any spaces or special characters that need encoding

4. **Verify Migrations Ran:**
   - Check Vercel build logs for migration output
   - Or connect to the database and verify tables exist

## 📝 Notes

- **Connection Pooling**: Vercel Prisma Postgres uses PgBouncer for connection pooling, which is why we use `POSTGRES_PRISMA_URL`
- **Multiple Environments**: Make sure `DATABASE_URL` is set for Production, Preview, and Development if you use them
- **Database Pausing**: Free tier databases may pause after inactivity - they'll resume automatically on next request

## 🆘 Still Having Issues?

If the problem persists:
1. Check Vercel build logs for more detailed error messages
2. Verify the database is not paused in Vercel Storage dashboard
3. Try recreating the database if it's a new setup
4. Check that your Prisma schema matches the database structure

