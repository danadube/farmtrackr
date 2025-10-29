# FarmTrackr Web App - Development Roadmap

## 📋 Overview

This roadmap outlines the development plan to bring the web application to feature parity with the Swift app, with special attention to the label printing functionality that had implementation challenges.

**Last Updated:** October 29, 2025  
**Current Version:** v0.4.0 (Label Printing & PDF Export) - ✅ COMPLETE  
**Next Target:** v0.5.0 (Documents & Google Sheets Integration)

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

- [x] **Data Import** ✅ API IMPLEMENTED - UI NEEDS VERIFICATION
  - CSV import API fully functional (`/api/contacts/import`)
  - Excel (.xlsx) import API fully functional
  - Field mapping and validation in API
  - Import UI exists but needs testing/refinement

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
- [ ] **Google Sheets Integration** (Partially implemented)
  - API structure exists (`/api/google-sheets/import` and `/export`)
  - Needs authentication flow completion
  - Needs data sync implementation
  - UI page exists but requires OAuth setup

- [ ] **CSV/Excel Import UI** (API complete, UI needs verification)
  - Import page exists at `/import-export`
  - API fully functional
  - UI may need refinement based on user testing

### ❌ Not Started
- [ ] **Label Printing** 🔴 **CRITICAL PRIORITY**
  - Dashboard link exists but route doesn't exist
  - No implementation found
  - Avery template support needed
  - This is the highest priority feature (had issues in Swift app)
  
- [ ] **Document Management**
  - Page exists at `/documents` but uses mock data
  - No real document storage/management functionality
  
- [ ] **Batch Operations**
  - Multi-select for contacts
  - Bulk edit/delete/export
  
- [ ] **Import Templates**
  - Save and reuse import configurations
  - Template management UI
  
- [ ] **Advanced Search/Filter**
  - Advanced filter builder
  - Saved search queries
  
- [ ] **PDF Export Enhancement**
  - Current PDF export is basic/placeholder
  - Needs proper PDF generation library

---

## 🚀 Version Roadmap

### **v0.2.0 - Data Persistence & Import** (Target: Q1 2025)
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

**Estimated Development Time:** 3-4 weeks

---

### **v0.3.0 - Export & Data Quality** (Target: Q1 2025) - ✅ MOSTLY COMPLETE
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

### **v0.4.0 - Label Printing & PDF Export** ✅ COMPLETE (October 29, 2025)
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

**Estimated Development Time:** 4-5 weeks (extra time allocated for testing and refinement)

**Dependencies:**
- PDF generation library
- Print CSS expertise
- Label format specifications

---

### **v0.5.0 - Document Management & Google Sheets Integration** (Target: Q4 2025)
**Focus:** Complete document management and Google Sheets sync capabilities

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

**Estimated Development Time:** 3-4 weeks

**Dependencies:**
- Google Sheets API credentials
- OAuth setup
- Secure backend for token storage

---

### **v0.6.0 - Advanced Features** (Target: Q3 2025)
**Focus:** Advanced CRM capabilities

#### Batch Operations
- [ ] **Bulk Actions**
  - Multi-select contacts
  - Bulk edit (farm, notes, etc.)
  - Bulk delete with confirmation
  - Bulk export
  - Bulk import updates

### **v0.4.1 - Document Management** (In Progress)
**Focus:** Complete document CRUD and file management

#### Document Management Core (Started)
- [x] **Document CRUD API** ✅ COMPLETE
  - [x] GET/POST /api/documents ✅
  - [x] GET/PUT/DELETE /api/documents/[id] ✅
  - [x] Database schema (Prisma) ✅
  - [x] Search and filter support ✅

- [ ] **Document Management UI** 🚧 IN PROGRESS
  - [x] Document list page with search/filter ✅
  - [x] API integration ✅
  - [ ] Create document modal
  - [ ] Edit document functionality
  - [ ] Delete with confirmation
  - [ ] Document type categorization

#### Document Storage (Planned)
- [ ] **File Upload & Storage**
  - [ ] File upload endpoint (Vercel Blob or S3)
  - [ ] Document association with contacts
  - [ ] Document organization by type
  - [ ] Document preview (PDF, images)
  - [ ] Document download
  - [ ] File size validation
  - [ ] Supported file types (PDF, images, docs)

#### Document Management
- [ ] **Document Storage**
  - Document upload (PDF, images, etc.)
  - Document association with contacts
  - Document organization
  - Document preview
  - Document download

#### Advanced Search
- [ ] **Enhanced Search**
  - Advanced filter builder
  - Saved search queries
  - Search across all fields
  - Fuzzy search
  - Search history

