import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Get Filtered Emails
 * GET /api/emails/list
 * 
 * Gets filtered emails using direct Gmail API calls
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      transactionId: searchParams.get('transactionId') || 'all',
      gmailLabel: searchParams.get('label') || 'INBOX',
      searchTerm: searchParams.get('search') || '',
      statusFilter: searchParams.get('status') || 'all',
      maxResults: parseInt(searchParams.get('maxResults') || '50', 10)
    }
    
    // Get authenticated Gmail client
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Gmail. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const gmail = getAuthenticatedGmailClient(accessToken)

    // Build Gmail query
    let query = ''
    
    // Add label filter
    if (filters.gmailLabel && filters.gmailLabel !== 'all') {
      const labelUpper = filters.gmailLabel.toUpperCase()
      
      // Map system labels to Gmail query syntax
      const systemLabelMap: Record<string, string> = {
        'INBOX': 'in:inbox',
        'STARRED': 'is:starred',
        'SENT': 'in:sent',
        'DRAFTS': 'in:drafts',
        'IMPORTANT': 'is:important',
        'TRASH': 'in:trash',
        'SPAM': 'in:spam',
      }
      
      // Check if it's a system label
      if (systemLabelMap[labelUpper]) {
        query = systemLabelMap[labelUpper]
      } else {
        // For custom labels, use the label name (Gmail accepts label names in queries)
        // The label might be passed as ID or name, so we'll try both
        // First, try to get the label name from the labels API
        try {
          const labelsResponse = await gmail.users.labels.list({ userId: 'me' })
          const allLabels = labelsResponse.data.labels || []
          
          // Try to find the label by ID first, then by name
          const matchingLabel = allLabels.find(
            (l) => l.id === filters.gmailLabel || l.name === filters.gmailLabel
          )
          
          if (matchingLabel) {
            // Use the label name in the query (Gmail accepts label names)
            query = `label:"${matchingLabel.name}"`
          } else {
            // Fallback: use the provided value as-is
            query = `label:"${filters.gmailLabel}"`
          }
        } catch (error) {
          // Fallback: use the provided value as-is
          query = `label:"${filters.gmailLabel}"`
        }
      }
    }

    // Add search term
    if (filters.searchTerm) {
      query += query ? ` ${filters.searchTerm}` : filters.searchTerm
    }

    // Add status filter
    if (filters.statusFilter === 'unread') {
      query += query ? ' is:unread' : 'is:unread'
    } else if (filters.statusFilter === 'read') {
      query += query ? ' is:read' : 'is:read'
    } else if (filters.statusFilter === 'starred') {
      query += query ? ' is:starred' : 'is:starred'
    } else if (filters.statusFilter === 'hasAttachments') {
      query += query ? ' has:attachment' : 'has:attachment'
    }

    // Fetch message list
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: query || undefined,
      maxResults: Math.min(filters.maxResults, 500),
    })

    const messages = listResponse.data.messages || []
    
    if (messages.length === 0) {
      return NextResponse.json([])
    }

    // Fetch full message details
    const messagePromises = messages.slice(0, filters.maxResults).map(async (msg) => {
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
        const messageId = getHeader('Message-ID')

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

        // Extract attachments
        const attachments: any[] = []
        const extractAttachments = (part: any) => {
          if (part.filename && part.body?.attachmentId) {
            attachments.push({
              attachmentId: part.body.attachmentId,
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body.size,
            })
          }
          if (part.parts) {
            part.parts.forEach(extractAttachments)
          }
        }

        if (message.payload) {
          extractAttachments(message.payload)
        }

        // Get labels
        const labels = message.labelIds || []
        const isUnread = labels.includes('UNREAD')
        const isStarred = labels.includes('STARRED')
        const hasAttachments = attachments.length > 0 || labels.includes('HAS_ATTACHMENT')

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
          attachments: attachments.length > 0 ? attachments : undefined,
        }
      } catch (error) {
        console.error(`Error fetching message ${msg.id}:`, error)
        return null
      }
    })

    const emailResults = await Promise.all(messagePromises)
    const emails = emailResults.filter((e): e is NonNullable<typeof e> => e !== null)

    // Filter by transaction ID if specified (this would need to check email body or metadata)
    // For now, we'll return all emails and let the client filter
    let filteredEmails = emails

    if (filters.transactionId && filters.transactionId !== 'all') {
      // TODO: Implement transaction filtering based on email content or metadata
      // This might require checking email body for transaction IDs or using a separate mapping
    }

    return NextResponse.json(filteredEmails)
  } catch (error) {
    console.error('Error getting filtered emails:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
