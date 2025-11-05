# OpenAI API Key Setup Guide

**Last Updated:** December 2024

---

## 🚀 Quick Start: Direct Link (Easiest Method)

**Just click this link:** 👉 **https://platform.openai.com/api-keys**

Then:
1. Log in if prompted
2. Click **"+ Create new secret key"**
3. Enter name: `FarmTrackr Commission Scanner`
4. Click **"Create secret key"**
5. **⚠️ COPY THE KEY IMMEDIATELY!** (starts with `sk-...`)
6. Click **"Done"**

That's it! If that link works, you're done. If not, try the methods below.

---

## Step-by-Step: Alternative Methods

### Method 1: Profile Icon (Most Common)

1. Go to **https://platform.openai.com/**
2. Log in if you haven't already
3. Look at the **top-right corner** - click your **profile icon** (or initials)
4. From the dropdown menu, click **"API keys"**
5. You should see the API keys page
6. Click **"+ Create new secret key"**
7. Enter name: `FarmTrackr Commission Scanner`
8. Click **"Create secret key"**
9. **⚠️ COPY THE KEY IMMEDIATELY!** (starts with `sk-...`)

### Method 2: Left Sidebar Navigation

1. Go to **https://platform.openai.com/**
2. Log in
3. Look at the **left sidebar**
4. Find and click **"API keys"** (might be under "Settings" section)
5. If you don't see it, try expanding any collapsed sections

### Method 3: Settings Menu

1. Go to **https://platform.openai.com/**
2. Log in
3. Click **"Settings"** (usually in left sidebar or profile menu)
4. Click **"API keys"** or **"Keys"** tab
5. Click **"+ Create new secret key"**

### Method 4: Direct URL (Always Works)

If the above methods don't work, try these direct URLs:

- **API Keys:** https://platform.openai.com/api-keys
- **Account Settings:** https://platform.openai.com/account
- **API Settings:** https://platform.openai.com/account/api-keys

If none of these work, you might need to:
1. Create an OpenAI account first
2. Add a payment method
3. Verify your email

### Option 3: If You Don't Have an Account

1. Go to **https://platform.openai.com/**
2. Click **"Sign up"** or **"Get started"**
3. Create an account (you can use Google, Microsoft, or email)
4. Verify your email if prompted
5. Once logged in, go to **https://platform.openai.com/api-keys**
6. Follow steps above to create your API key

---

## Troubleshooting

### "I don't see API keys in the menu"

**Solutions:**
- Try the direct link: **https://platform.openai.com/api-keys**
- Check if you're logged in (top right corner)
- Make sure you're on the Platform site, not Chat site:
  - ✅ Correct: `platform.openai.com`
  - ❌ Wrong: `chat.openai.com`

### "Create new secret key button not showing"

**Possible reasons:**
- You need to add a payment method first
- You haven't verified your account
- Your account is restricted

**Solutions:**
1. Go to **Settings** → **Billing**
2. Add a payment method (credit card required)
3. Verify your phone number if prompted
4. Try creating the API key again

### "I created the key but can't find it"

**Important:** API keys are only shown once when created. If you lost it:

1. Go to **https://platform.openai.com/api-keys**
2. Find the key in the list
3. You can't see the full key value anymore, but you can:
   - Click on it to see details
   - Delete it and create a new one if needed

---

## After Getting Your API Key

1. **Save it securely:**
   - Add to password manager
   - Or save in a secure note
   - Format: `sk-proj-...` or `sk-...`

2. **Add to FarmTrackr:**

   **Local Development:**
   ```bash
   # Edit .env.local
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

   **Production (Vercel):**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = `sk-your-actual-key-here`
   - Redeploy

3. **Test it:**
   ```bash
   npm run dev
   # Navigate to Commissions → New Transaction → Scan Commission Sheet
   ```

---

## Payment Method Required

**⚠️ Important:** OpenAI requires a payment method to use the API (even for free tier).

1. Go to **Settings** → **Billing** (or **https://platform.openai.com/account/billing**)
2. Click **"Add payment method"**
3. Enter your credit card details
4. Set usage limits if desired (recommended):
   - Go to **Settings** → **Limits**
   - Set monthly spending limit (e.g., $10/month)
   - This prevents unexpected charges

---

## Pricing Information

**GPT-4 Omni Vision API Pricing** (as of December 2024):
- **Input:** ~$0.005 per 1K tokens (images cost more)
- **Output:** ~$0.015 per 1K tokens
- **Average cost per commission sheet scan:** $0.05 - $0.15

**Tips:**
- Set usage limits in OpenAI dashboard
- Monitor usage regularly
- First-time users sometimes get free credits

---

## Quick Reference Links

- **API Keys Page:** https://platform.openai.com/api-keys
- **Billing Settings:** https://platform.openai.com/account/billing
- **Usage Dashboard:** https://platform.openai.com/usage
- **Documentation:** https://platform.openai.com/docs

---

## Alternative: Using Existing Credentials

If you already set up the commission scanner in the standalone app, you can use the same API key:

1. Open the standalone app's `.env.local` or check Vercel environment variables
2. Find `OPENAI_API_KEY`
3. Copy it
4. Add to FarmTrackr's `.env.local` or Vercel

---

## Still Having Issues?

1. **Check OpenAI Status:**
   - Visit https://status.openai.com/
   - See if there are any outages

2. **Try Different Browser:**
   - Sometimes browser extensions can interfere
   - Try incognito/private mode

3. **Contact OpenAI Support:**
   - Go to https://platform.openai.com/
   - Click "Help" or "Support"
   - Submit a support ticket

---

**Last Updated:** December 2024

