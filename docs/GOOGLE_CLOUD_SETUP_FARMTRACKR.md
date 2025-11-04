# Google Cloud Console Setup Guide for FarmTrackr

**Version:** 1.0  
**Last Updated:** December 2024  
**Author:** FarmTrackr Team

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Create Google Cloud Project](#step-1-create-google-cloud-project)
4. [Step 2: Enable Google Sheets API](#step-2-enable-google-sheets-api)
5. [Step 3: Configure OAuth Consent Screen](#step-3-configure-oauth-consent-screen)
6. [Step 4: Create OAuth 2.0 Credentials](#step-4-create-oauth-20-credentials)
7. [Step 5: Get Your Credentials](#step-5-get-your-credentials)
8. [Step 6: Add Credentials to FarmTrackr](#step-6-add-credentials-to-farmtrackr)
9. [Production Deployment Setup](#production-deployment-setup)
10. [Troubleshooting](#troubleshooting)

---

## Overview

FarmTrackr requires Google Cloud Platform (GCP) credentials to:
- **Import transactions from Google Sheets** - Sync your transaction data from a Google Spreadsheet
- **Access Google Sheets API** - Read and write data to your spreadsheet

This guide walks you through setting up Google Cloud Console credentials specifically for the FarmTrackr application.

---

## Prerequisites

- A Google account (Gmail account works)
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Basic understanding of web applications (helpful but not required)

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the **project dropdown** at the top (next to "Google Cloud")
3. Click **"New Project"**
4. Enter project details:
   - **Project name:** `FarmTrackr Web App`
   - **Organization:** (Leave as default, or select your organization)
   - **Location:** (Leave as default)
5. Click **"Create"**
6. Wait a few seconds for the project to be created
7. **Important:** Make sure your new project is selected in the dropdown

---

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"** (in the left sidebar)
2. In the search box, type: **"Google Sheets API"**
3. Click on **"Google Sheets API"** from the results
4. Click the **"Enable"** button
5. Wait for the API to be enabled (this may take 10-30 seconds)

**Why:** FarmTrackr needs the Google Sheets API to read and import your transaction data from spreadsheets.

---

## Step 3: Configure OAuth Consent Screen

The OAuth consent screen is what users see when they authorize FarmTrackr to access their Google Sheets.

1. Go to **"APIs & Services"** → **"OAuth consent screen"** (in the left sidebar)
2. Choose **"External"** user type (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required information:

   **App Information:**
   - **App name:** `FarmTrackr`
   - **User support email:** Your email address
   - **App logo:** (Optional) You can upload the FarmTrackr logo if you have one

   **App domain:**
   - **Application home page:** 
     - Local: `http://localhost:3000`
     - Production: `https://your-domain.vercel.app` (or your production URL)
   - **Authorized domains:** (Leave empty for now, or add your production domain)

   **Developer contact information:**
   - **Email addresses:** Your email address

5. Click **"Save and Continue"**

6. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - In the filter box, type: **"https://www.googleapis.com/auth/spreadsheets"**
   - Check the box next to **".../auth/spreadsheets"**
   - Click **"Update"**
   - Click **"Save and Continue"**

7. **Test users** (Step 3):
   - If your app is in "Testing" mode (default), you need to add test users
   - Click **"Add Users"**
   - Add your Google account email address
   - Click **"Add"**
   - Click **"Save and Continue"**

8. **Summary** (Step 4):
   - Review your settings
   - Click **"Back to Dashboard"**

**Note:** Your app will be in "Testing" mode initially. Users added as "Test users" can use the app. For production, you'll need to submit for verification (or publish internally if using Google Workspace).

---

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"** (in the left sidebar)
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

4. Configure the OAuth client:

   **Application type:** Select **"Web application"**

   **Name:** `FarmTrackr Web Client`

   **Authorized JavaScript origins:**
   
   For **Local Development**, add:
   - `http://localhost:3000`
   
   For **Production**, add your Vercel/production domain:
   - `https://your-app-name.vercel.app`
   - Or your custom domain: `https://yourdomain.com`

   **Authorized redirect URIs:**
   
   For **Local Development**, add:
   - `http://localhost:3000/api/google/oauth/callback`
   
   For **Production**, add:
   - `https://your-app-name.vercel.app/api/google/oauth/callback`
   - Or your custom domain: `https://yourdomain.com/api/google/oauth/callback`

   **Example (for both local and production):**
   ```
   Authorized JavaScript origins:
   http://localhost:3000
   https://farmtrackr.vercel.app
   
   Authorized redirect URIs:
   http://localhost:3000/api/google/oauth/callback
   https://farmtrackr.vercel.app/api/google/oauth/callback
   ```

5. Click **"Create"**

6. **⚠️ IMPORTANT:** You'll see a popup with your credentials:
   - **Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Client secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)
   
   **⚠️ Save these immediately!** The client secret will only be shown once.
   
   - Click **"Download JSON"** to save credentials to a file, OR
   - Copy both values to a secure location (password manager, secure note, etc.)

---

## Step 5: Get Your Credentials

After creating the OAuth client, you should have:

1. **Client ID** 
   - Format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - Location: In the OAuth 2.0 Client IDs list in Credentials page

2. **Client Secret**
   - Format: `GOCSPX-abcdefghijklmnopqrstuvwxyz`
   - ⚠️ **Only shown once** when you create the client
   - If you lost it, you'll need to delete and recreate the OAuth client

---

## Step 6: Add Credentials to FarmTrackr

### Local Development

1. Create `.env.local` file in the FarmTrackr project root (if it doesn't exist):
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   # Google Sheets OAuth Credentials
   GOOGLE_SHEETS_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_SHEETS_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
   GOOGLE_SHEETS_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
   ```

3. **Important:** Make sure `.env.local` is in `.gitignore` (it should be by default)

4. Restart your development server:
   ```bash
   npm run dev
   ```

### Verify Setup

1. Start your FarmTrackr app: `npm run dev`
2. Navigate to the Commissions page
3. Click "Import from Google Sheets" (if this feature exists)
4. You should be redirected to Google's OAuth consent screen
5. Authorize the app
6. You should be redirected back to FarmTrackr

---

## Production Deployment Setup

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Go to **"Settings"** → **"Environment Variables"**
3. Add the following variables:

   **For Production:**
   ```
   GOOGLE_SHEETS_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_SHEETS_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
   GOOGLE_SHEETS_REDIRECT_URI=https://your-app-name.vercel.app/api/google/oauth/callback
   ```

   **For Preview (optional - use same or different test credentials):**
   ```
   GOOGLE_SHEETS_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_SHEETS_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
   GOOGLE_SHEETS_REDIRECT_URI=https://your-app-name.vercel.app/api/google/oauth/callback
   ```

4. **Important:** After adding environment variables, redeploy your app:
   - Go to **"Deployments"** tab
   - Click **"..."** on the latest deployment
   - Click **"Redeploy"**

### Update OAuth Settings for Production

1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **"APIs & Services"** → **"Credentials"**
3. Click on your OAuth 2.0 Client ID to edit it
4. Add your production domain to:
   - **Authorized JavaScript origins**
   - **Authorized redirect URIs**
5. Click **"Save"**

**Example Production URLs:**
```
Authorized JavaScript origins:
https://farmtrackr.vercel.app
https://www.farmtrackr.com

Authorized redirect URIs:
https://farmtrackr.vercel.app/api/google/oauth/callback
https://www.farmtrackr.com/api/google/oauth/callback
```

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Symptoms:**
- OAuth flow fails with "redirect_uri_mismatch" error

**Solutions:**
- ✅ Verify the redirect URI in Google Cloud Console exactly matches your app's callback URL
- ✅ Check for trailing slashes (should NOT have trailing slash)
- ✅ Ensure protocol matches (http vs https)
- ✅ For local development, make sure it's `http://localhost:3000` (not `https://`)
- ✅ For production, make sure it's `https://` (not `http://`)

### "access_denied" Error

**Symptoms:**
- User clicks "Deny" on OAuth consent screen
- Or user's email is not in test users list

**Solutions:**
- ✅ Make sure the user's email is added to "Test users" in OAuth consent screen
- ✅ Check that the app is not in "Publishing" status (should be "Testing")
- ✅ Verify the user clicked "Allow" on the consent screen

### "invalid_client" Error

**Symptoms:**
- OAuth request fails immediately with "invalid_client"

**Solutions:**
- ✅ Verify `GOOGLE_SHEETS_CLIENT_ID` is correct in `.env.local`
- ✅ Verify `GOOGLE_SHEETS_CLIENT_SECRET` is correct in `.env.local`
- ✅ Check for typos or extra spaces in environment variables
- ✅ Restart your development server after changing `.env.local`

### Google Sheets API Not Enabled

**Symptoms:**
- "API not enabled" error when trying to access Google Sheets

**Solutions:**
- ✅ Go to Google Cloud Console → APIs & Services → Library
- ✅ Search for "Google Sheets API"
- ✅ Make sure it shows "Enabled" (green checkmark)
- ✅ If not enabled, click "Enable"

### "Quota exceeded" Error

**Symptoms:**
- Too many requests to Google Sheets API

**Solutions:**
- ✅ Check Google Cloud Console → APIs & Services → Dashboard
- ✅ Review quota usage
- ✅ Request quota increase if needed (for production apps)
- ✅ Implement request caching to reduce API calls

---

## Quick Reference Checklist

### Initial Setup
- [ ] Create Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] Configure OAuth Consent Screen
  - [ ] Add app name and email
  - [ ] Add scopes (spreadsheets)
  - [ ] Add test users
- [ ] Create OAuth 2.0 Client ID
  - [ ] Add authorized JavaScript origins
  - [ ] Add authorized redirect URIs
  - [ ] Save Client ID and Client Secret

### Local Development
- [ ] Copy `env.example` to `.env.local`
- [ ] Add `GOOGLE_SHEETS_CLIENT_ID` to `.env.local`
- [ ] Add `GOOGLE_SHEETS_CLIENT_SECRET` to `.env.local`
- [ ] Add `GOOGLE_SHEETS_REDIRECT_URI` to `.env.local` (http://localhost:3000/api/google/oauth/callback)
- [ ] Restart development server
- [ ] Test OAuth flow locally

### Production Deployment
- [ ] Add environment variables to Vercel
- [ ] Update OAuth client with production URLs
- [ ] Redeploy app
- [ ] Test OAuth flow in production
- [ ] Verify redirect URI matches exactly

---

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [OAuth 2.0 for Web Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Support

If you encounter issues not covered in this guide:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review Google Cloud Console error messages
3. Check FarmTrackr application logs
4. Verify all credentials are correct in `.env.local` (local) or Vercel (production)

---

**Last Updated:** December 2024  
**Documentation Version:** 1.0

