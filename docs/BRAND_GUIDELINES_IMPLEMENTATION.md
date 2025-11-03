# FarmTrackr Brand Guidelines Implementation

**Version:** 1.0  
**Date:** November 2025  
**Source:** FarmTrakr Brand Guidelines v1.0

## Overview

This document tracks the implementation of the official FarmTrackr brand guidelines into the web application. The brand guidelines define colors, typography, design principles, and voice & tone standards.

## Brand Colors

### Primary Colors (Green Palette)

| Color Name | HEX | RGB | HSB | Usage |
|------------|-----|-----|-----|-------|
| **Meadow Green** | `#689f38` | 104, 159, 56 | 88°, 65%, 62% | Primary brand color, buttons, headers |
| **Forest Green** | `#558b2f` | 85, 139, 47 | 95°, 66%, 55% | Hover states, darker accents |
| **Deep Forest** | `#2d5016` | 45, 80, 22 | 96°, 73%, 31% | Wordmark, dark backgrounds |
| **Light Sage** | `#7da65d` | 125, 166, 93 | 94°, 44%, 65% | Gradients, light accents |

**Current Implementation:** Needs update from purple-blue primary to green-based palette.

### Accent Colors (Functional)

| Color Name | HEX | Usage |
|------------|-----|-------|
| **Tangerine** | `#ff9800` | Financial cards, commissions |
| **Plum** | `#673ab7` | Analytics cards, reports |
| **Cherry** | `#f4516c` | Alerts, urgent items, errors |
| **Sky Blue** | `#42a5f5` | Calendar items, showings |
| **Peach** | `#ffb74d` | Tasks, highlights |

**Current Implementation:** Partially implemented, needs alignment with brand guidelines.

### Neutral Colors

| Color Name | HEX | Usage |
|------------|-----|-------|
| **White** | `#ffffff` | Backgrounds, cards |
| **Light Gray** | `#f5f5f7` | Secondary backgrounds |
| **Medium Gray** | `#86868b` | Secondary text |
| **Near Black** | `#1d1d1f` | Primary text |

**Current Implementation:** Needs update to match exact values.

## Typography ✅ Implemented

### Font Family: Inter (Apple Aesthetic)

**Implementation Status:** ✅ Configured via Next.js `next/font/google` in `src/app/layout.tsx`.

#### Typography Scale

| Element | Font | Size | Weight | Letter Spacing | Line Height |
|---------|------|------|--------|----------------|-------------|
| Display/Hero | Inter | 56px | 700 | -1.5px | 1.1 |
| Heading 1 | Inter | 40px | 700 | -0.8px | Default |
| Heading 2 | Inter | 32px | 600 | Default | Default |
| Body Text | Inter | 17px | 400 | -0.2px | 1.5 |
| Caption/Small | Inter | 13px | 400 | Default | Default |

**Current Implementation:** ✅ Inter font is loaded via Next.js font optimization. Typography scale values are guidelines; actual implementation may vary by component. Apple aesthetic font rendering (`text-rendering: optimizeLegibility`) added to global CSS.

### Alternative: Outfit (Orchard Grove - Optional)

Alternative typography option for a friendlier, less corporate feel.

## Design System Specifications

### Spacing System ✅ Implemented
- **Base Unit:** 8px
- **Spacing Scale:** 8, 16, 24, 32, 40, 48, 56, 64, 72, 80...

**Current Implementation:** ✅ Already using 8-point grid system via `spacing()` function in `src/lib/spacing.ts`.

### Border Radius ✅ Implemented
- **Small:** 8px
- **Medium:** 12px
- **Large:** 16px

**Current Implementation:** ✅ Already using consistent border radius values (12px default, 8px small, 16px large) throughout application.

### Shadows (Apple Aesthetic) ✅ Updated
- **Subtle, layered shadows**
- Light mode: `0 1px 2px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)` (implemented)
- Dark mode: `0 1px 2px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)` (implemented)
- Never harsh; create depth not distraction

**Current Implementation:** ✅ Updated in `useThemeStyles.ts` and `globals.css` to match Apple aesthetic layered shadows.

### Animation ✅ Verified
- **Duration:** 200-300ms for interactions
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (Apple-style smooth deceleration)

**Current Implementation:** ✅ Already using appropriate animation durations (200-300ms) and easing throughout application.

