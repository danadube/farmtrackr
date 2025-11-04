# Security Incident Response: Exposed OAuth Credentials

## Incident Summary
Google OAuth credentials were accidentally committed to the git repository in commit `abc3519`.

## Immediate Actions Required

### 1. Rotate Google OAuth Client Secret ⚠️ CRITICAL

**Do this immediately:**

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your **"Farm Trakr Web Client"** (Web application client)
3. In the **Client secrets** section, click **"+ Add secret"**
4. Copy the **new client secret** immediately
5. **Remove the old secret** by clicking the X next to it
6. Update your environment variables with the new secret:
   - Vercel production environment variables
   - Local `.env.local` file

**Note:** The Client ID can stay the same, only the secret needs to be rotated.

### 2. Remove Credentials from Git History

The credentials are in commit `abc3519`. To remove them from history:

**Option A: Using git filter-repo (Recommended)**
```bash
# Install git-filter-repo if not installed
# brew install git-filter-repo (on macOS)

cd /Users/danadube/Desktop/FarmTrackr-old
git filter-repo --path farmtrackr-web/docs/google/WEB_GOOGLE_OAUTH_SETUP.md --invert-paths
git filter-repo --path farmtrackr-web/docs/google/OAUTH_TROUBLESHOOTING.md --invert-paths
# Then re-add these files with credentials removed
```

**Option B: Using BFG Repo-Cleaner**
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt farmtrackr.git
```

**Option C: Manual commit (quickest)**
Since the files are already fixed, commit the changes:
```bash
git add farmtrackr-web/docs/google/
git commit -m "SECURITY: Remove exposed OAuth credentials from documentation"
git push origin farm-web-app-development
```

**Important:** After removing from history, you'll need to force push:
```bash
git push origin farm-web-app-development --force
```

⚠️ **Warning:** Force pushing rewrites history. Coordinate with your team if working with others.

### 3. Verify No Other Files Contain Credentials

```bash
# Search for any remaining instances
grep -r "1095090089380-57rc2o3qbtaoemgspjc9v6274jsgp2v2" farmtrackr-web/
grep -r "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" farmtrackr-web/
```

### 4. Update Vercel Environment Variables

1. Go to Vercel → Project Settings → Environment Variables
2. Update `GOOGLE_CLIENT_SECRET` with the **new secret** from Google Cloud Console
3. Redeploy the application

## Prevention

### ✅ Already in Place
- `.env*.local` files are in `.gitignore`
- Documentation now uses placeholders

### ✅ Best Practices Going Forward
1. **Never** commit actual credentials to git
2. **Always** use environment variables
3. **Use placeholders** in documentation (e.g., `your-client-id`)
4. **Rotate secrets immediately** if exposed

## Impact Assessment

- **Client ID**: Public exposure - relatively low risk, but should be rotated if possible
- **Client Secret**: High risk - **MUST be rotated immediately**
- **Repository**: Credentials are in git history and exposed on GitHub

## Status

- ✅ Credentials removed from current documentation files
- ⏳ Client secret rotation required (manual action needed)
- ⏳ Git history cleanup required (manual action needed)
- ⏳ Vercel environment variables update required (manual action needed)

