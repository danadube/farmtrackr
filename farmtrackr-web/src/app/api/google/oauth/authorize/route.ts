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

    // Generate authorization URL
    const authUrl = getGoogleAuthUrl(state)

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

