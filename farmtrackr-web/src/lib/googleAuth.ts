import { google } from 'googleapis'

// Google OAuth 2.0 configuration
const REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/oauth/callback`

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
)

// Google API scopes
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly', // Google Sheets read access
  'https://www.googleapis.com/auth/spreadsheets', // Google Sheets write access
  'https://www.googleapis.com/auth/contacts.readonly', // Google Contacts read access
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
  const client = google.sheets({ version: 'v4' })
  oauth2Client.setCredentials({ access_token: accessToken })
  return client
}

export function getAuthenticatedPeopleClient(accessToken: string) {
  const client = google.people({ version: 'v1' })
  oauth2Client.setCredentials({ access_token: accessToken })
  return client
}

