# Email Module Implementation - Current State Assessment

**Date:** November 6, 2025  
**Purpose:** Document existing email functionality before implementing comprehensive email module

---

## 📋 EXECUTIVE SUMMARY

The FarmTrackr Next.js application already has **partial email integration** via Google Apps Script. This document outlines what exists, what's missing, and what needs to be built to implement the full email module as described in the implementation guide.

---

## 🔍 EXISTING GOOGLE APPS SCRIPT

### **File Location:** 
`farmtrackr-web/docs/google/emails.gs`

### **Implemented Functions:**

1. ✅ **`sendEmailFromCRM(emailData)`**
   - Sends email via Gmail API
   - Supports: to, subject, body (HTML), cc, bcc, attachments
   - Links to transaction via `transactionId`
   - Logs to Email_Log sheet (if transactionId provided)
   - Returns: `{ success, messageId, timestamp }` or `{ success: false, error }`

2. ✅ **`getRecentEmails(queryParams)`**
   - Fetches emails from Gmail using search query
   - Returns: `{ success, emails[], count }` or `{ success: false, error, emails: [] }`
   - Supports Gmail search queries (e.g., "from:client@email.com")
   - Returns: id, threadId, from, to, cc, subject, body, plainBody, date, isUnread, attachments[], labels[]

3. ✅ **`logEmailToSheet(emailData)`**
   - Logs email to Google Sheets "Email_Log" sheet
   - Creates sheet if it doesn't exist
   - Stores: Message ID, Transaction ID, Contact ID, Direction, From, To, Subject, Date/Time, Body Preview, Full Body, Attachments JSON, Thread ID, Saved By

4. ✅ **`doPost(e)`** - Web app entry point
   - Handles POST requests from Next.js
   - Actions supported: `'send'`, `'fetch'`
   - Returns JSON responses

5. ✅ **`doGet(e)`** - Web app entry point
   - Handles GET requests (for testing)
   - Returns status message

### **Configuration:**
- ⚠️ **SPREADSHEET_ID**: Set to `'YOUR_SPREADSHEET_ID'` (needs to be configured)
- ✅ **EMAIL_LOG_SHEET_NAME**: `'Email_Log'`

### **Missing from Implementation Guide:**
- ❌ Gmail labels management (`getAllLabels`, `addLabel`, `removeLabel`, `createLabel`)
- ❌ Email templates (`getAllTemplates`, `getTemplate`)
- ❌ Link/unlink email to transaction separately (currently only links on send)
- ❌ Reply/forward functionality
- ❌ Transaction list for dropdown (`getActiveTransactions`)
- ❌ Helper utilities (`formatEmailDate`, `stripHtml`, etc.)
- ❌ Email filtering by transaction, label, search term, status

### **Web App Deployment:**
- ✅ Setup instructions exist in `GMAIL_INTEGRATION_SETUP.md`
- ⚠️ **Status**: Unknown if deployed
- ⚠️ **URL**: Stored in `GOOGLE_APPS_SCRIPT_WEB_APP_URL` env variable (if configured)

---

## 🚀 EXISTING NEXT.JS SETUP

### **API Routes:**

1. ✅ **`/api/gmail/send`** (POST)
   - Accepts: `{ to, subject, body, cc, bcc, transactionId, contactId, attachments }`
   - Calls Apps Script `sendEmailFromCRM()` function
   - Returns: `{ success, messageId, timestamp }` or `{ success: false, error }`
   - **Location:** `farmtrackr-web/src/app/api/gmail/send/route.ts`

2. ✅ **`/api/gmail/fetch`** (GET)
   - Accepts query params: `query`, `maxResults`
   - Calls Apps Script `getRecentEmails()` function
   - Returns: `{ success, emails[], count }` or `{ success: false, error }`
   - **Location:** `farmtrackr-web/src/app/api/gmail/fetch/route.ts`

3. ✅ **`/api/gmail/test`** (GET)
   - Tests connection to Apps Script Web App
   - Returns: Connection status and config info
   - **Location:** `farmtrackr-web/src/app/api/gmail/test/route.ts`

### **Frontend Components:**

1. ✅ **`EmailPanel`** 
   - **Location:** `farmtrackr-web/src/components/EmailPanel.tsx`
   - **Features:**
     - Displays emails in list view
     - Tabs: All, Sent, Received
     - Search functionality
     - Email detail modal
     - Compose button
     - Refresh button
   - **Limitations:**
     - Only works with single `transactionId` prop
     - No transaction selector dropdown
     - No Gmail labels UI
     - No email templates
     - No link/unlink functionality

