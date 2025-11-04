# FarmTrackr - Next Logical Steps

**Last Updated:** November 2, 2025  
**Current Version:** v0.6.0 (Commission Tracking) ✅ COMPLETE  
**Next Priority:** v0.7.0 (UI/UX Enhancements & Polish)

---

## 🎯 Immediate Next Steps (v0.7.0)

### 1. Dashboard Quick Actions Redesign ⭐ **START HERE**
**Priority:** High | **Effort:** Medium | **Impact:** High

**Current State:**
- Quick actions are in a vertical, centered layout (4-column grid)
- Icons and text are centered

**Target State:**
- Change to horizontal layout
- Icon on the left, text left-justified to the icon
- More compact and efficient use of space
- Better visual hierarchy

**Tasks:**
- [ ] Modify `DashboardClient.tsx` quick actions section
- [ ] Change grid layout from vertical-centered to horizontal
- [ ] Align icons to the left
- [ ] Left-justify text next to icons
- [ ] Test responsive behavior

**Files to Modify:**
- `src/app/DashboardClient.tsx` (lines 155-250 approx.)

---

### 2. Additional Quick Actions
**Priority:** Medium | **Effort:** Low-Medium | **Impact:** Medium

**Suggested Actions to Add:**
- [ ] Add New Transaction (link to `/commissions/new`)
- [ ] View Commissions (link to `/commissions`)
- [ ] Data Quality (link to `/data-quality`)
- [ ] Google Contacts (link to `/google-contacts`)
- [ ] Settings (link to `/settings`)
- [ ] Google Sheets Sync (link to `/google-sheets`)

**Tasks:**
- [ ] Add new quick action cards with appropriate icons
- [ ] Update grid to accommodate additional actions (maybe 6 columns or responsive)
- [ ] Ensure consistent styling and hover effects
- [ ] Test all navigation links

**Files to Modify:**
- `src/app/DashboardClient.tsx`

---

### 3. Button Animation System
**Priority:** Medium | **Effort:** Medium | **Impact:** Medium

**Already Implemented:**
- ✅ Commission page buttons have press feedback

**Tasks:**
- [ ] Create reusable button press animation utility/hook
- [ ] Apply to all buttons across the app:
  - Dashboard quick actions
  - Contact form buttons
  - Commission page buttons (already done)
  - Settings buttons
  - All navigation and action buttons
- [ ] Ensure consistent animation timing and style

**Files to Create/Modify:**
- `src/hooks/useButtonPress.ts` (new utility hook)
- Apply across all components with buttons

---

### 4. Dashboard Card Improvements
**Priority:** Medium | **Effort:** Low | **Impact:** Medium

**Tasks:**
- [ ] **Combine Total Contacts & Validation Issues Cards**
  - Merge into single card with two metrics
  - Show validation issues count as a badge/chip
- [ ] **Double Active Farms Card Size**
  - Increase card height/width
  - Better overflow handling for many farms
  - Scrollable chip container if needed

**Files to Modify:**
- `src/app/DashboardClient.tsx`

---

### 5. Active Farms Card - Overflow Handling
**Priority:** Low-Medium | **Effort:** Medium | **Impact:** Medium

**Tasks:**
- [ ] Implement scrollable chip container
- [ ] Add visual indicators for scrollable content
- [ ] Better layout for many farms
- [ ] Responsive behavior on mobile

**Files to Modify:**
- `src/app/DashboardClient.tsx`

---

## 📋 Next Priority: v0.12.0 (Quick Wins)

After v0.7.0, these are quick wins that provide immediate value:

### 6. Transaction Export Column Selection
**Priority:** Medium | **Effort:** Medium | **Impact:** High

**Tasks:**
- [ ] Add column selection UI to export dialog
- [ ] Allow users to choose which fields to export
- [ ] Save preferences for future exports
- [ ] Update CSV/Excel export endpoints

### 7. Google Contact Tag Colors
**Priority:** Medium | **Effort:** Medium | **Impact:** Medium

**Tasks:**
- [ ] Add color picker for Google contact tags
- [ ] Store tag colors in database
- [ ] Display colored chips in UI
- [ ] Visual tag organization and filtering

---

## 🚀 Future Priorities (After v0.7.0)

### v0.8.0 - Email Integration ⭐ **HIGH PRIORITY**
- Gmail full email client (send AND receive)
- Email templates
- Link emails to contacts/transactions
- **Estimated:** Major feature, 4-5 weeks

### v0.10.0 - Task Management
- Apple Reminders sync
- Link tasks to contacts/transactions
- **Estimated:** 2-3 weeks

### v0.9.0 - Transaction Pipeline
- Standard pipeline stages
- Asana-like task management per stage
- Forms needed per stage
- **Priority:** Lower - can come after email
- **Estimated:** 5-6 weeks

### v0.11.0 - Security & Personalization
- Single-user authentication
- Personal logo import
- Custom branding
- **Priority:** Toward end, before v1.0.0

---

## 📊 Recommended Development Order

**Phase 1: UI/UX Polish (v0.7.0)** - 1-2 weeks
1. Dashboard Quick Actions Redesign ⭐
2. Additional Quick Actions
3. Button Animation System
4. Dashboard Card Improvements
5. Active Farms Card Overflow

**Phase 2: Quick Wins (v0.12.0)** - 1 week
6. Transaction Export Column Selection
7. Google Contact Tag Colors

**Phase 3: Major Features**
8. Email Integration (Gmail) - v0.8.0
9. Task Management - v0.10.0
10. Transaction Pipeline - v0.9.0
11. Security & Personalization - v0.11.0

---

## 🎯 Where to Start Right Now

**Recommended:** Start with **Dashboard Quick Actions Redesign** (#1)

This is:
- ✅ High impact (improves daily UX)
- ✅ Medium effort (focused scope)
- ✅ Explicitly requested by user
- ✅ Sets foundation for additional quick actions (#2)

**Quick Win Alternative:** If you want something faster, start with **Dashboard Card Improvements** (#4) - combining cards and resizing Active Farms card is straightforward.

---

## 📝 Notes

- Button animations are already implemented on commission page - can be used as reference
- Quick actions redesign is user-requested and should be prioritized
- All v0.7.0 tasks improve existing features rather than adding new ones
- After v0.7.0, focus shifts to major features (Email, Tasks, Pipeline)

