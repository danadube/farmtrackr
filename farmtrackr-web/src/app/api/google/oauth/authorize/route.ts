import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/googleAuth'

/**
 * Initiate Google OAuth flow
 * GET /api/google/oauth/authorize
 */
export async function GET(request: NextRequest) {
  try {
    // Get state parameter (optional, can be used for CSRF protection)
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') || undefined

    // Debug: Log environment variables (not the secret, just presence)
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google/oauth/callback`
    
    console.log('OAuth Debug:', {
      hasRedirectUri: !!process.env.GOOGLE_OAUTH_REDIRECT_URI,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      computedRedirectUri: redirectUri,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      requestOrigin: request.headers.get('origin') || request.headers.get('host'),
    })

    // Generate authorization URL
    const authUrl = getGoogleAuthUrl(state)
    
    // Extract redirect_uri from the auth URL for debugging
    const urlParams = new URL(authUrl).searchParams
    const authRedirectUri = urlParams.get('redirect_uri')
    console.log('Generated redirect_uri in auth URL:', authRedirectUri)

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

