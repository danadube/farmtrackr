import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedPeopleClient } from '@/lib/googleAuth'
import { getGoogleOAuthToken } from '@/lib/googleTokenStore'

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
          const people = getAuthenticatedPeopleClient(token)
          const profile = await people.people.get({
            resourceName: 'people/me',
            personFields: 'names,emailAddresses'
          })
          
          userEmail = profile.data.emailAddresses?.[0]?.value || null
          userName = profile.data.names?.[0]?.displayName || 
                     `${profile.data.names?.[0]?.givenName || ''} ${profile.data.names?.[0]?.familyName || ''}`.trim() || null
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

