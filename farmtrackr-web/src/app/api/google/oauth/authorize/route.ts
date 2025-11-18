import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * Initiate Google OAuth flow
 * GET /api/google/oauth/authorize
 */
export async function GET(request: NextRequest) {
  try {
    // Get state parameter (optional, can be used for CSRF protection)
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') || undefined

    // Generate authorization URL
    const authUrl = getGoogleAuthUrl(state)
    
    // Log the authorization URL for debugging
    console.log('OAuth authorize - Redirect URI being used:', process.env.GOOGLE_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/oauth/callback`)
    console.log('OAuth authorize - Authorization URL:', authUrl)

    // Redirect to Google OAuth consent screen
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('OAuth authorization error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

