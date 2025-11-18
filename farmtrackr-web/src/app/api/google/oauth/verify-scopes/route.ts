import { NextRequest, NextResponse } from 'next/server'
import { getGoogleOAuthToken } from '@/lib/googleTokenStore'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedGmailClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * Verify Gmail scopes and test delete permission
 * GET /api/google/oauth/verify-scopes
 */
export async function GET(request: NextRequest) {
  try {
    const storedToken = await getGoogleOAuthToken()
    
    if (!storedToken) {
      return NextResponse.json({
        hasToken: false,
        scopes: [],
        message: 'No token found'
      })
    }

    const scopes = Array.isArray(storedToken.scopes) ? storedToken.scopes : []
    const hasGmailScope = scopes.some(scope => 
      typeof scope === 'string' && scope.includes('gmail')
    )

    // Try to test delete permission with a test call
    let canDelete = false
    let deleteError: any = null
    let actualTokenScopes: string[] = []
    
    try {
      const accessToken = await getGoogleAccessToken()
      if (accessToken) {
        // Check actual token scopes using Google's tokeninfo API
        try {
          const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`)
          if (tokenInfoResponse.ok) {
            const tokenInfo = await tokenInfoResponse.json()
            actualTokenScopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : []
          }
        } catch (tokenInfoError) {
          console.warn('Could not verify token scopes:', tokenInfoError)
        }
        
        const gmail = getAuthenticatedGmailClient(accessToken)
        // Try to list messages to verify we can access Gmail
        await gmail.users.messages.list({
          userId: 'me',
          maxResults: 1
        })
        canDelete = true
      }
    } catch (error: any) {
      deleteError = {
        code: error?.code,
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data
      }
    }

    // Check specifically for gmail.modify
    const hasGmailModify = scopes.some(scope => 
      typeof scope === 'string' && scope.includes('gmail.modify')
    )
    const hasGmailReadonly = scopes.some(scope => 
      typeof scope === 'string' && scope.includes('gmail.readonly') && !scope.includes('gmail.modify')
    )

    return NextResponse.json({
      hasToken: true,
      scopes: scopes,
      actualTokenScopes: actualTokenScopes,
      hasGmailScope,
      hasGmailModify,
      hasGmailReadonly,
      hasGmailModifyInActual: actualTokenScopes.some(s => s.includes('gmail.modify')),
      canDelete,
      deleteError,
      accountEmail: storedToken.accountEmail,
      // Show what scopes we're requesting vs what we got
      requestedScopes: [
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
      // Diagnostic info
      diagnostic: {
        storedHasGmailModify: hasGmailModify,
        actualHasGmailModify: actualTokenScopes.some(s => s.includes('gmail.modify')),
        scopesMatch: JSON.stringify(scopes.sort()) === JSON.stringify(actualTokenScopes.sort()),
        missingFromActual: scopes.filter(s => !actualTokenScopes.includes(s)),
        extraInActual: actualTokenScopes.filter(s => !scopes.includes(s))
      }
    })
  } catch (error) {
    console.error('Error verifying scopes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

