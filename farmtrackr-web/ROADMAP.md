# FarmTrackr Web App - Development Roadmap

## 📋 Overview

This roadmap outlines the development plan to bring the web application to feature parity with the Swift app, with special attention to the label printing functionality that had implementation challenges.

**Last Updated:** November 15, 2025  
**Current Version:** v0.7.0 (UI/UX Enhancements & Polish) - ✅ COMPLETE  
**Previous Version:** v0.6.0 (Commission Tracking Module) - ✅ COMPLETE  
**Next Priority:** v0.8.0 (Email & Communication Integration) + v0.7.1 (User Feedback & Bug Fixes)

---

## 🎯 Current Status (v0.2.0 - Data Persistence) ✅ UPDATED

**Last Verification:** January 29, 2025

### ✅ Completed Features
- [x] **Contact Management (CRUD)** ✅ VERIFIED
  - Create, read, update, delete contacts
  - Full contact form with all 20+ fields
  - Site address support (mailing vs site address)
  - Phone number formatting (XXX) XXX-XXXX
  - Address formatting (City, State ZIP)
  
- [x] **Basic Dashboard** ✅ VERIFIED
  - Contact statistics
  - Recent contacts display
  - Quick action buttons
  
- [x] **Search & Filter** ✅ VERIFIED
  - Real-time search by name, farm, email, city
  - Farm filter dropdown
  - State filter dropdown
  - Filter stats display
  
- [x] **Theme System** ✅ VERIFIED
  - Light, dark, and system theme support
  - Theme persistence
  - Theme-aware styling throughout
  
- [x] **Responsive Design** ✅ VERIFIED
  - Sidebar navigation (always visible on desktop)
  - Mobile-responsive layout
  - Apple-style aesthetic
  - Footer with build number

- [x] **Database Integration** ✅ VERIFIED
  - PostgreSQL database setup (Prisma Postgres on Vercel)
  - Database migrations system
  - Connection pooling via Prisma
  - Data persistence across sessions

- [x] **Data Export** ✅ VERIFIED - FULLY IMPLEMENTED
  - CSV export functionality (API + UI working)
  - Excel export functionality (API + UI working)
  - JSON export functionality (API implemented)
  - PDF export (basic API placeholder)
  - Farm-filtered export support (API ready)
  - Column selection UI exists

- [x] **Data Import** ✅ VERIFIED - UI + API COMPLETE
  - CSV import API fully functional (`/api/contacts/import`)
  - Excel (.xlsx) import API fully functional
  - Field mapping and validation in API
  - Drag-and-drop import UI on `/import-export` tested end-to-end

- [x] **Data Quality & Duplicate Detection** ✅ VERIFIED - FULLY IMPLEMENTED
  - Duplicate detection algorithm (name, email, phone matching)
  - Data validation system
  - Quality score calculation
  - Duplicate groups display (complete UI)
  - Validation issues display (complete UI)
  - Data quality page with tabs for duplicates/validation/cleanup

- [x] **Google Sheets Configuration** ✅ VERIFIED
  - Updated farm spreadsheet IDs (11 farms)
  - Configuration management
  - Integration ready for authentication

- [x] **Version & Build System** ✅ VERIFIED
  - Build number tracking
  - About section in Settings
  - Footer with build information
  - Version update documentation

### 🚧 In Progress / Partial Implementation
- [ ] **Google Sheets Integration** (UI + API implemented, OAuth pending)
  - Dedicated page at `/google-sheets` with farm-aware import/export
  - API structure exists (`/api/google-sheets/import` and `/export`)
  - Awaiting Google OAuth credential flow and token storage

### ❌ Not Started / Planned
- [ ] **Export Column Selection for Transactions**
  - Add column selection UI for transaction exports (similar to contacts export)
  - Allow users to choose which transaction fields to export
  - Save column preferences for future exports
  
- [ ] **Email Integration** 📧
  - Outlook email integration
  - Google Gmail integration
  - Built-in email client within the app
  - Send emails to contacts directly from FarmTrackr
  - Email templates and history tracking
  
- [ ] **Transaction Pipeline** 🔄
  - Visual pipeline for transaction stages
  - Track transactions through workflow stages
  - Pipeline management and customization
  - Link transactions to contacts and pipeline stages
  
- [ ] **Document Form Integration** 📝
  - ZipForms/DocuSign integration for document signing
  - CAR (California Association of Realtors) forms integration
  - Form generation and tracking
  - Electronic signature workflows
  
- [ ] **Task & Reminders System** ✅
  - Task management with reminders
  - Apple Reminders sync
  - Link tasks to contacts and transactions
  - Task pipeline integration
  
- [ ] **Outlook Integration** 📅
  - Outlook Calendar sync
  - Outlook People/Contacts sync
  - Outlook Email integration
  - Bidirectional sync capabilities
  
- [ ] **Button Interaction Animations** ✨
  - Click/press animations for all buttons throughout app
  - Visual feedback on button interactions
  - Consistent animation system
  
- [ ] **Active Farms Card Enhancement** 🏷️
  - Elegant handling for many farm chips
  - Scrollable chip container or better layout
  - Overflow handling for active farms card
  
- [ ] **Dashboard Redesign** 🎨
  - Rethink and reorganize welcome page dashboard
  - Better information architecture
  - Combine total contacts and validation issues into one card
  - Double the active farms card size for more space
  
- [ ] **Authentication & Security** 🔐
  - Sign in to app for security
  - User authentication system
  - Multi-user support with roles
  - Session management
  
- [ ] **Personalization** 🎨
  - Personal logo import
  - Custom branding options
  - App personalization features
  - Theme customization beyond light/dark
  
- [ ] **Transaction Type: Lease** 🏠
  - Add "Lease" option to transaction types
  - Lease-specific fields and calculations
  - Lease commission tracking
  
- [ ] **Google Contact Tag Colors** 🎨
  - Different colored chips for Google contact tags
  - Custom tag color assignment
  - Visual tag organization
  
- [ ] **Print Labels Enhancements** 🏷️
  - Add print labels option in Farm Contacts tab
  - Print labels from Google Contacts chips
  - Quick access to label printing from multiple locations
  
- [ ] **Sidebar Enhancements** 📱
  - Future features section/coming soon tab in sidebar
  - Show planned features and roadmap items
  - Sidebar actions: icon on left, text left-justified to icon
  - Streamlined action card design
  
- [ ] **Label Printing** 🔴 **CRITICAL PRIORITY** ✅ COMPLETE
  - Dashboard link exists but route doesn't exist
  - No implementation found
  - Avery template support needed
  - This is the highest priority feature (had issues in Swift app)
  - ✅ COMPLETE - Fully implemented with preview
  
- [ ] **Document Management** ✅ COMPLETE
  - Page exists at `/documents` but uses mock data
  - No real document storage/management functionality
  - ✅ COMPLETE - Full CRUD with file upload
  
- [ ] **Batch Operations** ✅ COMPLETE
  - Multi-select for contacts
  - Bulk edit/delete/export
  - ✅ COMPLETE - Full batch operations implemented
  
- [ ] **Import Templates**
  - Save and reuse import configurations
  - Template management UI
  
- [ ] **Advanced Search/Filter**
  - Advanced filter builder
  - Saved search queries
  
- [ ] **PDF Export Enhancement** ✅ COMPLETE
  - Current PDF export is basic/placeholder
  - Needs proper PDF generation library
  - ✅ COMPLETE - Professional PDF with pdfkit

---

## 🚀 Version Roadmap

### **v0.2.0 - Data Persistence & Import**
**Focus:** Foundation for data management and import capabilities

