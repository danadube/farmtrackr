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
      'propertyType',      // A
      'clientType',        // B
      'source',            // C
      'address',           // D
      'city',              // E
      'listPrice',         // F
      'commissionPct',     // G
      'listdate',          // H
      'closingDate',       // I
      'brokerage',         // J
      'netVolume',         // K
      'closedPrice',       // L
      'gci',               // M
      'referralPct',       // N
      'referralDollar',    // O
      'adjustedGci',       // P
      'presplitdeduction', // Q
      'brokeragesplit',    // R
      'adminfees',         // S
      'nci',               // T
      'status',            // U
      'assistantbonus',    // V
      'buyersagentsplit',  // W
      'transactionType',   // X
      'referringAgent',    // Y
      'referralFeeReceived' // Z
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
        const clientType = rowData.clientType || 'Seller'
        const transactionType = rowData.transactionType || 'Sale'
        const brokerage = rowData.brokerage || 'Bennion Deville Homes'
        const address = rowData.address || null
        const city = rowData.city || null
        const status = rowData.status || 'Closed'

        // Parse numeric fields
        const listPrice = parseMoney(rowData.listPrice)
        const closedPrice = parseMoney(rowData.closedPrice) || parseMoney(rowData.netVolume)
        const commissionPct = parseFloat(rowData.commissionPct) || null
        const referralPct = parseFloat(rowData.referralPct) || null
        const referralDollar = parseMoney(rowData.referralDollar)
        const referralFeeReceived = parseMoney(rowData.referralFeeReceived)

        // Dates
        const listDate = parseDate(rowData.listdate)
        const closingDate = parseDate(rowData.closingDate)

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

        let bdhSplitPct: number | null = null
        let asf: number | null = null
        let foundation10: number | null = null
        let adminFee: number | null = null
        let preSplitDeduction: number | null = null

        const otherDeductions = parseMoney(rowData.adminfees) || null
        const buyersAgentSplit = parseMoney(rowData.buyersagentsplit) || null
        const assistantBonus = parseMoney(rowData.assistantbonus) || null

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

