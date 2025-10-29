# FarmTrackr Web App - Development Roadmap

## 📋 Overview

This roadmap outlines the development plan to bring the web application to feature parity with the Swift app, with special attention to the label printing functionality that had implementation challenges.

**Last Updated:** January 29, 2025  
**Current Version:** v0.2.0 (Data Persistence)

---

## 🎯 Current Status (v0.2.0 - Data Persistence)

### ✅ Completed Features
- [x] **Contact Management (CRUD)**
  - Create, read, update, delete contacts
  - Full contact form with all 20+ fields
  - Site address support (mailing vs site address)
  - Phone number formatting (XXX) XXX-XXXX
  - Address formatting (City, State ZIP)
  
- [x] **Basic Dashboard**
  - Contact statistics
  - Recent contacts display
  - Quick action buttons
  
- [x] **Search & Filter**
  - Real-time search by name, farm, email, city
  - Farm filter dropdown
  - State filter dropdown
  - Filter stats display
  
- [x] **Theme System**
  - Light, dark, and system theme support
  - Theme persistence
  - Theme-aware styling throughout
  
- [x] **Responsive Design**
  - Sidebar navigation (always visible on desktop)
  - Mobile-responsive layout
  - Apple-style aesthetic
  - Footer with build number

- [x] **Database Integration** ✅
  - PostgreSQL database setup (Prisma Postgres on Vercel)
  - Database migrations system
  - Connection pooling via Prisma
  - Data persistence across sessions

- [x] **Data Export** ✅
  - CSV export functionality
  - Excel export functionality
  - Farm-filtered export support

- [x] **Data Quality & Duplicate Detection** ✅
  - Duplicate detection algorithm
  - Data validation system
  - Quality score calculation
  - Duplicate groups display
  - Validation issues display

- [x] **Google Sheets Configuration** ✅
  - Updated farm spreadsheet IDs (11 farms)
  - Configuration management
  - Integration ready for authentication

- [x] **Version & Build System** ✅
  - Build number tracking
  - About section in Settings
  - Footer with build information
  - Version update documentation

### 🚧 In Progress
- [ ] **Google Sheets Integration** (Partially implemented)
  - API structure exists
  - Needs authentication flow completion
  - Needs data sync implementation

### ❌ Not Started
- [ ] CSV Import (UI implementation needed)
- [ ] Excel Import (UI implementation needed)
- [ ] Label Printing (Critical Priority)
- [ ] Document Management
- [ ] Batch Operations
- [ ] Import Templates
- [ ] Advanced Search/Filter
- [ ] Data Validation & Cleanup UI

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
- [ ] **CSV File Import**
  - File upload interface
  - CSV parsing and validation
  - Field mapping UI (automatic + manual)
  - Import preview with validation errors
  - Duplicate detection during import
  - Bulk import with progress tracking
  - Error handling and reporting

#### Excel Import
- [ ] **Excel (.xlsx) Import**
  - Excel file parsing (using xlsx library)
  - Multi-sheet support
  - Header row detection
  - Data type validation
  - Import template system

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

### **v0.3.0 - Export & Data Quality** (Target: Q1 2025) - IN PROGRESS
**Focus:** Data export capabilities and quality management

#### Export System
- [x] **CSV Export** ✅
  - Basic CSV export working
  - All contact fields included
- [x] **Excel Export** ✅
  - .xlsx format working
  - All contact fields included
- [ ] **Customizable Columns** (In Progress)
  - Column selection UI needed
- [ ] **JSON Export**
  - JSON format for API integration
- [ ] **PDF Export**
  - PDF contact reports
  - Printable format
- [x] **Export Filters (API)** ✅
  - Farm filter in API (needs UI)
- [ ] **Export Filters (UI)**
  - Farm filter dropdown in UI
  - Date range filter UI
  - Additional filter options

#### Data Quality Tools
- [x] **Duplicate Detection** ✅
  - Automatic duplicate scanning working
  - Duplicate matching algorithms:
    - [x] Name-based matching ✅
    - [x] Email-based matching ✅
    - [x] Phone-based matching ✅
    - [ ] Address-based matching (partial)
  - [x] Duplicate groups display ✅
  - [ ] Duplicate merge functionality (needs implementation)
  - [ ] Merge conflict resolution UI (needs implementation)

#### Data Validation
- [x] **Comprehensive Validation** ✅
  - [x] Email format validation ✅
  - [x] Phone number formatting and validation ✅
  - [x] ZIP code validation (5-digit) ✅
  - [ ] ZIP+4 validation (needs implementation)
  - [ ] Address validation (basic done, needs enhancement)
  - [ ] Data completeness scoring (needs display)
  - [ ] Validation rules configuration (needs UI)

