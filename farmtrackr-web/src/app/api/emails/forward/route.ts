import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Forward Email
 * POST /api/emails/forward
 * 
 * Forwards an email via Gmail API
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, forwardTo, body, transactionId } = await request.json()
    
    if (!messageId || !forwardTo || !body) {
      return NextResponse.json(
        { error: 'messageId, forwardTo, and body are required' },
        { status: 400 }
      )
    }
    
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
        action: 'forwardEmail',
        messageId: messageId,
        forwardTo: forwardTo,
        forwardBody: body,
        transactionId: transactionId || ''
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const result = await response.json()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error forwarding email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

