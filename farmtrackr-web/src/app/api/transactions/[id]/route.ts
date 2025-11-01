import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/transactions/[id]
 * Get a single transaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: params.id }
    })
    
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

/**
 * PUT /api/transactions/[id]
 * Update a transaction
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const transaction = await prisma.transaction.update({
      where: { id: params.id },
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
        
        // Universal
        otherDeductions: body.otherDeductions ? parseFloat(body.otherDeductions) : null,
        buyersAgentSplit: body.buyersAgentSplit ? parseFloat(body.buyersAgentSplit) : null,
        assistantBonus: body.assistantBonus ? parseFloat(body.assistantBonus) : null,
        
        // Google Sheets Sync
        googleSheetsId: body.googleSheetsId,
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.transaction.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

