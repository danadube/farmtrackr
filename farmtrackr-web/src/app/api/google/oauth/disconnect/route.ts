import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { deleteGoogleOAuthToken } from '@/lib/googleTokenStore'

export const dynamic = 'force-dynamic'

/**
 * Disconnect Google OAuth (clear tokens)
 * POST /api/google/oauth/disconnect
 */
export async function POST(request: NextRequest) {
  try {
    await deleteGoogleOAuthToken()

    const cookieStore = await cookies()
    
    // Clear all Google OAuth cookies
    cookieStore.delete('google_access_token')
    cookieStore.delete('google_refresh_token')
    cookieStore.delete('google_token_expiry')

    return NextResponse.json({ 
      success: true,
      message: 'Google account disconnected'
    })
  } catch (error) {
    console.error('OAuth disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Google account' },
      { status: 500 }
    )
  }
}

