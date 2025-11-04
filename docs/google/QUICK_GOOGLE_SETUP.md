# Quick Google OAuth Setup for FarmTrackr

## ⚡ Quick Start (5 minutes)

### Step 1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name: `FarmTrackr`
4. Click "Create"

### Step 2: Enable Google Sheets API
1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted to configure OAuth consent screen:
   - App name: `FarmTrackr`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"
   - Add your email as test user
   - Click "Save and Continue"

### Step 4: Create iOS Client ID
1. Application type: **iOS**
2. Bundle ID: `com.danadube.FarmTrackr`
3. Click "Create"
4. **COPY THE CLIENT ID** (you'll need this)

### Step 5: Update Your App
1. Open `FarmTrackr/Resources/GoogleSheetsConfig.swift`
2. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
3. Replace `YOUR_GOOGLE_CLIENT_SECRET` with your actual Client Secret

### Step 6: Test
1. Build and run your app
2. Try the Google Sheets authentication
3. Should work now! 🎉

## 🔧 If You Still Get Errors

### Error: "Access blocked: Authorization Error"
- Make sure you added your email as a test user in OAuth consent screen
- Verify bundle ID matches exactly: `com.danadube.FarmTrackr`

### Error: "invalid_request"
- Check that you copied the Client ID and Secret correctly
- No extra spaces or characters

## 📱 Current App Status
- ✅ Bundle ID: `com.danadube.FarmTrackr`
- ✅ URL Scheme: `com.danadube.FarmTrackr`
- ✅ OAuth Manager: Configured
- ✅ Google Sheets Manager: Ready
- ⏳ **Waiting for your Google credentials**

## 🚀 Once You Have Credentials
1. Update `GoogleSheetsConfig.swift`
2. Build and test
3. Should work immediately!

---
**Need help?** The detailed guide is in `GOOGLE_OAUTH_SETUP.md` 