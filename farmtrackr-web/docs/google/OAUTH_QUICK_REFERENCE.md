# Google OAuth Consent Screen - Quick Reference

## Navigation Path
**APIs & Services** → **OAuth consent screen**

## Tab Structure

### 1. Audience Tab
- **Purpose**: Set user access and add test users
- **Actions**:
  - Choose **"External"** user type (or Internal for Google Workspace)
  - Add **Test users** (required in Testing mode - only these users can access the app)

### 2. Branding Tab
- **Purpose**: Configure app appearance and contact information
- **Actions**:
  - **App name*** (required): Name shown on consent screen
  - **User support email*** (required): For users to contact you
  - **App Logo** (optional): Upload 120x120px square logo
  - **App Domain** (optional): Home page, privacy policy, terms of service links
  - **Developer Contact Information*** (required): Email for Google notifications

### 3. Data Access Tab
- **Purpose**: Configure OAuth scopes (permissions)
- **Actions**:
  - Click **"Add or Remove Scopes"** button
  - Search and select required scopes:
    - `https://www.googleapis.com/auth/spreadsheets` (for Sheets integration)
    - `https://www.googleapis.com/auth/contacts.readonly` (for Contacts integration - optional)
  - Scopes are categorized as:
    - **Non-sensitive**: Standard OAuth (userinfo.email, userinfo.profile, openid)
    - **Sensitive**: Private user data (like spreadsheets)
    - **Restricted**: Highly sensitive data (like Drive)

## Creating OAuth Client (Credentials)

**Important:** Web applications require a separate OAuth client from iOS clients.

- Go to **APIs & Services** → **Credentials**
- Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
- Choose **"Web application"** (not iOS)
- Configure redirect URIs for your web app
- Copy Client ID and Client Secret

## Quick Setup Checklist

- [ ] **Audience**: Set to External, add test users
- [ ] **Branding**: Enter app name and support email
- [ ] **Data Access**: Add `spreadsheets` scope
- [ ] **Credentials**: Create Web application client (separate from iOS)
- [ ] Save all changes

## Notes

- Changes must be saved in each tab separately
- Test users are required while app is in "Testing" status
- Logo upload may require app verification (unless internal-only or Testing status)

