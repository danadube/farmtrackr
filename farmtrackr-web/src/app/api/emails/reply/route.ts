import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Reply to Email
 * POST /api/emails/reply
 * 
 * Replies to an email via Gmail API
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, body, transactionId } = await request.json()
    
    if (!messageId || !body) {
      return NextResponse.json(
        { error: 'messageId and body are required' },
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
        action: 'replyToEmail',
        messageId: messageId,
        replyBody: body,
        transactionId: transactionId || ''
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const result = await response.json()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error replying to email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
