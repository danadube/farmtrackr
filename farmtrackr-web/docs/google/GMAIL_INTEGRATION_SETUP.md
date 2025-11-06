# Gmail Integration Setup Guide

## Overview

This guide walks you through setting up Gmail API integration for FarmTrackr, enabling email send/receive capabilities directly from the CRM.

## Prerequisites

- Google account with Gmail access
- Access to Google Cloud Console
- Google Apps Script access

## Step 1: Enable Gmail API in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one for FarmTrackr)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Gmail API"
5. Click **Enable**

## Step 2: Create Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Click **New Project**
3. Name it "FarmTrackr Email Service"
4. This will create a new Apps Script project

## Step 3: Configure OAuth Consent Screen

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. Configure:
   - User Type: Internal (if using Google Workspace) or External
   - App name: FarmTrackr
   - User support email: Your email
   - Developer contact: Your email
3. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
4. Add test users (if External)
5. Save

## Step 4: Create OAuth 2.0 Credentials

### Important Note
**For Apps Script, you typically don't need to set redirect URIs in the OAuth client.** Apps Script handles OAuth internally. However, creating the OAuth client ensures the project is properly configured.

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the same project where you enabled Gmail API (Step 1)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. If prompted to configure OAuth consent screen, click **Cancel** (you already did this in Step 3)
6. Application type: Select **Web application**
7. Name: `FarmTrackr Email Service` (or any descriptive name)
8. **Authorized JavaScript origins**: 
   - Click **Add URI**
   - Enter: `https://script.google.com`
   - (No path, no trailing slash - just the domain)
9. **Authorized redirect URIs**: 
   - **Leave this empty** or skip it
   - Apps Script handles redirects internally, so you don't need to set this
10. Click **Create**
11. **IMPORTANT**: Copy both:
    - **Client ID** (starts with something like `123456789-abc...`)
    - **Client Secret** (starts with `GOCSPX-...`)
12. **Save these securely** - Store them in a secure password manager or encrypted notes
    - ⚠️ **NEVER commit these to git** - They are already protected by `.gitignore`
    - ⚠️ **DO NOT add them to any code files** - They should only be in `.env.local` if needed
    - For Apps Script, you typically don't need to add these to `.env.local` since Apps Script handles OAuth internally

**Security Note:** The OAuth client is created for the project configuration. Apps Script will use its own OAuth flow when you authorize the script to access Gmail. These credentials are mainly for reference and troubleshooting.

## Step 5: Add Apps Script Code

Copy the code from `farmtrackr-web/docs/google/emails.gs` into your Apps Script project.

## Step 6: Deploy Apps Script as Web App

1. In Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. **Description** (optional but recommended):
   - Enter: `FarmTrackr Gmail Integration - Initial Deployment`
   - Or any descriptive name like `Gmail Service v1.0`
   - This helps you track different versions if you redeploy later
4. **Execute as**: Select **Me** (your account)
5. **Who has access**: Select **Anyone** (or **Only myself** if you want to restrict access)
   - For production, you may want to use **Anyone** so the Next.js app can call it
   - You can change this later if needed
6. Click **Deploy**
7. **Authorize the deployment** (first time only):
   - Click **Authorize access**
   - Choose your Google account
   - Review permissions and click **Allow**
   - You'll see warnings about "unverified app" - this is normal for development
   - Click **Advanced** → **Go to [Your App Name] (unsafe)** to proceed
8. Copy the **Web App URL** (it will look like: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`)
   - ⚠️ **Save this URL** - you'll need it for Step 7

## Step 7: Configure Next.js Environment Variables

Add to `.env.local` (create this file if it doesn't exist):

```env
GOOGLE_APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
GOOGLE_APPS_SCRIPT_ID=YOUR_SCRIPT_ID
```

**Note:** The OAuth Client ID and Client Secret from Step 4 are typically **NOT needed** in `.env.local` because Apps Script handles OAuth internally. Only add the Web App URL and Script ID here.

**Security Reminder:** 
- ✅ `.env.local` is automatically gitignored (will never be committed)
- ⚠️ Never commit credentials to git
- ⚠️ Never add credentials to code files

## Step 8: Test the Integration

1. Run the Apps Script authorization flow (first time will ask for permissions)
2. Test sending an email from the CRM
3. Verify email appears in Gmail
4. Test receiving emails in the CRM

## Troubleshooting

### "Access denied" errors
- Make sure OAuth consent screen is configured
- Check that test users are added (for External apps)
- Verify scopes are correctly set

### "Script not found" errors
- Verify the Web App URL is correct
- Check that deployment is set to "Anyone" or includes your user
- Ensure the script is deployed (not just saved)

### Email not sending
- Check Gmail API is enabled in Cloud Console
- Verify OAuth token has proper scopes
- Check Apps Script execution logs for errors

## Next Steps

After setup is complete:
1. Set up the Email_Log Google Sheet (see `emails.gs` for structure)
2. Test email sending from a transaction
3. Test email receiving and linking to contacts
4. Configure email templates

