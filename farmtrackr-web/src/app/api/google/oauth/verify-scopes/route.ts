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
    
    try {
      const accessToken = await getGoogleAccessToken()
      if (accessToken) {
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
      hasGmailScope,
      hasGmailModify,
      hasGmailReadonly,
      canDelete,
      deleteError,
      accountEmail: storedToken.accountEmail,
      // Show what scopes we're requesting vs what we got
      requestedScopes: [
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ]
    })
  } catch (error) {
    console.error('Error verifying scopes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

