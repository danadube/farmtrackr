# Run Notes Field Migration

The `notes` field has been added to the Transaction model to store CSV NCI for referral transactions. The migration file is ready but needs to be applied to the database.

## Migration File

The migration is located at:
```
prisma/migrations/20251101200000_add_notes_to_transactions/migration.sql
```

## Run Migration

### Option 1: Via Vercel CLI (Recommended)

If you have Vercel CLI set up:

```bash
vercel env pull  # Get production DATABASE_URL
npx prisma migrate deploy
```

### Option 2: Via Production Database

1. Connect to your production database
2. Run the SQL command:

```sql
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
```

### Option 3: Wait for Next Deploy

The `prisma db push` command in `vercel-build` should automatically sync the schema, but if it doesn't, use one of the options above.

## After Migration

Once the migration is complete:
- Referral transactions will store CSV NCI in the `notes` field
- The temporary `netVolume` workaround can be removed
- Frontend will automatically use `notes` when available, falling back to `netVolume` for older imports

