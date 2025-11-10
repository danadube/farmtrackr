import { NextRequest, NextResponse } from 'next/server'
import { getTokensFromCode } from '@/lib/googleAuth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * Handle Google OAuth callback
 * GET /api/google/oauth/callback?code=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        new URL('/settings?error=oauth_denied', request.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=no_code', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokens = await getTokensFromCode(code)

    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL('/settings?error=no_token', request.url)
      )
    }

    // Store tokens securely (using HTTP-only cookies for security)
    // In production, consider encrypting these tokens or using a session store
    const cookieStore = await cookies()
    
    // Set access token (short-lived, expires when browser closes)
    cookieStore.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    // Store refresh token (long-lived, for getting new access tokens)
    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      })
    }

    // Store token expiry
    if (tokens.expiry_date) {
      cookieStore.set('google_token_expiry', tokens.expiry_date.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      })
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/settings?connected=google', request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', request.url)
    )
  }
}