#### Reporting & Analytics
- [ ] **Reports**
  - Contact reports by farm
  - Data quality reports
  - Export reports
  - Custom report builder

**Estimated Development Time:** 4-5 weeks

---

### **v1.0.0 - Production Ready** (Target: Q4 2025)
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

**Estimated Development Time:** 6-8 weeks

---

## 📊 Feature Comparison Matrix (UPDATED)

| Feature | Swift App | Web App Status | Priority | Notes |
|---------|-----------|----------------|----------|-------|
| Contact CRUD | ✅ Complete | ✅ Complete | ✅ Done | Fully verified |
| Search & Filter | ✅ Complete | ✅ Complete | ✅ Done | Basic search/filter working |
| CSV Import | ✅ Complete | 🟡 API Done, UI Needs Testing | 🔴 High | API functional, UI exists |
| Excel Import | ✅ Complete | 🟡 API Done, UI Needs Testing | 🟡 Medium | API functional, UI exists |
| CSV Export | ✅ Complete | ✅ Complete | ✅ Done | Full implementation verified |
| Excel Export | ✅ Complete | ✅ Complete | ✅ Done | Full implementation verified |
| JSON Export | ✅ Complete | ✅ Complete | ✅ Done | API implemented |
| PDF Export | ✅ Complete | ✅ Complete | ✅ Done | Professional PDF with pdfkit |
| **Label Printing** | ⚠️ Had Issues | ✅ Complete | ✅ Done | Fully implemented with preview |
| Duplicate Detection | ✅ Complete | ✅ Complete | ✅ Done | Full UI + API verified |
| Data Validation | ✅ Complete | ✅ Complete | ✅ Done | Validation + cleanup UI working |
| Data Quality UI | ✅ Complete | ✅ Complete | ✅ Done | Full page with tabs implemented |
| Google Sheets Sync | 🟡 Partial | 🟡 Partial | 🟡 Medium | OAuth needed |
| Import Templates | ✅ Complete | ❌ Not Started | 🟡 Medium | Future enhancement |
| Document Management | ✅ Complete | 🟡 API Complete, UI Partial | 🟡 Medium | CRUD API done, file upload pending |
| Batch Operations | ✅ Complete | ❌ Not Started | 🟡 Medium | Future enhancement |
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
2. **CSV/Excel Import UI Verification** - Core data migration functionality
3. ~~**Duplicate Detection**~~ - ✅ COMPLETE
4. ~~**Database Integration**~~ - ✅ COMPLETE
5. **Document Management UI** - Complete CRUD workflow

### High Priority (Important)
1. **Data Validation** - Prevent bad data entry
2. **Advanced Search** - Improve usability
3. **Batch Operations** - Efficiency for large datasets

### Medium Priority (Nice to Have)
1. **Excel Import/Export** - Additional format support
2. **Google Sheets Full Integration** - Enhanced sync
3. **Document Management** - File organization
4. **Import Templates** - Reusability

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
| v0.2.0 | Q1 2025 ✅ | Database + Import System |
| v0.3.0 | Q1 2025 ✅ | Export + Data Quality |
| v0.4.0 | Oct 2025 ✅ | **Label Printing & PDF Export** |
| v0.4.1 | Q4 2025 🚧 | Document Management (In Progress) |
| v0.5.0 | Q4 2025 | Google Sheets Integration |
| v0.6.0 | Q3 2025 | Advanced Features |
| v1.0.0 | Q4 2025 | Production Release |

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

**Last Reviewed:** October 29, 2025

---

## 🎯 Immediate Next Steps (v0.4.1 & v0.5.0)

### Priority 1: Complete Document Management (v0.4.1)
**Status:** API Complete, UI Partial ✅🚧

**Remaining Tasks:**
1. **Create Document Modal**
   - Form with title, description, type
   - Validation and error handling
   - Success feedback

2. **Edit & Delete Actions**
   - Edit document modal
   - Delete confirmation dialog
   - Optimistic UI updates

3. **File Upload Integration** (Optional - can be v0.5.0)
   - File upload endpoint (Vercel Blob or AWS S3)
   - Document preview for PDFs/images
   - Download functionality

**Estimated Time:** 2-3 days

### Priority 2: Google Sheets Authentication (v0.5.0)
**Status:** API Structure Exists 🟡

**Tasks:**
1. **OAuth 2.0 Setup**
   - Google Cloud Console configuration
   - OAuth flow implementation
   - Token storage (secure backend)

2. **Complete Sync Implementation**
   - Import from Google Sheets
   - Export to Google Sheets
   - Sync status UI

**Estimated Time:** 1-2 weeks

### Priority 3: CSV/Excel Import UI Verification (v0.4.1)
**Status:** API Complete, UI Needs Testing 🟡

