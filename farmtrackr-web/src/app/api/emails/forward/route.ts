import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Forward Email
 * POST /api/emails/forward
 * 
 * Forwards an email using direct Gmail API
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, forwardTo, body, transactionId } = await request.json()
    
    if (!messageId || !forwardTo || !body) {
      return NextResponse.json(
        { success: false, error: 'messageId, forwardTo, and body are required' },
        { status: 400 }
      )
    }
    
    // Get authenticated Gmail client
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Gmail. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const gmail = getAuthenticatedGmailClient(accessToken)

    // Get the original message to extract headers and body
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })

    const headers = originalMessage.data.payload?.headers || []
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

    const originalFrom = getHeader('From')
    const originalTo = getHeader('To')
    const originalCc = getHeader('Cc')
    const originalSubject = getHeader('Subject')
    const originalDate = getHeader('Date')

    // Extract original body
    let originalBody = ''
    const extractBody = (part: any) => {
      if (part.body?.data) {
        const data = Buffer.from(part.body.data, 'base64').toString('utf-8')
        if (part.mimeType === 'text/plain') {
          originalBody = data
        } else if (part.mimeType === 'text/html' && !originalBody) {
          originalBody = data
        }
      }
      if (part.parts) {
        part.parts.forEach(extractBody)
      }
    }

    if (originalMessage.data.payload) {
      extractBody(originalMessage.data.payload)
    }

    // Build forward subject
    const forwardSubject = originalSubject.startsWith('Fwd:') || originalSubject.startsWith('Fw:')
      ? originalSubject
      : `Fwd: ${originalSubject}`

    // Build forward message with original email quoted
    const forwardBody = `${body}\n\n---------- Forwarded message ----------\nFrom: ${originalFrom}\nDate: ${originalDate}\nTo: ${originalTo}${originalCc ? `\nCc: ${originalCc}` : ''}\nSubject: ${originalSubject}\n\n${originalBody}`

    // Build email message
    const to = Array.isArray(forwardTo) ? forwardTo.join(', ') : forwardTo
    const lines = [
      `To: ${to}`,
      `Subject: ${forwardSubject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      forwardBody.replace(/\n/g, '<br>'),
    ].filter(Boolean)

    const rawMessage = lines.join('\r\n')
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send forward
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    })

    if (!response.data.id) {
      return NextResponse.json(
        { success: false, error: 'Failed to forward email' },
        { status: 500 }
      )
    }

    // TODO: Link forward to transaction if transactionId is provided

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
    })
  } catch (error) {
    console.error('Error forwarding email:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