2. ✅ **`EmailComposer`**
   - **Location:** `farmtrackr-web/src/components/EmailComposer.tsx`
   - **Features:**
     - To, CC, BCC fields
     - Subject field
     - Plain text body (textarea)
     - Send button
     - Error handling
   - **Limitations:**
     - No rich text editor (HTML support)
     - No email templates
     - No attachment UI (button disabled)
     - No transaction selector (uses prop)

### **Services:**

1. ✅ **`gmailService.ts`**
   - **Location:** `farmtrackr-web/src/lib/gmailService.ts`
   - **Functions:**
     - `sendEmail(emailData)` - Wrapper for `/api/gmail/send`
     - `fetchEmails(query, maxResults)` - Wrapper for `/api/gmail/fetch`
     - `fetchContactEmails(contactEmail, maxResults)` - Helper
     - `fetchTransactionEmails(contactEmail, maxResults)` - Helper (same as contact)

### **Types:**

✅ **Email-related types defined in `src/types/index.ts`:**
- `EmailAttachment` - { name, content?, mimeType?, size? }
- `EmailData` - { to, subject, body, cc?, bcc?, transactionId?, contactId?, attachments? }
- `GmailMessage` - { id, threadId, from, to, cc?, subject, body, plainBody, date, isUnread, attachments[], labels[] }
- `EmailLogEntry` - { messageId, transactionId?, contactId?, direction, from, to, subject, date, bodyPreview, fullBody, attachments[], threadId, savedBy }

---

## 💾 DATABASE SCHEMA

### **Transaction Model** (Prisma)
✅ **Location:** `farmtrackr-web/prisma/schema.prisma`

**Existing Fields:**
- `id` (String) - Primary key
- `address`, `city` - Property location
- `closedPrice`, `listPrice` - Pricing
- `status` - 'Closed', 'Pending', 'Cancelled'
- `brokerage`, `transactionType`, `clientType` - Classification
- `closingDate`, `listDate` - Dates
- Many commission calculation fields
- `notes` - JSON or text

**Missing:**
- ❌ No direct link to Contact/FarmContact (would need to add `contactId` field or relationship)
- ❌ No `clientEmail` field (would be needed to fetch emails)

### **Email Log**
❌ **NOT in Prisma schema**
- Currently uses Google Sheets (Email_Log sheet)
- Would need to add `EmailLog` model to Prisma if we want database storage

---

## 🔐 AUTHENTICATION

### **Current Setup:**
- ✅ Google Apps Script handles OAuth internally
- ✅ Apps Script Web App deployed with "Me" execution and "Anyone" access
- ✅ No OAuth client ID/secret needed in Next.js (Apps Script handles it)
- ⚠️ User must authorize Apps Script on first use (when accessing Gmail)

### **Environment Variables:**
✅ **Defined in `env.example`:**
- `GOOGLE_APPS_SCRIPT_WEB_APP_URL` - Web app deployment URL
- `GOOGLE_APPS_SCRIPT_ID` - Script ID (optional, for reference)

---

## 📊 DATA STRUCTURES

### **Transactions Available:**
✅ **Transaction model exists with:**
- All commission fields
- Property information
- Status tracking
- Dates (listDate, closingDate)

### **Contacts Available:**
✅ **FarmContact model exists with:**
- `email1`, `email2` fields
- Contact information
- Farm association

### **Missing Links:**
- ❌ No direct relationship between Transaction and Contact
- ❌ Transaction doesn't have `contactEmail` or `contactId` field
- ❌ Would need to match by email address or add relationship

---

## 🎯 WHAT'S MISSING FROM IMPLEMENTATION GUIDE

### **Backend (Google Apps Script):**

1. ❌ **Email Labels Management**
   - `getAllLabels()` - Get all Gmail labels with counts
   - `fetchEmailsByLabel()` - Get emails by label
   - `addLabel()`, `removeLabel()`, `createLabel()`

2. ❌ **Email Templates**
   - `getAllTemplates()` - List all templates
   - `getTemplate(templateId, variables)` - Get template with variable substitution
   - Template storage (could use Google Sheets or hardcoded)

3. ❌ **Transaction Management**
   - `getActiveTransactions()` - Get active transactions for dropdown
   - Would need to query from database or Google Sheets

