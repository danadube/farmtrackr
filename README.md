# FarmTrackr

A comprehensive Customer Relationship Management application designed specifically for farm operations, built with SwiftUI and Core Data for iPad and Mac.

## Features

### Core Functionality
- **Contact Management**: Complete CRUD operations for farm contacts
- **Data Import**: CSV file import with validation and preview
- **Data Export**: Export contacts to CSV and PDF formats
- **Search & Filter**: Real-time search with farm and state filtering
- **Master-Detail Interface**: Optimized for iPad with split view layout
- **iCloud Sync**: Automatic data synchronization across devices using CloudKit
- **Backup & Restore**: Create and restore data backups for data safety

### Contact Information
- Personal details (name, farm association)
- Multiple contact methods (6 phone numbers, 2 email addresses)
- Mailing and site addresses
- Notes and metadata tracking
- Creation and modification timestamps

### Import/Export Capabilities
- **CSV Import**: Parse and validate CSV files with flexible column mapping
- **Data Validation**: Email, phone, and ZIP code format validation
- **Import Preview**: Review data before confirming import
- **CSV Export**: Complete contact data export
- **PDF Export**: Professional contact list generation
- **Error Handling**: Comprehensive validation error reporting

### User Interface
- **iPad Optimized**: Master-detail layout with touch-friendly design
- **Mac Compatible**: Full desktop support with keyboard navigation
- **Modern Design**: Clean, professional interface with farm-themed colors
- **Accessibility**: VoiceOver support and dynamic type
- **Responsive**: Adapts to different screen sizes and orientations

## Technical Architecture

### Platform Support
- **Primary**: iPad (iOS 15.0+)
- **Secondary**: Mac (macOS 12.0+)
- **Framework**: SwiftUI
- **Data Persistence**: Core Data with CloudKit
- **Design Pattern**: MVVM
- **Cloud Services**: iCloud/CloudKit for data synchronization

### Core Data Model
```swift
FarmContact Entity:
- firstName, lastName (String)
- mailingAddress, city, state (String)
- zipCode (Int32)
- email1, email2 (String?)
- phoneNumber1-6 (String?)
- siteMailingAddress, siteCity, siteState (String?)
- siteZipCode (Int32)
- notes (String?)
- farm (String)
- dateCreated, dateModified (Date)
```

### Project Structure
```
GlaabFarmCRM/
├── App/
│   ├── Glaab_Farm_CRMApp.swift
│   └── ContentView.swift
├── Models/
│   ├── FarmContact.swift
│   └── GlaabFarmCRM.xcdatamodeld/
├── Views/
│   ├── ContactListView.swift
│   ├── ContactDetailView.swift
│   ├── ContactEditView.swift
│   ├── ImportView.swift
│   ├── ExportView.swift
│   ├── FilterView.swift
│   └── ImportPreviewView.swift
├── Managers/
│   ├── DataImportManager.swift
│   └── ExportManager.swift
├── Utilities/
│   ├── Constants.swift
│   └── Extensions.swift
└── PersistenceController.swift
```

## Setup Instructions

### Prerequisites
- Xcode 14.0 or later
- iOS 15.0+ / macOS 12.0+
- Swift 5.0+
- Apple Developer Account (for CloudKit container setup)
- iCloud account (for data synchronization)

### Installation
1. Clone the repository
2. Open `FarmTrackr.xcodeproj` in Xcode
3. Select your target device (iPad recommended)
4. Build and run the application

### Core Data Setup
The application automatically creates the Core Data stack. The data model is defined in `GlaabFarmCRM.xcdatamodeld` and managed by `PersistenceController.swift`.

## Usage Guide

### Adding Contacts
1. Tap the "+" button in the toolbar
2. Fill in the required fields (First Name, Last Name, Farm)
3. Add optional contact information
4. Tap "Add" to save

### Importing Data
1. Tap the download icon in the toolbar
2. Select a CSV file
3. Review the import preview
4. Confirm import if validation passes

### Exporting Data
1. Tap the upload icon in the toolbar
2. Choose export format (CSV or PDF)
3. Tap "Export" to generate file
4. Use "Share File" to save or share

### Searching and Filtering
- Use the search bar for real-time filtering
- Tap filter buttons to filter by farm or state
- Use the sort menu to change list order

### iCloud Sync & Backup
- **Automatic Sync**: Data automatically syncs across all your devices
- **Manual Sync**: Tap "Sync Now" in Settings to force synchronization
- **Create Backup**: Generate local backup files for data safety
- **Restore from Backup**: Restore data from previously created backups
- **Status Monitoring**: View sync status and last sync time in Settings

## CSV Import Format

The application supports flexible CSV import with automatic column mapping. Supported column names include:

### Required Fields
- `firstname`, `first_name`, `first name`
- `lastname`, `last_name`, `last name`
- `farm`

### Optional Fields
- `address`, `mailingaddress`, `mailing_address`
- `city`, `state`, `zipcode`, `zip`, `zip_code`
- `email`, `email1`, `email2`
- `phone`, `phone1-6`, `phonenumber1-6`
- `siteaddress`, `site_address`, `sitecity`, `site_city`, `sitestate`, `site_state`, `sitezipcode`, `site_zipcode`
- `notes`

## Design System

### Color Palette
- **Primary**: Farm Green (#2E7D32)
- **Secondary**: Harvest Gold (#FFA000)
- **Background**: Light Gray (#F5F5F5)
- **Text**: Dark Gray (#333333)
- **Accent**: Sky Blue (#1976D2)

### Typography
- **Headers**: SF Pro Display, Bold, 24pt
- **Body**: SF Pro Text, Regular, 16pt
- **Captions**: SF Pro Text, Regular, 12pt

### Spacing
- **Small**: 8pt
- **Medium**: 16pt
- **Large**: 24pt
- **Extra Large**: 32pt

## Data Validation

### Email Validation
- Standard email format validation
- Supports international domains

### Phone Validation
- Accepts 10-15 digit numbers
- Supports international formats with country codes

### ZIP Code Validation
- 5-digit US ZIP codes
- 9-digit ZIP+4 format

## Future Enhancements

### Phase 4: Advanced Features
- Excel import support (CoreXLSX integration)
- Label generation (Avery templates)
- Multiple custom lists
- Communication history tracking
- Photo support for contacts

### Phase 5: Mac Desktop Features
- Menu bar integration
- Multi-window support
- Keyboard shortcuts
- Drag and drop support

### Phase 6: Advanced Export
- Custom report templates
- Batch operations
- Email integration
- Cloud sync support

## Testing

### Unit Tests
- Core Data operations
- Import/export functionality
- Data validation
- Contact management

### UI Tests
- Navigation flow
- Import/export workflows
- Contact creation/editing
- Search and filtering

## Performance Considerations

- Optimized for large datasets (10,000+ contacts)
- Background processing for import/export
- Memory-efficient list rendering
- Lazy loading for contact details

## Security & Privacy

- Core Data encryption support
- Secure file handling
- Privacy policy compliance
- User consent for data operations

## Support

For technical support or feature requests, please contact the development team.

## License

This project is proprietary software developed for Glaab Farm. All rights reserved. 