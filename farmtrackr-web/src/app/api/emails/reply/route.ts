import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Reply to Email
 * POST /api/emails/reply
 * 
 * Replies to an email using direct Gmail API
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, body, transactionId } = await request.json()
    
    if (!messageId || !body) {
      return NextResponse.json(
        { success: false, error: 'messageId and body are required' },
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

    // Get the original message to extract headers
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Message-ID'],
    })

    const headers = originalMessage.data.payload?.headers || []
    const getHeader = (name: string) => 
      headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

    const originalFrom = getHeader('From')
    const originalTo = getHeader('To')
    const originalSubject = getHeader('Subject')
    const originalMessageId = getHeader('Message-ID')

    // Build reply headers
    const replyTo = originalFrom
    const replySubject = originalSubject.startsWith('Re:') 
      ? originalSubject 
      : `Re: ${originalSubject}`

    // Build email message
    const lines = [
      `To: ${replyTo}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: ${originalMessageId}`,
      `References: ${originalMessageId}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ].filter(Boolean)

    const rawMessage = lines.join('\r\n')
    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    // Send reply
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: originalMessage.data.threadId || undefined,
      },
    })

    if (!response.data.id) {
      return NextResponse.json(
        { success: false, error: 'Failed to send reply' },
        { status: 500 }
      )
    }

    // TODO: Link reply to transaction if transactionId is provided

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
      threadId: response.data.threadId,
    })
  } catch (error) {
    console.error('Error replying to email:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
