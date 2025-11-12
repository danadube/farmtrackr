# FarmTrackr - Technical Documentation

**Version:** 0.6.0  
**Last Updated:** October 31, 2025  
**Author:** FarmTrackr Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Key Features](#key-features)
5. [Commission Tracking System](#commission-tracking-system)
6. [Google Integration](#google-integration)
7. [API & Service Layer](#api--service-layer)
8. [Database Schema](#database-schema)
9. [Security & Authentication](#security--authentication)
10. [Deployment](#deployment)
11. [Development Guide](#development-guide)

---

## Overview

FarmTrackr is a comprehensive farm CRM (Customer Relationship Management) and commission tracking system built for real estate professionals managing farm properties. The application combines farm contact management, document handling, and real estate commission tracking in a single modern web platform.

### Key Capabilities

- **Farm Contact Management**: Organize and manage contacts across multiple farm properties
- **Commission Tracking**: Track real estate transactions with automated commission calculations
- **Google Integration**: Two-way sync with Google Sheets and Google Contacts
- **Document Management**: Upload, organize, and manage documents with Google Drive backup
- **Analytics Dashboard**: Visual insights with charts and performance metrics
- **Label Printing**: Avery-compatible address label printing
- **Data Quality Tools**: Duplicate detection and data validation

---

## Architecture

### Tech Stack

**Frontend:**
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.3.0 with custom design system
- **UI Components:** Lucide React icons, Recharts for analytics
- **State Management:** React hooks (useState, useMemo, useEffect)

**Backend:**
- **Runtime:** Node.js on Vercel serverless
- **Database:** PostgreSQL via Prisma ORM 6.18.0
- **API:** Next.js API Routes (RESTful)
- **Authentication:** Google OAuth 2.0

**Deployment:**
- **Platform:** Vercel
- **Database:** Vercel Postgres (production), SQLite (development)
- **File Storage:** Vercel Blob Storage
- **Region:** IAD1 (US East)

### Application Structure

```
farmtrackr-web/
├── public/
│   ├── images/           # Logo assets, templates
│   ├── templates/        # CSV templates for imports
│   └── favicon.png       # App icon
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Dashboard
│   │   ├── contacts/     # Contact management pages
│   │   ├── commissions/  # Commission tracking pages
│   │   ├── documents/    # Document management
│   │   ├── import-export/# Import/export functionality
│   │   ├── print-labels/ # Label printing
│   │   ├── settings/     # Settings page
│   │   ├── api/          # API routes
│   │   │   ├── contacts/ # Contact CRUD endpoints
│   │   │   ├── transactions/ # Transaction endpoints
│   │   │   ├── documents/    # Document endpoints
│   │   │   ├── google-contacts/ # Google Contacts API
│   │   │   └── google-sheets/   # Google Sheets API
│   │   └── layout.tsx    # Root layout with Sidebar
│   ├── components/       # React components
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   ├── ContactForm.tsx       # Contact create/edit form
│   │   ├── TransactionForm.tsx   # Transaction create/edit form
│   │   ├── Footer.tsx            # App footer
│   │   └── ThemeProvider.tsx     # Theme context
│   ├── lib/              # Utility libraries
│   │   ├── prisma.ts     # Prisma client singleton
│   │   ├── googleAuth.ts # Google OAuth helpers
│   │   ├── commissionCalculations.ts # Commission math
│   │   ├── dataQuality.ts # Duplicate detection
│   │   ├── address.ts    # Address normalization
│   │   └── theme.ts      # Theme system
│   ├── hooks/            # Custom React hooks
│   │   └── useThemeStyles.ts # Theme-aware styling
│   └── types/            # TypeScript definitions
│       └── index.ts      # Shared types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
├── docs/                 # Documentation
└── scripts/              # Import/seed scripts
```

### Key Design Patterns

1. **App Router Architecture:** All routes use Next.js App Router with server and client components
2. **Server-Side Data Fetching:** API routes handle all database operations
3. **Client-Side State:** React hooks manage UI state and form data
4. **Service Layer:** Business logic abstracted to utility libraries
5. **Type Safety:** Full TypeScript coverage with strict null checks
6. **Theme System:** Context-based theming with light/dark/system modes
7. **Responsive Design:** Mobile-first approach with Tailwind breakpoints

---

## Data Models

### FarmContact

Represents a contact associated with a farm property.

**Fields:**
- `id` (String, CUID) - Unique identifier
- `firstName` (String?) - Contact first name
- `lastName` (String?) - Contact last name
- `organizationName` (String?) - Business/trust/organization name
- `farm` (String?) - Farm name (dropdown from existing farms)
- `mailingAddress` (String?) - Mailing address
- `city`, `state`, `zipCode` (String?) - Location fields
- `email1`, `email2` (String?) - Email addresses
- `phoneNumber1-6` (String?) - Phone numbers
- `siteMailingAddress`, `siteCity`, `siteState`, `siteZipCode` (String?) - Site address
- `notes` (String?) - Additional notes
- `dateCreated`, `dateModified` (DateTime) - Timestamps

**Validation Rules:**
- At least `firstName`/`lastName` OR `organizationName` required
- Email format validation
- Phone number formatting: (XXX) XXX-XXXX
- ZIP code: 5-digit US format

### GeneralContact

Represents a contact from Google Contacts or other sources.

**Fields:**
- All `FarmContact` fields, plus:
- `tags` (String[]) - Multi-select tags (e.g., "buyer", "seller", "realtor")
- `googleContactsId` (String?) - Google Contacts resource ID for syncing

### Transaction

Represents a real estate transaction with commission details.

**Fields:**
- **Basic Info:** `propertyType`, `clientType`, `transactionType`, `source`, `address`, `city`
- **Pricing:** `listPrice`, `closedPrice`, `listDate`, `closingDate`, `status`
- **Referral:** `referringAgent`, `referralFeeReceived`
- **Commission:** `brokerage`, `commissionPct`, `referralPct`, `referralDollar`, `netVolume`
- **KW-Specific:** `eo`, `royalty`, `companyDollar`, `hoaTransfer`, `homeWarranty`, `kwCares`, `kwNextGen`, `boldScholarship`, `tcConcierge`, `jelmbergTeam`
- **BDH-Specific:** `bdhSplitPct`, `asf`, `foundation10`, `adminFee`, `preSplitDeduction`
- **Universal:** `otherDeductions`, `buyersAgentSplit`, `assistantBonus`
- **Sync:** `googleSheetsId` (String?) - Row ID for Google Sheets
- **Timestamps:** `createdAt`, `updatedAt` (DateTime)

**Key Differences from Standalone App:**
- Calculated fields (GCI, NCI, etc.) are **computed on-demand**, not stored
- Database uses Prisma with PostgreSQL instead of localStorage
- All dates stored as DateTime, not strings

### Document

Represents uploaded documents and templates.

**Fields:**
- `id` (String, CUID) - Unique identifier
- `title` (String) - Document title
- `description` (String?) - Optional description
- `type` (String?) - 'template', 'contact', 'report', or null
- `content` (String?) - Text content
- `fileUrl` (String?) - Vercel Blob URL for files
- `contactId` (String?) - Optional link to contact
- `createdAt`, `updatedAt` (DateTime)

### LetterTemplate, Letterhead, Signature

Letter generation system models (detailed in FUTURE_ARCHITECTURE.md).

---

## Key Features

### 1. Contact Management

**CRUD Operations:**
- Create, read, update, delete farm contacts
- Comprehensive contact form with 20+ fields
- Site address vs mailing address support
- Multi-phone and multi-email support

**Search & Filtering:**
- Real-time search by name, farm, email, city
- Farm filter dropdown (normalized names)
- State filter
- Search across multiple fields simultaneously

**Data Quality:**
- Duplicate detection (name, email, phone matching)
- Data validation (email format, ZIP codes)
- Quality scoring
- Cleanup tools

### 2. Commission Tracking

**Transaction Types:**
- **Sale:** Regular property sale
- **Referral $ Received:** You refer to another agent (flat fee)
- **Referral $ Paid:** Another agent refers to you (calculated)

**Brokerage Support:**
- **Keller Williams (KW):** Royalty (6%), Company Dollar (10%), E&O, HOA Transfer, etc.
- **Bennion Deville Homes (BDH):** Pre-split deduction (6%), ASF, Foundation 10, Admin Fee

**Automated Calculations:**
- GCI (Gross Commission Income)
- Adjusted GCI (after referrals)
- Total Brokerage Fees (brokerage-specific)
- NCI (Net Commission Income)
- Bidirectional calculations (GCI ↔ Commission %, Referral $ ↔ Referral %)

**Analytics:**
- 6 metric cards: GCI, NCI, Volume, Avg Deal, Referrals Paid/Received
- 4 charts: Monthly Income Trend, Transactions by Month, Client Type Distribution, Income by Brokerage
- 5 smart insights: Best Month, Top Property Type, Avg Days to Close, Stronger Side, Biggest Deal
- Real-time filtering and aggregation

### 3. Google Integration

**Google OAuth 2.0:**
- OAuth consent screen configuration
- Token storage in HTTP-only cookies
- Automatic token refresh
- Scope management

**Google Contacts:**
- Import all Google Contacts
- Map Google groups to tags
- Duplicate detection during import
- Field mapping wizard

**Google Sheets:**
- **Transactions:** Two-way sync with commission tracking sheet
- **Farm Data:** Import farm contact spreadsheets (11 farms configured)
- Authenticated read/write operations
- Fallback to public CSV when unauthenticated

### 4. Import/Export

**Import Formats:**
- **CSV:** Contacts, transactions
- **Excel (.xlsx):** Full spreadsheet support
- **Google Sheets:** Direct OAuth import

**Export Formats:**
- **CSV:** All data tables
- **Excel (.xlsx):** Formatted spreadsheets
- **JSON:** API data dump
- **PDF:** Contact directory, transaction reports

**Features:**
- Field mapping and validation
- Duplicate handling
- Template downloads
- Column selection

### 5. Label Printing

**Avery Format Support:**
- Avery 5160 (1" x 2.625") - 30 labels per sheet
- Avery 5161, 5162, 5163, 5164, 5167

**Features:**
- Column-major order layout
- Precise label positioning
- Font selection (System, Times, Arial, Courier)
- Address type selection (mailing vs site)
- Multi-page preview
- Print-ready HTML generation

**Technical Implementation:**
- Fixed-pixel positioning (no flexbox/grid for labels)
- CSS @media print rules
- Text wrapping and truncation
- Accurate DPI handling

### 6. Document Management

**CRUD Operations:**
- Create, read, update, delete documents
- Type categorization (template, contact, report)
- Full-text search

**File Upload:**
- Supported formats: .txt, .pdf, .doc, .docx, .html
- Max size: 10MB per file
- Vercel Blob Storage
- Download and preview

---

## Commission Tracking System

### Calculation Flow

The `calculateCommission()` function in `src/lib/commissionCalculations.ts` handles all commission math.

#### 1. Regular Sale Transaction

```javascript
// GCI = Closed Price × Commission %
// Note: commissionPct stored as decimal (0.03 = 3%)
GCI = closedPrice * commissionPct

// Referral $ = GCI × Referral %
// Note: referralPct stored as decimal (0.25 = 25%)
referralDollar = GCI * referralPct

// Adjusted GCI = GCI - Referral $
adjustedGci = GCI - referralDollar

// NCI = Adjusted GCI - Total Brokerage Fees
nci = adjustedGci - totalBrokerageFees
```

#### 2. Referral $ Received Transaction

When `transactionType === "Referral $ Received"`:

```javascript
GCI = referralFeeReceived  // Flat fee, no property calculation
referralDollar = 0         // You're receiving, not paying
adjustedGci = GCI          // No adjustment needed
nci = adjustedGci - totalBrokerageFees
```

#### 3. Referral $ Paid Transaction

When `transactionType === "Referral $ Paid"`:

```javascript
GCI = closedPrice * commissionPct  // Normal calculation (commPct is decimal)
referralDollar = GCI * referralPct // You pay this (refPct is decimal)
adjustedGci = GCI - referralDollar
nci = adjustedGci - totalBrokerageFees
```

### Brokerage-Specific Calculations

#### Keller Williams (KW)

```javascript
// Auto-calculated with manual override support
Royalty = manualValue || (Adjusted GCI × 0.06)      // 6% default
Company Dollar = manualValue || (Adjusted GCI × 0.10) // 10% default

Total Brokerage Fees = 
  E&O + Royalty + Company Dollar + HOA Transfer + 
  Home Warranty + KW Cares + KW NextGen + Bold Scholarship + 
  TC/Concierge + Jelmberg Team + Other Deductions + Buyer's Agent Split

NCI = Adjusted GCI - Total Brokerage Fees
```

**Key Feature:** `royalty` and `companyDollar` fields support manual override. If user edits these fields, calculations use the manual values instead of auto-calculated defaults.

#### Bennion Deville Homes (BDH)

```javascript
// Auto-calculated with manual override
Pre-Split Deduction = manualValue || (Adjusted GCI × 0.06)  // 6% default

After Pre-Split = Adjusted GCI - Pre-Split Deduction
Agent Split = After Pre-Split × (BDH Split % / 100)        // Default 94%
Brokerage Portion = Adjusted GCI - Agent Split

Total Brokerage Fees = 
  Pre-Split Deduction + Brokerage Portion + ASF + 
  Foundation 10 + Admin Fee + Other Deductions + Buyer's Agent Split

NCI = Adjusted GCI - Total Brokerage Fees
```

**Key Feature:** `preSplitDeduction` field supports manual override. `bdhSplitPct` defaults to 94% but is editable.

### Bidirectional Calculations ✅ **IMPLEMENTED**

FarmTrackr supports **bidirectional calculations** allowing users to work with either calculated values or their inputs.

#### GCI ↔ Commission Percentage

```typescript
// If user enters GCI:
Commission % = (GCI ÷ Closed Price) × 100
// Stored as decimal: 0.03 (displays as 3.00%)

// If user enters Commission %:
GCI = Closed Price × Commission %
```

**Implementation:**
- Manual GCI edit triggers commission % recalculation
- Manual edit preserved when other fields change
- Supports flexible transaction entry workflows

#### Referral Dollar ↔ Referral Percentage

```typescript
// If user enters Referral $:
Referral % = (Referral $ ÷ GCI) × 100
// Stored as decimal: 0.25 (displays as 25.00%)

// If user enters Referral %:
Referral $ = GCI × Referral %
```

**Implementation:**
- Manual Referral $ edit triggers referral % recalculation
- Works with all transaction types
- Manual edit preserved across field changes

#### Manual Edit Tracking

**State Management:**
```typescript
const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set())

// Track when user manually edits calculated field
if (manuallyEditableFields.includes(field)) {
  setManuallyEditedFields(prev => new Set(Array.from(prev).concat(field)))
}

// Prevent auto-calculation from overwriting manual edit
if (manuallyEditedFields.has('gci') || manuallyEditedFields.has('referralDollar')) {
  return // Skip auto-calculation
}
```

**Benefits:**
- Prevents calculation loops
- Preserves user intent
- Supports complex workflows
- No unexpected overrides

### Data Storage Differences

**FarmTrackr vs Standalone Commission Dashboard:**

| Aspect | FarmTrackr | Standalone App |
|--------|-----------|----------------|
| Storage | PostgreSQL via Prisma | localStorage + Google Sheets |
| Calculated Fields | Computed on-demand | Stored in database |
| Dates | DateTime objects | String (YYYY-MM-DD) |
| Percentages | Decimal (0.03 = 3%) | Decimal (0.03 = 3%) ✅ |
| Currency | Decimal(12,2) | Numbers ✅ |
| Brokerage Normalization | Full names + abbreviations | Full names ✅ |
| State Management | React useState + API fetch | React useState + localStorage |
| **Bidirectional Calc** | **✅ Implemented** | **✅ Implemented** |
| **Manual Edit Tracking** | **✅ Implemented** | **✅ Implemented** |

**Why On-Demand Calculations?**

In FarmTrackr, commission fields (GCI, NCI, etc.) are computed in JavaScript client-side and in the API layer. Benefits:
- **Single Source of Truth:** Calculation logic lives in one place (`calculateCommission.ts`)
- **Always Accurate:** No risk of stale calculated values
- **Simpler Data Model:** Database stores raw inputs only
- **Easier Debugging:** Can trace calculation flow clearly

Trade-offs:
- Slight performance overhead on list renders (batch computation in useMemo mitigates this)
- Requires calculation library to be in sync with frontend

---

## Google Integration

### Authentication Flow

**OAuth 2.0 Setup:**

1. User clicks "Connect Google Account"
2. Redirect to Google OAuth consent screen
3. User authorizes access
4. Callback receives `code`
5. Exchange `code` for `access_token` + `refresh_token`
6. Store tokens in HTTP-only cookies
7. Set token expiry tracking

**Token Management:**
- `getGoogleAccessToken()` checks cookies and refreshes if needed
- Refresh token rotation handled automatically
- Session expiry: 1 hour (Google default)
- Secure cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`

**Required Scopes:**
- `https://www.googleapis.com/auth/spreadsheets` - Google Sheets read/write
- `https://www.googleapis.com/auth/contacts.readonly` - Google Contacts read

### Google Contacts Sync

**Import Process:**

```typescript
1. Fetch all contacts via People API
2. Map Google fields → FarmTrackr fields:
   - names → firstName/lastName/organizationName
   - emailAddresses → email1/email2
   - phoneNumbers → phoneNumber1-6
   - addresses → mailingAddress, city, state, zipCode
   - memberships → tags (group names)
3. Run duplicate detection
4. Create GeneralContact records
5. Store googleContactsId for future sync
```

**Field Mapping:**
- Google "Name" → `firstName` + `lastName` (if both provided) OR `organizationName` (if single word)
- Google "Memberships" (groups) → `tags` array
- Google phone numbers → Sequential `phoneNumber1-6`
- Address parsing: street, city, state, ZIP

**Duplicate Detection:**
- Match by email address (exact or normalized)
- Match by name + phone
- User can merge or skip duplicates

### Google Sheets Sync

**Transaction Sheet Structure:**

| Column | Field | Type | Description |
|--------|-------|------|-------------|
| A | propertyType | string | "Residential", "Commercial", "Land" |
| B | clientType | string | "Buyer", "Seller" |
| C | source | string | Lead source |
| D | address | string | Property address |
| E | city | string | City |
| F | listPrice | number | List price (no $) |
| G | commissionPct | number | Decimal (0.03 = 3%) |
| H | listDate | string | YYYY-MM-DD or MM/DD/YYYY |
| I | closingDate | string | YYYY-MM-DD or MM/DD/YYYY |
| J | brokerage | string | "Keller Williams", "BDH" |
| K | netVolume | number | Net volume |
| L | closedPrice | number | Closed price (no $) |
| M | gci | number | Gross Commission Income |
| N | referralPct | number | Referral % decimal |
| O | referralDollar | number | Referral $ |
| P | adjustedGci | number | Adjusted GCI |
| Q | preSplitDeduction | number | Pre-split (BDH) |
| R | totalBrokerageFees | number | Total fees |
| S | otherDeductions | number | Other deductions |
| T | nci | number | Net Commission Income |
| U | status | string | "Closed", "Pending", "Active" |
| V | assistantBonus | number | Assistant bonus |
| W | buyersAgentSplit | number | Buyer's agent split |
| X | transactionType | string | "Sale", "Referral $ Received", "Referral $ Paid" |
| Y | referringAgent | string | Referring agent name |
| Z | referralFeeReceived | number | Referral fee received |

**Sync Operations:**
- **Read:** Fetch all rows from `Transactions!A2:Z`
- **Write:** Batch update on create/update/delete
- **Import:** `POST /api/transactions/import-google` - One-time import with conflict resolution
- **Auto-Sync:** Currently manual via button click (auto-sync in future)

**Conflict Resolution:**
- **Google Sheets → FarmTrackr:** Google Sheets takes precedence
- **FarmTrackr → Google Sheets:** FarmTrackr overwrites
- **Future:** Two-way sync with merge strategies

**Farm Spreadsheet Import:**

11 pre-configured farm spreadsheets:
- Each farm has unique Google Sheets ID
- Flexible field mapping (case-insensitive)
- Automatic name normalization
- CSV fallback if not authenticated

---

## API & Service Layer

### API Routes

All API routes are in `src/app/api/` following RESTful conventions.

#### Contacts API

**Base URL:** `/api/contacts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all contacts (with search/filter) |
| POST | `/` | Create contact |
| GET | `/[id]` | Get single contact |
| PUT | `/[id]` | Update contact |
| DELETE | `/[id]` | Delete contact |
| POST | `/import` | Import from CSV/Excel |
| GET | `/export` | Export to CSV/Excel/JSON |
| POST | `/merge` | Merge duplicate contacts |
| GET | `/stats` | Contact statistics |
| GET | `/cleanup` | Run data cleanup |

**Example Response:**

```json
{
  "id": "clm123xyz456",
  "firstName": "John",
  "lastName": "Doe",
  "farm": "River Farm",
  "email1": "john@example.com",
  "city": "Sacramento",
  "dateCreated": "2025-01-15T10:30:00.000Z"
}
```

#### Transactions API

**Base URL:** `/api/transactions`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all transactions (with filters) |
| POST | `/` | Create transaction |
| GET | `/[id]` | Get single transaction |
| PUT | `/[id]` | Update transaction |
| DELETE | `/[id]` | Delete transaction |
| POST | `/import-google` | Import from Google Sheets |

**Query Parameters (GET):**
- `brokerage` - Filter by brokerage
- `clientType` - Filter by Buyer/Seller
- `status` - Filter by Closed/Pending/Active
- `year` - Filter by closing year

**Example Response:**

```json
{
  "id": "clm456abc789",
  "propertyType": "Residential",
  "clientType": "Buyer",
  "transactionType": "Sale",
  "address": "123 Main St",
  "city": "Sacramento",
  "closedPrice": 500000.00,
  "commissionPct": 0.03,
  "brokerage": "Keller Williams",
  "status": "Closed",
  "createdAt": "2025-01-20T14:00:00.000Z"
}
```

#### Documents API

**Base URL:** `/api/documents`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List documents (with search/type filter) |
| POST | `/` | Create document |
| GET | `/[id]` | Get single document |
| PUT | `/[id]` | Update document |
| DELETE | `/[id]` | Delete document |
| POST | `/mail-merge` | Generate mail merge document |

#### Google Contacts API

**Base URL:** `/api/google-contacts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List imported Google contacts |
| POST | `/import` | Import all from Google |
| GET | `/stats` | Import statistics |

#### Admin API

**Base URL:** `/api/admin`

| Endpoint | Description |
|----------|-------------|
| POST | `/purge/contacts` | Delete all contacts (dev only) |
| POST | `/purge/documents` | Delete all documents (dev only) |
| POST | `/seed` | Seed database with test data |

### Service Layer Functions

**Prisma Client (`src/lib/prisma.ts`):**
- Singleton pattern for database connection
- Connection pooling in production
- Hot reload safe

**Google Auth (`src/lib/googleAuth.ts`):**
- `getGoogleAuthUrl()` - Generate OAuth URL
- `getTokensFromCode()` - Exchange code for tokens
- `getAuthenticatedSheetsClient()` - Create Sheets API client
- `getAuthenticatedPeopleClient()` - Create People API client

**Commission Calculations (`src/lib/commissionCalculations.ts`):**
- `calculateCommission()` - Main calculation function
- `formatCurrencyForInput()` - Format $ for display
- `parseCurrencyFromInput()` - Parse $ for storage
- `formatPercentageForInput()` - Format % for display
- `parsePercentageFromInput()` - Parse % for storage

**Data Quality (`src/lib/dataQuality.ts`):**
- `findDuplicates()` - Multi-field duplicate detection
- `validateContact()` - Email/ZIP validation
- `calculateQualityScore()` - Data completeness scoring

**Address Normalization (`src/lib/address.ts`):**
- `normalizeAddressCasing()` - Title case addresses
- `normalizeCityCasing()` - Title case cities
- `formatAddress()` - Combine address components

**Theme System (`src/lib/theme.ts`):**
- `getThemeStyles()` - Get theme-aware styles
- `useThemeStyles()` - React hook for components

---

## Database Schema

### Prisma Models

**File:** `prisma/schema.prisma`

```prisma
// Core Models
model FarmContact { ... }
model GeneralContact { ... }
model Transaction { ... }
model Document { ... }

// Letter System
model LetterTemplate { ... }
model Letterhead { ... }
model Signature { ... }

// Templates
model ImportTemplate { ... }
model LabelTemplate { ... }
```

**Key Configuration:**
- **Provider:** PostgreSQL
- **ID Generation:** CUID (default)
- **Timestamps:** `@default(now())` and `@updatedAt`
- **Decimal Types:** `Decimal(12,2)` for currency, `Decimal(5,4)` for percentages
- **Arrays:** `String[]` for tags
- **JSON:** `Json` type for flexible schema

**Migration Strategy:**
- `prisma migrate dev` - Create new migration
- `prisma migrate deploy` - Apply migrations in production
- `prisma db push` - Sync schema without migrations (dev only)

**Indexes:**
- `Transaction`: `brokerage`, `clientType`, `transactionType`, `closingDate`, `status`
- Foreign keys for cascading deletes (future)

---

## Security & Authentication

### Google OAuth 2.0

**Flow:**
1. **Authorization:** User redirected to Google
2. **Consent:** User grants permissions
3. **Callback:** Return with authorization code
4. **Token Exchange:** Backend exchanges code for access + refresh tokens
5. **Storage:** Tokens stored in HTTP-only cookies
6. **Refresh:** Automatic refresh before expiry

**Security Measures:**
- **HTTPS Only:** All API calls encrypted
- **HTTP-Only Cookies:** Prevent XSS token theft
- **SameSite=Strict:** CSRF protection
- **Token Expiry:** 1-hour sessions
- **Refresh Rotation:** Secure token refresh

**Scopes Requested:**
- `spreadsheets` - Read/write Google Sheets
- `contacts.readonly` - Read Google Contacts

### Data Protection

**Input Validation:**
- Email format validation
- Phone number sanitization
- ZIP code format checking
- SQL injection prevention (Prisma parameterization)
- XSS prevention (React escaping)

**File Upload Security:**
- Allowed file types whitelist
- Max file size limits (10MB)
- Content-type verification
- Malware scanning (Vercel Blob)

**Access Control:**
- Single-user system (no multi-tenant)
- No user authentication yet (planned for v1.0)
- API routes protected by Google OAuth scope

---

## Deployment

### Vercel Configuration

**File:** `vercel.json`

```json
{
  "version": 2,
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  },
  "installCommand": "npm install",
  "buildCommand": "npm run vercel-build",
  "outputDirectory": ".next"
}
```

**Build Command:**
```bash
npm run vercel-build  # → prisma generate && prisma db push && next build
```

### Environment Variables

**Required in Production:**

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/farmtrackr

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://farmtrackr.vercel.app/api/google/oauth/callback

# Public App URL
NEXT_PUBLIC_APP_URL=https://farmtrackr.vercel.app

# Vercel Blob (optional)
BLOB_READ_WRITE_TOKEN=your-blob-token
```

**Google Cloud Console Setup:**
1. Create OAuth 2.0 Client ID
2. Add authorized JavaScript origins: `https://farmtrackr.vercel.app`
3. Add redirect URIs: `/api/google/oauth/callback`
4. Enable APIs: Sheets API, People API
5. Configure consent screen

### Database Migrations

**Production Deployment:**

```bash
# Push schema changes
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npm run import-data
```

**Rollback:**
- Vercel provides automatic rollbacks
- Prisma migrations version-controlled
- Database backups: Vercel Postgres automated

---

## Development Guide

### Getting Started

**Prerequisites:**
- Node.js 18.20.4+
- PostgreSQL database (or SQLite for dev)
- Google Cloud Project with OAuth credentials

**Installation:**

```bash
# Clone repository
git clone <repo-url>
cd farmtrackr-web

# Install dependencies
npm install

# Set up environment
cp env.example .env.local
# Edit .env.local with your credentials

# Set up database
npx prisma migrate dev
npx prisma generate

# Run development server
npm run dev
```

**Visit:** `http://localhost:3000`

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema without migration |
| `npm run db:migrate` | Run migrations |

**Import Scripts:**
- `scripts/import-local-data.ts` - Import from CSV
- `scripts/import-cielo-sheet.ts` - Cielo-specific import
- `scripts/check-brokerages.ts` - Validate brokerage data
- `scripts/verify-import.ts` - Verify import results

### Code Style

**TypeScript:**
- Strict mode enabled
- Explicit types preferred
- `any` type avoided
- Null checks required

**React:**
- Functional components only
- Hooks for state management
- Props interfaces defined
- No class components

**Styling:**
- Tailwind CSS utility classes
- Inline styles for dynamic values
- Theme system via `useThemeStyles()` hook
- Responsive mobile-first

**File Naming:**
- Components: PascalCase (`ContactForm.tsx`)
- Utilities: camelCase (`commissionCalculations.ts`)
- API routes: kebab-case (`route.ts`)
- Types: PascalCase interfaces

### Testing Strategy

**Current State:**
- Manual testing for features
- No automated tests yet
- QA checklist in planning

**Planned Testing:**
- **Unit Tests:** Commission calculations, data quality
- **Integration Tests:** API routes, Google Sheets sync
- **E2E Tests:** Critical user flows (add contact, calculate commission)
- **Visual Regression:** UI components

**Testing Tools (Future):**
- Jest + React Testing Library
- Playwright for E2E
- Chromatic for visual testing

### Debugging

**Common Issues:**

1. **Prisma Client Error:** Run `npx prisma generate`
2. **OAuth Redirect Error:** Check `GOOGLE_OAUTH_REDIRECT_URI` matches exactly
3. **Google Sheets Empty:** Verify spreadsheet ID and permissions
4. **Calculation Wrong:** Check brokerage type and transaction type
5. **Import Fails:** Check CSV format matches template

**Debug Commands:**

```bash
# View Prisma schema
npx prisma studio

# Check database connection
npx prisma db pull

# Reset database
npx prisma migrate reset

# Seed data
npm run import-data
```

---

## Performance Considerations

### Database Optimization

- **Indexes:** All foreign keys and filter fields indexed
- **Connection Pooling:** Prisma manages pool automatically
- **Query Batching:** `findMany` uses batch queries
- **Pagination:** Planned for large datasets

### Frontend Performance

- **Code Splitting:** Next.js automatic splitting
- **Image Optimization:** Next.js Image component
- **Memoization:** `useMemo` for expensive calculations
- **Lazy Loading:** Recharts and heavy libraries code-split

### Caching Strategy

**Current:**
- Browser caching for static assets
- No API caching

**Planned:**
- SWR or React Query for client-side caching
- Redis for server-side cache
- CDN for static assets

---

## Future Enhancements

See `ROADMAP.md` and `docs/FUTURE_ARCHITECTURE.md` for detailed plans.

**Short Term (v0.7):**
- Batch operations (bulk edit/delete)
- Advanced search filters
- Import templates

**Medium Term (v1.0):**
- User authentication
- Multi-user support
- Transaction Coordinator module
- CAR forms integration
- DocuSign integration

**Long Term:**
- AI commission sheet scanning (OpenAI Vision)
- Mobile app (React Native)
- Advanced analytics (forecasting, projections)
- Custom brokerage configurations

---

## References

**External Documentation:**
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google People API](https://developers.google.com/people)
- [Recharts Documentation](https://recharts.org)

**Internal Documentation:**
- `README.md` - Project overview
- `ROADMAP.md` - Development roadmap
- `docs/FUTURE_ARCHITECTURE.md` - Architecture plans
- `docs/planning/COMMISSION_INTEGRATION.md` - Commission module integration
- `DOCUMENTATION_INDEX.md` - Documentation map

---

**Last Updated:** October 31, 2025  
**Documentation Version:** 1.1  
**Status:** Active Development

---

## Commission System Audit

**Recent Audit:** October 31, 2025

A comprehensive audit was performed comparing FarmTrackr's commission tracking system to the standalone Commission Dashboard. Key findings:

### ✅ Strengths

- **Accurate Calculations:** All commission math verified correct
- **Complete Brokerage Support:** KW and BDH calculations match standalone
- **Solid Foundation:** Core architecture and data model are sound

### ✅ Recent Improvements (Oct 31, 2025)

- **✅ Bidirectional Calculations IMPLEMENTED:** GCI↔Commission % and Referral $↔Referral %
- **✅ Manual Edit Tracking IMPLEMENTED:** Preserves user manual edits
- **✅ Form Intelligence Enhanced:** Reactive calculations with manual override protection

### ⚠️ Minor Differences

- **Percentage Unit Mismatch:** Standalone uses 3.0=3%, FarmTrackr uses 0.03=3%
  - Impact: LOW - Different storage format, both work correctly
  - Recommendation: Keep decimal standard (industry standard)

### 📋 Documentation

**See:** `docs/COMMISSION_SYSTEM_AUDIT.md` for detailed audit findings  
**See:** `docs/COMMISSION_IMPROVEMENT_ROADMAP.md` for implementation details  
**See:** `docs/COMMISSION_PARITY_STATUS.md` for current status

**Status:** ✅ **PARITY ACHIEVED** - All critical features now implemented!

