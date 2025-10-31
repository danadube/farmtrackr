# FarmTrackr - Farm CRM Application

## Overview
FarmTrackr is a comprehensive Customer Relationship Management (CRM) application designed specifically for farm operations. Built with SwiftUI and Core Data, it provides native iPad and Mac support with robust contact management, import/export capabilities, and cloud synchronization.

## Current Status: PRODUCTION READY ✅
- **32 passing tests** (100% success rate)
- **Complete Core Data implementation** with 20+ contact fields
- **Full CRUD operations** for contact management
- **Import/Export system** supporting CSV, Excel, and PDF formats
- **CloudKit integration** for data synchronization
- **iPad-optimized UI** with master-detail interface

## Key Features

### Contact Management
- Complete contact profiles with farm-specific fields
- Advanced search and filtering capabilities
- Duplicate detection and merging
- Batch operations for bulk actions
- Data validation and cleanup tools

### Import/Export System
- CSV and Excel file import with field mapping
- PDF report generation with farm branding
- Avery label template support
- Import templates for reusable configurations
- Comprehensive error handling and validation

### User Interface
- Modern SwiftUI design with farm-themed aesthetics
- Multiple themes including dark mode support
- iPad-optimized master-detail layout
- Mac desktop compatibility
- Full accessibility support (VoiceOver, Dynamic Type)

### Data Management
- Core Data persistence with CloudKit sync
- Automatic data backup and restore
- Data quality assessment and scoring
- Phone number and ZIP code formatting
- Comprehensive error handling

## Technical Architecture

### Core Technologies
- **Framework**: SwiftUI + Core Data
- **Platform**: iOS 15.0+ (iPad primary), macOS 12.0+ (Mac secondary)
- **Data Persistence**: Core Data with CloudKit synchronization
- **Architecture**: MVVM pattern with ObservableObject
- **Testing**: XCTest with comprehensive coverage

### Project Structure
```
FarmTrackr/
├── FarmTrackrApp.swift          # Main app entry point
├── ContentView.swift            # Root view controller
├── Models/                      # Core Data models
│   ├── FarmContact.swift
│   ├── ImportTemplate.swift
│   └── LabelTemplate.swift
├── Views/                       # SwiftUI views (30 files)
├── Managers/                    # Business logic managers
│   ├── CloudKitManager.swift
│   ├── DataImportManager.swift
│   ├── GoogleSheetsManager.swift
│   └── UnifiedImportExportManager.swift
├── Utilities/                   # Helper utilities
│   ├── Constants.swift
│   ├── Extensions.swift
│   └── DataValidator.swift
└── Resources/                   # Assets and templates
    ├── Assets.xcassets
    └── Avery Templates/
```

## Performance Metrics
- **App Launch Time**: < 2 seconds
- **Contact List Loading**: < 1 second for 1,000 contacts
- **Import Speed**: ~100 contacts/second
- **Export Speed**: ~200 contacts/second
- **Memory Usage**: < 100MB for typical usage

## Next Development Priorities

### Phase 1: Google Sheets Integration (2-4 weeks)
- Complete OAuth 2.0 authentication setup
- Implement real-time Google Sheets synchronization
- Add field mapping for Google Sheets
- Error handling and retry logic

### Phase 2: Apple Numbers Support (2-3 weeks)
- Import/export .numbers files
- iCloud Numbers integration
- Collaborative editing support

### Phase 3: Performance Optimization (2-3 weeks)
- Large dataset handling (10,000+ contacts)
- Background processing improvements
- Memory management optimization

## Getting Started

### Prerequisites
- Xcode 14.0+
- iOS 15.0+ or macOS 12.0+
- Apple Developer Account (for CloudKit)

### Installation
1. Clone the repository
2. Open `FarmTrackr.xcodeproj` in Xcode
3. Configure CloudKit capabilities
4. Build and run on iPad or Mac

### Testing
Run the comprehensive test suite:
```bash
# Run all tests
xcodebuild test -scheme FarmTrackr -destination 'platform=iOS Simulator,name=iPad Pro (13-inch) M4'

# Run specific test categories
xcodebuild test -scheme FarmTrackr -only-testing:FarmTrackrTests/CoreDataModelTest
```

## Archive Contents
The `/archive/` directory contains:
- **web-prototype/**: React/Next.js web app prototype (archived)
- **docs/**: Historical documentation and setup guides
- **resources/**: Test files, scripts, and temporary assets

## Contributing
This is a production-ready application. For feature requests or bug reports, please refer to the development roadmap in the archive documentation.

## License
Private project for Glaab Farm operations.

---
*Last updated: October 29, 2025*
*Status: Production Ready with 32 passing tests*
