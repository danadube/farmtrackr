# Calendar Module Migration Plan

## Goal
Enhance existing calendar functionality by adding database persistence and bi-directional sync, while preserving all current features.

## Current Architecture (Preserve)

```
Calendar Page (Client)
  ↓
/api/google/calendar/events (GET) → Google Calendar API
/api/google/calendar/events (POST) → Google Calendar API  
/api/google/calendar/events (PUT) → Google Calendar API
/api/google/calendar/list (GET) → Google Calendar API
```

**Events are NOT stored in database - only fetched from Google**

## New Architecture (Add Layer)

```
Calendar Page (Client)
  ↓
/api/events (NEW) → Database + Google Sync
  ├─ GET: Merge DB events + Google events
  ├─ POST: Save to DB + Push to Google
  ├─ PUT: Update DB + Update Google
  └─ DELETE: Delete from DB + Delete from Google

/api/google/calendar/* (KEEP EXISTING)
  └─ Use for direct Google operations and sync
```

## Migration Steps

### Step 1: Database Layer (Non-Breaking)
- [x] Add Prisma models
- [ ] Run migration
- [ ] Create `/api/events` routes that work alongside existing routes
- [ ] Test that existing calendar page still works

### Step 2: Dual-Write Pattern
- [ ] Modify `handleCreateEvent` to:
  1. Save to database (new)
  2. Push to Google (existing - keep working)
  3. Update database with `googleEventId` (new)
- [ ] Modify `handleUpdateEvent` similarly
- [ ] Test: Events appear in both DB and Google

### Step 3: Merge Display
- [ ] Update `fetchEvents` to:
  1. Fetch from database (CRM events)
  2. Fetch from Google API (existing)
  3. Merge and deduplicate by `googleEventId`
- [ ] Test: All events display correctly

### Step 4: Inbound Sync
- [ ] Create sync job that:
  1. Fetches from Google API
  2. Compares with database
  3. Creates/updates local events
- [ ] Test: Changes in Google appear in CRM

### Step 5: CRM-Only Events
- [ ] Add "Create only in CRM" option
- [ ] Events with `source = "crm"` don't sync to Google
- [ ] Test: CRM-only events work independently

## Backward Compatibility

**CRITICAL**: All existing functionality must continue to work:
- ✅ Calendar views (month/week/day)
- ✅ Event creation
- ✅ Event editing
- ✅ Calendar selection
- ✅ All-day events
- ✅ Multi-day events
- ✅ Opening events in Google Calendar

**New features are ADDITIVE, not replacements.**

## Testing Checklist

- [ ] Can create event → Appears in Google Calendar
- [ ] Can edit event → Updates in Google Calendar
- [ ] Event saved in database with `googleEventId`
- [ ] Can view events from both DB and Google
- [ ] Changes in Google appear in CRM (after sync)
- [ ] CRM-only events don't sync to Google
- [ ] Existing UI/UX unchanged
- [ ] No breaking changes to API contracts