4. ❌ **Email Linking**
   - `linkEmailToTransaction(messageId, transactionId)` - Link existing email
   - Currently only links on send

5. ❌ **Reply/Forward**
   - `replyToEmail(messageId, body, transactionId)`
   - Forward functionality

6. ❌ **Helper Functions**
   - `stripHtml()`, `formatEmailDate()`, `formatFileSize()`, etc.

7. ❌ **Enhanced Filtering**
   - Filter by transaction, label, search term, status (unread, starred, attachments)

### **Frontend (Next.js):**

1. ❌ **Transaction Selector Dropdown**
   - Select transaction to filter emails
   - Show "All Transactions", "Unlinked Emails Only", and active transactions
   - Display transaction info (status, price, linked email count)

2. ❌ **Gmail Labels UI**
   - Display Gmail labels/folders
   - Click to filter by label
   - Show unread counts

3. ❌ **Email Templates UI**
   - Template selector dropdown
   - Load template into composer
   - Variable substitution interface

4. ❌ **Link/Unlink UI**
   - Button to link email to transaction
   - Modal to select transaction
   - Show linked transaction badge

5. ❌ **Enhanced Email Composer**
   - Rich text editor (HTML)
   - Attachment upload
   - Template selection
   - Transaction selector in composer

6. ❌ **Reply/Forward UI**
   - Reply button in email detail
   - Forward button in email detail
   - Pre-fill composer with original email

7. ❌ **Standalone Email Page**
   - Currently EmailPanel is embedded in transaction view
   - Need dedicated email management page

### **Database:**

1. ❌ **Email Log Model** (Prisma)
   - Currently uses Google Sheets
   - Should add to Prisma schema for better integration

2. ❌ **Transaction-Contact Relationship**
   - Add `contactId` to Transaction model
   - Or add `clientEmail` field

3. ❌ **Email Templates Model** (Prisma)
   - Store email templates in database
   - Currently would be hardcoded or in Google Sheets

---

## ✅ WHAT WORKS NOW

1. ✅ **Basic email sending** - Can send emails from transaction view
2. ✅ **Email fetching** - Can fetch emails by contact email
3. ✅ **Email display** - EmailPanel shows emails in list and detail views
4. ✅ **Email search** - Search functionality works
5. ✅ **API integration** - Next.js ↔ Apps Script communication works
6. ✅ **Test page** - `/test-gmail` page to verify connection

---

## 🚧 IMPLEMENTATION PRIORITIES

### **Phase 1: Core Functionality** (Must Have)
1. Add transaction selector dropdown to EmailPanel
2. Implement `getActiveTransactions()` in Apps Script
3. Add link/unlink email functionality
4. Enhance email filtering (transaction, search, status)

### **Phase 2: Enhanced Features** (Should Have)
1. Gmail labels UI and management
2. Email templates system
3. Rich text composer
4. Reply/forward functionality

### **Phase 3: Polish** (Nice to Have)
1. Database email log (Prisma model)
2. Attachment support
3. Standalone email management page
4. Advanced filtering and search

---

## 📝 KEY DECISIONS NEEDED

1. **Email Storage:**
   - Keep Google Sheets Email_Log?
   - Or migrate to Prisma database?

2. **Transaction-Contact Linking:**
   - Add `contactId` to Transaction model?
   - Or match by email address only?

3. **Email Templates:**
   - Hardcode in Apps Script?
   - Store in Google Sheets?
   - Store in Prisma database?

4. **Rich Text Editor:**
   - Which library? (React Quill, Draft.js, TipTap, etc.)

5. **Gmail Labels:**
   - Sync all labels?
   - Only specific labels?
   - Allow creating custom labels?

---

## 🔗 RELATED FILES

- **Apps Script:** `farmtrackr-web/docs/google/emails.gs`
- **Setup Guide:** `farmtrackr-web/docs/google/GMAIL_INTEGRATION_SETUP.md`
- **API Routes:** `farmtrackr-web/src/app/api/gmail/*`
- **Components:** `farmtrackr-web/src/components/EmailPanel.tsx`, `EmailComposer.tsx`
- **Services:** `farmtrackr-web/src/lib/gmailService.ts`
- **Types:** `farmtrackr-web/src/types/index.ts`
- **Schema:** `farmtrackr-web/prisma/schema.prisma`
- **Test Page:** `farmtrackr-web/src/app/test-gmail/page.tsx`

---

**Next Step:** Review this assessment and confirm implementation approach before proceeding with development.

