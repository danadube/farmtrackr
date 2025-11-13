# Calendar Module - Google Calendar-Style Implementation Roadmap

## Project Overview

Build a full-featured Calendar module that:
1. Visually and behaviorally matches Google Calendar
2. Syncs bi-directionally with Google Calendar
3. Supports CRM-specific events & layers
4. Is modular, scalable, and AI-ready

## Current State Assessment

### ✅ What We Have (PRESERVE THESE)
- **Calendar Views**: Month, Week, Day views with navigation
- **Google OAuth Integration**: Fully working OAuth 2.0 flow
- **Google Calendar API Integration**:
  - `GET /api/google/calendar/list` - Fetches Google calendars
  - `GET /api/google/calendar/events` - Fetches events from Google
  - `POST /api/google/calendar/events` - Creates events in Google
  - `PUT /api/google/calendar/events` - Updates events in Google
- **Event Creation**: Full form with calendar selection, all-day, multi-day support
- **Event Editing**: Inline edit modal with all fields
- **Event Display**: Click to view, edit, or open in Google Calendar
- **Calendar Picker**: Toggle Google calendars on/off
- **UI Components**: Working calendar grid, event modals, forms
- **Helper Functions**: `getGoogleAccessToken()`, `getAuthenticatedCalendarClient()`

### ⚠️ Current Architecture
- **Events are NOT persisted in database** - Only fetched from Google API
- **One-way sync** - CRM → Google (when creating/editing)
- **No bi-directional sync** - Changes in Google don't auto-update in CRM
- **No CRM-only events** - All events must exist in Google Calendar
- **No event linking** - Events can't link to contacts, deals, tasks

### ❌ What's Missing (ADD THESE)
- Database models for Calendar and Event (✅ JUST ADDED)
- Bi-directional sync infrastructure
- CRM-only calendars and events
- Event persistence in database
- Drag and drop functionality
- Recurring events (RRULE)
- Attendees management
- CRM entity linking (contacts, deals, tasks)
- Team/shared calendars
- Auto-generated CRM events
- Google Calendar-style UI (mini calendar, drag/drop, etc.)
- Conflict resolution
- Sync status tracking
- AI endpoint structure

## Implementation Phases

### Phase 1: Foundation (Current)
- [x] Database models (Calendar, Event, Attendee, RepeatRule, CalendarShare)
- [ ] Database migration
- [x] Helper functions for Google Calendar API (already exist)
- [ ] Sync infrastructure that works WITH existing API routes
- [ ] Preserve existing UI/UX while adding database layer

### Phase 2: Bi-Directional Sync
- [x] Outbound sync (CRM → Google) - **ALREADY WORKS** via existing POST/PUT routes
- [ ] **ENHANCE**: Store events in DB when creating/updating (dual-write)
- [ ] Inbound sync (Google → CRM) - Poll or webhook
- [ ] Sync status tracking
- [ ] Conflict resolution
- [ ] Background sync jobs

### Phase 3: CRM Features
- [ ] CRM-only calendars
- [ ] Event linking to CRM entities
- [ ] Auto-generated CRM events
- [ ] Workflow automations

### Phase 4: Advanced Features
- [ ] Recurring events (RRULE)
- [ ] Attendees management
- [ ] Team/shared calendars
- [ ] Permissions system

### Phase 5: UI/UX Improvements
- [ ] Google Calendar-style layout
- [ ] Drag and drop
- [ ] Mini calendar
- [ ] Smooth transitions
- [ ] Mobile responsive

### Phase 6: AI Structure
- [ ] AI endpoint scaffolding
- [ ] Data model hooks for AI

## Technical Details

### Database Models (✅ Complete)

**Calendar Model:**
- Supports both Google and CRM calendars
- Tracks sync status
- Supports sharing

**Event Model:**
- Links to Google Calendar via `googleEventId`
- Tracks sync status
- Supports recurring events
- Links to CRM entities

**Attendee Model:**
- Supports Google Contacts integration
- Tracks response status

### API Routes Needed

```
/api/calendar
  GET    - List all calendars (Google + CRM)
  POST   - Create CRM calendar

/api/calendar/[id]
  GET    - Get calendar details
  PUT    - Update calendar
  DELETE - Delete calendar

/api/calendar/google
  GET    - List Google calendars
  POST   - Sync Google calendars to DB

/api/events
  GET    - List events (with filters)
  POST   - Create event

/api/events/[id]
  GET    - Get event details
  PUT    - Update event
  DELETE - Delete event

/api/events/google-sync
  POST   - Trigger sync from Google
  GET    - Get sync status

/api/events/attendees
  POST   - Add attendee
  DELETE - Remove attendee

/api/ai/schedule (structure only)
  POST   - AI scheduling suggestions

/api/ai/parse-event (structure only)
  POST   - Parse natural language to event
```

### Sync Strategy

**Outbound (CRM → Google) - ENHANCE EXISTING:**
1. User creates/edits event in CRM (existing flow works)
2. **NEW**: Also save to database with `syncStatus = "pending"`
3. Push to Google Calendar API (existing POST/PUT routes)
4. **NEW**: Store `googleEventId` in database
5. **NEW**: Set `syncStatus = "synced"` in database
6. **PRESERVE**: Existing UI continues to work

**Inbound (Google → CRM) - NEW:**
1. Poll Google Calendar API (use existing GET route)
2. Compare `googleEventId` with local events
3. Create/update local events in database
4. Handle conflicts (use `updatedAt` timestamp)

**Display Strategy:**
- Merge events from database (CRM + synced Google) with live Google events
- Show both CRM-only events and Google events
- Use database as source of truth for CRM events
- Use Google API for real-time Google events

**Conflict Resolution:**
- If edited in both: Use most recent `updatedAt`
- If deleted in Google: Archive CRM copy (unless CRM-only)
- If deleted in CRM: Delete from Google

## Next Steps

1. Run database migration
2. Create helper functions for Google Calendar API
3. Build sync infrastructure
4. Update calendar page to use database
5. Add CRM-only calendar support
6. Implement bi-directional sync
7. Add advanced features incrementally

