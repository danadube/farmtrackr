import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Get Gmail Labels
 * GET /api/emails/labels
 * 
 * Fetches Gmail labels (system + custom) from Google Apps Script
 */
export async function GET(request: NextRequest) {
  try {
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getGmailLabels'
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const labels = await response.json()
    return NextResponse.json(labels)
  } catch (error) {
    console.error('Error getting Gmail labels:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

