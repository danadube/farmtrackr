import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Get Active Transactions for Email Module
 * GET /api/emails/transactions
 * 
 * Fetches active transactions from database (preferred) or Google Apps Script fallback
 */
export async function GET(request: NextRequest) {
  try {
    // First, try to get from database (Prisma)
    // Note: Using type assertion to handle cases where clientEmail field types may not be available during build
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      
      // Use type assertion to avoid build-time type errors if schema changes haven't propagated
      const transactions = await (prisma.transaction.findMany as any)({
        where: {
          status: {
            in: ['Active', 'Pending', 'Closing', 'Under Contract']
          }
        },
        select: {
          id: true,
          address: true,
          city: true,
          clientEmail: true,
          status: true,
          closedPrice: true,
          listPrice: true,
        },
        orderBy: {
          closingDate: 'desc'
        }
      })
      
      await prisma.$disconnect()
      
      const formatted = transactions.map((txn: any) => ({
        id: txn.id,
        propertyAddress: txn.address || '',
        clientName: '', // Would need to join with contact - can add later
        clientEmail: txn.clientEmail || '',
        status: txn.status,
        price: txn.closedPrice ? Number(txn.closedPrice) : (txn.listPrice ? Number(txn.listPrice) : 0)
      }))
      
      return NextResponse.json(formatted)
    } catch (dbError) {
      console.log('Database query failed, trying Apps Script fallback:', dbError)
    }
    
    // Fallback to Google Apps Script if database unavailable
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { error: 'No data source configured' },
        { status: 500 }
      )
    }
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getActiveTransactions'
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const transactions = await response.json()
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error getting transactions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

