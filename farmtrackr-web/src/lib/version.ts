/**
 * Version Information
 * 
 * To update the version:
 * 1. Update version in package.json (e.g., "1.2.3")
 * 2. Update BUILD_NUMBER here (increment for each build/deployment)
 * 3. Update LAST_UPDATED date
 * 4. Update APP_VERSION here to match package.json
 * 
 * See docs/setup/VERSION_UPDATE.md for detailed instructions
 */

// IMPORTANT: Keep this in sync with package.json version
export const APP_VERSION = '0.5.0'
export const BUILD_NUMBER = '20251101.1' // Format: YYYYMMDD.buildNumber (increment buildNumber for same day)
export const LAST_UPDATED = 'November 1, 2025'
export const APP_NAME = 'FarmTrackr'

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    build: BUILD_NUMBER,
    lastUpdated: LAST_UPDATED,
    name: APP_NAME,
    fullVersion: `${APP_VERSION} (Build ${BUILD_NUMBER})`
  }
}

