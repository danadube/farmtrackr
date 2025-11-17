import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'
import { getGoogleOAuthToken } from '@/lib/googleTokenStore'

export const dynamic = 'force-dynamic'

/**
 * Check if the stored token has Gmail scopes
 */
async function hasGmailScopes(): Promise<boolean> {
  try {
    const storedToken = await getGoogleOAuthToken()
    if (!storedToken?.scopes || storedToken.scopes.length === 0) {
      return false
    }
    
    const gmailScopes = [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
    ]
    
    return storedToken.scopes.some(scope => 
      gmailScopes.some(gmailScope => scope.includes('gmail'))
    )
  } catch (error) {
    console.error('Error checking Gmail scopes:', error)
    return false
  }
}

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
    
    // Check if Gmail scopes are present
    const hasScopes = await hasGmailScopes()
    if (!hasScopes) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gmail permissions not granted. Please reconnect your Google account and ensure Gmail access is enabled.',
          requiresReauth: true
        },
        { status: 403 }
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

