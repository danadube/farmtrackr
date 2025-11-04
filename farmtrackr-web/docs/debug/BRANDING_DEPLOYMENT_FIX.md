# Branding Gradient Deployment Fix

## Issue
The green header gradient (Meadow Green #689f38 → Forest Green #558b2f) was not showing in deployment across browsers (Chrome, Safari, Arc).

## Root Cause
When using inline styles in React, if both `background` (gradient) and `backgroundColor` (solid color) are set, some browsers or CSS specificity rules may cause `backgroundColor` to override the gradient.

## Solution
Explicitly set `backgroundColor: 'transparent'` in:
1. `headerCard` style object in `useThemeStyles.ts`
2. `headerTint` function return in `useThemeStyles.ts`
3. Dashboard header inline style in `DashboardClient.tsx`

This ensures the gradient `background` property takes precedence.

## Changes Made

### File: `src/hooks/useThemeStyles.ts`
- Added `backgroundColor: 'transparent'` to `headerCard`
- Added `backgroundColor: 'transparent'` to `headerTint` return object

### File: `src/app/DashboardClient.tsx`
- Added `backgroundColor: 'transparent'` to Dashboard header inline style

## Testing
After deployment, verify:
1. Dashboard header shows gradient (Meadow Green → Forest Green)
2. All page headers using `headerCard` or `headerTint(colors.primary)` show gradient
3. Works in Chrome, Safari, and Arc browsers
4. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to clear browser cache

## Browser Cache Clearing
If gradient still doesn't show:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache completely
3. Check Vercel deployment logs to ensure build completed successfully
4. Verify build includes latest commit: `8fa9111` or later

## Commit History
- `8fa9111` - Initial gradient implementation
- Latest commit - Added `backgroundColor: 'transparent'` fix

