import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Get Filtered Emails
 * GET /api/emails/list
 * 
 * Gets filtered emails based on transaction, label, search, and status filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      transactionId: searchParams.get('transactionId') || 'all',
      gmailLabel: searchParams.get('label') || 'INBOX',
      searchTerm: searchParams.get('search') || '',
      statusFilter: searchParams.get('status') || 'all',
      maxResults: parseInt(searchParams.get('maxResults') || '50', 10)
    }
    
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getFilteredEmails',
        filters: filters
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const emails = await response.json()
    return NextResponse.json(emails)
  } catch (error) {
    console.error('Error getting filtered emails:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

