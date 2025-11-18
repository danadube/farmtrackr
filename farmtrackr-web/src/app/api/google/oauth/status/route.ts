import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedPeopleClient, oauth2Client } from '@/lib/googleAuth'
import { getGoogleOAuthToken } from '@/lib/googleTokenStore'
import { google } from 'googleapis'

export const dynamic = 'force-dynamic'

/**
 * Check Google OAuth connection status
 * GET /api/google/oauth/status
 */
export async function GET(request: NextRequest) {
  try {
    const storedToken = await getGoogleOAuthToken()
    const accessToken = storedToken?.accessToken || null
    const refreshToken = storedToken?.refreshToken || null
    const expiry = storedToken?.expiryDate ? storedToken.expiryDate.getTime() : null

    const isConnected = !!accessToken || !!refreshToken
    const isExpired = expiry ? Date.now() >= expiry : false

    // Fetch user info if connected
    let userEmail: string | null = storedToken?.accountEmail || null
    let userName: string | null = null

    if (isConnected) {
      try {
        const token = await getGoogleAccessToken()
        if (token) {
          oauth2Client.setCredentials({ access_token: token })
          
          // Try People API first (more detailed)
          try {
            const people = getAuthenticatedPeopleClient(token)
            const profile = await people.people.get({
              resourceName: 'people/me',
              personFields: 'names,emailAddresses'
            })
            
            userEmail = profile.data.emailAddresses?.[0]?.value || userEmail
            userName = profile.data.names?.[0]?.displayName || null
          } catch (peopleError: any) {
            // If People API fails (missing profile scope), fall back to OAuth2 userinfo
            if (peopleError?.code === 403 || peopleError?.message?.includes('profile')) {
              console.log('People API requires profile scope, falling back to OAuth2 userinfo')
              const oauthClient = google.oauth2({ version: 'v2', auth: oauth2Client })
              const userInfo = await oauthClient.userinfo.get()
              userName = userInfo.data.name || null
              userEmail = userInfo.data.email || userEmail
            } else {
              throw peopleError
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error)
        // Don't fail the whole request if user info fetch fails
      }
    }

    return NextResponse.json({
      connected: isConnected,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expired: isExpired,
      canRefresh: !!refreshToken && isExpired,
      userEmail,
      userName,
    })
  } catch (error) {
    console.error('OAuth status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check OAuth status' },
      { status: 500 }
    )
  }
}