#### Database Integration
- [x] **Database Setup** ✅
  - PostgreSQL database (Prisma Postgres on Vercel)
  - Database migrations system
  - Connection pooling via Prisma Accelerate
  - Production data migration completed

#### CSV Import
- [x] **CSV File Import API** ✅ COMPLETE
  - File upload API implemented (`/api/contacts/import`)
  - CSV parsing working (PapaParse)
  - Field mapping (automatic mapping implemented)
  - Duplicate detection during import
  - Error handling and reporting in API
- [x] **CSV Import UI** ✅ EXISTS - NEEDS TESTING
  - File upload interface exists at `/import-export`
  - Import preview functionality
  - Status messages working
  - **Needs:** User testing to verify workflow, may need refinement

#### Excel Import
- [x] **Excel (.xlsx) Import API** ✅ COMPLETE
  - Excel file parsing working (xlsx library)
  - Header row detection implemented
  - Data type validation in API
  - Error handling implemented
- [x] **Excel Import UI** ✅ EXISTS - NEEDS TESTING
  - File upload interface exists
  - **Needs:** User testing, multi-sheet support UI enhancement

#### Import Templates
- [ ] **Reusable Import Configurations**
  - Save import field mappings
  - Template management UI
  - Template sharing/export

**Dependencies:**
- Database ORM (Prisma or similar)
- xlsx parsing library
- File upload handling


---

### **v0.3.0 - Export & Data Quality** - ✅ MOSTLY COMPLETE
**Focus:** Data export capabilities and quality management

#### Export System
- [x] **CSV Export** ✅ VERIFIED
  - CSV export working (API + UI)
  - All contact fields included
- [x] **Excel Export** ✅ VERIFIED
  - .xlsx format working (API + UI)
  - All contact fields included
- [x] **Customizable Columns** ✅ VERIFIED
  - Column selection UI implemented
  - Column selection available in import-export page
- [x] **JSON Export** ✅ VERIFIED
  - JSON format implemented in API
- [ ] **PDF Export** (Partial - Placeholder)
  - Basic placeholder exists
  - Needs proper PDF generation library (pdfkit/jsPDF)
  - Printable format needed
- [x] **Export Filters (API)** ✅ VERIFIED
  - Farm filter in API working
  - Date range filter in API ready
- [x] **Export Filters (UI)** ✅ VERIFIED
  - Farm filter dropdown in UI
  - Date range filter inputs in UI
  - Column selection working

#### Data Quality Tools
- [x] **Duplicate Detection** ✅ VERIFIED - FULLY IMPLEMENTED
  - Automatic duplicate scanning working
  - Duplicate matching algorithms:
    - [x] Name-based matching ✅
    - [x] Email-based matching ✅
    - [x] Phone-based matching ✅
    - [ ] Address-based matching (enhancement opportunity)
  - [x] Duplicate groups display ✅ (Complete UI)
  - [ ] Duplicate merge functionality (future enhancement)
  - [ ] Merge conflict resolution UI (future enhancement)

#### Data Validation
- [x] **Comprehensive Validation** ✅ VERIFIED - FULLY IMPLEMENTED
  - [x] Email format validation ✅
  - [x] Phone number formatting and validation ✅
  - [x] ZIP code validation (5-digit) ✅
  - [ ] ZIP+4 validation (future enhancement)
  - [x] Address validation (basic working) ✅
  - [x] Data completeness scoring (displayed in UI) ✅
  - [ ] Validation rules configuration (future enhancement)

#### Data Cleanup
- [x] **Basic Data Cleanup** ✅ VERIFIED
  - [x] Phone number formatting (display) ✅
  - [x] Cleanup API exists (`/api/contacts/cleanup`) ✅
  - [x] ZIP code formatting (display) ✅
  - [ ] Bulk cleanup operations UI polish (needs testing)

**Status:** ✅ **v0.3.0 is essentially complete** - Minor enhancements possible but core functionality working

---

### **v0.4.0 - Label Printing & PDF Export** ✅ COMPLETE
**Focus:** CRITICAL - Address label printing functionality (had issues in Swift app)

#### Label Printing Core
- [x] **Avery Label Format Support** ✅ COMPLETE
  - [x] Avery 5160 (1" x 2.625") - 30 labels per sheet ✅
  - [x] Avery 5161, 5162, 5163, 5164, 5167 format definitions ✅
  - [x] Column-major order layout ✅
  - [x] Precise label positioning calculations ✅

- [x] **Label Rendering Engine** ✅ COMPLETE
  - [x] Column-major order layout ✅
  - [x] Precise label positioning (margins, gaps) ✅
  - [x] Font size and family selection ✅
  - [x] Text wrapping and address formatting ✅
  - [x] Multi-page support ✅
  - [x] Print-ready HTML generation ✅

#### Label Printing UI
- [x] **Print Label Interface** ✅ COMPLETE
  - [x] Farm selection dropdown ✅
  - [x] Label format picker ✅
  - [x] Address type selection (mailing vs site) ✅
  - [x] Font family selection (System, Times New Roman, Arial, Courier New) ✅
  - [x] Contact count display ✅
  - [x] Preview before printing ✅
  - [x] Print button integration ✅

#### Label Preview
- [x] **Visual Preview System** ✅ COMPLETE
  - [x] Full-page preview (8.5" x 11") ✅
  - [x] Multi-page preview with pagination ✅
  - [x] Zoom in/out functionality ✅
  - [x] Page navigation ✅

#### Print Implementation
- [x] **Print Functionality** ✅ COMPLETE
  - [x] Browser print dialog integration ✅
  - [x] Print settings (orientation, margins) ✅
  - [x] Multi-page print support ✅
  - [x] Print-specific styling (no borders, white background) ✅
  - [x] Accurate positioning using inches/points ✅

#### PDF Export Enhancement
- [x] **Professional PDF Generation** ✅ COMPLETE
  - [x] Multi-page PDF support with pdfkit ✅
  - [x] Title page with metadata ✅
  - [x] Professional styling with farm branding ✅
  - [x] Contact cards with organized fields ✅
  - [x] Page numbers and proper formatting ✅
  - [x] Column selection support ✅

#### UI Improvements
- [x] **Logo Updates** ✅ COMPLETE
  - [x] Light and dark mode logos ✅
  - [x] Transparent logo for dark mode sidebar ✅
  - [x] Full-width sidebar logo display ✅

**Status:** ✅ **v0.4.0 is COMPLETE** - All critical features implemented and tested

#### ⚠️ **Critical Implementation Notes**
Based on Swift app challenges:

1. **Precise Positioning is Critical**
   - Use CSS for exact label positioning (avoid flexbox/grid for labels)
   - Calculate positions based on label format specs (margins, gaps)
   - Use fixed pixel positioning, not percentages
   - Account for printer margins and DPI differences

2. **Font Rendering**
   - Use web-safe fonts or ensure font loading
   - Test with various font families
   - Implement text scaling for different label sizes
   - Use monospace fonts for consistent spacing

3. **Print-Specific Styling**
   - Separate stylesheet for print media queries
   - Remove borders/backgrounds in print view
   - Ensure white background for labels
   - Use @media print rules

4. **Multi-Page Handling**
   - Pagination logic (labels per page calculation)
   - Generate separate PDF pages for each sheet
   - Handle partial pages correctly
   - Column-major order layout (critical for correct positioning)

5. **Browser Compatibility**
   - Test print functionality across browsers
   - Chrome/Edge: Best print support
   - Firefox: Good support, may need adjustments
   - Safari: May have limitations
   - Provide browser-specific instructions if needed

6. **Address Formatting**
   - Center-align text (as per user preference)
   - Handle long addresses (truncation/wrapping)
   - Proper line breaks
   - PO Box capitalization (user preference)

