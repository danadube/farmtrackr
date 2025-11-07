# How to Update Your Google Apps Script

## Quick Update Instructions

Your Google Apps Script needs to be updated with the latest code that includes the `createTestEmails` function and full email templates.

### Step 1: Open Your Apps Script Project

1. Go to [Google Apps Script](https://script.google.com/)
2. Open your "FarmTrackr Email Service" project (or whatever you named it)

### Step 2: Replace the Code

1. **Select ALL the code** in the editor (Ctrl+A or Cmd+A)
2. **Delete it** (Delete or Backspace)
3. **Copy the entire contents** of `farmtrackr-web/docs/google/emails.gs`
4. **Paste it** into the Apps Script editor
5. **Click Save** (Ctrl+S or Cmd+S)

### Step 3: Update Configuration

Make sure to update the `SPREADSHEET_ID` at the top of the file:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual spreadsheet ID
```

### Step 4: Redeploy

1. Click **Deploy** → **Manage deployments**
2. Click the **pencil icon** (✏️) next to your active deployment
3. Click **Deploy** (you can keep the same version or create a new one)
4. **Don't change the Web App URL** - it stays the same

### Step 5: Test

1. Go back to your FarmTrackr app
2. Try clicking "Create Test Emails" again
3. It should work now!

## What Was Added

The updated script includes:
- ✅ `createTestEmails()` function
- ✅ Full email template bodies (welcome_buyer, welcome_seller, etc.)
- ✅ All template functions with proper HTML formatting
- ✅ Support for all email actions

## Troubleshooting

**Still getting "Invalid action" error?**
- Make sure you saved the Apps Script after pasting
- Make sure you redeployed (Step 4 above)
- Check that the `doPost` function includes the `createTestEmails` case
- Try creating a new deployment instead of editing the existing one

**Can't find the function?**
- Search for "createTestEmails" in the Apps Script editor
- It should be around line 1255
- If it's not there, the code wasn't pasted correctly


