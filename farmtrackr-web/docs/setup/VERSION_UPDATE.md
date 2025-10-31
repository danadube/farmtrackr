# Version Update Guide

## 📍 Where to Update Version Numbers

When updating the application version, update the following files:

### 1. **package.json**
**Location:** `/farmtrackr-web/package.json`
**Field:** `"version"`
**Format:** Semantic versioning (e.g., `"1.2.3"`)
```json
{
  "version": "1.2.3"
}
```

### 2. **src/lib/version.ts**
**Location:** `/farmtrackr-web/src/lib/version.ts`
**Fields to update:**
- `APP_VERSION`: Must match package.json version (e.g., `'0.2.0'`)
- `BUILD_NUMBER`: Format `YYYYMMDD.buildNumber` (e.g., `20250129.1`)
  - Increment build number if same day, or use new date
- `LAST_UPDATED`: Human-readable date (e.g., `'January 29, 2025'`)
```typescript
export const APP_VERSION = '0.2.0' // Must match package.json
export const BUILD_NUMBER = '20250129.1' // Format: YYYYMMDD.buildNumber
export const LAST_UPDATED = 'January 29, 2025'
```

### 3. **ROADMAP.md** (Optional but recommended)
**Location:** `/farmtrackr-web/ROADMAP.md`
**Fields to update:**
- `Current Version:` at the top
- `Last Updated:` date
- Version history sections

## 🔄 Update Process

1. **Update package.json version**
   ```bash
   # Edit package.json and update version field
   ```

2. **Update src/lib/version.ts**
   ```bash
   # Update APP_VERSION to match package.json
   # Update BUILD_NUMBER (increment if same day)
   # Update LAST_UPDATED date
   ```

3. **Rebuild and test**
   ```bash
   npm run build
   npm run dev  # Test locally
   ```

4. **Deploy**
   ```bash
   vercel --prod --yes
   ```

5. **Verify**
   - Check footer shows new build number
   - Check Settings → About shows correct version info

## 📝 Build Number Convention

- **Format:** `YYYYMMDD.buildNumber`
- **Example:** `20250129.1` means January 29, 2025, build #1
- **Increment:** If multiple builds same day, increment: `.1`, `.2`, `.3`, etc.
- **New day:** Use new date, reset to `.1`

## ✅ Checklist

- [ ] Updated `package.json` version
- [ ] Updated `APP_VERSION` in `src/lib/version.ts` (must match package.json)
- [ ] Updated `BUILD_NUMBER` in `src/lib/version.ts`
- [ ] Updated `LAST_UPDATED` in `src/lib/version.ts`
- [ ] Updated `ROADMAP.md` (optional)
- [ ] Built and tested locally
- [ ] Deployed to production
- [ ] Verified footer shows correct build
- [ ] Verified Settings → About shows correct version

