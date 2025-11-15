import { cookies } from 'next/headers'
import { oauth2Client } from './googleAuth'
import { getGoogleOAuthToken, saveGoogleOAuthToken } from './googleTokenStore'

/**
 * Get Google access token from cookies
 * Returns the token or null if not available/expired
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const storedToken = await getGoogleOAuthToken()

  if (storedToken?.accessToken) {
    const expiryOk =
      !storedToken.expiryDate || storedToken.expiryDate.getTime() - 60_000 > Date.now()
    if (expiryOk) {
      return storedToken.accessToken
    }
  }

  if (storedToken?.refreshToken) {
    try {
      oauth2Client.setCredentials({ refresh_token: storedToken.refreshToken })
      const { credentials } = await oauth2Client.refreshAccessToken()

      if (credentials.access_token) {
        await saveGoogleOAuthToken({
          accountEmail: storedToken.accountEmail,
          scopes: credentials.scope
            ? typeof credentials.scope === 'string'
              ? credentials.scope.split(' ')
              : credentials.scope
            : storedToken.scopes,
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token ?? storedToken.refreshToken,
          tokenType: credentials.token_type ?? storedToken.tokenType,
          expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date) : storedToken.expiryDate,
        })
        return credentials.access_token
      }
    } catch (error) {
      console.error('Failed to refresh stored Google token:', error)
    }
  }

  // Legacy cookie fallback (will be removed once all tokens migrate to DB)
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value
  const expiryStr = cookieStore.get('google_token_expiry')?.value

  if (accessToken && expiryStr) {
    const expiry = parseInt(expiryStr, 10)
    if (Date.now() < expiry) {
      return accessToken
    }
  }

  if (refreshToken && !accessToken) {
    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken })
      const { credentials } = await oauth2Client.refreshAccessToken()

      if (credentials.access_token) {
        const newExpiry = credentials.expiry_date ? credentials.expiry_date.toString() : undefined
        cookieStore.set('google_access_token', credentials.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60,
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
      console.error('Failed to refresh legacy Google token:', error)
      return null
    }
  }

  return accessToken || null
}

