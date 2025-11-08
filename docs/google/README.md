# Google Integration Documentation

This directory contains all documentation related to Google services integration (Sheets, Contacts, Drive, Calendar).

## Files

- **GOOGLE_CONTACTS_INTEGRATION.md** - Overview and planning for Google Contacts integration
- **GOOGLE_OAUTH_SETUP.md** - Step-by-step OAuth 2.0 setup instructions
- **GOOGLE_SHEETS_SETUP.md** - Google Sheets API setup and configuration
- **OAUTH_CONSENT_SCREEN_SETUP.md** - Google OAuth consent screen configuration
- **QUICK_GOOGLE_SETUP.md** - Quick start guide for Google integrations
- **TROUBLESHOOTING_GOOGLE_OAUTH.md** - Common issues and solutions for Google OAuth

## Quick Start

For a quick overview, start with **QUICK_GOOGLE_SETUP.md**.

For detailed OAuth setup, follow **GOOGLE_OAUTH_SETUP.md** and **OAUTH_CONSENT_SCREEN_SETUP.md**.

## Status

Most Google integrations are planned for v0.5.0. See the main **ROADMAP.md** for current status.

## Calendar Integration

FarmTrackr now supports Google Calendar sync for the dashboard schedule and the standalone calendar page.

- **OAuth scope required:** `https://www.googleapis.com/auth/calendar`
- Update your Google Cloud OAuth consent screen to include the new scope, then redeploy.
- After deploying, reconnect Google from the in-app settings so the additional permission is granted.
- API endpoints:
  - `GET /api/google/calendar/events` (list events with `timeMin` / `timeMax`)
  - `POST /api/google/calendar/events` (create events)

