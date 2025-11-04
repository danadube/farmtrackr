import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/transactions
 * List all transactions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brokerage = searchParams.get('brokerage')
    const clientType = searchParams.get('clientType')
    const status = searchParams.get('status')
    const year = searchParams.get('year')
    
    // Build where clause
    const where: any = {}
    if (brokerage) where.brokerage = brokerage
    if (clientType) where.clientType = clientType
    if (status) where.status = status
    if (year) {
      where.closingDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: {
        closingDate: 'desc'
      }
    })
    
    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.propertyType || !body.clientType || !body.transactionType || !body.brokerage || !body.status) {
      return NextResponse.json({ 
        error: 'Missing required fields: propertyType, clientType, transactionType, brokerage, status' 
      }, { status: 400 })
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        // Basic Info
        propertyType: body.propertyType,
        clientType: body.clientType,
        transactionType: body.transactionType,
        source: body.source,
        address: body.address,
        city: body.city,
        listPrice: body.listPrice ? parseFloat(body.listPrice) : null,
        closedPrice: body.closedPrice ? parseFloat(body.closedPrice) : null,
        listDate: body.listDate ? new Date(body.listDate) : null,
        closingDate: body.closingDate ? new Date(body.closingDate) : null,
        status: body.status,
        
        // Referral Fields
        referringAgent: body.referringAgent,
        referralFeeReceived: body.referralFeeReceived ? parseFloat(body.referralFeeReceived) : null,
        
        // Commission Fields
        brokerage: body.brokerage,
        commissionPct: body.commissionPct ? parseFloat(body.commissionPct) : null,
        referralPct: body.referralPct ? parseFloat(body.referralPct) : null,
        referralDollar: body.referralDollar ? parseFloat(body.referralDollar) : null,
        netVolume: body.netVolume ? parseFloat(body.netVolume) : null,
        
        // KW Specific
        eo: body.eo ? parseFloat(body.eo) : null,
        royalty: body.royalty ? parseFloat(body.royalty) : null,
        companyDollar: body.companyDollar ? parseFloat(body.companyDollar) : null,
        hoaTransfer: body.hoaTransfer ? parseFloat(body.hoaTransfer) : null,
        homeWarranty: body.homeWarranty ? parseFloat(body.homeWarranty) : null,
        kwCares: body.kwCares ? parseFloat(body.kwCares) : null,
        kwNextGen: body.kwNextGen ? parseFloat(body.kwNextGen) : null,
        boldScholarship: body.boldScholarship ? parseFloat(body.boldScholarship) : null,
        tcConcierge: body.tcConcierge ? parseFloat(body.tcConcierge) : null,
        jelmbergTeam: body.jelmbergTeam ? parseFloat(body.jelmbergTeam) : null,
        
        // BDH Specific
        bdhSplitPct: body.bdhSplitPct ? parseFloat(body.bdhSplitPct) : null,
        asf: body.asf ? parseFloat(body.asf) : null,
        foundation10: body.foundation10 ? parseFloat(body.foundation10) : null,
        adminFee: body.adminFee ? parseFloat(body.adminFee) : null,
        preSplitDeduction: body.preSplitDeduction ? parseFloat(body.preSplitDeduction) : null,
        brokerageSplit: body.brokerageSplit ? parseFloat(body.brokerageSplit) : null,
        
        // Universal
        otherDeductions: body.otherDeductions ? parseFloat(body.otherDeductions) : null,
        buyersAgentSplit: body.buyersAgentSplit ? parseFloat(body.buyersAgentSplit) : null,
        assistantBonus: body.assistantBonus ? parseFloat(body.assistantBonus) : null,
        
        // Google Sheets Sync
        googleSheetsId: body.googleSheetsId,
      }
    })
    
    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

