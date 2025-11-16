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

    // Transform to expected format
    const formattedLabels = labels.map((label) => {
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

      return {
        id: labelId,
        name: labelName,
        value: systemLabelMap[labelId] || labelId,
        count: label.messagesTotal || 0,
        type: label.type || 'user',
        color: label.color?.backgroundColor || undefined,
      }
    })

    return NextResponse.json(formattedLabels)
  } catch (error) {
    console.error('Error getting Gmail labels:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