**Technical Stack:**
- PDF.js or jsPDF for PDF generation
- CSS @media print for print styling
- Canvas API for precise rendering (if needed)
- Print CSS for browser print dialog


**Dependencies:**
- PDF generation library
- Print CSS expertise
- Label format specifications

---

### **v0.5.0 - Google Integration (Sheets, Contacts & Drive)**
**Focus:** Complete Google ecosystem integration for data and document management

#### Google Sheets Sync
- [ ] **Authentication**
  - OAuth 2.0 implementation
  - Token refresh handling
  - Multi-account support
  - Secure credential storage

- [ ] **Data Synchronization**
  - Import from Google Sheets
  - Export to Google Sheets
  - Conflict resolution
  - Sync status indicators
  - Last sync timestamp

- [ ] **Sheet Management**
  - Multiple sheet support
  - Sheet selection UI
  - Column mapping
  - Auto-sync options
  - Sync scheduling

#### Farm Spreadsheet Management
- [ ] **Multi-Farm Support**
  - Farm-specific spreadsheets
  - Separate sync per farm
  - Bulk operations across farms

#### Google Contacts Integration
- [ ] **People API Setup**
  - Enable People API (replaces deprecated Contacts API)
  - OAuth 2.0 with contacts scope
  - Token management and refresh

- [ ] **Import from Google Contacts**
  - Connect Google account
  - One-time import of all contacts
  - Field mapping (Google → FarmTrackr)
  - Duplicate detection during import
  - Import preview and selection

- [ ] **Export to Google Contacts**
  - Export FarmTrackr contacts to Google Contacts
  - Create new Google contacts
  - Update existing contacts (match by email/name)
  - Handle merge conflicts

- [ ] **Bidirectional Sync** (Optional Advanced)
  - Two-way synchronization
  - Conflict resolution UI
  - Sync status dashboard
  - Choose sync direction per contact
  - Automatic sync scheduling

#### Google Calendar Integration
- [ ] **Calendar API Setup**
  - Enable Google Calendar API
  - OAuth 2.0 with calendar scope
  - Token management and refresh

- [ ] **Event Management**
  - Create calendar events for meetings/visits
  - Link events to contacts
  - Event reminders and notifications
  - Recurring events support

- [ ] **Schedule Management**
  - View calendar from FarmTrackr
  - Schedule meetings with contacts
  - Block time for farm visits
  - Calendar sync (two-way)

- [ ] **Activity Integration**
  - Automatically log calendar events as activities
  - Link events to contacts
  - Follow-up reminders from calendar
  - Meeting notes attached to events

#### Google Drive Integration
- [ ] **Drive API Setup**
  - Enable Google Drive API
  - OAuth 2.0 with Drive scope
  - Token management and refresh

- [ ] **File Management**
  - Access files from Google Drive
  - Upload documents to Drive
  - Link Drive files to contacts/documents
  - Organize by folders

- [ ] **Document Storage Integration**
  - Store documents in Google Drive (alternative to Vercel Blob/S3)
  - Sync FarmTrackr documents to Drive
  - Access Drive documents from FarmTrackr
  - File preview for Drive documents

- [ ] **Backup & Sync**
  - Automatic backup to Google Drive
  - Export all data to Drive
  - Restore from Drive backups
  - Version history

- Google Drive: 1 week

**Dependencies:**
- Google Cloud Project setup
- People API enabled
- Google Calendar API enabled
- Google Sheets API enabled
- Google Drive API enabled
- OAuth 2.0 credentials with multiple scopes
- Secure backend for token storage

---

### **v0.5.0 - Google Integration** ✅ COMPLETE
**Focus:** Complete Google ecosystem integration

#### Google OAuth & Authentication
- [x] **OAuth 2.0 Setup** ✅ COMPLETE
  - Google Cloud Console configuration
  - OAuth flow implementation
  - Secure token storage (HTTP-only cookies)
  - Token refresh handling

#### Google Contacts Integration
- [x] **People API Setup** ✅ COMPLETE
  - People API enabled
  - OAuth with contacts.readonly scope
  - Token management
- [x] **Import from Google Contacts** ✅ COMPLETE
  - Connect Google account
  - One-time import of all contacts
  - Field mapping (Google → FarmTrackr)
  - Contact groups/labels imported as tags
  - Duplicate detection during import
- [x] **Google Contacts UI** ✅ COMPLETE
  - Search, filters, and sort
  - Contact list with tags
  - Individual detail pages
  - Consistent design with Farm Contacts

#### Google Sheets Integration
- [x] **Authenticated Import** ✅ COMPLETE
  - Authenticated Google Sheets API
  - Fallback to public CSV
- [x] **Export to CSV** ✅ COMPLETE
  - Mock CSV export (ready for enhancement)

**Status:** ✅ **v0.5.0 is COMPLETE** - Google OAuth and Contacts fully integrated

---

### **v0.6.0 - Commission Tracking Module** ✅ COMPLETE
**Focus:** Commission transaction management and analytics

See `docs/planning/COMMISSION_INTEGRATION.md` for complete integration plan.

#### Phase 1: Foundation ✅ COMPLETE
- [x] Transaction database schema (40+ fields)
- [x] Transaction CRUD API
- [x] Basic transaction list UI
- [x] Add "Commissions" to sidebar
- [x] Transaction detail modal
- [x] Transaction form (create/edit)

#### Phase 2: Analytics ✅ COMPLETE
- [x] Recharts integration
- [x] Commission calculations (GCI, NCI)
- [x] Brokerage-specific calculations (KW/BDH)
- [x] Charts and metrics dashboard
- [x] Smart Insights section (5 insights)
- [x] 6 metric cards with proper formatting

#### Phase 3: Advanced Features ✅ COMPLETE
- [x] Google Sheets sync
- [x] CSV template download
- [x] Import from Google Sheets
- [x] Referral tracking
- [x] Transaction list redesign
- [x] Clickable transaction cards
- [x] Commission breakdown in detail modal