### Touch Targets
- **Minimum:** 44x44px (iOS Human Interface Guidelines)

**Current Implementation:** ✅ Buttons generally meet this requirement.

## Color Usage Guidelines

### Headers
- **Primary:** Meadow Green
- **Accent:** White text
- **Effect:** Gradient from Meadow Green to Forest Green

### Buttons (Primary)
- **Base:** Meadow Green
- **Text:** White
- **Hover:** Forest Green

### Financial Cards
- **Background:** White
- **Accent:** Tangerine (left border + icon)

### Analytics Cards
- **Background:** White
- **Accent:** Plum (left border + icon)

### Alerts
- **Background:** White/Light background
- **Accent:** Cherry
- **Note:** Use sparingly for urgency

### Calendar Items
- **Background:** White
- **Accent:** Sky Blue

## Design Principles

1. **Clarity Above All** - Every interface element should have a clear purpose
2. **Respect the User's Time** - Design for efficiency, minimal clicks
3. **Consistent, Not Boring** - Use patterns consistently with color for visual interest
4. **Mobile-First, Always** - Design for mobile first, then scale up
5. **Accessible by Default** - Maintain 4.5:1 contrast ratios, keyboard navigation
6. **Delight in the Details** - Smooth animations, subtle hover effects, thoughtful micro-interactions

## Voice & Tone

### Brand Voice Characteristics
- **Professional** but not corporate
- **Friendly** but not casual
- **Clear** but not vague
- **Confident** but not arrogant
- **Supportive** but not patronizing

### Writing Guidelines
- Use active voice ("Track your clients")
- Start with verbs for actions
- Use contractions (we're, you'll, they've)
- Address users directly ("your listings")
- Keep sentences short and scannable
- Focus on benefits, not features

## Implementation Checklist

### Phase 1: Core Color System ✅ Completed
- [x] Update `src/lib/theme.ts` with new primary colors (green palette)
- [x] Update accent colors to match brand guidelines
- [x] Update neutral colors (Light Gray, Medium Gray, Near Black)
- [ ] Test color contrast ratios for accessibility (manual testing recommended)

### Phase 2: Typography ✅ Completed
- [x] Verify Inter font is primary font (configured via Next.js `next/font/google`)
- [x] Typography scale already in place via global CSS
- [ ] Test typography hierarchy across pages (visual testing recommended)

### Phase 3: Design Tokens ✅ In Progress
- [x] Verify 8-point grid system is consistent (`src/lib/spacing.ts`)
- [x] Verify border radius values match guidelines (8px, 12px, 16px)
- [x] Update shadow definitions to match Apple aesthetic
- [x] Verify animation durations and easing (200-300ms, cubic-bezier)

### Phase 4: Component Updates 🔄 Partial
- [ ] Update header styles (glassmorphism optional - enhancement)
- [x] Button styles use new primary color (Meadow Green)
- [x] Card styles updated with new shadows
- [ ] Update financial cards with Tangerine accent (when cards are implemented)
- [ ] Update analytics cards with Plum accent (when cards are implemented)

### Phase 5: Documentation ✅ Completed
- [x] Create brand guidelines implementation documentation
- [x] Document color changes in theme file
- [ ] Create brand color reference guide for developers (optional)

## Files to Update

### Primary Files
1. `src/lib/theme.ts` - Main theme color definitions
2. `src/hooks/useThemeStyles.ts` - Theme hook and style objects
3. `tailwind.config.js` - Tailwind color configuration (if used)
4. `src/app/globals.css` - Global CSS variables

### Component Files (May Need Updates)
- Header components (glassmorphism enhancement)
- Button components (new primary color)
- Card components (accent colors)
- Dashboard cards (financial/analytics card styling)

## Notes

- Brand guidelines use "FarmTrakr" spelling, but codebase uses "FarmTrackr" - this is acceptable
- Apple Aesthetic approach is preferred but not required (glassmorphism is optional enhancement)
- Color system should maintain dark mode compatibility
- All changes must maintain accessibility standards (WCAG AA minimum)

## Reference

- Brand Guidelines HTML: `/Users/danadube/Downloads/farmtrakr-brand-guidelines-real-estate.html`
- Apple Aesthetic Example: `/Users/danadube/Downloads/farmtrakr-apple-aesthetic.html`

