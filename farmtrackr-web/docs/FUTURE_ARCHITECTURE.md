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

## Current Status
- ✅ Farm field converted to dropdown in ContactForm
- ✅ Dropdown populated from existing farm contacts
- ⏳ Dual contact list architecture (future)
- ⏳ Google Contacts sync (future)
- ⏳ Tag system for general contacts (future)

