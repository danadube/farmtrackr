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

    // Log token info for debugging
    const { getGoogleOAuthToken } = await import('@/lib/googleTokenStore')
    const storedToken = await getGoogleOAuthToken()
    console.log('Delete attempt - Stored scopes:', storedToken?.scopes)
    console.log('Delete attempt - Stored scopes (full):', JSON.stringify(storedToken?.scopes, null, 2))
    console.log('Delete attempt - Has gmail.modify in stored:', storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')))
    console.log('Delete attempt - Access token length:', accessToken.length)
    console.log('Delete attempt - Account email:', storedToken?.accountEmail)

    // Verify actual access token scopes using Google's tokeninfo API
    let actualTokenScopes: string[] = []
    try {
      const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
      if (tokenInfoResponse.ok) {
        const tokenInfo = await tokenInfoResponse.json()
        actualTokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : []
        console.log('Delete attempt - Actual token scopes from Google:', actualTokenScopes)
        console.log('Delete attempt - Has gmail.modify in actual token:', actualTokenScopes.some(s => s.includes('gmail.modify')))
      } else {
        console.warn('Could not verify token scopes with Google tokeninfo API')
      }
    } catch (tokenInfoError) {
      console.warn('Error checking token scopes:', tokenInfoError)
    }

    // Double-check the token right before using it - tokeninfo might be cached
    // Verify the exact token we're about to use has the scope
    let tokenScopesBeforeDelete: string[] = []
    try {
      const preDeleteCheck = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
      if (preDeleteCheck.ok) {
        const preDeleteInfo = await preDeleteCheck.json()
        tokenScopesBeforeDelete = preDeleteInfo.scope ? preDeleteInfo.scope.split(' ') : []
        console.log('Delete attempt - Token scopes RIGHT BEFORE delete call:', tokenScopesBeforeDelete)
        console.log('Delete attempt - Has gmail.modify RIGHT BEFORE delete:', tokenScopesBeforeDelete.some(s => s.includes('gmail.modify')))
      }
    } catch (preCheckError) {
      console.warn('Could not verify token scopes right before delete:', preCheckError)
    }

    const gmail = getAuthenticatedGmailClient(accessToken)

    // Try to delete the message - let the API tell us if scopes are missing
    try {
      // Try direct delete first (most efficient)
      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      })
    } catch (apiError: any) {
      // If direct delete fails with 404, message might already be deleted - that's OK
      if (apiError?.code === 404 || apiError?.response?.status === 404) {
        // Message already deleted or doesn't exist - consider it success
        return NextResponse.json({
          success: true,
          message: 'Email deleted successfully',
        })
      }
      
      console.error('Gmail delete API error:', {
        code: apiError?.code,
        message: apiError?.message,
        response: apiError?.response?.data,
        status: apiError?.response?.status,
        errors: apiError?.errors,
        fullError: JSON.stringify(apiError, null, 2)
      })
      
      // Log the actual error response from Google
      if (apiError?.response?.data) {
        console.error('Google API error details:', JSON.stringify(apiError.response.data, null, 2))
      }
      
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
        // This is a known Google OAuth issue: tokeninfo API shows scopes, but the actual token doesn't have them
        // This happens when a token was created before scopes were added, or when refresh loses scopes
        // The only solution is to force a full re-authentication
        console.error('⚠️ CRITICAL: Gmail API says token has insufficient scopes for delete!')
        console.error('Stored scopes:', JSON.stringify(storedToken?.scopes, null, 2))
        console.error('Tokeninfo scopes:', JSON.stringify(actualTokenScopes, null, 2))
        console.error('Tokeninfo scopes before delete:', JSON.stringify(tokenScopesBeforeDelete, null, 2))
        console.error('Has gmail.modify in stored:', storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')))
        console.error('Has gmail.modify in tokeninfo:', actualTokenScopes.some(s => s.includes('gmail.modify')))
        console.error('Has gmail.modify before delete:', tokenScopesBeforeDelete.some(s => s.includes('gmail.modify')))
        console.error('This is a Google OAuth bug - the token needs to be recreated with fresh scopes.')
        console.error('Forcing full re-authentication required.')
        
        // Check if this is a refresh token issue
        const isRefreshTokenIssue = storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')) && 
                                    !actualTokenScopes.some(s => s.includes('gmail.modify'))
        
        return NextResponse.json(
          { 
            success: false, 
            error: isRefreshTokenIssue
              ? 'Your Google account was connected before Gmail delete permissions were added. The refresh token doesn\'t have the new scopes. Please disconnect and reconnect to get a fresh token with all required permissions.'
              : 'Gmail delete permissions not granted. This appears to be a Google OAuth token issue where the token shows the correct scopes but doesn\'t actually have them. Please disconnect and reconnect your Google account to get a fresh token with all required permissions.',
            requiresReauth: true,
            forceFullReauth: true, // Flag to indicate this needs a full re-auth, not just reconnect
            isRefreshTokenIssue,
            debug: {
              code: apiError?.code,
              message: errorMessage,
              status: apiError?.response?.status,
              fullError: apiError?.response?.data,
              storedScopes: storedToken?.scopes,
              actualTokenScopes: actualTokenScopes,
              tokenScopesBeforeDelete: tokenScopesBeforeDelete,
              hasGmailModifyInStored: storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')),
              hasGmailModifyInActual: actualTokenScopes.some(s => s.includes('gmail.modify')),
              hasGmailModifyBeforeDelete: tokenScopesBeforeDelete.some(s => s.includes('gmail.modify')),
              accessTokenFirst10: accessToken.substring(0, 10),
              accessTokenLength: accessToken.length,
              diagnosis: isRefreshTokenIssue
                ? 'Refresh token was created before Gmail scopes were added. Token refresh doesn\'t include new scopes. Full re-authentication required.'
                : 'Token shows gmail.modify in tokeninfo but Gmail API rejects it - this is a Google OAuth token refresh bug. Full re-authentication required.'
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

