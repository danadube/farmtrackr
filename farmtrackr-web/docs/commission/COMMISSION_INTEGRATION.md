# Commission Dashboard Integration Plan

**Status:** Planning Phase  
**Target Version:** v0.6.0  
**Estimated Effort:** 4-6 weeks  
**Complexity:** HIGH

---

## Overview

Integrate the Commission Dashboard (currently a separate React app) into FarmTrackr as a comprehensive commission tracking module. This will add transaction management, commission calculations, analytics, and Google Sheets sync capabilities to FarmTrackr.

---

## Source Analysis

### Commission Dashboard Tech Stack
- **Framework:** React (Create React App)
- **Charts:** Recharts
- **Storage:** localStorage + Google Sheets
- **OAuth:** Google OAuth 2.0
- **Deployment:** Vercel

### FarmTrackr Current Tech Stack
- **Framework:** Next.js 14
- **Charts:** None (would add Recharts)
- **Storage:** PostgreSQL via Prisma
- **OAuth:** Google OAuth 2.0 ✅ (already set up!)
- **Deployment:** Vercel

### Compatibility Assessment
✅ **Fully compatible** - Both use React, both on Vercel, both have Google OAuth

---

## Database Schema Design

### New Prisma Model: `Transaction`

```prisma
model Transaction {
  id                  String   @id @default(cuid())
  
  // Basic Info
  propertyType        String   // 'Residential', 'Commercial', 'Land', etc.
  clientType          String   // 'Buyer', 'Seller'
  transactionType     String   // 'Sale', 'Referral Out', 'Referral In'
  source              String?  // Lead source
  address             String?
  city                String?
  listPrice           Decimal? @db.Decimal(12, 2)
  closedPrice         Decimal? @db.Decimal(12, 2)
  listDate            DateTime?
  closingDate         DateTime?
  status              String   // 'Closed', 'Pending', 'Cancelled'
  
  // Referral Fields
  referringAgent      String?  // Name of agent referred to/from
  referralFeeReceived Decimal? @db.Decimal(10, 2)
  
  // Commission Fields
  brokerage           String   // 'Keller Williams', 'BDH', etc.
  commissionPct       Decimal? @db.Decimal(5, 4)  // As decimal (0.0300 = 3%)
  referralPct         Decimal? @db.Decimal(5, 4)
  referralDollar      Decimal? @db.Decimal(10, 2)
  netVolume           Decimal? @db.Decimal(12, 2)
  
  // KW Specific
  eo                  Decimal? @db.Decimal(10, 2)
  royalty             Decimal? @db.Decimal(10, 2)
  companyDollar       Decimal? @db.Decimal(10, 2)
  hoaTransfer         Decimal? @db.Decimal(10, 2)
  homeWarranty        Decimal? @db.Decimal(10, 2)
  kwCares             Decimal? @db.Decimal(10, 2)
  kwNextGen           Decimal? @db.Decimal(10, 2)
  boldScholarship     Decimal? @db.Decimal(10, 2)
  tcConcierge         Decimal? @db.Decimal(10, 2)
  jelmbergTeam        Decimal? @db.Decimal(10, 2)
  
  // BDH Specific
  bdhSplitPct         Decimal? @db.Decimal(5, 4)
  asf                 Decimal? @db.Decimal(10, 2)
  foundation10        Decimal? @db.Decimal(10, 2)
  adminFee            Decimal? @db.Decimal(10, 2)
  preSplitDeduction   Decimal? @db.Decimal(10, 2)
  
  // Universal
  otherDeductions     Decimal? @db.Decimal(10, 2)
  buyersAgentSplit    Decimal? @db.Decimal(10, 2)
  assistantBonus      Decimal? @db.Decimal(10, 2)  // FYI only
  
  // Calculated Fields (computed, not stored)
  // GCI, Adjusted GCI, Total Brokerage Fees, NCI calculated on-demand
  
  // Google Sheets Sync
  googleSheetsId      String?  // Row ID for Google Sheets sync
  
  // Timestamps
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@map("transactions")
  @@index([brokerage])
  @@index([clientType])
  @@index([transactionType])
  @@index([closingDate])
  @@index([status])
}
```

---

## Phase 1: Foundation (Week 1-2)

### Tasks
1. **Database Schema**
   - [ ] Add `Transaction` model to Prisma schema
   - [ ] Run migration
   - [ ] Verify schema in database

2. **Basic UI Setup**
   - [ ] Add "Commissions" to sidebar navigation
   - [ ] Create `/commissions` page route
   - [ ] Add basic page header with stats
   - [ ] Create empty state UI

3. **Transaction API Routes**
   - [ ] `GET /api/transactions` - List all transactions
   - [ ] `POST /api/transactions` - Create transaction
   - [ ] `GET /api/transactions/[id]` - Get single transaction
   - [ ] `PUT /api/transactions/[id]` - Update transaction
   - [ ] `DELETE /api/transactions/[id]` - Delete transaction

