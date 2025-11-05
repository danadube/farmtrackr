# Google OAuth "Access Blocked" Troubleshooting Guide

## 🚨 Current Issue: "Access blocked: Authorization Error"

Even with the correct Client ID, you're still getting blocked. This means there are configuration issues in your Google Cloud project.

## 🔍 Step-by-Step Troubleshooting

### 1. **Check OAuth Consent Screen Configuration**

**Go to:** https://console.cloud.google.com/apis/credentials/consent

**Required Settings:**
- ✅ **App name**: `FarmTrackr`
- ✅ **User support email**: Your email address
- ✅ **Developer contact information**: Your email address
- ✅ **App domain**: Leave blank for iOS apps
- ✅ **Authorized domains**: Leave blank for iOS apps

### 2. **Add Test Users**

**Critical Step:** You MUST add your email as a test user.

**How to:**
1. In OAuth consent screen, scroll to "Test users"
2. Click "Add Users"
3. Add your Google account email address
4. Click "Save"

**Why this matters:** In development/testing mode, only authorized test users can access your app.

### 3. **Verify OAuth 2.0 Client ID Configuration**

**Go to:** https://console.cloud.google.com/apis/credentials

**Check your iOS OAuth 2.0 Client ID:**
- ✅ **Application type**: iOS
- ✅ **Bundle ID**: `com.danadube.FarmTrackr`
- ✅ **App Store ID**: Leave blank (optional)

### 4. **Enable Google Sheets API**

**Go to:** https://console.cloud.google.com/apis/library/sheets.googleapis.com

**Make sure:**
- ✅ Google Sheets API is **ENABLED**
- ✅ Status shows "API enabled"

### 5. **Check Project Settings**

**Go to:** https://console.cloud.google.com/apis/credentials

**Verify:**
- ✅ You're in the correct Google Cloud project
- ✅ The project has billing enabled (if required)
- ✅ The project is not in a restricted organization

## 🛠️ Quick Fix Checklist

### Immediate Actions:
1. **Add your email as test user** in OAuth consent screen
2. **Enable Google Sheets API** if not already enabled
3. **Verify bundle ID** matches exactly: `com.danadube.FarmTrackr`
4. **Check project selection** - make sure you're in the right project

### Common Issues:
- ❌ **Missing test user** - Most common cause
- ❌ **API not enabled** - Google Sheets API must be enabled
- ❌ **Wrong project** - Make sure you're in the correct Google Cloud project
- ❌ **Bundle ID mismatch** - Must match exactly

## 🔧 Advanced Troubleshooting

### If Still Blocked:

1. **Create a new OAuth 2.0 Client ID:**
   - Delete the existing iOS client
   - Create a new one with bundle ID `com.danadube.FarmTrackr`
   - Update the Client ID in `GoogleSheetsConfig.swift`

2. **Check OAuth Consent Screen Publishing:**
   - Make sure it's set to "Testing" mode
   - Add all necessary test users

3. **Verify Redirect URI:**
   - Should be: `com.danadube.FarmTrackr://oauth2redirect`
   - This is handled automatically by iOS

## 📱 Test the Fix

After making changes:

1. **Wait 5-10 minutes** for Google's systems to update
2. **Restart the app** on the iPad simulator
3. **Try Google Sheets authentication again**

## 🆘 Still Having Issues?

If you're still getting blocked after following these steps:

1. **Check Google Cloud Console logs** for any error messages
2. **Verify your Google account** has proper permissions
3. **Try with a different Google account** as a test
4. **Contact Google Cloud support** if the issue persists

## 📞 Need Help?

The most common fix is adding your email as a test user in the OAuth consent screen. This is required for all development/testing OAuth flows. 