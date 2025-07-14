# Google Sheets API Integration Setup Guide

## Overview

FarmTrackr now includes Google Sheets integration, allowing you to:
- Import contacts directly from Google Sheets
- Export contacts to new Google Sheets
- Sync data between FarmTrackr and Google Sheets

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Xcode for development

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "FarmTrackr Integration")
4. Click "Create"

### 1.2 Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on "Google Sheets API"
4. Click "Enable"

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: FarmTrackr
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Create"
5. Choose "iOS" as the application type
6. Enter the following details:
   - Bundle ID: `com.farmtrackr`
   - App Store ID: (leave blank for development)
7. Click "Create"
8. **Important**: Copy the Client ID and Client Secret

## Step 2: Configure FarmTrackr

### 2.1 Update Configuration File

1. Open `FarmTrackr/Resources/GoogleSheetsConfig.swift`
2. Replace the placeholder values with your actual credentials:

```swift
static let clientID = "YOUR_ACTUAL_CLIENT_ID"
static let clientSecret = "YOUR_ACTUAL_CLIENT_SECRET"
```

### 2.2 Add URL Scheme (if needed)

The app should already be configured with the URL scheme `com.farmtrackr://oauth2redirect`. If you need to verify or add it:

1. In Xcode, select your project
2. Go to your target's "Info" tab
3. Expand "URL Types"
4. Add a new URL type:
   - Identifier: `com.farmtrackr`
   - URL Schemes: `com.farmtrackr`

## Step 3: Build and Test

1. Build and run the app in Xcode
2. Go to Import → Google Sheets
3. Click "Connect Google Account"
4. Complete the OAuth flow
5. Test import and export functionality

## Usage Guide

### Importing from Google Sheets

1. **Prepare your Google Sheets**:
   - Create a Google Sheets with your contact data
   - Ensure the first row contains headers
   - Supported columns: First Name, Last Name, Email, Phone, Address, City, State, ZIP, etc.

2. **Get the Spreadsheet ID**:
   - Open your Google Sheets
   - Look at the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Copy the ID between `/d/` and `/edit`

3. **Import in FarmTrackr**:
   - Go to Import → Google Sheets
   - Click "Import from Google Sheets"
   - Enter the Spreadsheet ID
   - Click "Import"
   - Review the imported data
   - Click "Import" to save to FarmTrackr

### Exporting to Google Sheets

1. **Export from FarmTrackr**:
   - Go to Import → Google Sheets
   - Click "Export to Google Sheets"
   - Enter a title for the new spreadsheet
   - Click "Export"
   - The app will create a new Google Sheets with all your contacts

### Supported Data Fields

The Google Sheets integration supports the following fields:

**Contact Information:**
- First Name
- Last Name
- Email 1
- Email 2
- Phone 1-6
- Mailing Address
- City
- State
- ZIP Code

**Site Information:**
- Site Address
- Site City
- Site State
- Site ZIP

**Additional:**
- Notes
- Farm

## Troubleshooting

### Common Issues

1. **"Not authenticated" error**:
   - Make sure you've completed the OAuth flow
   - Check that your credentials are correctly configured
   - Try disconnecting and reconnecting your Google account

2. **"Invalid spreadsheet ID" error**:
   - Verify you copied the correct ID from the Google Sheets URL
   - Ensure the spreadsheet is shared with your Google account
   - Check that the spreadsheet exists and is accessible

3. **"API error" messages**:
   - Verify the Google Sheets API is enabled in your Google Cloud project
   - Check that your OAuth credentials are properly configured
   - Ensure your Google account has access to the spreadsheet

4. **Import/Export fails**:
   - Check your internet connection
   - Verify the spreadsheet format matches the expected structure
   - Try with a smaller dataset first

### Debug Information

To help with troubleshooting, the app includes:
- Detailed error messages
- Progress indicators during operations
- Validation feedback for imported data

## Security Notes

- Your Google credentials are stored locally on your device
- The app only requests access to Google Sheets (not other Google services)
- You can revoke access at any time through your Google account settings
- The OAuth flow uses secure authentication methods

## Support

If you encounter issues:

1. Check this setup guide
2. Verify your Google Cloud Console configuration
3. Test with a simple spreadsheet first
4. Check the app's error messages for specific issues

## Future Enhancements

Planned improvements include:
- Support for multiple Google accounts
- Real-time sync with Google Sheets
- Advanced field mapping
- Batch operations
- Integration with other Google services

---

**Note**: This integration requires an active internet connection and a valid Google account. The feature is designed for personal and small business use. 