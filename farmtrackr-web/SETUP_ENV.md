# Environment Variables Setup

## Quick Setup for Google Apps Script Web App URL

### Step 1: Get Your Google Apps Script Web App URL

1. Go to [Google Apps Script](https://script.google.com/)
2. Open your FarmTrackr Email Service project (or create a new one)
3. Click **Deploy** → **New deployment**
4. Click the gear icon (⚙️) and select **Web app**
5. Configure:
   - **Execute as**: Me
   - **Who has access**: Anyone (or "Only myself" for testing)
6. Click **Deploy**
7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)

### Step 2: Set Up Local Environment Variables

1. Create a file named `.env.local` in the `farmtrackr-web` directory (if it doesn't exist)
2. Add the following:

```env
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

**Replace `YOUR_SCRIPT_ID` with your actual Web App URL from Step 1.**

### Step 3: Set Up Vercel Environment Variables (for production)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `GOOGLE_APPS_SCRIPT_WEB_APP_URL`
   - **Value**: Your Web App URL from Step 1
   - **Environment**: Production, Preview, and Development (select all)
4. Click **Save**
5. **Redeploy** your application for the changes to take effect

### Step 4: Restart Your Development Server

After creating/updating `.env.local`:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
# or
yarn dev
```

### Verification

To verify the environment variable is set:

1. Check that `.env.local` exists and contains the URL
2. Restart your dev server
3. Try using the email features - the error should be gone

### Troubleshooting

**Still getting "not configured" error?**
- Make sure `.env.local` is in the `farmtrackr-web` directory (not the root)
- Make sure the file is named exactly `.env.local` (with the dot at the beginning)
- Restart your dev server after creating/updating the file
- Check that the URL doesn't have any extra spaces or quotes

**For Vercel:**
- Make sure you added the variable in Vercel dashboard
- Redeploy after adding the variable
- Check that the variable is available in all environments (Production, Preview, Development)

