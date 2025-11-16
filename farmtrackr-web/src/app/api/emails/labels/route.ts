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
      // If both are 0 or undefined, try to get a count by querying
      else {
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
            const messagesResponse = await gmail.users.messages.list({
              userId: 'me',
              q: query,
              maxResults: 1,
            })
            // Use resultSizeEstimate as a fallback when messagesTotal is 0
            // This is an estimate but better than showing 0 when there are emails
            const estimate = messagesResponse.data.resultSizeEstimate
            if (typeof estimate === 'number' && estimate > 0) {
              count = estimate
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