4. **Basic CRUD**
   - [ ] Transaction list page
   - [ ] Create transaction modal
   - [ ] Edit transaction modal
   - [ ] Delete confirmation
   - [ ] Basic validation

**Deliverable:** Working transaction CRUD with basic UI

---

## Phase 2: Analytics & Calculations (Week 3)

### Tasks
1. **Add Recharts**
   - [ ] Install `recharts` package
   - [ ] Add to Next.js config if needed

2. **Commission Calculations**
   - [ ] Create calculation utilities (GCI, NCI, etc.)
   - [ ] KW-specific calculations
   - [ ] BDH-specific calculations
   - [ ] Referral calculations

3. **Analytics Dashboard**
   - [ ] Metric cards (GCI, NCI, Total Transactions, Avg Commission)
   - [ ] Line chart (commissions over time)
   - [ ] Bar chart (transactions by month)
   - [ ] Pie chart (client type breakdown)

4. **Smart Insights**
   - [ ] Best month analysis
   - [ ] Top property type
   - [ ] Stronger side (Buyer vs Seller)
   - [ ] Biggest deal

**Deliverable:** Full analytics dashboard with charts

---

## Phase 3: Advanced Features (Week 4+)

### Tasks
1. **Filters & Search**
   - [ ] Filter by year
   - [ ] Filter by client type
   - [ ] Filter by brokerage
   - [ ] Filter by property type
   - [ ] Search transactions

2. **Google Sheets Sync**
   - [ ] Map to existing Google OAuth
   - [ ] Sync to Google Sheets on create/update/delete
   - [ ] Import from Google Sheets
   - [ ] Conflict resolution

3. **Export**
   - [ ] CSV export
   - [ ] Excel export
   - [ ] PDF export (enhanced)

4. **Advanced UI**
   - [ ] Transaction detail modal
   - [ ] Color-coded cards (Buyer/Seller)
   - [ ] Chronological sorting
   - [ ] Bulk operations

**Deliverable:** Production-ready commission tracking system

---

## Phase 4: Future Enhancements

### Potential Additions
- [ ] AI Commission Sheet Scanner (OpenAI Vision)
- [ ] Custom date ranges
- [ ] Goal tracking and projections
- [ ] Year-over-year comparisons
- [ ] Commission forecasting
- [ ] Transaction notes/comments
- [ ] Tags and categories

---

## Key Migration Challenges

### 1. Framework Migration
- **Challenge:** CRA to Next.js conversion
- **Solution:** Port components, use Next.js pages/app router

### 2. State Management
- **Challenge:** Commission dashboard uses useState extensively
- **Solution:** Keep client-side state, add server-side fetch for data

### 3. Styling
- **Challenge:** Commission dashboard uses Tailwind + custom classes
- **Solution:** Integrate Tailwind config, maintain design system

### 4. Google Sheets Sync
- **Challenge:** Complex sync logic
- **Solution:** Leverage existing Google OAuth setup, port service logic

### 5. Commission Calculations
- **Challenge:** Complex brokerage-specific math
- **Solution:** Port calculation utilities, create type-safe helpers

---

## File Structure (Proposed)

```
farmtrackr-web/
├── prisma/
│   └── schema.prisma          # Add Transaction model
├── src/
│   ├── app/
│   │   ├── commissions/
│   │   │   ├── page.tsx       # Main dashboard
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Transaction detail
│   │   └── api/
│   │       └── transactions/
│   │           ├── route.ts   # GET/POST all
│   │           └── [id]/
│   │               └── route.ts # GET/PUT/DELETE one
│   ├── components/
│   │   ├── CommissionDashboard.tsx
│   │   ├── TransactionCard.tsx
│   │   ├── TransactionForm.tsx
│   │   └── CommissionCharts.tsx
│   ├── lib/
│   │   ├── commissionCalculations.ts
│   │   ├── googleSheetsSync.ts
│   │   └── transactionFormatter.ts
└── docs/
    └── planning/
        └── COMMISSION_INTEGRATION.md
```

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Can create, view, edit, delete transactions
- ✅ All data persists in database
- ✅ Basic UI is functional

### Phase 2 Complete When:
- ✅ Charts display correctly
- ✅ All commission calculations work
- ✅ Analytics provide meaningful insights

### Phase 3 Complete When:
- ✅ Google Sheets sync works both ways
- ✅ Filters and search functional
- ✅ Export features working

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 1-2 weeks | None |
| Phase 2: Analytics | 1 week | Phase 1 complete |
| Phase 3: Advanced | 2 weeks | Phase 2 complete |
| **TOTAL** | **4-5 weeks** | Sequential |

---

## Next Steps

1. **Review** this integration plan
2. **Approve** database schema
3. **Start Phase 1** with database setup
4. **Iterate** based on feedback

---

## Questions to Address

- Should we keep the separate commission-dashboard repo or fully migrate?
- Do we need to maintain backward compatibility with existing data?
- What's the priority: features or performance?
- Any custom brokerage calculations beyond KW/BDH?

---

**Last Updated:** November 1, 2025  
**Author:** FarmTrackr Development Team  
**Status:** Ready for Review

