import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getTokensFromCode, oauth2Client } from '@/lib/googleAuth'
import { cookies } from 'next/headers'
import { saveGoogleOAuthToken } from '@/lib/googleTokenStore'

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

    const scopesFromToken =
      tokens.scope && typeof tokens.scope === 'string'
        ? tokens.scope.split(' ')
        : Array.isArray(tokens.scope)
          ? tokens.scope
          : []

    let accountEmail: string | null = null

    try {
      oauth2Client.setCredentials({ access_token: tokens.access_token })
      const oauthClient = google.oauth2({ version: 'v2', auth: oauth2Client })
      const profile = await oauthClient.userinfo.get()
      accountEmail = profile.data.email || null
    } catch (profileError) {
      console.warn('Unable to fetch Google profile during OAuth callback:', profileError)
    }

    await saveGoogleOAuthToken({
      accountEmail,
      scopes: scopesFromToken,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenType: tokens.token_type ?? null,
      expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    })

    // Store tokens securely (using HTTP-only cookies for legacy flows)
    const cookieStore = await cookies()
    
    cookieStore.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    })

    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }

    if (tokens.expiry_date) {
      cookieStore.set('google_token_expiry', tokens.expiry_date.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60,
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

