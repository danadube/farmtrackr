# Google OAuth Troubleshooting: Error 400 invalid_request

## Error: "Access blocked: Authorization Error" + "Error 400: invalid_request"

This error means Google is rejecting the OAuth request. Common causes:

### 1. Redirect URI Mismatch (Most Common)

The redirect URI must **exactly** match what's configured in Google Cloud Console.

**Check in Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your **Web application** client (not the iOS one)
3. Check **"Authorized redirect URIs"**
4. Ensure it **exactly** matches one of these:

**For Production (danadube.com):**
```
https://danadube.com/api/google/oauth/callback
```

**For Development:**
```
http://localhost:3000/api/google/oauth/callback
```

**Common mistakes:**
- ❌ `https://danadube.com/api/google/oauth/callback/` (trailing slash)
- ❌ `http://danadube.com/api/google/oauth/callback` (http instead of https)
- ❌ `https://www.danadube.com/api/google/oauth/callback` (www prefix)
- ✅ `https://danadube.com/api/google/oauth/callback` (correct)

**Fix:**
- Make sure the redirect URI in Google Cloud Console matches exactly
- Check your Vercel environment variable: `GOOGLE_OAUTH_REDIRECT_URI`
- No trailing slashes, correct protocol (https for production)

### 2. Missing Test User

If your app is in **"Testing"** status (not Published), you must add test users.

**Fix:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Click on **"Audience"** tab
3. Scroll to **"Test users"** section
4. Click **"Add Users"**
5. Add: `dana@danadube.com`
6. Click **"Add"** then **"Save"**
7. **Important:** Only test users can access the app in Testing mode

### 3. Client ID/Secret Mismatch

Make sure you're using the **Web application** client credentials, not the iOS client.

**Check:**
- In Google Cloud Console → Credentials, you should see:
  - iOS client: `FarmTrackr` (for iOS app)
  - Web client: `FarmTrackr Web Client` or similar (for web app)
- Use the **Web client** credentials in your environment variables

### 4. Environment Variables Not Set

Verify your Vercel environment variables are set correctly:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://danadube.com/api/google/oauth/callback
NEXT_PUBLIC_APP_URL=https://danadube.com
```

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Verify all variables are set for Production environment
3. Redeploy after adding/updating variables

### 5. OAuth Consent Screen Not Configured

Ensure the OAuth consent screen is fully configured:

**Check:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Verify:
   - **Audience tab**: Set to External, test users added
   - **Branding tab**: App name and support email filled
   - **Data Access tab**: Spreadsheets scope added

## Step-by-Step Fix Checklist

- [ ] **Redirect URI** matches exactly in Google Cloud Console
- [ ] **Test user** (dana@danadube.com) added in Audience tab
- [ ] **Environment variables** set correctly in Vercel
- [ ] Using **Web application** client credentials (not iOS)
- [ ] **OAuth consent screen** fully configured (all three tabs)
- [ ] **Redeployed** after any changes

## Still Not Working?

1. **Clear browser cache** and cookies for danadube.com
2. **Try incognito/private window** to rule out browser issues
3. **Check browser console** for additional error messages
4. **Check Vercel logs** for server-side errors
5. **Verify the redirect URI** is being generated correctly by checking the authorization URL

## Testing the Redirect URI

To verify the redirect URI is correct, check the authorization URL:
1. In Settings → Google Integration, click "Connect Google Account"
2. Look at the URL before redirecting - it should contain `redirect_uri=...`
3. Compare that redirect_uri with what's in Google Cloud Console
4. They must match **exactly** (no trailing slashes, correct protocol, correct domain)

