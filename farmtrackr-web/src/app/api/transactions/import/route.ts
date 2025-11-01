import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { calculateCommission } from '@/lib/commissionCalculations'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const fileContent = await file.arrayBuffer()
    
    let rows: any[] = []

    // Parse CSV
    if (fileExtension === 'csv') {
      const text = new TextDecoder().decode(fileContent)
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      })
      
      rows = parsed.data as any[]
    }
    // Parse Excel
    else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const workbook = XLSX.read(fileContent, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet) as any[]
    }
    else {
      return NextResponse.json({ error: 'Unsupported file format. Please upload a CSV or Excel file.' }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 })
    }

    // Debug: Log first row to see column structure
    if (rows.length > 0) {
      console.log('First row columns:', Object.keys(rows[0]))
      console.log('First row sample:', JSON.stringify(rows[0], null, 2))
    }

    let imported = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    // Helper functions
    const parseMoney = (value: any): number | null => {
      if (!value) return null
      const cleaned = String(value).replace(/[$,]/g, '')
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? null : parsed
    }

    const parseDate = (dateStr: any): Date | null => {
      if (!dateStr) return null
      // Handle string dates (from CSV/Excel)
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


    const normalizePercentage = (value: any): number | null => {
      if (!value) return null
      const num = parseFloat(String(value))
      if (isNaN(num)) return null
      // If > 1, assume it's a percentage (3.0 = 3%) and convert to decimal
      // If <= 1, assume it's already decimal
      return num > 1 ? num / 100 : num
    }

    // Process each row
    for (const row of rows) {
      try {
        // Skip truly empty rows - check if row has any meaningful data
        const rowKeys = Object.keys(row)
        const hasAnyData = rowKeys.some(key => {
          const value = row[key]
          return value !== null && value !== undefined && String(value).trim() !== ''
        })
        
        if (!hasAnyData) {
          skipped++
          continue
        }

        // Map column names (flexible field mapping with case-insensitive matching)
        const mapField = (names: string[]): any => {
          // First try exact match
          for (const name of names) {
            if (row[name]) return row[name]
          }
          // Then try case-insensitive match
          const rowKeys = Object.keys(row)
          for (const name of names) {
            const found = rowKeys.find(key => key.toLowerCase().trim() === name.toLowerCase().trim())
            if (found && row[found]) return row[found]
          }
          return null
        }

        // Basic fields
        const propertyType = mapField(['propertyType', 'Property Type', 'property_type', 'type']) || 'Residential'
        const clientType = mapField(['clientType', 'Client Type', 'client_type', 'client']) || 'Seller'
        const source = mapField(['source', 'Source', 'leadSource', 'lead_source'])
        const address = mapField(['address', 'Address', 'propertyAddress', 'property_address'])
        const city = mapField(['city', 'City', 'propertyCity', 'property_city'])
        const transactionType = mapField(['Transaction Type', 'transactionType', 'transaction_type', 'type']) || 'Sale'

        // Pricing fields
        const listPrice = parseMoney(mapField(['listPrice', 'List Price', 'list_price', 'listingPrice', 'listing_price']))
        const closedPrice = parseMoney(mapField(['closedPrice', 'Closed Price', 'closed_price', 'salePrice', 'sale_price', 'netVolume', 'NetVolume', 'net_volume']))
        
        // Date fields - prioritize exact column names from CSV, then try variations
        const listDate = parseDate(mapField([
          'listdate',        // Exact match from CSV (lowercase)
          'listDate', 
          'List Date', 
          'list_date', 
          'listingDate', 
          'listing_date',
          'LIST_DATE',
          'LISTING_DATE',
          'Listing Date',
          'ListingDate'
        ]))
        const closingDate = parseDate(mapField([
          'closingDate',     // Exact match from CSV (camelCase)
          'Closing Date', 
          'closing_date', 
          'closeDate', 
          'close_date', 
          'date',
          'closedDate',
          'closed_date',
          'CLOSING_DATE',
          'CLOSED_DATE',
          'Close Date',
          'CloseDate'
        ]))
        
        // Brokerage
        let brokerage = mapField(['brokerage', 'Brokerage', 'Broker']) || ''
        // Normalize brokerage
        if (brokerage) {
          brokerage = brokerage.trim()
          if (brokerage === 'KW' || brokerage.toLowerCase() === 'keller williams' || brokerage.toLowerCase().includes('keller')) {
            brokerage = 'KW'
          } else if (brokerage === 'BDH' || brokerage.toLowerCase() === 'bennion deville homes' || brokerage.toLowerCase().includes('bennion deville')) {
            brokerage = 'BDH'
          } else if (!isNaN(parseFloat(brokerage))) {
            brokerage = 'BDH' // Default if numeric
          } else {
            brokerage = 'BDH' // Default
          }
        } else {
          brokerage = 'BDH' // Default
        }

        // Commission fields - handle percentage conversion
        const commissionPct = normalizePercentage(mapField(['commissionPct', 'Commission %', 'commission_pct', 'commission', 'Commission', 'commPct']))
        const referralPct = normalizePercentage(mapField(['referralPct', 'Referral %', 'referral_pct', 'referral', 'Referral']))
        const referralDollar = parseMoney(mapField(['referralDollar', 'Referral $', 'referral_dollar', 'referralAmount', 'referral_amount']))
        const referralFeeReceived = parseMoney(mapField(['Referral Fee Received', 'referralFeeReceived', 'referral_fee_received', 'feeReceived']))
        const referringAgent = mapField(['Referring Agent', 'referringAgent', 'referring_agent', 'agent'])
        
        // Status
        const status = mapField(['status', 'Status']) || 'Closed'

        // KW specific fields
        const eo = parseMoney(mapField(['eo', 'EO', 'E&O']))
        const royalty = mapField(['royalty', 'Royalty'])
        const companyDollar = mapField(['companyDollar', 'Company Dollar', 'company_dollar'])
        const hoaTransfer = parseMoney(mapField(['hoaTransfer', 'HOA Transfer', 'hoa_transfer']))
        const homeWarranty = parseMoney(mapField(['homeWarranty', 'Home Warranty', 'home_warranty']))
        const kwCares = parseMoney(mapField(['kwCares', 'KW Cares', 'kw_cares']))
        const kwNextGen = parseMoney(mapField(['kwNextGen', 'KW NextGen', 'kw_next_gen']))
        const boldScholarship = parseMoney(mapField(['boldScholarship', 'Bold Scholarship', 'bold_scholarship']))
        const tcConcierge = parseMoney(mapField(['tcConcierge', 'TC Concierge', 'tc_concierge']))
        const jelmbergTeam = parseMoney(mapField(['jelmbergTeam', 'Jelmberg Team', 'jelmberg_team']))

        // BDH specific fields
        const bdhSplitPct = normalizePercentage(mapField(['bdhSplitPct', 'BDH Split %', 'bdh_split_pct', 'split']))
        const asf = parseMoney(mapField(['asf', 'ASF']))
        const foundation10 = parseMoney(mapField(['foundation10', 'Foundation 10', 'foundation_10']))
        const adminFee = parseMoney(mapField(['adminFee', 'Admin Fee', 'admin_fee']))
        const preSplitDeduction = mapField(['preSplitDeduction', 'Pre-Split Deduction', 'pre_split_deduction'])

        // Universal
        const otherDeductions = parseMoney(mapField(['otherDeductions', 'Other Deductions', 'other_deductions']))
        const buyersAgentSplit = parseMoney(mapField(['buyersAgentSplit', "Buyer's Agent Split", 'buyers_agent_split']))
        const assistantBonus = parseMoney(mapField(['assistantBonus', 'Assistant Bonus', 'assistant_bonus']))

        // Validate dates before storing - ensure they're valid Date objects or null
        // Dec 31, 1969 (Unix epoch) indicates invalid date, so reject dates before 1970
        const validatedListDate = listDate && listDate instanceof Date && !isNaN(listDate.getTime()) && listDate.getFullYear() >= 1970 ? listDate : null
        const validatedClosingDate = closingDate && closingDate instanceof Date && !isNaN(closingDate.getTime()) && closingDate.getFullYear() >= 1970 ? closingDate : null

        // Check if transaction already exists
        // Include clientType to allow same address for buyer/seller sides
        const existing = await prisma.transaction.findFirst({
          where: {
            address: address || undefined,
            closingDate: validatedClosingDate || undefined,
            clientType: clientType || undefined
          }
        })

        const transactionData: any = {
          propertyType,
          clientType,
          transactionType,
          source: source || null,
          address: address || null,
          city: city || null,
          listPrice,
          closedPrice,
          listDate: validatedListDate,
          closingDate: validatedClosingDate,
          status,
          brokerage,
          commissionPct: commissionPct !== null ? commissionPct : undefined,
          referralPct: referralPct !== null ? referralPct : undefined,
          referralDollar: referralDollar !== null ? referralDollar : undefined,
          referralFeeReceived: referralFeeReceived !== null ? referralFeeReceived : undefined,
          referringAgent: referringAgent || null,
          
          // KW
          eo: eo !== null ? eo : undefined,
          royalty: royalty !== null ? royalty : undefined,
          companyDollar: companyDollar !== null ? companyDollar : undefined,
          hoaTransfer: hoaTransfer !== null ? hoaTransfer : undefined,
          homeWarranty: homeWarranty !== null ? homeWarranty : undefined,
          kwCares: kwCares !== null ? kwCares : undefined,
          kwNextGen: kwNextGen !== null ? kwNextGen : undefined,
          boldScholarship: boldScholarship !== null ? boldScholarship : undefined,
          tcConcierge: tcConcierge !== null ? tcConcierge : undefined,
          jelmbergTeam: jelmbergTeam !== null ? jelmbergTeam : undefined,
          
          // BDH
          bdhSplitPct: bdhSplitPct !== null ? bdhSplitPct : undefined,
          asf: asf !== null ? asf : undefined,
          foundation10: foundation10 !== null ? foundation10 : undefined,
          adminFee: adminFee !== null ? adminFee : undefined,
          preSplitDeduction: preSplitDeduction !== null ? preSplitDeduction : undefined,
          
          // Universal
          otherDeductions: otherDeductions !== null ? otherDeductions : undefined,
          buyersAgentSplit: buyersAgentSplit !== null ? buyersAgentSplit : undefined,
          assistantBonus: assistantBonus !== null ? assistantBonus : undefined
        }

        // Validate required fields before attempting to save
        if (!propertyType || !clientType || !transactionType || !brokerage || !status) {
          console.error('Missing required fields:', {
            propertyType,
            clientType,
            transactionType,
            brokerage,
            status,
            row: JSON.stringify(row, null, 2)
          })
          errors++
          continue
        }

        if (existing) {
          try {
            await prisma.transaction.update({
              where: { id: existing.id },
              data: transactionData
            })
            updated++
          } catch (updateError: any) {
            console.error('Error updating transaction:', updateError)
            console.error('Transaction data:', JSON.stringify(transactionData, null, 2))
            errors++
          }
        } else {
          try {
            await prisma.transaction.create({
              data: transactionData
            })
            imported++
          } catch (createError: any) {
            console.error('Error creating transaction:', createError)
            console.error('Transaction data:', JSON.stringify(transactionData, null, 2))
            errors++
          }
        }

      } catch (error: any) {
        console.error('Error processing transaction row:', error)
        console.error('Row data:', JSON.stringify(row, null, 2))
        errors++
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

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({
      error: 'Failed to import transactions',
      message: error.message || 'Unknown error occurred'
    }, { status: 500 })
  }
}