#### Phase 4: UI/UX Improvements 🚧 IN PROGRESS
- [ ] **Rename Commission page/tab** to "Closed Transactions" or "Closed" or "Sold" (better naming)
- [ ] **Fix Desert Holly listing issue** (only 2 sections in checklist, can't move or advance - investigate data integrity)

**Status:** Core features complete, UI improvements in progress 🎉

---

### **v0.7.0 - UI/UX Enhancements & Polish**
**Focus:** User experience improvements and visual refinements

#### Button Interactions
- [ ] **Button Animation System**
  - Click/press animations for all buttons throughout app
  - Visual feedback on button interactions (scale, shadow, etc.)
  - Consistent animation system across all components
  - Enhanced button press states
  - **Hover state for every button** (consistent hover feedback across all interactive elements)

#### Dashboard Redesign
- [x] **Welcome Page Dashboard Improvements** ✅ COMPLETE
  - [x] Combined stats card (Google Contacts, Farm Contacts, Active Farms) ✅
  - [x] 3-column grid layout with proper spacing ✅
  - [x] Calendar card with full calendar view ✅
  - [x] Tasks & Reminders card ✅
  - [x] Better visual hierarchy and information architecture ✅
  - [x] Improved layout with persistent colored sidebars ✅
  - [x] Tightened spacing throughout cards ✅

#### Active Farms Card
- [x] **Elegant Chip Overflow Handling** ✅ COMPLETE
  - [x] Separate Farms card with chip display ✅
  - [x] Better layout for active farms card ✅
  - [x] Responsive chip display ✅
  - Note: Scrollable overflow can be added if needed for many farms

#### Dashboard Quick Actions Redesign
- [x] **Quick Actions Card Layout** ✅ COMPLETE
  - [x] Horizontal layout with icon on left, text left-justified ✅
  - [x] Streamlined action card design ✅
  - [x] Consistent icon and text alignment ✅
  - [x] More compact and efficient use of space ✅
- [x] **Additional Quick Actions** ✅ COMPLETE
  - [x] Add New Transaction (commissions) ✅
  - [x] View Commissions ✅
  - [x] Google Contacts sync ✅
  - [x] Data Quality page ✅
  - [x] Settings/Preferences ✅
  - [x] Import & Export ✅
  - [x] Print Labels ✅
  - [x] Documents ✅
  - [x] Google Sheets ✅
  
#### Sidebar Enhancements
- [x] **Future Features Section** ✅ COMPLETE
  - [x] Add "Coming Soon" tab in sidebar ✅
  - [x] Create Future Features page with roadmap items ✅
  - [x] Feature preview with version numbers ✅
  - [x] Styled feature cards with icons ✅

#### Print Labels Enhancements
- [x] **Additional Print Locations** ✅ COMPLETE
  - [x] Add print labels option in Farm Contacts tab header ✅
  - [x] Add print labels button to Google Contacts page header ✅
  - [x] Quick access to label printing from multiple locations ✅
  - [x] Consistent styling across both pages ✅


---

### **v0.8.0 - Google Integration Suite**
**Focus:** Complete Google ecosystem integration (Gmail, Calendar, Drive) - Google-first approach

**Status:** 📋 Planned - Implementation strategy defined

---

#### **📋 Implementation Strategy Overview**

**Recommended Approach:** Focus on Google ecosystem first, then add Outlook support later (v0.9.0+)

**Why Google-First:**
- Already in Google ecosystem (Sheets, Apps Script)
- Full send/receive capability for Gmail
- Native threading and search
- Free for Google Workspace accounts
- Simpler setup (no Azure registration needed)
- Most real estate agents use Gmail/Google Workspace
- Unified OAuth flow for all Google services
- Consistent API patterns across Gmail, Calendar, Drive

**Architecture:**
```
CRM UI
    ↓
Google Services Layer
    ↓
    ├─→ Gmail API (Email)
    ├─→ Calendar API (Calendar)
    └─→ Drive API (Documents)
```

**Outlook Integration:** Deferred to v0.9.0+ after Google integrations are complete

---

#### **Phase 1: Gmail Integration** - PRIORITY

##### **A. Backend Setup**
- [ ] **Gmail API Setup**
  - Gmail API authentication via Google Apps Script
  - OAuth 2.0 with Gmail scope (built-in)
  - Token management and refresh
  - Create `emails.gs` file in Apps Script
  - Email service layer functions:
    - `sendEmailFromCRM(transactionId, to, subject, body)`
    - `getRecentEmails(query, maxResults)`
    - `logEmailToTransaction(transactionId, emailData)`
- [ ] **Data Structure Setup**
  - Create `Email_Log` sheet with columns:
    - Transaction ID
    - Direction (sent/received)
    - Contact Email
    - Subject
    - Date/Time
    - Body Preview (first 200 chars)
    - Full Body (hidden column)
    - Attachments JSON
    - Thread ID
    - Saved By

##### **B. Frontend UI**
- [ ] **Email Panel in Transaction View**
  - Add "Emails" tab to transaction detail view
  - Email list view (filterable, searchable)
  - Email detail viewer
  - Email compose modal
- [ ] **Email Composer**
  - To/From fields
  - Subject field
  - Rich text editor (HTML)
  - Attach files support
  - "Save to Transaction" checkbox (auto-checked)
  - Quick send from contact records
- [ ] **Email List View**
  - Inbox view with threading
  - Conversation view
  - Email search and filtering
  - Unread count badges
  - Filter by: All, From/To Client, Internal
- [ ] **Email Management**
  - Mark as read/unread
  - Archive, delete, label emails
  - Email threading and conversation view
  - Link emails to contacts and transactions

##### **C. Core Features**
- [ ] **Email Templates**
  - Template library (offer letter, showing confirmation, etc.)
  - Custom email templates
  - Template variables and personalization:
    - Contact name
    - Farm name
    - Transaction address
    - Property details
  - Quick send from contact records
  - **Redesign template interface** (user feedback: "Hate template interface")
- [ ] **Email History & Tracking**
  - Email history linked to contacts
  - Email history linked to transactions
  - Sent email tracking
  - Email thread view by contact
  - Auto-detect client emails (link to contact records)
- [ ] **Smart Features**
  - Auto-suggest transactions when composing
  - Scheduled sends (future enhancement)
  - Attachment handling (save to Google Drive, link to transaction)
  - Email threading (group conversations)
  - Quick replies / canned responses
  - **Email signatures** (customizable signatures for sent emails)
  - **Pictures not showing up in emails** (fix image rendering in email client)
  - **Edit/add labels (tags) and folders/labels** (Gmail label management)
  - **Additional column on left of emails** (similar to Spark setup - folder/label navigation)
  - **Change label on new received emails** (label assignment for incoming emails)
  - **Reduce open space in received emails** (improve email list layout)
  - **Update button not working** (fix email update functionality)
  - **Auto-complete email addresses from contacts** (type-ahead when composing new email)

---

#### **Phase 2: Google Calendar Integration** - After Gmail Backend Setup

- [ ] **Google Calendar API Setup**
  - Enable Google Calendar API in Apps Script
  - OAuth 2.0 with calendar scope (extend existing Gmail OAuth)
  - Calendar service layer functions:
    - `createCalendarEvent(contactId, title, startTime, endTime, location)`
    - `getCalendarEvents(query, timeMin, timeMax)`
    - `updateCalendarEvent(eventId, updates)`
    - `deleteCalendarEvent(eventId)`
    - `syncCalendarEventsToCRM(contactId)`
- [x] **Calendar Event Creation** ✅ COMPLETE
  - Create calendar events from meetings/showings/appointments
  - Link events to contacts and transactions
  - Auto-sync calendar events to CRM activities
  - Two-way sync (CRM → Calendar, Calendar → CRM)
  - **Choose which calendar event is added to** (calendar selection in add event form) ✅
  - **All-day event support** (toggle for all-day events) ✅
  - **Multiple day event support** (date range selection) ✅
- [x] **Calendar UI Integration** ✅ COMPLETE
  - Calendar view in dashboard (enhance existing calendar card)
  - Create event from contact/transaction pages
  - View calendar events linked to contacts
  - Calendar event reminders and notifications
  - **Calendar page header: Fix "Today" button text color in light mode** ✅
  - **Week view: Fit on page in 1 row** ✅
  - **Calendar label colors: Match calendar colors on calendar view** ✅
- [ ] **Event Management**
  - Edit/delete calendar events from CRM
  - Event details viewer (time, location, attendees, description)
  - Recurring events support
  - Event reminders and follow-ups

---

#### **Phase 3: Google Drive Integration** - Complete Google Ecosystem

- [ ] **Google Drive API Setup**
  - Enable Google Drive API in Apps Script
  - OAuth 2.0 with Drive scope (extend existing Google OAuth)
  - Drive service layer functions:
    - `listDriveFiles(folderId, query)`
    - `getDriveFile(fileId)`
    - `createDriveFile(name, content, mimeType)`
    - `updateDriveFile(fileId, content)`
    - `deleteDriveFile(fileId)`
    - `getDriveFileLink(fileId)`
- [ ] **Drive UI Integration**
  - Drive file browser in documents section
  - View/list Drive files from CRM
  - Link Drive documents to contacts/transactions
  - Direct file links (open in Drive)
  - File preview for common formats (PDF, images, etc.)
- [ ] **Document Management**
  - Create documents in Drive from CRM
  - Upload files to Drive
  - Organize files in Drive folders
  - Search Drive files
  - File metadata display (size, modified date, owner)
- [ ] **Google Drive as Primary Storage** 🔴 HIGH PRIORITY
  - **Make app able to use Google Drive as its storage** (alternative to Vercel Blob)
  - Store all documents in Google Drive
  - Use Drive API for file uploads/downloads
  - Integrate Drive storage into document management system

---

#### **Phase 4: Outlook Integration** - DEFERRED TO v0.9.0+

**Status:** Will be implemented after all Google integrations are complete and stable

**Approach:** Will follow similar patterns as Google integrations but use Microsoft Graph API
- Outlook Email Integration
- Outlook Calendar Sync
- Outlook People/Contacts Sync
- Universal abstraction layer for multi-provider support

---

#### **📊 Provider Comparison**

| Feature | Gmail API | Outlook (Graph API) | Winner |
|---------|-----------|---------------------|--------|
| **Setup Complexity** | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐ Moderate | Gmail |
| **Authentication** | Built-in (Apps Script) | OAuth 2.0 (manual) | Gmail |
| **Free Tier** | Unlimited (Workspace) | Unlimited (personal) | Tie |
| **Email Search** | Advanced Gmail queries | OData filters | Gmail |
| **Threading** | Native support | Conversation IDs | Gmail |
| **Attachments** | Easy handling | Base64 encoding needed | Gmail |
| **Read Receipts** | No | Yes | Outlook |
| **Scheduling** | No (3rd party needed) | Yes (with Graph) | Outlook |
| **Corporate Adoption** | Startups, tech | Enterprise, corporate | Outlook |
| **API Stability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Gmail |

---

#### **💾 Data Structure Examples**

**Email_Log Sheet:**
```
| ID | Transaction | Direction | Contact | Subject | Date | Body | Attachments | Thread ID | Provider |
|----|-------------|-----------|---------|---------|------|------|-------------|-----------|----------|
| EM-001 | TXN-123 | sent | buyer@x.com | Offer | 11/4 | ... | offer.pdf | THR-A1 | gmail |
| EM-002 | TXN-123 | received | buyer@x.com | Re: Offer | 11/4 | ... | - | THR-A1 | gmail |
```

**Email_Config Sheet:**
```
| User Email | Provider | Access Token | Refresh Token | Token Expiry | Default From |
|------------|----------|--------------|---------------|--------------|--------------|
| janice@glaab.com | gmail | [encrypted] | [encrypted] | 2025-12-01 | janice@glaab.com |
| dana@glaab.com | outlook | [encrypted] | [encrypted] | 2025-12-01 | dana@glaab.com |
```

**Transaction Master Sheet (add columns):**
```
| ... | Last Email Date | Email Count | Last Email Subject | Provider |
|-----|-----------------|-------------|--------------------|----------|
| ... | 11/4/2025 | 12 | Re: Offer | gmail |
```

---

#### **✅ Implementation Order**

**Recommended Path: Gmail First (Option A)**

1. Set up Gmail API backend functions
2. Build CRM email UI (compose, view, list)
3. Add transaction linking and email log
4. Test with real transactions
5. Add templates and quick actions
6. Mobile optimization and notifications
7. Add abstraction layer (if needed)
8. Add Outlook support (only if requested)

**Alternative Path: Universal from Day 1 (Option B)**

1. Build abstraction layer
2. Implement Gmail connector
3. Implement Outlook connector
4. Test both providers
5. Polish and optimize

**Recommendation:** Start with Option A (Gmail First) because:
- 80% of real estate agents use Gmail
- Faster time to production
- Less complexity upfront
- Easy to add Outlook later (architecture supports it)

---

#### **🎯 Additional Features (Future Enhancements)**

- [ ] **Email Templates Library**
  - Pre-built templates for common scenarios
  - Template variables and personalization
  - Template categories (offers, showings, follow-ups)
- [ ] **Email Analytics**
  - Email open tracking (requires third-party service)
  - Click tracking
  - Response time metrics
- [ ] **Bulk Email Features**
  - Email campaigns
  - Drip campaigns
  - Email automation
- [ ] **Third-Party Email Service Integration** (Optional)
  - SendGrid/Mailgun for branded sending
  - Advanced tracking and analytics
  - Marketing email capabilities
  - Monthly cost: ~$15-30/month


---

### **v0.9.0 - Transaction Pipeline & Advanced Features**
**Focus:** Transaction workflow with task management (Asana-like) and forms integration
**Priority:** Lower priority - can come after email integration

#### Transaction Pipeline
- [ ] **Standard Pipeline Stages** (Initial Implementation)
  - Default stages: Lead → Active → Under Contract → Closed → Cancelled
  - Visual pipeline interface (Kanban-style or list view)
  - Drag-and-drop transaction movement between stages
  - Stage-based filtering and views
  - Pipeline analytics and reporting
  - **Each pipeline stage should be a different color** (color coding for visual distinction)
  - **Make pipeline more usable** (user feedback: "clunky and a little hard to use")
  - **Standardize section tabs above pipeline** (some tabs pushing listing cards down - fix alignment)
- [ ] **Customizable Pipeline** (Future Enhancement)
  - User ability to customize stage names
  - Add/remove stages
  - Define stage order
  - Stage color coding
- [ ] **Pipeline Integration**
  - Link transactions to contacts
  - Track transactions through workflow stages
  - Stage-based notifications and reminders
  - Pipeline dashboard view
  - **Create tasks from pipeline and attach to listing** (task creation directly from pipeline view)

#### Task Management for Pipeline (Asana-like)
- [ ] **Stage-Specific Tasks**
  - Define typical tasks for each pipeline stage
  - Define substage tasks (tasks within a stage)
  - Task templates per stage
  - Automatic task creation when transaction moves to stage
- [ ] **Task Assignment & Tracking**
  - Assign tasks to transactions
  - Task due dates and priorities
  - Task completion tracking
  - Task checklist items
  - Task comments and notes
- [ ] **Forms Needed Per Stage**
  - Define forms/document types needed for each stage
  - Form checklist per transaction
  - Mark forms as complete/incomplete
  - Link forms to transaction pipeline stage
  - Integration with ZipForms/DocuSign/CAR forms

#### Transaction Type: Lease
- [ ] **Lease Transaction Support**
  - Add "Lease" option to transaction types
  - Lease-specific fields (lease terms, monthly rent, etc.)
  - Lease commission calculations
  - Lease duration and renewal tracking

#### Document Form Integration
- [ ] **ZipForms/DocuSign Integration**
  - Connect to ZipForms API
  - Connect to DocuSign API
  - Generate forms from templates
  - Electronic signature workflows
  - Form tracking and completion status
  - Forms linked to pipeline stages
- [ ] **CAR Forms Integration**
  - California Association of Realtors forms
  - Form library access
  - Form generation and filling
  - Integration with transaction pipeline
  - Stage-specific form requirements


---

### **v0.10.0 - Task Management & Reminders**
**Focus:** Task system with calendar integration

#### Task & Reminders System
- [ ] **Task Management**
  - Create, edit, delete tasks
  - Task priorities and due dates
  - Task categories and tags
  - Task search and filtering
- [ ] **Apple Reminders Sync**
  - Connect to Apple Reminders
  - Two-way sync with Reminders app
  - Task creation from contacts/transactions
  - Reminder notifications
- [ ] **Task Linking**
  - Link tasks to contacts
  - Link tasks to transactions
  - Link tasks to pipeline stages
  - Context-aware task creation
- [ ] **Task Pipeline Integration**
  - Tasks associated with transaction stages
  - Automated task creation from pipeline
  - Task completion tracking


---

### **v0.11.0 - Personalization & Security**
**Focus:** Single-user authentication and personalization (toward end of roadmap)
**Priority:** Can wait - implement toward the end before v1.0.0

#### Authentication & Security (Single User)
- [ ] **User Authentication System**
  - Single-user password protection
  - Sign in to app for security
  - User account and profile
  - Password management (change, reset)
  - Session management (auto-logout, remember me)
  - Secure session storage
- [ ] **Basic Security Features**
  - Password encryption
  - Session tokens
  - Basic access control (lock app when signed out)
  - User activity logging (optional)

#### Personalization (Requires User Account)
- [ ] **Personal Logo Import**
  - Upload custom logo (requires authentication)
  - Logo customization options
  - Logo placement and sizing
  - Replace default FarmTrackr logo
- [ ] **App Branding**
  - Custom color schemes
  - Brand color customization
  - Theme personalization beyond light/dark
  - Customizable app appearance
  - Save preferences to user account
- [ ] **Personalization Options**
  - Dashboard layout customization
  - Feature visibility toggles
  - Custom navigation preferences
  - Saved preferences per user account
  - Export/import personalization settings

#### Future: Multi-User Support (v1.1.0+)
- [ ] **Multi-User Support** (Post v1.0.0)
  - Multiple user accounts
  - User roles and permissions
  - Shared workspace management
  - Team collaboration features

 (single user auth + personalization)

---

### **v0.12.0 - Enhanced Export & Google Contacts**
**Focus:** Export improvements and Google Contacts enhancements

#### Export Enhancements
- [ ] **Transaction Export Column Selection**
  - Column selection UI for transaction exports
  - Similar to contacts export column selection
  - Choose which transaction fields to export
  - Save column preferences for future exports

#### Google Contacts Enhancements
- [ ] **Google Contact Tag Colors**
  - Different colored chips for Google contact tags
  - Custom tag color assignment
  - Visual tag organization
  - Color-coded tag filtering
- [ ] **Google Contacts Page UI Improvements**
  - **Remove total contacts card** (already shows below - redundant)
  - **Move last synced and connection info** to where contact type picker is
  - **Move contact type picker left-justified** (reposition picker)
  - **Streamline search and sort card** (improve layout and spacing)


---

### **Future: Advanced Features**
**Focus:** Additional CRM capabilities

#### Batch Operations ✅ COMPLETE
- [x] **Bulk Actions** ✅
  - Multi-select contacts ✅
  - Bulk edit (farm, notes, etc.) ✅
  - Bulk delete with confirmation ✅
  - Bulk export ✅
  - Bulk import updates ✅

### **v0.4.1 - Farm Dropdown & Settings Enhancement** ✅ COMPLETE
**Focus:** Improved farm selection and settings personalization

#### Farm Management
- [x] **Farm Field Dropdown** ✅ COMPLETE
  - Converted farm input to dropdown populated from existing contacts
  - Automatic farm normalization and deduplication
  - Sorted alphabetically for easy selection
  - Prevents typos and ensures consistency

#### Settings Enhancement
- [x] **Personalization Settings** ✅ COMPLETE
  - Updated "Farm Name" to "Agent Name" for welcome screen
  - Updated "Default Farm" to "Brokerage Name" for welcome screen
  - Added helpful descriptions for future welcome screen usage
  - Prepared for future personalization features

#### Documentation
- [x] **Future Architecture Documentation** ✅ COMPLETE
  - Created comprehensive architecture document
  - Documented dual contact list system vision
  - Documented Transaction Coordinator module plan
  - Added zipForm integration research and options

**Status:** ✅ **v0.4.1 is COMPLETE** - Farm dropdown and settings enhancements ready for use

---

### **v0.4.2 - Document Management** ✅ COMPLETE
**Focus:** Complete document CRUD and file management

#### Document Management Core
- [x] **Document CRUD API** ✅ COMPLETE
  - [x] GET/POST /api/documents ✅
  - [x] GET/PUT/DELETE /api/documents/[id] ✅
  - [x] Database schema (Prisma) ✅
  - [x] Search and filter support ✅

- [x] **Document Management UI** ✅ COMPLETE
  - [x] Document list page with search/filter ✅
  - [x] API integration ✅
  - [x] Create document modal ✅
  - [x] Edit document functionality ✅
  - [x] Delete with confirmation ✅
  - [x] Document type categorization ✅

#### Document Storage
- [x] **File Upload & Storage** ✅ COMPLETE
  - [x] File upload API (Vercel Blob) ✅
  - [x] Document association with contacts (schema ready) ✅
  - [x] Document organization by type ✅
  - [x] Document preview modal ✅
  - [x] Document download ✅
  - [x] File size validation in UI ✅
  - [x] Supported file types (.txt, .pdf, .doc, .docx, .html) ✅

**Status:** ✅ **v0.4.2 is COMPLETE** - Full document management with file upload

---

### Future: Data Accuracy & Address Validation (Planned)
**Focus:** Validate/normalize addresses and score person-to-address confidence

#### Provider Evaluation
- [ ] Google Maps Geocoding
  - Strengths: global coverage, strong geocoding + reverse geocoding, easy setup
  - Limits/Pricing: pay-as-you-go; free monthly credits, beyond that billed per request
  - Reliability: very high for locating and normalizing addresses; not USPS-certified deliverability
- [ ] Smarty (US-focused)
  - Strengths: USPS CASS Certified, DPV deliverability codes, high-fidelity US address standardization
  - Limits/Pricing: generous free tier for basic lookups; paid tiers for DPV/NCOA; US-centric
  - Reliability: excellent for US mailing deliverability and normalization

#### Scope
- [ ] Address normalization & geocoding on import and edit
- [ ] Store formatted address + lat/lng
- [ ] Person-to-address confidence score (name/address/farm-geo consistency)
- [ ] Duplicate/mismatch surfacing (fuzzy name + street comparisons)
- [ ] Data Quality dashboard with suggested fixes

#### Dependencies
- API keys (Google or Smarty)
- Backend endpoints to validate/normalize addresses
- DB fields for lat/lng and normalized address


---

### **v1.0.0 - Production Ready**
**Focus:** Polish, performance, and production deployment

#### Performance Optimization
- [ ] **Performance Improvements**
  - Database query optimization
  - Caching strategies
  - Lazy loading
  - Pagination for large datasets
  - Image optimization

#### Testing
- [ ] **Test Suite**
  - Unit tests for core functionality
  - Integration tests for API
  - E2E tests for critical flows
  - Label printing specific tests
  - Cross-browser testing

#### Security
- [ ] **Security Enhancements**
  - Authentication system
  - Authorization (roles/permissions)
  - Input sanitization
  - XSS protection
  - CSRF protection
  - Rate limiting

#### Documentation
- [ ] **Documentation**
  - User manual
  - API documentation
  - Deployment guide
  - Troubleshooting guide
  - Label printing guide

#### Deployment
- [ ] **Production Deployment**
  - Production database setup
  - CDN for static assets
  - Monitoring and logging
  - Error tracking
  - Backup automation


---

## 📊 Feature Comparison Matrix (UPDATED)

| Feature | Swift App | Web App Status | Priority | Notes |
|---------|-----------|----------------|----------|-------|
| Contact CRUD | ✅ Complete | ✅ Complete | ✅ Done | Fully verified |
| Search & Filter | ✅ Complete | ✅ Complete | ✅ Done | Basic search/filter working |
| CSV Import | ✅ Complete | ✅ Complete | ✅ Done | Workflow verified via `/import-export` |
| Excel Import | ✅ Complete | ✅ Complete | ✅ Done | Workflow verified via `/import-export` |
| CSV Export | ✅ Complete | ✅ Complete | ✅ Done | Full implementation verified |
| Excel Export | ✅ Complete | ✅ Complete | ✅ Done | Full implementation verified |
| JSON Export | ✅ Complete | ✅ Complete | ✅ Done | API implemented |
| PDF Export | ✅ Complete | ✅ Complete | ✅ Done | Professional PDF with pdfkit |
| **Label Printing** | ⚠️ Had Issues | ✅ Complete | ✅ Done | Fully implemented with preview |
| Duplicate Detection | ✅ Complete | ✅ Complete | ✅ Done | Full UI + API verified |
| Data Validation | ✅ Complete | ✅ Complete | ✅ Done | Validation + cleanup UI working |
| Data Quality UI | ✅ Complete | ✅ Complete | ✅ Done | Full page with tabs implemented |
| Google Sheets Sync | 🟡 Partial | 🟡 Partial | 🟡 Medium | OAuth needed |
| Google Contacts Integration | ❌ Not Started | ❌ Not Started | 🟡 Medium | People API + OAuth |
| Google Calendar Integration | ❌ Not Started | ❌ Not Started | 🟡 Medium | Calendar API + OAuth |
| Google Drive Integration | ❌ Not Started | ❌ Not Started | 🟡 Medium | Drive API + OAuth |
| Import Templates | ✅ Complete | ❌ Not Started | 🟡 Medium | Future enhancement |
| Document Management | ✅ Complete | ✅ Complete | ✅ Done | CRUD + file upload live on `/documents` |
| Batch Operations | ✅ Complete | ✅ Complete | ✅ Done | Multi-select + bulk actions implemented |
| Theme System | ✅ Complete | ✅ Complete | ✅ Done | Light/Dark/System working |
| Database Integration | ✅ Core Data | ✅ PostgreSQL + Prisma | ✅ Done | Production ready |
| Advanced Search | ✅ Complete | ❌ Not Started | 🟡 Medium | Basic search sufficient for now |

**Legend:**
- ✅ Complete
- 🟡 Partial/In Progress
- ❌ Not Started
- ⚠️ Had Issues/Needs Extra Attention

---

## 🎯 Priority Focus Areas

### Critical Priority (Must Have)
1. ~~**Label Printing**~~ - ✅ COMPLETE - Successfully implemented
2. ~~**CSV/Excel Import UI Verification**~~ - ✅ COMPLETE
3. ~~**Duplicate Detection**~~ - ✅ COMPLETE
4. ~~**Database Integration**~~ - ✅ COMPLETE
5. ~~**Document Management UI**~~ - ✅ COMPLETE

### High Priority (Important)
1. **Data Validation** - Prevent bad data entry
2. **Advanced Search** - Improve usability
3. **Batch Operations** - Efficiency for large datasets

### Medium Priority (Nice to Have)
1. **Excel Import/Export** - Additional format support
2. **Google Sheets Full Integration** - Enhanced sync
3. **Google Contacts Integration** - Import/export contacts
4. **Google Calendar Integration** - Schedule meetings/visits
5. **Google Drive Integration** - Document storage and file management
6. **Document Management** - File organization
7. **Import Templates** - Reusability

---

## 🔧 Technical Considerations

### Label Printing Specific Challenges

**From Swift App Experience:**
1. **Precise Positioning**: Labels must align exactly with Avery template dimensions
2. **Font Rendering**: Fonts may render differently in print vs screen
3. **Multi-Page Handling**: Correct pagination for large contact lists
4. **Browser Compatibility**: Print functionality varies by browser
5. **DPI Differences**: Printer DPI vs screen DPI differences

**Recommended Approach:**
- Use CSS @page rules for print margins
- Calculate label positions in pixels based on DPI (72 DPI for screen, 300 DPI for print)
- Test extensively with actual Avery label sheets
- Provide print preview before actual printing
- Generate PDF for consistent results across browsers

---

## 📅 Milestone Schedule

| Version | Target Date | Key Deliverables |
|---------|-------------|------------------|
| Version | Status | Key Deliverables |
|---------|--------|------------------|
| v0.2.0 | ✅ Complete | Database + Import System |
| v0.3.0 | ✅ Complete | Export + Data Quality |
| v0.4.0 | ✅ Complete | **Label Printing & PDF Export** |
| v0.4.1 | ✅ Complete | **Farm Dropdown & Settings Enhancement** |
| v0.4.2 | ✅ Complete | Document Management |
| v0.5.0 | ✅ Complete | Google Integration (Sheets, Contacts) |
| v0.6.0 | ✅ Complete | Commission Tracking Module |
| v0.7.0 | 📋 Planned | UI/UX Enhancements & Polish |
| v0.8.0 | 📋 Planned | Email & Communication Integration |
| v0.9.0 | 📋 Planned | Transaction Pipeline & Advanced Features |
| v0.10.0 | 📋 Planned | Task Management & Reminders |
| v0.11.0 | 📋 Planned | Personalization & Security |
| v0.12.0 | 📋 Planned | Enhanced Export & Google Contacts |
| v1.0.0 | 📋 Planned | Production Release |

---

## 📝 Notes

- **Label Printing is marked as Critical Priority** due to implementation challenges in the Swift app
- Extra development time allocated for v0.4.0 to ensure proper testing and refinement
- Database integration (v0.2.0) is foundational and should be completed before other features
- Consider user feedback from Swift app when implementing label printing
- Browser print capabilities vary - may need browser-specific implementations

---

## 🔄 Roadmap Maintenance

This roadmap should be reviewed and updated:
- After each version release
- When priorities change
- When technical challenges are discovered
- Quarterly for strategic planning


---

## 🎯 Immediate Next Steps (Updated November 15, 2025)

### Priority 1: Gmail/Email Integration (v0.8.0)
**Status:** UI and API scaffolding complete; needs live Gmail connector.

**Next Actions:**
1. Implement OAuth + token storage for Gmail (send + read scopes).
2. Wire `/api/emails/*` routes to real Gmail data instead of stubs.
3. Finish template management (persisted templates + editor polish).
4. Add delete/archive/label actions backed by Gmail.

### Priority 2: Google Sheets OAuth Completion (v0.5.0 follow-up)
**Status:** Import/export flows functional in UI; blocked on auth.

**Next Actions:**
1. Finalize Google Cloud credentials and server-side token storage.
2. Connect `/api/google-sheets/import|export` to authenticated client.
3. Add sync status indicators + error reporting on `/google-sheets`.

### Priority 3: Transaction Pipeline UI (v0.9.0)
**Status:** Transactions + analytics exist; pipeline view not started.

**Next Actions:**
1. Design Kanban list grouped by stage using existing transaction data.
2. Enable drag/drop stage changes with optimistic updates.
3. Expose stage-specific task templates (prep for task system).

### Priority 4: Task & Reminders Foundations (v0.10.0)
**Status:** Listing tasks exist but no global task module.

**Next Actions:**
1. Standalone `/tasks` page listing per-contact/per-transaction tasks.
2. Hook calendar events to task reminders to prep for Apple Reminders sync.
3. Define schema for recurring reminders ahead of external sync work.

### Priority 5: Theme Flash Fix (Technical Debt)
**Status:** Known Issue ⚠️

**Issue:** Theme switches dark→light on refresh when set to System
**Priority:** Low (doesn't affect functionality)

---

## 📊 Version Summary

| Version | Status | Key Features |
|---------|--------|--------------|
| v0.2.0 | ✅ Complete | Database, Basic CRUD |
| v0.3.0 | ✅ Complete | Export, Data Quality |
| v0.4.0 | ✅ Complete | Label Printing, PDF Export |
| v0.4.1 | ✅ Complete | Farm Dropdown, Settings Enhancement |
| v0.4.2 | ✅ Complete | Document Management UI |
| v0.5.0 | ✅ Complete | Google OAuth, Contacts Integration |
| v0.6.0 | ✅ Complete | Commission Tracking Module |
| v0.7.0 | 📋 Planned | UI/UX Enhancements & Polish |
| v0.8.0 | 📋 Planned | Email & Communication Integration |
| v0.9.0 | 📋 Planned | Transaction Pipeline & Advanced Features |
| v0.10.0 | 📋 Planned | Task Management & Reminders |
| v0.11.0 | 📋 Planned | Personalization & Security |
| v0.12.0 | 📋 Planned | Enhanced Export & Google Contacts |
| v1.0.0 | 📋 Planned | Production Release |

---

## 🎯 **IMMEDIATE NEXT STEPS** (Recommended Priority Order)

### **1. 📊 Commission Tracking Module (v0.6.0)** ✅ COMPLETE
**Status:** All features integrated and working!  
**See:** `docs/planning/COMMISSION_INTEGRATION.md`

✅ **All Phases Complete:**
- Transaction database schema (40+ fields) ✅
- Transaction CRUD API ✅
- Basic transaction list UI ✅
- Analytics with Recharts ✅
- Commission calculations (GCI, NCI) ✅
- Smart Insights section ✅
- Google Sheets sync ✅
- CSV template download ✅
- Transaction detail modal ✅
- Clickable transaction cards ✅

---

### **2. 🎨 UI/UX Enhancements (v0.7.0)** 🚧 NEXT PRIORITY
**Status:** Ready to implement

**Immediate Tasks:**
- ✅ Button click animations (partially done - commissions page has it)
- ✅ Dashboard redesign (combine cards, expand active farms) - COMPLETE
- ✅ Active farms card elegant overflow handling - COMPLETE
- ✅ Dashboard Quick Actions: icon on left, text left-justified (horizontal layout) - COMPLETE
- ✅ Add suggested quick actions (Add Transaction, View Commissions, Data Quality, Google Contacts, etc.) - COMPLETE
- ✅ Future features section in sidebar - COMPLETE
- ✅ Print labels in Farm Contacts tab and Google Contacts chips - COMPLETE

**Estimated Time:** 1-2 weeks

---

### **3. 🔄 Export & Google Contacts Enhancements (v0.12.0)**
**Status:** Quick wins

**Tasks:**
- Transaction export column selection
- Google contact tag colors
- Print labels from Google Contacts


---

### **4. 📧 Email Integration (v0.8.0)** - PRIORITY
**Status:** High value feature - Gmail first, full client

**Tasks:**
- Gmail API integration (priority)
- Full email client: send AND receive emails
- Email templates and history
- Link emails to contacts/transactions
- Outlook integration (after Gmail)


---

### **5. 🔄 Transaction Pipeline (v0.9.0)** - LOWER PRIORITY
**Status:** Important workflow feature - can come later

**Tasks:**
- Standard pipeline stages (customizable later)
- Asana-like task management per stage
- Forms needed per stage tracking
- Visual pipeline interface (Kanban/list view)
- ZipForms/DocuSign/CAR forms integration
- Lease transaction type


---

### **6. ✅ Task Management (v0.10.0)**
**Status:** Productivity enhancement

**Tasks:**
- Task management system
- Apple Reminders sync
- Link tasks to contacts and transactions
- Pipeline integration


---

### **7. 🔐 Security & Personalization (v0.11.0)** - TOWARD END
**Status:** Can wait - implement toward end, before v1.0.0

**Tasks:**
- Single-user authentication (password protection)
- Personal logo import (requires user account)
- App personalization (requires user account)
- Custom branding
- Save preferences to user account

 (single user auth + personalization)

---

### **8. 🔧 Polish & Testing**
**Status:** Ongoing refinement

**Tasks:**
- End-to-end testing of all features
- UX refinements based on usage
- Performance optimization
- Mobile responsiveness improvements
- Accessibility enhancements


---

### **9. 🌟 Advanced Features**
**Lower Priority but Valuable:**
- Advanced Search/Filter (filter builder, saved searches)
- Import Templates (save/reuse field mappings)
- Goal tracking and projections (for commissions)
- Year-over-year comparisons
- Commission forecasting


---

## 📝 **COMPLETION SUMMARY**

### ✅ Fully Complete Versions
- **v0.2.0** - Data Persistence & Basic CRUD
- **v0.3.0** - Export & Data Quality Tools
- **v0.4.0** - Label Printing & PDF Export
- **v0.4.1** - Farm Dropdown & Settings Enhancement
- **v0.4.2** - Document Management
- **v0.5.0** - Google OAuth & Contacts Integration

### 🚧 In Planning
- **v0.6.0** - Commission Tracking Module (integration plan created)

### 📋 Future Versions
- **v1.0.0** - Production Release (polish, performance, testing)

**Current Focus:** v0.6.0 Commission Tracking Module integration

---

## 📊 **Progress Summary**

**Current Status:**
- ✅ **v0.2.0 (Data Persistence)** - COMPLETE
- ✅ **v0.3.0 (Export & Data Quality)** - COMPLETE
- ✅ **v0.4.0 (Label Printing & PDF)** - COMPLETE
- ✅ **v0.4.1 (Farm Dropdown & Settings)** - COMPLETE
- ✅ **v0.4.2 (Document Management)** - COMPLETE
- ✅ **v0.5.0 (Google Integration)** - COMPLETE
- ✅ **v0.6.0 (Commission Tracking)** - COMPLETE
- 🎯 **Next: Production Polish & Testing**

**Completion Rate:**
- Core Features: ~95% complete
- Google Integration: Complete (OAuth, Contacts, Sheets)
- Document Management: Complete with file upload
- Commission Tracking: Complete with all analytics

**Recommendation:** Focus on UI/UX polish, testing, and preparing for v1.0.0 production release.

## 🎨 UI/UX Enhancements & Refinements (Ongoing)

### High Impact (Near-Term)
- Navigation polish
  - Reduce sidebar paddings/margins where sensible (logo done; review list items)
  - Improve active/hover states for all nav links (consistent color/contrast)
  - Add keyboard focus outlines for accessibility
- Tables and lists
  - Sticky headers on long lists (Contacts, Documents)
  - Row hover states and larger hit targets
  - Empty states with clear calls-to-action
- Forms
  - Consistent field spacing, label alignment, and helper text
  - Inline validation with clear error messages
  - Save/Cancel button placement consistency
- Feedback and status
  - Non-blocking toasts/snackbars for success/error states
  - Loading states and skeletons for key pages
  - Progress indicators for long-running tasks (imports, exports)
- Theme fidelity
  - Resolve dark→light flash on refresh (system theme)
  - Ensure brand colors meet contrast ratios in both themes

### Medium Impact
- Typography
  - Standardize font sizes/weights for headings, body, captions
  - Tighten line-heights where content is dense
- Spacing system
  - Audit paddings/margins to an 8px scale across pages
- Icons and actions
  - Consistent icon sizes (16/20/24) and placement
  - Confirm destructive actions with clear labels and secondary text
- Motion
  - Subtle transitions for expand/collapse, modals, and inline edits

### Longer-Term
- Accessibility
  - Full keyboard navigation coverage and visible focus management
  - ARIA roles/labels where needed
  - Color contrast audits for all interactive elements
- Responsiveness
  - Mobile-first tweaks for Contacts, Documents, and Settings
  - Touch target sizes at least 44px

### Measurement
- Add lightweight telemetry hooks (client-only) for page load timing and error capture
- Capture click-through on critical actions (print, export, import) to prioritize polish

---
