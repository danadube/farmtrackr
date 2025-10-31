# Google OAuth Scope Configuration

This document tracks the current scope configuration in Google Cloud Console and what's needed for FarmTrackr.

## Currently Configured Scopes

Based on your Google Cloud Console configuration:

### Non-Sensitive Scopes (Standard OAuth)
- `openid` - Associate you with your personal info on Google
- `https://www.googleapis.com/auth/userinfo.email` - See your primary Google Account email address
- `https://www.googleapis.com/auth/userinfo.profile` - See your personal info

### Sensitive Scopes
- `https://www.googleapis.com/auth/spreadsheets` - See, edit, create, and delete all your Google Sheets spreadsheets
  - ✅ **Configured** - This provides full read/write access to Google Sheets

### Restricted Scopes
- `https://www.googleapis.com/auth/drive.readonly` - See and download all your Google Drive files
  - ⚠️ **Configured but not currently used** - This scope is not needed for FarmTrackr but won't cause issues

## Required Scopes for FarmTrackr Features

### Current Implementation (v0.5.0)
- ✅ `https://www.googleapis.com/auth/spreadsheets` - **Configured** - For Google Sheets import/export

### Future Features (Not Yet Implemented)
- ⏳ `https://www.googleapis.com/auth/contacts.readonly` - **Not configured** - Needed for Google Contacts import
  - To add: Go to OAuth consent screen → Data Access → Add or remove scopes → Search for "contacts.readonly"

## Code Reference

The scopes requested by the application are defined in:
- `src/lib/googleAuth.ts` - `GOOGLE_SCOPES` array

**Current code requests:**
```typescript
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets', // ✅ Matches your configuration
]
```

## Adding Google Contacts Scope (When Ready)

When you're ready to implement Google Contacts integration:

1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Click on the **"Data Access"** tab (not the main overview)
3. Click **"Add or Remove Scopes"** button
4. Search for: `contacts.readonly`
5. Select: `https://www.googleapis.com/auth/contacts.readonly`
6. Click **"Update"** to add the scope
7. Click **"Save"** at the bottom of the page
8. Update the code in `src/lib/googleAuth.ts` to uncomment the contacts scope

## Verification

To verify your current scope configuration:
1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Click on the **"Data Access"** tab (use the left sidebar navigation)
4. Review the "Your sensitive scopes" and "Your restricted scopes" sections

## Notes

- The `spreadsheets` scope provides both read and write access, so `spreadsheets.readonly` is not needed
- Drive scope is not used by FarmTrackr but having it configured is harmless
- Standard OAuth scopes (openid, userinfo) are automatically added by Google

