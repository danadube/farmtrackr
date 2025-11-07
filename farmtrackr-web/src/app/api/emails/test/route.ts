import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Create Test Emails
 * POST /api/emails/test
 * 
 * Creates test emails for development/testing
 */
export async function POST(request: NextRequest) {
  try {
    const { count } = await request.json()
    
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
        action: 'createTestEmails',
        count: count || 5
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating test emails:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

