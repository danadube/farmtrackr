import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Get Gmail Labels
 * GET /api/emails/labels
 * 
 * Fetches Gmail labels (system + custom) using direct Gmail API
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated Gmail client
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Gmail. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const gmail = getAuthenticatedGmailClient(accessToken)

    // Fetch labels
    const response = await gmail.users.labels.list({
      userId: 'me',
    })

    const labels = response.data.labels || []

    // Transform to expected format and get accurate counts
    const formattedLabels = await Promise.all(labels.map(async (label) => {
      const labelId = label.id || ''
      const labelName = label.name || ''
      
      // Map system labels to standard values
      const systemLabelMap: Record<string, string> = {
        'INBOX': 'INBOX',
        'STARRED': 'STARRED',
        'SENT': 'SENT',
        'DRAFT': 'DRAFT',
        'IMPORTANT': 'IMPORTANT',
        'TRASH': 'TRASH',
        'SPAM': 'SPAM',
      }

      // Get count - Gmail API provides messagesTotal which is the authoritative count
      // Check all possible count properties
      let count = 0
      
      // Try messagesTotal first (total messages with this label)
      if (typeof label.messagesTotal === 'number' && label.messagesTotal > 0) {
        count = label.messagesTotal
      }
      // Try threadsTotal as fallback (total threads with this label)
      else if (typeof label.threadsTotal === 'number' && label.threadsTotal > 0) {
        count = label.threadsTotal
      }
      
      // If count is still 0 (or messagesTotal/threadsTotal were undefined/null), query for a better estimate
      // This handles cases where Gmail API doesn't populate counts accurately
      if (count === 0) {
        try {
          // Build query based on label type
          let query = ''
          if (systemLabelMap[labelId]) {
            // System label
            const systemQueries: Record<string, string> = {
              'INBOX': 'in:inbox',
              'STARRED': 'is:starred',
              'SENT': 'in:sent',
              'DRAFT': 'in:drafts',
              'IMPORTANT': 'is:important',
              'TRASH': 'in:trash',
              'SPAM': 'in:spam',
            }
            query = systemQueries[labelId] || ''
          } else {
            // Custom label - use label name
            query = `label:"${labelName}"`
          }

          if (query) {
            // Fetch a small batch to check if messages exist and get a better estimate
            const messagesResponse = await gmail.users.messages.list({
              userId: 'me',
              q: query,
              maxResults: 100, // Fetch up to 100 to get a more accurate count
            })
            
            const messages = messagesResponse.data.messages || []
            const estimate = messagesResponse.data.resultSizeEstimate
            
            // If we got messages, use the actual count or a reasonable estimate
            if (messages.length > 0) {
              // If we got 100 messages, there are likely more - use estimate if reasonable
              if (messages.length === 100 && estimate && estimate > 100) {
                // Use estimate but cap it at a reasonable number to avoid showing 201
                count = Math.min(estimate, 1000)
              } else {
                // Use actual count of messages we fetched
                count = messages.length
              }
            } else if (estimate && estimate > 0) {
              // No messages in first batch but estimate says there are some
              // This is unlikely but handle it
              count = Math.min(estimate, 100)
            }
          }
        } catch (error) {
          console.error(`Error getting count for label ${labelName}:`, error)
          // Keep count as 0 if query fails
        }
      }

      return {
        id: labelId,
        name: labelName,
        value: systemLabelMap[labelId] || labelId,
        count: count,
        type: label.type || 'user',
        color: label.color?.backgroundColor || undefined,
      }
    }))

    return NextResponse.json(formattedLabels)
  } catch (error) {
    console.error('Error getting Gmail labels:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
