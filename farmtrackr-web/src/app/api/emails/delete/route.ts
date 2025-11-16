import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Delete Email
 * POST /api/emails/delete
 * 
 * Deletes an email using direct Gmail API
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId } = await request.json()
    
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

    // Delete the message
    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    })

    return NextResponse.json({
      success: true,
      message: 'Email deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting email:', error)
    
    // Check for insufficient scopes error
    if (error instanceof Error && error.message.includes('insufficient authentication scopes')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Insufficient authentication scopes. Please reconnect your Google account to grant Gmail permissions.',
          requiresReauth: true
        },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

