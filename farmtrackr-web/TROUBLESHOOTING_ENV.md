# Troubleshooting: "Google Apps Script Web App URL not configured"

## ✅ Your `.env.local` file has the variable set!

I can see that `GOOGLE_APPS_SCRIPT_WEB_APP_URL` is already in your `.env.local` file. Here's how to fix the error:

## Quick Fixes

### 1. Restart Your Development Server

Environment variables are only loaded when the server starts. If you added/updated the variable, you need to restart:

```bash
# Stop your current dev server (Ctrl+C or Cmd+C)
# Then restart:
npm run dev
# or
yarn dev
```

### 2. Verify the Variable Format

Make sure your `.env.local` has the correct format (no quotes, no spaces):

```env
# ✅ CORRECT
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/AKfycbyloQxd6v7W61udgIb0Z8UBGl6FuV_zO8oWHUMu9ivb9pIdUfi4H_AK3NRweDdO9rGh/exec

# ❌ WRONG (with quotes)
GOOGLE_APPS_SCRIPT_WEB_APP_URL="https://script.google.com/macros/s/..."

# ❌ WRONG (with spaces)
GOOGLE_APPS_SCRIPT_WEB_APP_URL = https://script.google.com/macros/s/...
```

### 3. Check if You're Testing on Vercel (Production)

If you're seeing this error on your deployed Vercel site, you need to add the environment variable in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Name**: `GOOGLE_APPS_SCRIPT_WEB_APP_URL`
   - **Value**: `https://script.google.com/macros/s/AKfycbyloQxd6v7W61udgIb0Z8UBGl6FuV_zO8oWHUMu9ivb9pIdUfi4H_AK3NRweDdO9rGh/exec`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application

### 4. Verify the Apps Script is Deployed

Make sure your Google Apps Script is actually deployed:

1. Go to [Google Apps Script](https://script.google.com/)
2. Open your project
3. Click **Deploy** → **Manage deployments**
4. Verify there's an active deployment
5. If not, create a new deployment (see `docs/google/GMAIL_INTEGRATION_SETUP.md`)

### 5. Test the Web App URL Directly

Try accessing your Web App URL in a browser:
```
https://script.google.com/macros/s/AKfycbyloQxd6v7W61udgIb0Z8UBGl6FuV_zO8oWHUMu9ivb9pIdUfi4H_AK3NRweDdO9rGh/exec
```

You should see a JSON response like:
```json
{
  "status": "FarmTrackr Email Service is running",
  "timestamp": "..."
}
```

If you get an error, the Apps Script might not be deployed correctly.

### 6. Clear Next.js Cache

Sometimes Next.js caches environment variables. Try:

```bash
# Delete .next folder
rm -rf .next

# Restart dev server
npm run dev
```

## Still Not Working?

1. **Check the browser console** for any additional error messages
2. **Check the terminal** where your dev server is running for errors
3. **Verify the Apps Script code** is deployed (copy from `docs/google/emails.gs`)
4. **Check Apps Script execution logs** in Google Apps Script editor

## Common Issues

- **Variable set but server not restarted** → Most common issue
- **Testing on Vercel without setting variable** → Need to add in Vercel dashboard
- **Apps Script not deployed** → Need to deploy as Web App
- **Wrong URL format** → Should end with `/exec`, not `/dev`

