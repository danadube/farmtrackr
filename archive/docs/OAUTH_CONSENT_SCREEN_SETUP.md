# OAuth Consent Screen Setup Guide

## 🚨 Issue: "Test users" section not visible

If you don't see the "Test users" section, your OAuth consent screen hasn't been configured yet.

## 🔧 Step-by-Step Setup

### Step 1: Access OAuth Consent Screen

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (the one with your FarmTrackr OAuth credentials)
3. **Navigate to**: APIs & Services → OAuth consent screen

### Step 2: Configure OAuth Consent Screen

**If you see "Configure Consent Screen":**
1. Click "Configure Consent Screen"
2. Choose **"External"** user type
3. Click "Create"

**If you see an existing configuration:**
1. Click "Edit App" to modify it

### Step 3: Fill in Required Information

**App Information:**
- **App name**: `FarmTrackr`
- **User support email**: Your email address
- **App logo**: Leave blank for now
- **App domain**: Leave blank (not needed for iOS apps)
- **Application home page**: Leave blank
- **Application privacy policy link**: Leave blank
- **Application terms of service link**: Leave blank

**Authorized domains:**
- Leave blank (not needed for iOS apps)

**Developer contact information:**
- **Email addresses**: Your email address

### Step 4: Configure Scopes

1. Click "Save and Continue"
2. In "Scopes" section, click "Add or Remove Scopes"
3. Find and select: `https://www.googleapis.com/auth/spreadsheets`
4. Click "Update"
5. Click "Save and Continue"

### Step 5: Add Test Users

**This is the critical step!**

1. In "Test users" section, click "Add Users"
2. Add your Google account email address
3. Click "Add"
4. Click "Save and Continue"

### Step 6: Review and Publish

1. Review your configuration
2. Click "Back to Dashboard"

## 🎯 What You Should See After Setup

After proper configuration, you should see:

- ✅ **App information** section
- ✅ **Scopes** section with Google Sheets API
- ✅ **Test users** section with your email listed
- ✅ **Publishing status**: "Testing" (not "In production")

## 🔍 Troubleshooting

### If "Test users" still not visible:

1. **Check publishing status**: Should be "Testing", not "In production"
2. **Verify user type**: Should be "External", not "Internal"
3. **Check scopes**: Make sure Google Sheets API scope is added
4. **Try refreshing**: Wait a few minutes and refresh the page

### If you see "In production":

1. Click "Edit App"
2. Scroll to bottom
3. Click "Reset to testing"
4. This will make "Test users" section visible again

## 📱 Test After Setup

1. **Wait 5-10 minutes** for changes to propagate
2. **Restart FarmTrackr** on iPad simulator
3. **Try Google Sheets authentication** again

## 🆘 Still Having Issues?

If you still don't see "Test users":

1. **Screenshot the OAuth consent screen** and share what you see
2. **Check if you're in the correct Google Cloud project**
3. **Verify the project has billing enabled** (if required)
4. **Try creating a new Google Cloud project** and setting up OAuth from scratch

## 📞 Quick Check

After setup, your OAuth consent screen should show:
- App name: FarmTrackr
- Publishing status: Testing
- Test users: [Your email address]
- Scopes: Google Sheets API

If any of these are missing, the setup isn't complete. 