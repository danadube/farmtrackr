# Git Repository Analysis

## Issue: Many files showing in git status

### Root Cause

There are **TWO separate git repositories**:

1. **Root Repository**: `/Users/danadube/Desktop/FarmTrackr-old/`
   - This is tracking files at the root level
   - Has duplicate files with " 2" suffix (from macOS duplicate operations)
   - Has some files that should be in `farmtrackr-web/`

2. **Subdirectory Repository**: `/Users/danadube/Desktop/FarmTrackr-old/farmtrackr-web/`
   - This is the actual working repository
   - Clean and up to date

### Problems Found

1. **Duplicate Files with " 2" suffix**:
   - `README 2.md`
   - `ROADMAP 2.md`
   - `VERCEL_DEPLOYMENT 2.md`
   - `docs/* 2.md` (multiple documentation files)
   - `archive/xcode-projects/FarmTrackr 2.xcodeproj/`
   - Many more...

2. **Files in wrong location**:
   - `src/app/DashboardClient.tsx` (deleted in root, should be in farmtrackr-web)
   - `src/app/globals.css` (deleted in root)
   - `src/app/layout.tsx` (deleted in root)
   - `src/app/page.tsx` (deleted in root)

3. **Root repository has changes**:
   - The root directory is a git repository tracking things separately
   - This is causing confusion

### Solution

The root repository should either:
- **Option 1**: Be removed/ignored (recommended)
- **Option 2**: Have all files cleaned up and organized

### Recommended Actions

1. **Remove duplicate files** with " 2" suffix
2. **Clean up root repository** - either remove it or properly organize
3. **Work only in `farmtrackr-web/`** directory for the web app

---

*Generated: November 3, 2025*

