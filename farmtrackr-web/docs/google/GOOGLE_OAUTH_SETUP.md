# Google OAuth 2.0 Setup Guide for FarmTrackr

## Overview
This guide will help you set up Google OAuth 2.0 authentication for the FarmTrackr app to enable Google Sheets integration.

> **Note:** This guide was originally written for the iOS app. For the web app, adapt the bundle ID/redirect URI sections to use web URLs instead.

## ⚡ Quick Start (5 minutes)

If you just need to get started quickly, follow these steps:

1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Name: `FarmTrackr`
   - Click "Create"

2. **Enable Google Sheets API**
   - In your new project, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

3. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - If prompted to configure OAuth consent screen:
     - App name: `FarmTrackr`
     - User support email: Your email
     - Developer contact: Your email
     - Click "Save and Continue"
     - Add your email as test user
     - Click "Save and Continue"

4. **Create Client ID**
   - For iOS: Application type: **iOS**, Bundle ID: `com.danadube.FarmTrackr`
   - For Web: Application type: **Web application**, Authorized redirect URIs: Your callback URL
   - Click "Create"
   - **COPY THE CLIENT ID AND SECRET** (you'll need these)

5. **Update Your App Configuration**
   - Add credentials to your app configuration file
   - Test the authentication flow

For detailed instructions and troubleshooting, see the sections below.

---

## Prerequisites
- Google Cloud Console account
- For iOS: Apple Developer account and Xcode project with bundle identifier: `com.danadube.FarmTrackr`
- For Web: Domain and redirect URI configured

## Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name: `FarmTrackr`
   - Click "Create"

3. **Select the Project**
   - Make sure your new project is selected in the dropdown

## Step 2: Enable Google Sheets API

1. **Navigate to APIs & Services**
   - Go to "APIs & Services" → "Library"

2. **Enable Google Sheets API**
   - Search for "Google Sheets API"
   - Click on "Google Sheets API"
   - Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. **Go to Credentials**
   - Navigate to "APIs & Services" → "Credentials"

2. **Create OAuth 2.0 Client ID**
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - If prompted, configure the OAuth consent screen first

### Configure OAuth Consent Screen (if needed)

1. **App Information**
   - App name: `FarmTrackr`
   - User support email: Your email
   - Developer contact information: Your email

2. **Scopes**
   - Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/spreadsheets`
   - Click "Update"

3. **Test Users**
   - Add your Google account as a test user
   - Click "Save and Continue"

### Create OAuth 2.0 Client ID

1. **Application Type**
   - Choose "iOS"

2. **Bundle ID**
   - Enter: `com.danadube.FarmTrackr`

3. **Create**
   - Click "Create"
   - **IMPORTANT**: Copy the Client ID and Client Secret

## Step 4: Update App Configuration

1. **Open GoogleSheetsConfig.swift**
   - File: `FarmTrackr/Resources/GoogleSheetsConfig.swift`

2. **Replace Placeholder Values**
   ```swift
   static let clientID = "YOUR_ACTUAL_CLIENT_ID"
   static let clientSecret = "YOUR_ACTUAL_CLIENT_SECRET"
   ```

## Step 5: Verify URL Scheme Configuration

The app should already be configured with the correct URL scheme. Verify in Xcode:

1. **Select your project** in the navigator
2. **Select the FarmTrackr target**
3. **Go to Info tab**
4. **Look for URL Types**
   - Should have: `com.danadube.FarmTrackr`

If not present, add it:
- Click "+" under URL Types
- Identifier: `com.danadube.FarmTrackr`
- URL Schemes: `com.danadube.FarmTrackr`

## Step 6: Build and Test

1. **Clean Build**
   - Xcode → Product → Clean Build Folder
   - Build the project

2. **Test OAuth Flow**
   - Run the app on device/simulator
   - Try to authenticate with Google Sheets
   - Should redirect to Google OAuth consent screen

## Troubleshooting

### Error: "Access blocked: Authorization Error"

**Common Causes:**
1. **Bundle ID / Redirect URI Mismatch**
   - iOS: Ensure Google Cloud Console bundle ID matches your app (`com.danadube.FarmTrackr`)
   - Web: Verify redirect URI matches exactly (including protocol, domain, path)

2. **Missing URL Scheme / Redirect URI**
   - iOS: Verify URL scheme is configured in Xcode: `com.danadube.FarmTrackr`
   - Web: Ensure redirect URI is properly configured in OAuth client settings

3. **OAuth Consent Screen Not Configured**
   - Make sure OAuth consent screen is set up
   - Add your email as test user
   - Verify app is in testing mode

4. **API Not Enabled**
   - Verify Google Sheets API is enabled
   - Check "APIs & Services" → "Enabled APIs"

### Error: "invalid_request"

**Common Causes:**
1. **Incorrect Redirect URI**
   - iOS: Should be: `com.danadube.FarmTrackr://oauth2redirect`
   - Web: Should match exactly what's configured in Google Cloud Console
   - Check your configuration file

2. **Missing Client Secret**
   - Ensure client secret is properly set
   - Check for typos in configuration
   - Never commit secrets to version control

3. **OAuth Consent Screen Issues**
   - Verify app is in testing mode
   - Add your email as test user
   - Review consent screen configuration

## Security Notes

1. **Client Secret Security**
   - Never commit client secret to public repositories
   - Consider using environment variables for production

2. **OAuth Consent Screen**
   - Keep app in testing mode for development
   - Submit for verification before production release

3. **Bundle ID Protection**
   - Bundle ID should be unique to your app
   - Don't share OAuth credentials

## Next Steps

After successful OAuth setup:

1. **Test Google Sheets Import**
   - Try importing from a Google Sheet
   - Verify data is correctly parsed

2. **Test Google Sheets Export**
   - Try exporting contacts to Google Sheets
   - Verify data is correctly formatted

3. **Production Deployment**
   - Submit OAuth consent screen for verification
   - Update to production credentials

## Support

If you encounter issues:

1. **Check Google Cloud Console**
   - Verify API is enabled
   - Check OAuth consent screen configuration
   - Review credentials setup

2. **Check Xcode Configuration**
   - Verify bundle identifier
   - Check URL scheme configuration
   - Ensure proper entitlements

3. **Review Error Messages**
   - Google OAuth errors are usually descriptive
   - Check console logs for additional details 