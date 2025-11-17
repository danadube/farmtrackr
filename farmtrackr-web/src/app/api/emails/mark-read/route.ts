import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Mark Email as Read/Unread
 * POST /api/emails/mark-read
 * 
 * Marks an email as read (removes UNREAD label) or unread (adds UNREAD label)
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, read = true } = await request.json()
    
    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
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

    // Mark as read (remove UNREAD label) or unread (add UNREAD label)
    try {
      if (read) {
        // Mark as read - remove UNREAD label
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        })
      } else {
        // Mark as unread - add UNREAD label
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['UNREAD'],
          },
        })
      }
    } catch (apiError: any) {
      // Check for insufficient scopes error from Gmail API
      if (apiError?.code === 403 || 
          (apiError?.message && apiError.message.includes('insufficient authentication scopes')) ||
          (apiError?.message && apiError.message.includes('Insufficient Permission'))) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Gmail permissions not granted. Please disconnect and reconnect your Google account, making sure to grant Gmail access when prompted.',
            requiresReauth: true
          },
          { status: 403 }
        )
      }
      // Re-throw other errors
      throw apiError
    }

    return NextResponse.json({
      success: true,
      message: `Email marked as ${read ? 'read' : 'unread'}`,
    })
  } catch (error) {
    console.error('Error marking email as read/unread:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

