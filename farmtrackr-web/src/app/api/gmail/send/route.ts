import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Send Email via Gmail
 * POST /api/gmail/send
 * 
 * Sends email through Google Apps Script Gmail integration
 */
export async function POST(request: NextRequest) {
  try {
    const emailData = await request.json()

    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.body) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
    }

    // Get Apps Script Web App URL from environment
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }

    // Call Google Apps Script
    // Format: { action: 'send', emailData: { to, subject, body, cc, bcc, transactionId, contactId, attachments } }
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        emailData: {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          cc: emailData.cc,
          bcc: emailData.bcc,
          transactionId: emailData.transactionId,
          contactId: emailData.contactId,
          attachments: emailData.attachments,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }

    const result = await response.json()

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

