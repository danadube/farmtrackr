# Google OAuth 2.0 Setup for FarmTrackr Web

This guide will help you set up Google OAuth 2.0 authentication for the FarmTrackr web application.

## Overview

Google OAuth enables the FarmTrackr web app to:
- Access Google Sheets (authenticated, not just public)
- Import/export contacts from Google Sheets
- Sync with Google Contacts (coming soon)

## Prerequisites

- Google Cloud Console account
- Access to create OAuth credentials
- Your application URL (for redirect URI configuration)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `FarmTrackr Web`
4. Click "Create"

## Step 2: Enable Required APIs

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search and enable the following APIs:
   - **Google Sheets API**
   - **People API** (for Google Contacts - coming soon)

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** user type (or Internal if using Google Workspace)
3. Fill in required information:
   - **App name**: `FarmTrackr`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **"Save and Continue"**
5. In **Scopes** section, click **"Add or Remove Scopes"**
   - Add: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Add: `https://www.googleapis.com/auth/spreadsheets`
   - Add: `https://www.googleapis.com/auth/contacts.readonly`
6. Click **"Save and Continue"**
7. In **Test users** section (if in testing mode), add your Google account email
8. Click **"Save and Continue"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Choose **"Web application"** as the application type
4. Configure:
   - **Name**: `FarmTrackr Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google/oauth/callback` (for development)
     - `https://yourdomain.com/api/google/oauth/callback` (for production)
5. Click **"Create"**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

Create a `.env.local` file in the `farmtrackr-web/` directory:

```bash
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_OAUTH_REDIRECT_URI="http://localhost:3000/api/google/oauth/callback"

# App URL (used for OAuth redirects)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database (if not already set)
DATABASE_URL="your-database-url"
```

For **production**, update the values:
```bash
GOOGLE_CLIENT_ID="your-production-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-production-client-secret"
GOOGLE_OAUTH_REDIRECT_URI="https://yourdomain.com/api/google/oauth/callback"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Step 6: Add Environment Variables to Vercel

If deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to **"Environment Variables"**
3. Add all the variables from Step 5:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI`
   - `NEXT_PUBLIC_APP_URL`

## Step 7: Test the Integration

1. Start your development server: `npm run dev` or `yarn dev`
2. Navigate to **Settings** → **Google Integration**
3. Click **"Connect Google Account"**
4. You should be redirected to Google's consent screen
5. After authorizing, you'll be redirected back to the settings page
6. You should see "Connected" status

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in Google Cloud Console **exactly** matches your environment variable
- Check for trailing slashes, http vs https, and port numbers

### Error: "invalid_client"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces or quotes

### Error: "Access blocked: Authorization Error"
- Add your email as a test user in OAuth consent screen (if in testing mode)
- Verify the OAuth consent screen is configured correctly

### Tokens not persisting
- Check that cookies are enabled in your browser
- Verify `NODE_ENV` is set correctly for secure cookie settings

## Security Notes

- **Never commit** `.env.local` or environment variables to version control
- Use **HTTP-only cookies** for token storage (already implemented)
- Tokens are stored securely on the server side
- Refresh tokens allow automatic token renewal
- Users can disconnect their Google account at any time

## Next Steps

After OAuth is set up:
1. The Google Sheets integration will automatically use authenticated API calls
2. Google Contacts integration can be added (People API is already enabled)
3. Private Google Sheets can now be accessed (not just public ones)

## Support

For issues or questions:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify all environment variables are set correctly
4. Ensure APIs are enabled in Google Cloud Console

