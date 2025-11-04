import { cookies } from 'next/headers'
import { oauth2Client } from './googleAuth'

/**
 * Get Google access token from cookies
 * Returns the token or null if not available/expired
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value
  const expiryStr = cookieStore.get('google_token_expiry')?.value

  // If we have a valid access token, return it
  if (accessToken && expiryStr) {
    const expiry = parseInt(expiryStr, 10)
    if (Date.now() < expiry) {
      return accessToken
    }
  }

  // If access token is expired but we have a refresh token, refresh it
  if (refreshToken && !accessToken) {
    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken })
      const { credentials } = await oauth2Client.refreshAccessToken()
      
      if (credentials.access_token) {
        // Update cookies with new token
        const newExpiry = credentials.expiry_date ? credentials.expiry_date.toString() : undefined
        cookieStore.set('google_access_token', credentials.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
          path: '/',
        })
        if (newExpiry) {
          cookieStore.set('google_token_expiry', newExpiry, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60,
            path: '/',
          })
        }
        
        return credentials.access_token
      }
    } catch (error) {
      console.error('Failed to refresh Google token:', error)
      return null
    }
  }

  return accessToken || null
}

