import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Fetch Emails from Gmail
 * GET /api/gmail/fetch?query=...&maxResults=25
 * 
 * Fetches emails using direct Gmail API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query') || ''
    const maxResults = parseInt(searchParams.get('maxResults') || '25', 10)

    // Get authenticated Gmail client
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Gmail. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const gmail = getAuthenticatedGmailClient(accessToken)

    // Fetch message list
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query || undefined,
      maxResults: Math.min(maxResults, 500),
    })

    const messages = listResponse.data.messages || []
    
    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        emails: [],
        count: 0,
      })
    }

    // Fetch full message details (similar to emails/list route)
    const messagePromises = messages.slice(0, maxResults).map(async (msg) => {
      try {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })

        const message = messageResponse.data
        const headers = message.payload?.headers || []
        
        const getHeader = (name: string) => 
          headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || ''

        const from = getHeader('From')
        const to = getHeader('To')
        const cc = getHeader('Cc')
        const subject = getHeader('Subject')
        const date = getHeader('Date')

        // Extract body
        let plainBody = ''
        let htmlBody = ''
        
        const extractBody = (part: any) => {
          if (part.body?.data) {
            const data = Buffer.from(part.body.data, 'base64').toString('utf-8')
            if (part.mimeType === 'text/plain') {
              plainBody = data
            } else if (part.mimeType === 'text/html') {
              htmlBody = data
            }
          }
          if (part.parts) {
            part.parts.forEach(extractBody)
          }
        }

        if (message.payload) {
          extractBody(message.payload)
        }

        // Get labels
        const labels = message.labelIds || []
        const isUnread = labels.includes('UNREAD')
        const isStarred = labels.includes('STARRED')
        const hasAttachments = labels.includes('HAS_ATTACHMENT')

        // Determine direction
        const sentLabels = ['SENT', 'DRAFT']
        const direction = labels.some(l => sentLabels.includes(l)) ? 'sent' : 'received'

        // Parse date
        const parsedDate = date ? new Date(date).toISOString() : new Date().toISOString()

        return {
          id: message.id,
          threadId: message.threadId,
          from,
          to,
          cc: cc || undefined,
          subject: subject || '(No subject)',
          body: htmlBody || plainBody,
          plainBody: plainBody || htmlBody.replace(/<[^>]*>/g, ''),
          date: parsedDate,
          isUnread,
          isStarred,
          hasAttachments,
          labels: labels.filter(l => !['UNREAD', 'STARRED', 'IMPORTANT', 'CATEGORY_PERSONAL', 'CATEGORY_SOCIAL', 'CATEGORY_PROMOTIONS', 'CATEGORY_UPDATES', 'CATEGORY_FORUMS'].includes(l)),
          direction,
        }
      } catch (error) {
        console.error(`Error fetching message ${msg.id}:`, error)
        return null
      }
    })

    const emailResults = await Promise.all(messagePromises)
    const emails = emailResults.filter((e): e is NonNullable<typeof e> => e !== null)

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    })
  } catch (error) {
    console.error('Error fetching emails:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