**Tasks:**
1. Test import workflow end-to-end
2. Fix any UI issues found
3. Improve error messaging
4. Add progress indicators if needed

**Estimated Time:** 1-2 days

### Priority 4: Theme Flash Fix (Technical Debt)
**Status:** Known Issue ⚠️

**Issue:** Theme switches dark→light on page refresh when set to System
**Priority:** Low (doesn't affect functionality)
**Estimated Time:** 1-2 hours

---

## 📊 Version Summary

| Version | Status | Key Features |
|---------|--------|--------------|
| v0.2.0 | ✅ Complete | Database, Basic CRUD |
| v0.3.0 | ✅ Complete | Export, Data Quality |
| v0.4.0 | ✅ Complete | Label Printing, PDF Export |
| v0.4.1 | 🚧 In Progress | Document Management UI |
| v0.5.0 | 📋 Planned | Google Sheets Integration |
| v0.6.0 | 📋 Planned | Advanced Features |
| v1.0.0 | 📋 Planned | Production Release |

---

## 🎯 **IMMEDIATE NEXT STEPS** (Recommended Priority Order)

### **1. 🔴 CRITICAL: Implement Label Printing (v0.4.0)**
**Why First:** This is marked as CRITICAL priority because it had implementation issues in the Swift app and is a core feature.

**Tasks:**
1. Create `/print-labels` route and page component
2. Implement Avery label template support (start with 5160, most common)
3. Build label layout engine with precise positioning
4. Add farm/contact selection UI
5. Implement print preview functionality
6. Add font selection and address type (mailing vs site) options
7. Test with actual Avery label sheets

**Estimated Time:** 4-5 weeks
**Dependencies:** None (can start immediately)

**Technical Notes:**
- Use CSS @media print for print-specific styling
- Consider jsPDF or react-pdf for PDF generation if browser print is insufficient
- Test extensively across browsers (Chrome, Firefox, Safari)
- Reference Swift app implementation challenges to avoid same pitfalls

---

### **2. 🟡 HIGH: Verify & Polish CSV/Excel Import**
**Why Second:** APIs are implemented but UI needs user testing and potential refinement.

**Tasks:**
1. Test CSV import workflow end-to-end with real data
2. Test Excel import workflow end-to-end
3. Verify field mapping works correctly
4. Check error messages are clear and actionable
5. Add import preview with validation errors (if not already good)
6. Test with edge cases (empty rows, missing headers, etc.)
7. Document any issues found and fix them

**Estimated Time:** 1 week (testing + fixes)
**Dependencies:** None (can be done in parallel with label printing)

---

### **3. 🟡 MEDIUM: Complete Google Sheets Integration**
**Why Third:** Core infrastructure exists, just needs OAuth authentication.

**Tasks:**
1. Set up Google OAuth 2.0 credentials
2. Implement OAuth flow in UI
3. Store tokens securely (backend session storage)
4. Implement token refresh logic
5. Complete sync functionality (import from Sheets)
6. Add sync status indicators
7. Test with actual Google Sheets

**Estimated Time:** 2-3 weeks
**Dependencies:** Google Cloud Console setup, OAuth credentials

---

### **4. 🟢 ENHANCEMENT: PDF Export Enhancement**
**Why Fourth:** Basic placeholder exists, can be improved with proper library.

**Tasks:**
1. Choose PDF library (pdfkit or jsPDF)
2. Implement proper PDF generation with formatting
3. Add contact report templates
4. Test PDF output quality
5. Add to export options

**Estimated Time:** 1 week
**Dependencies:** None

---

### **5. 🟢 ENHANCEMENT: Future Features (v0.6.0+)**
**Lower Priority but Valuable:**
- Batch Operations (multi-select, bulk edit/delete)
- Import Templates (save/reuse field mappings)
- Document Management (real storage, not just mock data)
- Advanced Search/Filter (filter builder, saved searches)

**Estimated Time:** Varies (4-5 weeks total for all)

---

## 📊 **Progress Summary**

**Current Status:**
- ✅ **v0.2.0 (Data Persistence)** - COMPLETE
- ✅ **v0.3.0 (Export & Data Quality)** - COMPLETE
- 🎯 **Next: v0.4.0 (Label Printing)** - CRITICAL PRIORITY

**Completion Rate:**
- Core Features: ~75% complete
- Critical Features: 66% complete (2 of 3 critical features done - need Label Printing)
- Overall: Strong foundation, ready for next major feature

**Recommendation:** Focus on Label Printing (v0.4.0) as it's the highest priority remaining feature and addresses a known challenge from the Swift app implementation.

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
