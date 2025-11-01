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
    
    // DEBUG: Log first row for column verification
    if (rows.length > 0) {
      console.log('\n🔍 First row from Google Sheets:')
      console.log('   Row data:', rows[0])
      console.log(`   Total columns: ${rows[0].length}`)
      for (let i = 0; i < rows[0].length && i < 15; i++) {
        console.log(`   Column ${String.fromCharCode(65 + i)}: "${rows[0][i]}"`)
      }
    }

    // Column mapping based on the ACTUAL spreadsheet structure (verified from screenshot)
    // A=propertyType, B=source, C=address, D=city, E=listPrice, F=commissionPct, G=listDate, H=closingDate
    // I=Date, J=brokerage, K=NetVolume, L=grossCommission, M=closePrice, N=referralPct, O=referralDollar
    // P=adjustedGCI, Q=p_adjustedGCI, R=prededucbrokerageplit, S=adminfeesotherinc, T=adminfees
    // U=status, V=assistantbonus, W=buyersagentplit, X=transactionType, Y=Referring Agent, Z=Referral Fee Received
    const HEADERS = [
      'propertyType',      // A: propertyType
      'source',            // B: source (lead source - may contain "Buyer"/"Seller" as clientType)
      'address',           // C: address
      'city',              // D: city
      'listPrice',         // E: listPrice
      'commissionPct',     // F: commissionPct (decimal, e.g. 0.025)
      'listDate',          // G: listDate
      'closingDate',       // H: closingDate
      'date',              // I: Date (additional date field - may be same as closingDate)
      'brokerage',         // J: brokerage (e.g. "Bennion Deville Homes")
      'netVolume',         // K: NetVolume (closed price)
      'grossCommission',  // L: grossCommission (calculated GCI)
      'closePrice',        // M: closePrice (another price field)
      'referralPct',       // N: referralPct (decimal, e.g. 0.25)
      'referralDollar',    // O: referralDollar
      'adjustedGCI',       // P: adjustedGCI
      'p_adjustedGCI',     // Q: p_adjustedGCI
      'prededucbrokerageplit', // R: pre-deduction brokerage split
      'adminfeesotherinc', // S: admin fees other income
      'adminfees',         // T: admin fees
      'status',            // U: status
      'assistantbonus',    // V: assistantBonus
      'buyersagentplit',   // W: buyersAgentSplit
      'transactionType',   // X: transactionType
      'referringAgent',    // Y: Referring Agent
      'referralFeeReceived' // Z: Referral Fee Received
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
        const parseDate = (dateStr: any): Date | null => {
          if (!dateStr) return null
          // Handle string dates (from Google Sheets)
          if (typeof dateStr === 'string') {
            const trimmed = dateStr.trim()
            if (!trimmed || trimmed === '' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'na') return null
            // Try parsing M/D/YYYY format (common in spreadsheets)
            const mdyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
            if (mdyMatch) {
              const [, month, day, year] = mdyMatch
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            }
            // Try parsing standard ISO format
            const date = new Date(trimmed)
            if (!isNaN(date.getTime())) return date
          }
          // Handle Date objects (from Google Sheets API)
          if (dateStr instanceof Date) {
            return isNaN(dateStr.getTime()) ? null : dateStr
          }
          // Try converting to date
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
        // Extract clientType from source field (if "Buyer" or "Seller", use that; otherwise default to "Seller")
        const sourceValue = (rowData.source || '').trim()
        const clientType = sourceValue === 'Buyer' ? 'Buyer' : sourceValue === 'Seller' ? 'Seller' : 'Seller'
        // Source is the lead source (unless it's Buyer/Seller, then it's empty)
        const source = (sourceValue === 'Buyer' || sourceValue === 'Seller') ? null : sourceValue || null
        const transactionType = rowData.transactionType || 'Sale'
        // Normalize brokerage to 'KW' or 'BDH' format
        let brokerage = (rowData.brokerage || '').trim()
        // If it's a number, skip it and set default
        if (brokerage && !isNaN(parseFloat(brokerage))) {
          brokerage = 'BDH' // Default if numeric
        } else if (brokerage === 'KW' || brokerage === 'Keller Williams') {
          brokerage = 'KW'
        } else if (brokerage === 'BDH' || brokerage === 'Bennion Deville Homes' || brokerage.includes('Bennion Deville')) {
          brokerage = 'BDH'
        } else if (!brokerage) {
          brokerage = 'BDH' // Default
        }
        const address = rowData.address || null
        const city = rowData.city || null
        const status = rowData.status || 'Closed'

        // Parse numeric fields
        const listPrice = parseMoney(rowData.listPrice)
        const closedPrice = parseMoney(rowData.netVolume) || parseMoney(rowData.closePrice)  // NetVolume or closePrice
        
        // Convert percentages: standalone uses 3.0=3%, we need 0.03
        const convertPercentage = (value: any): number | null => {
          if (!value) return null
          const num = parseFloat(String(value))
          if (isNaN(num)) return null
          return num > 1 ? num / 100 : num  // If > 1, assume percentage and convert to decimal
        }
        
        const commissionPct = convertPercentage(rowData.commissionPct)
        const referralPct = convertPercentage(rowData.referralPct)
        const referralDollar = parseMoney(rowData.referralDollar)
        const referralFeeReceived = parseMoney(rowData.referralFeeReceived)

        // Dates
        const listDate = parseDate(rowData.listDate)
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

        let asf: number | null = null
        let foundation10: number | null = null

        const otherDeductions = parseMoney(rowData.adminfeesotherinc) || null  // R: admin fees other income
        const buyersAgentSplit = parseMoney(rowData.buyersagentplit) || null  // V: buyersAgentSplit
        const assistantBonus = parseMoney(rowData.assistantbonus) || null  // U: assistantBonus
        const preSplitDeduction = parseMoney(rowData.prededucbrokerageplit) || null  // Q: pre-deduction brokerage split (dollar amount)
        const bdhSplitPct = null  // Split percentage not in sheet, will use default 94% in calculation
        const adminFee = parseMoney(rowData.adminfees) || null  // S: admin fees

        // Check if transaction already exists
        // Include clientType to allow same address for buyer/seller sides
        const existing = await prisma.transaction.findFirst({
          where: {
            address: address,
            closingDate: closingDate || undefined,
            clientType: clientType || undefined
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

