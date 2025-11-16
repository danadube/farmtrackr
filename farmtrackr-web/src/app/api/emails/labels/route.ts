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

      // Get count - use messagesTotal, threadsTotal, or query for estimate
      let count = label.messagesTotal || label.threadsTotal || 0
      
      // If count is still 0, try to get estimate from messages list
      // This handles cases where Gmail API doesn't return accurate counts
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
            const messagesResponse = await gmail.users.messages.list({
              userId: 'me',
              q: query,
              maxResults: 1, // We only need resultSizeEstimate
            })
            // resultSizeEstimate gives approximate count (faster than fetching all)
            count = messagesResponse.data.resultSizeEstimate || 0
          }
        } catch (error) {
          console.error(`Error getting count for label ${labelName}:`, error)
          // Keep the original count (0 or from messagesTotal/threadsTotal)
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
