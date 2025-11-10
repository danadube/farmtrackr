import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Check Google OAuth connection status
 * GET /api/google/oauth/status
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('google_access_token')?.value
    const refreshToken = cookieStore.get('google_refresh_token')?.value
    const expiry = cookieStore.get('google_token_expiry')?.value

    const isConnected = !!accessToken || !!refreshToken
    
    let isExpired = false
    if (expiry) {
      const expiryTime = parseInt(expiry, 10)
      isExpired = Date.now() >= expiryTime
    }

    return NextResponse.json({
      connected: isConnected,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expired: isExpired,
      canRefresh: !!refreshToken && isExpired,
    })
  } catch (error) {
    console.error('OAuth status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check OAuth status' },
      { status: 500 }
    )
  }
}

