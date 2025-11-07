import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Link Email to Transaction
 * POST /api/emails/link
 * 
 * Links or unlinks an email to/from a transaction
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, transactionId } = await request.json()
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }
    
    // Try to update database first (Prisma)
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      // Check if email log exists
      const existing = await prisma.emailLog.findUnique({
        where: { gmailMessageId: messageId }
      })
      
      if (existing) {
        // Update existing record
        await prisma.emailLog.update({
          where: { gmailMessageId: messageId },
          data: {
            transactionId: transactionId || null,
            autoLinked: false // User manually changed it
          }
        })
      } else {
        // Would need to fetch email from Gmail first - for now, just update Sheets
        // In full implementation, we'd fetch email and create Prisma record
      }
      
      await prisma.$disconnect()
    } catch (dbError) {
      console.log('Database update failed, using Apps Script fallback:', dbError)
    }
    
    // Always update Google Sheets as well (source of truth for full email content)
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
        action: 'linkEmailToTransaction',
        messageId: messageId,
        transactionId: transactionId || ''
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const result = await response.json()
    
    return NextResponse.json({
      success: result.success || false
    })
  } catch (error) {
    console.error('Error linking email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

