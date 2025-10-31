# Future Architecture: Dual Contact Lists

## Overview
The application will support two distinct contact lists with different use cases and data structures.

## Contact List Types

### 1. Farm Contacts List
- **Purpose**: Manage contacts associated with farms/estates
- **Data Source**: Uploaded farm data (spreadsheets, manual entry)
- **Key Field**: `farm` (dropdown of existing farms)
- **Behavior**: 
  - Farm field is a dropdown populated from existing farm contacts
  - Prevents typos and ensures consistency
  - Normalizes farm names automatically

### 2. General Contacts List  
- **Purpose**: Manage contacts from Google Contacts sync and other sources
- **Data Source**: Google Contacts API, manual entry
- **Key Field**: `tags` (multi-select, dynamic)
- **Behavior**:
  - Tags replace the farm field (e.g., "buyer", "seller", "client", "realtor")
  - Tags can be added dynamically as contacts are updated
  - Tags from Google Contacts should be imported automatically when syncing
  - Supports multiple tags per contact
  - Tags are user-defined and can evolve over time

## Implementation Notes

### Google Contacts Integration
- When syncing from Google Contacts, existing labels/tags should be imported
- Map Google Contacts labels to the new tag system
- Preserve existing tag structure during import

### Database Schema Considerations
- Consider separate tables or a unified table with a `contactType` field
- Farm contacts: `contactType = 'farm'`, uses `farm` field
- General contacts: `contactType = 'general'`, uses `tags` field (array)
- Migration path for existing data

### UI Considerations
- Navigation/views to switch between contact lists
- Filtering and search within each list
- Tag management interface (create, edit, merge tags)
- Tag autocomplete when adding/editing general contacts

## Transaction Coordinator

### Overview
Transaction Coordinator is an integrated document workflow system for managing real estate transactions from setup to completion. It provides seamless CAR form management and DocuSign integration to streamline the entire transaction process.

### CAR (California Association of Realtors) Integration
- **Form Library**: Maintain up-to-date CAR forms repository
  - RLA (Residential Listing Agreement)
  - RPA (Residential Purchase Agreement)
  - Other standard CAR forms as needed
- **Auto-updates**: System checks for new form versions periodically
- **Form Access**: Quick access to current forms for new client transactions
- **Version Control**: Track which form versions were used for each transaction

### DocuSign Integration
- **Document Sending**: Send transaction documents directly to clients via DocuSign
- **Signature Tracking**: Monitor document status and completion
- **Template Management**: Store and reuse common document templates
- **Status Notifications**: Real-time updates when documents are signed

### Transaction Coordinator Workflow
- **Create Transaction**: Set up new transaction directly from the app
  - Link transaction to contacts (buyer, seller, agents, etc.)
  - Select property/listing if applicable
  - Choose appropriate CAR forms for the transaction type
- **Document Pipeline**:
  1. Select or create CAR forms
  2. Auto-populate forms with contact/property data
  3. Review and edit documents
  4. Send via DocuSign
  5. Track signatures and completion
  6. Store completed documents in transaction record
- **Transaction Dashboard**: View all active transactions with status indicators
- **Document History**: Complete audit trail of all transaction documents

### Implementation Notes
- Integrate with CAR form API (if available) or manual update process
- DocuSign API integration for sending and tracking documents
- Transaction data model to link contacts, properties, and documents
- File storage for completed documents
- Document templates with merge fields from contact/property data

## Current Status
- ✅ Farm field converted to dropdown in ContactForm
- ✅ Dropdown populated from existing farm contacts
- ⏳ Dual contact list architecture (future)
- ⏳ Google Contacts sync (future)
- ⏳ Tag system for general contacts (future)
- ⏳ Transaction Coordinator module (future)
- ⏳ CAR form integration and auto-updates (future)
- ⏳ DocuSign integration (future)
- ⏳ Transaction workflow from app (future)

