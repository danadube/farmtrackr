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

    // Try to delete the message - let the API tell us if scopes are missing
    try {
      // First, try to move to trash (safer, reversible)
      // If that works, then permanently delete
      try {
        await gmail.users.messages.trash({
          userId: 'me',
          id: messageId,
        })
        
        // Wait a moment, then permanently delete from trash
        await new Promise(resolve => setTimeout(resolve, 500))
        
        await gmail.users.messages.delete({
          userId: 'me',
          id: messageId,
        })
      } catch (trashError: any) {
        // If trash fails, try direct delete
        console.log('Trash failed, trying direct delete:', trashError?.message)
        await gmail.users.messages.delete({
          userId: 'me',
          id: messageId,
        })
      }
    } catch (apiError: any) {
      console.error('Gmail delete API error:', {
        code: apiError?.code,
        message: apiError?.message,
        response: apiError?.response?.data,
        status: apiError?.response?.status,
        errors: apiError?.errors
      })
      
      // Check for insufficient scopes error from Gmail API
      const errorMessage = apiError?.message || apiError?.response?.data?.error?.message || ''
      const isScopeError = apiError?.code === 403 || 
          apiError?.response?.status === 403 ||
          errorMessage.includes('insufficient authentication scopes') ||
          errorMessage.includes('Insufficient Permission') ||
          errorMessage.includes('Request had insufficient authentication scopes') ||
          (apiError?.response?.data?.error?.errors?.some((e: any) => 
            e.reason === 'insufficientPermissions' || 
            e.message?.includes('insufficient') ||
            e.message?.includes('permission')
          ))
      
      if (isScopeError) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Gmail delete permissions not granted. Please disconnect and reconnect your Google account, making sure to grant Gmail access when prompted.',
            requiresReauth: true,
            debug: {
              code: apiError?.code,
              message: errorMessage,
              status: apiError?.response?.status,
              fullError: apiError?.response?.data
            }
          },
          { status: 403 }
        )
      }
      // Re-throw other errors
      throw apiError
    }

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