#### Data Cleanup
- [x] **Basic Data Cleanup** ✅
  - [x] Phone number formatting (display) ✅
  - [ ] Phone number formatting tool (bulk operation)
  - [x] ZIP code formatting (display) ✅
  - [ ] ZIP code formatting tool (bulk operation)
  - [ ] Address normalization (needs implementation)
  - [ ] Email normalization (needs implementation)
  - [ ] Bulk cleanup operations UI (needs implementation)

**Estimated Development Time Remaining:** 1-2 weeks

---

### **v0.4.0 - Label Printing** (Target: Q2 2025)
**Focus:** CRITICAL - Address label printing functionality (had issues in Swift app)

#### Label Printing Core
- [ ] **Avery Label Format Support**
  - Avery 5160 (1" x 2.625") - 30 labels per sheet
  - Avery 5161 (1" x 4") - 20 labels per sheet
  - Avery 5162 (1.33" x 4") - 14 labels per sheet
  - Avery 5163 (2" x 4") - 10 labels per sheet
  - Avery 5164 (3.33" x 4") - 6 labels per sheet
  - Avery 5167 (0.5" x 1.75") - 80 labels per sheet
  - Custom format support

- [ ] **Label Rendering Engine**
  - Column-major order layout
  - Precise label positioning (margins, gaps)
  - Font size and family selection
  - Text wrapping and truncation
  - Multi-page support
  - Print-ready PDF generation

#### Label Printing UI
- [ ] **Print Label Interface**
  - Farm selection dropdown
  - Label format picker
  - Address type selection (mailing vs site)
  - Font family selection (System, Times New Roman, Arial, Courier New)
  - Contact count display
  - Preview before printing
  - Print button integration

#### Label Preview
- [ ] **Visual Preview System**
  - Full-page preview (8.5" x 11")
  - Multi-page preview with pagination
  - Zoom in/out functionality
  - Page navigation
  - Visual grid overlay (optional)

#### Print Implementation
- [ ] **Print Functionality**
  - PDF generation from label layout
  - Browser print dialog integration
  - Print settings (orientation, margins)
  - Multi-page print support
  - Print-specific styling (no borders, white background)

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

### **v0.5.0 - Google Sheets Integration** (Target: Q2 2025)
**Focus:** Complete Google Sheets sync capabilities

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

## 📊 Feature Comparison Matrix

| Feature | Swift App | Web App Status | Priority |
|---------|-----------|----------------|----------|
| Contact CRUD | ✅ Complete | ✅ Complete | ✅ Done |
| Search & Filter | ✅ Complete | 🟡 Partial | 🔴 High |
| CSV Import | ✅ Complete | ❌ Not Started | 🔴 High |
| Excel Import | ✅ Complete | ❌ Not Started | 🟡 Medium |
| CSV Export | ✅ Complete | ❌ Not Started | 🔴 High |
| Excel Export | ✅ Complete | ❌ Not Started | 🟡 Medium |
| PDF Export | ✅ Complete | ❌ Not Started | 🟡 Medium |
| **Label Printing** | ⚠️ Had Issues | ❌ Not Started | 🔴 **CRITICAL** |
| Duplicate Detection | ✅ Complete | ❌ Not Started | 🔴 High |
| Data Validation | ✅ Complete | 🟡 Basic | 🔴 High |
| Google Sheets Sync | 🟡 Partial | 🟡 Partial | 🟡 Medium |
| Import Templates | ✅ Complete | ❌ Not Started | 🟡 Medium |
| Document Management | ✅ Complete | ❌ Not Started | 🟡 Medium |
| Batch Operations | ✅ Complete | ❌ Not Started | 🟡 Medium |
| Theme System | ✅ Complete | ✅ Complete | ✅ Done |
| Cloud Sync | ✅ Complete | N/A (Web) | N/A |
| Backup/Restore | ✅ Complete | ❌ Not Started | 🟡 Medium |

**Legend:**
- ✅ Complete
- 🟡 Partial/In Progress
- ❌ Not Started
- ⚠️ Had Issues/Needs Extra Attention

---

## 🎯 Priority Focus Areas

### Critical Priority (Must Have)
1. **Label Printing** - This was the most problematic feature in Swift app
2. **CSV Import/Export** - Core data migration functionality
3. **Duplicate Detection** - Data quality critical
4. **Database Integration** - Foundation for all features

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
| v0.2.0 | Q1 2025 | Database + Import System |
| v0.3.0 | Q1 2025 | Export + Data Quality |
| v0.4.0 | Q2 2025 | **Label Printing (Critical)** |
| v0.5.0 | Q2 2025 | Google Sheets Integration |
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

**Last Reviewed:** January 2025
