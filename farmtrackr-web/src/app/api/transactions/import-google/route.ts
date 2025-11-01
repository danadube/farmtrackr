import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedSheetsClient } from '@/lib/googleAuth'
import { prisma } from '@/lib/prisma'

const SPREADSHEET_ID = '1JN8qt64Jpy3PIxW9WDVmTNmDVdoHDhY0hJ4ZBVAmTnQ'
const RANGE = 'Transactions!A2:Z' // Start from row 2 to skip headers

/**
 * Import transactions from Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const accessToken = await getGoogleAccessToken()
    
    if (!accessToken) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'Please connect your Google account in Settings > Google Integration'
      }, { status: 401 })
    }

    // Get authenticated Sheets client
    const sheets = getAuthenticatedSheetsClient(accessToken)
    
    console.log('📊 Reading transactions from Google Sheets...')
    
    // Read data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE
    })

    const rows = response.data.values || []
    
    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        total: 0,
        message: 'No transactions found in Google Sheets'
      })
    }

    console.log(`📊 Found ${rows.length} rows in Google Sheets`)

    // Column mapping based on the spreadsheet headers
    const HEADERS = [
      'propertyType',      // A: propertyType
      'type',              // B: type (this is clientType)
      'source',            // C: source
      'address',           // D: address
      'city',              // E: city
      'listPrice',         // F: listPrice
      'commission',        // G: commission (this is commissionPct)
      'pct',               // H: pct (not used)
      'listdate',          // I: listdate
      'closingdate',       // J: closingdate (this is closingDate)
      'brokerage',         // K: brokerage
      'netVolume',         // L: netVolume
      'grossProfit',       // M: grossProfit (this is GCI)
      'commissionPaid',    // N: commissionPaid (not used)
      'referralPct',       // O: referralPct
      'referralDollar',    // P: referralDollar
      'adjustedGCI',       // Q: adjustedGCI
      'prepaidDeductor',   // R: prepaidDeductor
      'brokerageSplit',    // S: brokerageSplit
      'adminFeesOther',    // T: adminFeesOther
      'status',            // U: status
      'assistantBonus',    // V: assistantBonus
      'buyersAgentSplit',  // W: buyersAgentSplit
      'transactionType',   // X: transactionType
      'referringAgent',    // Y: referringAgent
      'referralFeeReceiv'  // Z: referralFeeReceiv
    ]

    let imported = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    // Process each row
    for (const row of rows) {
      try {
        // Skip empty rows
        if (!row[0] || row.length < 5) {
          skipped++
          continue
        }

        // Build transaction data object
        const rowData: Record<string, string> = {}
        HEADERS.forEach((header, index) => {
          rowData[header] = row[index] || ''
        })

        // Parse dates
        const parseDate = (dateStr: string): Date | null => {
          if (!dateStr) return null
          try {
            const date = new Date(dateStr)
            return isNaN(date.getTime()) ? null : date
          } catch {
            return null
          }
        }

        // Parse numeric values (remove $ and commas)
        const parseMoney = (value: string): number | null => {
          if (!value) return null
          const cleaned = String(value).replace(/[$,]/g, '')
          const parsed = parseFloat(cleaned)
          return isNaN(parsed) ? null : parsed
        }

        // Map transaction data
        const propertyType = rowData.propertyType || 'Residential'
        const clientType = rowData.type || 'Seller'  // Changed from clientType to type
        const transactionType = rowData.transactionType || 'Sale'
        const brokerage = rowData.brokerage || 'Bennion Deville Homes'
        const address = rowData.address || null
        const city = rowData.city || null
        const status = rowData.status || 'Closed'

        // Parse numeric fields
        const listPrice = parseMoney(rowData.listPrice)
        const closedPrice = parseMoney(rowData.netVolume)  // netVolume is the closed price
        const commissionPct = parseFloat(rowData.commission) || null  // Changed from commissionPct to commission
        const referralPct = parseFloat(rowData.referralPct) || null
        const referralDollar = parseMoney(rowData.referralDollar)
        const referralFeeReceived = parseMoney(rowData.referralFeeReceiv)  // Fixed case

        // Dates
        const listDate = parseDate(rowData.listdate)
        const closingDate = parseDate(rowData.closingdate)  // Fixed case

        // Skip if no essential data
        if (!address && !city) {
          skipped++
          continue
        }

        // Map brokerage-specific fields
        let eo: number | null = null
        let royalty: string | null = null
        let companyDollar: string | null = null
        let hoaTransfer: number | null = null
        let homeWarranty: number | null = null
        let kwCares: number | null = null
        let kwNextGen: number | null = null
        let boldScholarship: number | null = null
        let tcConcierge: number | null = null
        let jelmbergTeam: number | null = null

        let asf: number | null = null
        let foundation10: number | null = null

        const otherDeductions = parseMoney(rowData.adminFeesOther) || null  // Fixed case
        const buyersAgentSplit = parseMoney(rowData.buyersAgentSplit) || null  // Fixed case
        const assistantBonus = parseMoney(rowData.assistantBonus) || null  // Fixed case
        const preSplitDeduction = parseMoney(rowData.prepaidDeductor) || null  // Map this field
        const bdhSplitPct = parseFloat(rowData.brokerageSplit) || null  // Map this field
        const adminFee = parseMoney(rowData.adminFeesOther) || null  // Same as otherDeductions in this sheet

        // Check if transaction already exists
        const existing = await prisma.transaction.findFirst({
          where: {
            address: address,
            closingDate: closingDate || undefined
          }
        })

        const transactionData = {
          propertyType,
          clientType,
          transactionType,
          source: rowData.source || null,
          address,
          city,
          listPrice,
          closedPrice,
          listDate,
          closingDate,
          status,
          brokerage,
          commissionPct,
          referralPct,
          referralDollar,
          referralFeeReceived,
          referringAgent: rowData.referringAgent || null,
          
          // KW
          eo,
          royalty,
          companyDollar,
          hoaTransfer,
          homeWarranty,
          kwCares,
          kwNextGen,
          boldScholarship,
          tcConcierge,
          jelmbergTeam,
          
          // BDH
          bdhSplitPct,
          asf,
          foundation10,
          adminFee,
          preSplitDeduction,
          
          // Universal
          otherDeductions,
          buyersAgentSplit,
          assistantBonus
        }

        if (existing) {
          await prisma.transaction.update({
            where: { id: existing.id },
            data: transactionData
          })
          updated++
        } else {
          await prisma.transaction.create({
            data: transactionData
          })
          imported++
        }

      } catch (error) {
        errors++
        console.error('Error importing transaction:', error)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
      errors,
      total: rows.length,
      message: `Imported ${imported}, updated ${updated}, skipped ${skipped} of ${rows.length} transactions`
    })

  } catch (error) {
    console.error('Google Sheets import error:', error)
    return NextResponse.json({
      error: 'Failed to import from Google Sheets',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

