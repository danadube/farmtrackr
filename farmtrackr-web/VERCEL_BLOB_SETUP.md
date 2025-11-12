# Vercel Blob Storage Setup

## Issue
Document uploads are failing with the error: "Upload service not configured. Please check BLOB_READ_WRITE_TOKEN environment variable."

## Solution

### Option 1: Enable Vercel Blob Storage (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Storage**
3. Click **Create Database** or **Add Storage**
4. Select **Blob** from the storage options
5. Follow the prompts to create and connect the Blob store
6. Once created, Vercel will automatically configure the `BLOB_READ_WRITE_TOKEN` environment variable

### Option 2: Manual Token Configuration

If you already have a Vercel Blob store:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Your Blob store token (found in your Blob store settings)
4. Make sure to add it for all environments (Production, Preview, Development)
5. Redeploy your application

## Verification

After enabling Vercel Blob Storage:

1. The upload API will automatically use the token from Vercel's environment
2. File uploads should work without any code changes
3. Check the server logs - you should see "Upload API: Upload successful" messages

## Troubleshooting

- **Error persists**: Make sure you've redeployed after enabling Blob storage
- **Token not found**: Check that the environment variable is set for the correct environment (Production/Preview/Development)
- **Still not working**: Check Vercel's documentation for the latest Blob storage setup instructions

## Alternative: Use a Different Storage Solution

If you prefer not to use Vercel Blob, you can:
- Use AWS S3
- Use Google Cloud Storage
- Use a different file storage service

You would need to modify the `/api/uploads/route.ts` file to use your chosen storage solution.

