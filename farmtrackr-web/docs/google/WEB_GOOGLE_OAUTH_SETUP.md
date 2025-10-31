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
   - **Google Sheets API** (required)
   - **People API** (optional - for Google Contacts integration, coming soon)
   - **Note:** Google Drive API may already be enabled if Drive scopes are configured

## Step 3: Configure OAuth Consent Screen

Navigation: **APIs & Services** → **OAuth consent screen**

The OAuth consent screen has three main tabs in the left sidebar:
- **Audience**: Set user access type and add test users
- **Branding**: Configure app name and contact information
- **Data Access**: Configure OAuth scopes (permissions)

### Configure Audience (Audience Tab)
1. Click on the **"Audience"** tab in the left sidebar
2. Choose **"External"** user type (or Internal if using Google Workspace)
3. In the **Test users** section, click **"Add Users"**
4. Enter your Google account email address
5. Click **"Add"**
6. Click **"Save"** at the bottom of the page
7. **Important:** Only test users can access your app while it's in "Testing" status

### Configure Branding (Branding Tab)
1. Click on the **"Branding"** tab in the left sidebar
2. In the **App Information** section:
   - **App name***: Enter `FarmTrackr` (required)
   - **User support email***: Enter your email address (required - for users to contact you about consent)
3. (Optional) Upload an **App Logo**:
   - Logo should be square, 120px x 120px
   - Maximum 1MB, formats: JPG, PNG, or BMP
   - **Note:** Logo upload requires app verification unless app is internal-only or in "Testing" status
4. (Optional) Configure **App Domain**:
   - **Application home page**: Link to your home page (optional)
   - **Application privacy policy link**: Link to privacy policy (optional)
   - **Application terms of service link**: Link to terms of service (optional)
   - **Authorized domains**: Click "+ Add domain" if needed (domains must be pre-registered)
5. In **Developer Contact Information** section:
   - **Email addresses***: Add your email (required - for Google to notify you about project changes)
6. Click **"Save"** at the bottom of the page

### Configure Scopes (Data Access Tab)
1. Click on the **"Data Access"** tab in the left sidebar
2. You'll see sections for:
   - **Your non-sensitive scopes** (standard OAuth scopes like userinfo.email, userinfo.profile, openid)
   - **Your sensitive scopes** (scopes requesting access to private user data)
   - **Your restricted scopes** (scopes for highly sensitive data like Drive)
3. Click the **"Add or Remove Scopes"** button
4. In the popup, search and add the following scopes:
   - **Required for Sheets integration:**
     - Search for: `spreadsheets`
     - Select: `https://www.googleapis.com/auth/spreadsheets` (includes both read and write access)
   - **Optional for Contacts integration (future):**
     - Search for: `contacts.readonly`
     - Select: `https://www.googleapis.com/auth/contacts.readonly`
   - **Note:** You may see Drive scopes already configured - these are not needed but won't cause issues
5. Click **"Update"** to save the scopes
6. Click **"Save"** at the bottom of the Data Access page


## Step 4: Create OAuth 2.0 Credentials (Web Application)

**Note:** If you already have an iOS client (e.g., "FarmTrackr" for iOS), you need to create a **separate Web application** client for the web app. iOS and Web clients are different and cannot be used interchangeably.

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
3. If prompted to configure OAuth consent screen, you've already done this in Step 3, so click through
4. Choose **"Web application"** as the application type (not iOS)
5. Configure:
   - **Name**: `FarmTrackr Web Client` (or `FarmTrackr Web` to distinguish from iOS client)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://danadube.com` (for production - your domain)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/google/oauth/callback` (for development)
     - `https://danadube.com/api/google/oauth/callback` (for production - your domain)
6. Click **"Create"**
7. **IMPORTANT**: Copy the **Client ID** and **Client Secret** from the popup
   - These will be different from your iOS client credentials
   - You'll use these in your `.env.local` file

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

For **production** (danadube.com), update the values:
```bash
GOOGLE_CLIENT_ID="1095090089380-57rc2o3qbtaoemgspjc9v6274jsgp2v2.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GOOGLE_OAUTH_REDIRECT_URI="https://danadube.com/api/google/oauth/callback"
NEXT_PUBLIC_APP_URL="https://danadube.com"
```

**Note:** Make sure you've added `https://danadube.com/api/google/oauth/callback` as an authorized redirect URI in your Google Cloud Console OAuth client settings.

## Step 6: Add Environment Variables to Vercel

If deploying to Vercel (danadube.com):

1. Go to your Vercel project settings
2. Navigate to **"Environment Variables"**
3. Add all the variables for production:
   - `GOOGLE_CLIENT_ID` = `1095090089380-57rc2o3qbtaoemgspjc9v6274jsgp2v2.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET` = `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`
   - `GOOGLE_OAUTH_REDIRECT_URI` = `https://danadube.com/api/google/oauth/callback`
   - `NEXT_PUBLIC_APP_URL` = `https://danadube.com`
4. Make sure to select the correct environment (Production, Preview, Development)

**Important:** Before deploying, ensure you've added `https://danadube.com/api/google/oauth/callback` to your Google Cloud Console OAuth client's authorized redirect URIs.

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
- For production (danadube.com), make sure `https://danadube.com/api/google/oauth/callback` is added to authorized redirect URIs

### Error: "invalid_client"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure there are no extra spaces or quotes

### Error: "Access blocked: Authorization Error"
- Add your email as a test user in OAuth consent screen → Test users section (if in testing mode)
- Verify the OAuth consent screen is configured correctly (check both Branding and Data Access tabs)

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

