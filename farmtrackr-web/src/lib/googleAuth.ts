import { google } from 'googleapis'

// Google OAuth 2.0 configuration
// Note: In production, use GOOGLE_OAUTH_REDIRECT_URI explicitly
// The fallback construction may use the wrong domain if NEXT_PUBLIC_APP_URL isn't set
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/oauth/callback`

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
)

// Google API scopes
// Note: These must match the scopes configured in Google Cloud Console OAuth consent screen
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets', // Google Sheets (read/write access)
  'https://www.googleapis.com/auth/contacts.readonly', // Google Contacts read access
  'https://www.googleapis.com/auth/calendar', // Google Calendar read/write access
]

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
    state: state || undefined,
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

/**
 * Create authenticated Google API clients
 */
export function getAuthenticatedSheetsClient(accessToken: string) {
  // Create a new OAuth2 client instance and set credentials
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
  auth.setCredentials({ access_token: accessToken })
  
  const client = google.sheets({ version: 'v4', auth })
  return client
}

export function getAuthenticatedPeopleClient(accessToken: string) {
  // Create a new OAuth2 client instance and set credentials
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
  auth.setCredentials({ access_token: accessToken })
  
  const client = google.people({ version: 'v1', auth })
  return client
}

export function getAuthenticatedCalendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  )
  auth.setCredentials({ access_token: accessToken })

  const client = google.calendar({ version: 'v3', auth })
  return client
}

