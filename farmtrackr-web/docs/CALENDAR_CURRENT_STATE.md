# Calendar Module - Current State Analysis

## ✅ What's Already Working (PRESERVE ALL OF THIS)

### 1. Google OAuth Integration
- **Location**: `farmtrackr-web/src/lib/googleAuth.ts`
- **Status**: ✅ Fully functional
- **Features**:
  - OAuth 2.0 flow with refresh tokens
  - Scopes include: `calendar`, `calendar.events`
  - Helper: `getGoogleAccessToken()` - Gets/refreshes tokens
  - Helper: `getAuthenticatedCalendarClient()` - Creates authenticated client

### 2. Calendar List API
- **Route**: `GET /api/google/calendar/list`
- **Location**: `farmtrackr-web/src/app/api/google/calendar/list/route.ts`
- **Status**: ✅ Working
- **Returns**: List of Google calendars with colors, names, primary flag
- **Used by**: Calendar page to populate calendar picker

### 3. Events API (Google Calendar)
- **Routes**:
  - `GET /api/google/calendar/events` - Fetch events from Google
  - `POST /api/google/calendar/events` - Create event in Google
  - `PUT /api/google/calendar/events` - Update event in Google
- **Location**: `farmtrackr-web/src/app/api/google/calendar/events/route.ts`
- **Status**: ✅ All working
- **Features**:
  - Supports multiple calendars
  - Handles all-day events (date format)
  - Handles timed events (dateTime format)
  - Returns attendees, location, description
  - Calendar selection support

### 4. Calendar Page UI
- **Location**: `farmtrackr-web/src/app/calendar/page.tsx`
- **Status**: ✅ Fully functional
- **Features**:
  - **Views**: Month, Week, Day
  - **Navigation**: Prev/Next, Today button
  - **Calendar Picker**: Toggle Google calendars on/off
  - **Event Creation**: Full form with:
    - Title, description, location
    - Calendar selection dropdown
    - All-day checkbox
    - Start/end dates and times
    - Multi-day support
  - **Event Editing**: Inline edit modal
  - **Event Display**: Click to view/edit/open in Google
  - **Event Grid**: Displays events by date
  - **Color Coding**: Events show calendar colors

### 5. Event Creation Flow
- **Function**: `handleCreateEvent()` in calendar page
- **Status**: ✅ Working
- **Flow**:
  1. Validates form
  2. Formats dates (handles all-day vs timed)
  3. POSTs to `/api/google/calendar/events`
  4. Refreshes event list
  5. Closes modal

### 6. Event Editing Flow
- **Function**: `handleUpdateEvent()` in calendar page
- **Status**: ✅ Working
- **Flow**:
  1. Populates form from selected event
  2. User edits
  3. PUTs to `/api/google/calendar/events`
  4. Refreshes event list
  5. Closes modal

### 7. Event Fetching
- **Function**: `fetchEvents()` in calendar page
- **Status**: ✅ Working
- **Flow**:
  1. Gets selected calendars
  2. Fetches from each calendar via `/api/google/calendar/events`
  3. Normalizes events (handles all-day date parsing)
  4. Merges and sorts events
  5. Displays in grid

## ⚠️ Current Limitations

### 1. No Database Persistence
- Events are **only** fetched from Google Calendar API
- No local storage of events
- If Google API is down, no events show
- Can't have CRM-only events

### 2. One-Way Sync Only
- **CRM → Google**: ✅ Works (create/update)
- **Google → CRM**: ❌ Doesn't exist
- Changes made directly in Google Calendar don't appear until manual refresh
- No automatic sync

### 3. No CRM-Only Events
- All events must exist in Google Calendar
- Can't create events that stay only in CRM
- No transaction deadlines, listing reminders, etc.

### 4. No Event Linking
- Events can't link to:
  - Contacts (FarmContact, GeneralContact)
  - Listings/Deals
  - Tasks (ListingTaskInstance)
- No CRM context for events

### 5. No Recurring Events
- Can't create repeating events
- No RRULE support

### 6. No Attendees Management
- API supports attendees, but UI doesn't manage them
- Can't add/remove attendees from events

### 7. No Team/Sharing
- No shared calendars
- No permissions system
- Single-user only

## 🔄 Enhancement Strategy

### Phase 1: Add Database Layer (Non-Breaking)
**Goal**: Store events in database while keeping Google sync working

**Changes**:
1. Run Prisma migration (adds Calendar, Event, Attendee tables)
2. Create `/api/events` routes (new, doesn't replace existing)
3. Modify `handleCreateEvent` to:
   - Save to database (new)
   - Push to Google (existing - keep working)
   - Store `googleEventId` in database
4. Modify `handleUpdateEvent` similarly
5. Modify `fetchEvents` to:
   - Fetch from database (CRM events)
   - Fetch from Google (existing)
   - Merge and deduplicate

**Result**: 
- ✅ All existing functionality preserved
- ✅ Events now stored in database
- ✅ Can add CRM-only events later

### Phase 2: Bi-Directional Sync
**Goal**: Sync changes from Google back to CRM

**Changes**:
1. Create sync job/endpoint
2. Poll Google Calendar API periodically
3. Compare with database by `googleEventId`
4. Create/update local events
5. Handle conflicts

**Result**:
- ✅ Changes in Google appear in CRM
- ✅ Full bi-directional sync

### Phase 3: CRM Features
**Goal**: Add CRM-specific functionality

**Changes**:
1. Add "Create only in CRM" option
2. Link events to contacts/deals/tasks
3. Auto-generate CRM events (deadlines, reminders)
4. Workflow automations

**Result**:
- ✅ CRM-only events
- ✅ Event linking
- ✅ Auto-generated events

### Phase 4: Advanced Features
**Goal**: Match Google Calendar feature set

**Changes**:
1. Recurring events (RRULE)
2. Attendees management UI
3. Team/shared calendars
4. Permissions system

**Result**:
- ✅ Full feature parity with Google Calendar
- ✅ Plus CRM enhancements

## 🎯 Key Principles

1. **Backward Compatibility**: All existing code continues to work
2. **Additive Changes**: New features don't replace existing ones
3. **Dual-Write Pattern**: Write to both DB and Google (for synced events)
4. **Graceful Degradation**: If Google API fails, show DB events
5. **Incremental Rollout**: Build and test each phase separately

## 📋 Implementation Checklist

### Database & Models
- [x] Prisma models created
- [ ] Migration run
- [ ] Models tested

### API Routes
- [x] `/api/google/calendar/*` (existing - keep)
- [ ] `/api/events` (new - for database)
- [ ] `/api/calendar` (new - for calendar management)
- [ ] `/api/events/google-sync` (new - for sync)

### Client Updates
- [ ] Update `handleCreateEvent` to save to DB
- [ ] Update `handleUpdateEvent` to save to DB
- [ ] Update `fetchEvents` to merge DB + Google
- [ ] Add "CRM-only" option to create form

### Sync Infrastructure
- [ ] Create sync service
- [ ] Add background sync job
- [ ] Handle conflicts
- [ ] Track sync status

### Testing
- [ ] Existing features still work
- [ ] Events save to database
- [ ] Events sync to Google
- [ ] Events sync from Google
- [ ] CRM-only events work
- [ ] No breaking changes

