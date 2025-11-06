import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Fetch Emails from Gmail
 * GET /api/gmail/fetch?query=...&maxResults=25
 * 
 * Fetches emails from Gmail via Google Apps Script
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const maxResults = parseInt(searchParams.get('maxResults') || '25', 10)

    // Get Apps Script Web App URL from environment
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }

    // Call Google Apps Script
    // Format: { action: 'fetch', queryParams: { query, maxResults } }
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'fetch',
        queryParams: {
          query,
          maxResults,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to fetch emails' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

