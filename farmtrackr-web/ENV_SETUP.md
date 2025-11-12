# Environment Variables Setup

## BLOB_READ_WRITE_TOKEN

This token is required for file uploads to work with Vercel Blob Storage.

### For Local Development

The token has been added to `.env.local` (which is gitignored and will not be committed).

### For Vercel Production

You need to add this environment variable in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: `vercel_blob_rw_BfhkFs9czzeuGki5_ElvSljGlTRzt0Rdw3a7JjgNs9zLRg5`
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

### Verification

After setting up the environment variable:

1. **Local**: Restart your dev server (`npm run dev`)
2. **Vercel**: Trigger a new deployment
3. Test file uploads - they should now work!

### Security Note

⚠️ **Never commit the token to git!** It's already in `.gitignore`, but make sure:
- The token is only in `.env.local` (local development)
- The token is in Vercel's environment variables (production)
- Never share the token publicly or commit it to the repository

