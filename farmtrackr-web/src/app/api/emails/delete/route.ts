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

    // Double-check: verify the exact token we're about to use has the scope
    // Sometimes tokeninfo can be cached or show incorrect info
    console.log('Delete attempt - About to create Gmail client with token (first 20 chars):', accessToken.substring(0, 20))
    
    // Try to make a test Gmail API call first to verify the token actually works
    const gmail = getAuthenticatedGmailClient(accessToken)
    
    // Test the token with a simple API call first
    try {
      console.log('Delete attempt - Testing token with Gmail API list call...')
      const testList = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1,
      })
      console.log('Delete attempt - Gmail API list call succeeded, token is valid')
      
      // Try to test modify permissions with a harmless operation (mark as read)
      // This will tell us if we have modify permissions at all
      if (testList.data.messages && testList.data.messages.length > 0) {
        const testMessageId = testList.data.messages[0].id
        try {
          console.log('Delete attempt - Testing modify permissions with mark as read...')
          await gmail.users.messages.modify({
            userId: 'me',
            id: testMessageId,
            requestBody: {
              addLabelIds: [],
              removeLabelIds: ['UNREAD'],
            },
          })
          console.log('Delete attempt - Mark as read succeeded, token HAS modify permissions')
        } catch (modifyTestError: any) {
          console.error('Delete attempt - Mark as read failed:', modifyTestError?.code, modifyTestError?.message)
          if (modifyTestError?.code === 403 && modifyTestError?.message?.includes('insufficient')) {
            console.error('⚠️ CRITICAL: Token has gmail.readonly but NOT gmail.modify!')
            console.error('This means Google only granted read-only access, not modify access.')
            console.error('Possible causes:')
            console.error('1. App is in production mode but not verified by Google')
            console.error('2. Gmail scopes are restricted and require verification')
            console.error('3. OAuth consent screen is in testing mode with limited scopes')
            
            return NextResponse.json(
              {
                success: false,
                error: 'Your token only has Gmail read-only permissions, not delete permissions. This typically happens when your app is in production mode but not verified by Google for restricted scopes. Gmail modify/delete requires app verification. Please check your Google Cloud Console OAuth consent screen status, or switch to testing mode and add yourself as a test user.',
                requiresReauth: true,
                forceFullReauth: true,
                isReadOnlyOnly: true,
                debug: {
                  modifyTestError: modifyTestError?.message,
                  diagnosis: 'Token has gmail.readonly but NOT gmail.modify - Google only granted read-only access despite gmail.modify being in requested scopes. This is a Google app verification issue.'
                }
              },
              { status: 403 }
            )
          }
        }
      }
    } catch (testError: any) {
      console.error('Delete attempt - Gmail API list call failed:', testError?.code, testError?.message)
      if (testError?.code === 403 && testError?.message?.includes('insufficient')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Gmail API access denied. The token does not have Gmail permissions. Please disconnect and reconnect your Google account.',
            requiresReauth: true,
            forceFullReauth: true,
            debug: {
              testError: testError?.message,
              diagnosis: 'Token fails even basic Gmail API list call - token does not have Gmail scopes despite tokeninfo saying it does'
            }
          },
          { status: 403 }
        )
      }
    }

    // Try to delete the message - let the API tell us if scopes are missing
    try {
      // Gmail API delete requires specific permissions
      // Some implementations require trash first, then delete
      // Try direct delete first (most efficient)
      try {
        await gmail.users.messages.delete({
          userId: 'me',
          id: messageId,
        })
      } catch (directDeleteError: any) {
        // If direct delete fails with scope error, try trash then delete
        if (directDeleteError?.code === 403 && directDeleteError?.message?.includes('insufficient')) {
          console.log('Delete attempt - Direct delete failed, trying trash then delete approach...')
          
          // First, try to trash the message
          try {
            await gmail.users.messages.trash({
              userId: 'me',
              id: messageId,
            })
            console.log('Delete attempt - Message trashed successfully')
            
            // Wait a moment for trash to process
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Then try to permanently delete from trash
            try {
              await gmail.users.messages.delete({
                userId: 'me',
                id: messageId,
              })
              console.log('Delete attempt - Message permanently deleted from trash')
              return NextResponse.json({
                success: true,
                message: 'Email deleted successfully (via trash)',
              })
            } catch (trashDeleteError: any) {
              // If delete from trash also fails, at least it's in trash
              if (trashDeleteError?.code === 404) {
                // Message already deleted - that's OK
                return NextResponse.json({
                  success: true,
                  message: 'Email moved to trash successfully',
                })
              }
              throw trashDeleteError
            }
          } catch (trashError: any) {
            // If trash also fails, fall through to original error
            console.error('Delete attempt - Trash also failed:', trashError?.code, trashError?.message)
            throw directDeleteError // Throw original delete error, not trash error
          }
        } else {
          throw directDeleteError
        }
      }
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
        // OR when the OAuth consent screen isn't properly configured for Gmail scopes
        console.error('⚠️ CRITICAL: Gmail API says token has insufficient scopes for delete!')
        console.error('Stored scopes:', JSON.stringify(storedToken?.scopes, null, 2))
        console.error('Tokeninfo scopes:', JSON.stringify(actualTokenScopes, null, 2))
        console.error('Tokeninfo scopes before delete:', JSON.stringify(tokenScopesBeforeDelete, null, 2))
        console.error('Has gmail.modify in stored:', storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')))
        console.error('Has gmail.modify in tokeninfo:', actualTokenScopes.some(s => s.includes('gmail.modify')))
        console.error('Has gmail.modify before delete:', tokenScopesBeforeDelete.some(s => s.includes('gmail.modify')))
        
        // This is a very specific Google bug: tokeninfo shows the scope, but Gmail API rejects it
        // This typically means:
        // 1. The OAuth consent screen isn't configured for Gmail scopes, OR
        // 2. The app needs Google verification for restricted scopes, OR
        // 3. Gmail API isn't enabled in Google Cloud Console
        const hasScopeInAllChecks = storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')) &&
                                    actualTokenScopes.some(s => s.includes('gmail.modify')) &&
                                    tokenScopesBeforeDelete.some(s => s.includes('gmail.modify'))
        
        if (hasScopeInAllChecks) {
          console.error('⚠️ DIAGNOSIS: Token shows gmail.modify in ALL checks but Gmail API still rejects it!')
          console.error('This is a Google Cloud Console configuration issue, not a token issue.')
          console.error('Please check:')
          console.error('1. Gmail API is enabled in Google Cloud Console')
          console.error('2. OAuth consent screen includes gmail.modify scope')
          console.error('3. App is verified (if in production mode with restricted scopes)')
        }
        
        // Check if this is a refresh token issue
        const isRefreshTokenIssue = storedToken?.scopes?.some((s: string) => s.includes('gmail.modify')) && 
                                    !actualTokenScopes.some(s => s.includes('gmail.modify'))
        
        return NextResponse.json(
          { 
            success: false, 
            error: hasScopeInAllChecks
              ? 'Gmail delete permissions appear to be granted, but Google\'s Gmail API is rejecting the request. This is likely a Google Cloud Console configuration issue. Please verify: 1) Gmail API is enabled, 2) OAuth consent screen includes gmail.modify scope, 3) App is verified if using restricted scopes. Then disconnect and reconnect your Google account.'
              : isRefreshTokenIssue
              ? 'Your Google account was connected before Gmail delete permissions were added. The refresh token doesn\'t have the new scopes. Please disconnect and reconnect to get a fresh token with all required permissions.'
              : 'Gmail delete permissions not granted. This appears to be a Google OAuth token issue where the token shows the correct scopes but doesn\'t actually have them. Please disconnect and reconnect your Google account to get a fresh token with all required permissions.',
            requiresReauth: true,
            forceFullReauth: true, // Flag to indicate this needs a full re-auth, not just reconnect
            isRefreshTokenIssue,
            isConfigurationIssue: hasScopeInAllChecks,
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
              diagnosis: hasScopeInAllChecks
                ? 'Token shows gmail.modify in all checks but Gmail API rejects it - this is a Google Cloud Console configuration issue. Check: 1) Gmail API enabled, 2) OAuth consent screen configured, 3) App verification status.'
                : isRefreshTokenIssue
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

