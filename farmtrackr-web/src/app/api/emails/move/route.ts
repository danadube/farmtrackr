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
    
    return storedToken.scopes.some(scope => scope.includes('gmail'))
  } catch (error) {
    console.error('Error checking Gmail scopes:', error)
    return false
  }
}

/**
 * API Route: Move Email to Folder (Add/Remove Labels)
 * POST /api/emails/move
 * 
 * Moves an email to a folder by adding/removing Gmail labels
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, labelId, labelName, action = 'add' } = await request.json()
    
    if (!messageId) {
      return NextResponse.json(
        { success: false, error: 'messageId is required' },
        { status: 400 }
      )
    }

    if (!labelId && !labelName) {
      return NextResponse.json(
        { success: false, error: 'labelId or labelName is required' },
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

    // If we only have labelName, find the label ID
    let targetLabelId = labelId
    if (!targetLabelId && labelName) {
      const labelsResponse = await gmail.users.labels.list({ userId: 'me' })
      const allLabels = labelsResponse.data.labels || []
      const matchingLabel = allLabels.find(
        (l) => l.name === labelName || l.id === labelName
      )
      
      if (!matchingLabel) {
        return NextResponse.json(
          { success: false, error: `Label "${labelName}" not found` },
          { status: 404 }
        )
      }
      
      targetLabelId = matchingLabel.id!
    }

    if (!targetLabelId) {
      return NextResponse.json(
        { success: false, error: 'Could not determine label ID' },
        { status: 400 }
      )
    }

    // Perform the action (add or remove label)
    if (action === 'add') {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [targetLabelId],
        },
      })
    } else if (action === 'remove') {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: [targetLabelId],
        },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Action must be "add" or "remove"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email ${action === 'add' ? 'moved to' : 'removed from'} folder`,
    })
  } catch (error) {
    console.error('Error moving email:', error)
    
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

