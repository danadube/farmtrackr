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
        console.log(`Skipped empty row ${rows.indexOf(row) + 1}`)
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

        // Basic fields - use defaults if missing to avoid validation errors
        const propertyType = mapField(['propertyType', 'Property Type', 'property_type', 'type']) || 'Residential'
        const clientType = mapField(['clientType', 'Client Type', 'client_type', 'client']) || 'Seller'
        
        // Log if defaults are being used
        if (!mapField(['propertyType', 'Property Type', 'property_type', 'type'])) {
          console.warn(`Row ${rows.indexOf(row) + 1}: Using default propertyType 'Residential'`)
        }
        if (!mapField(['clientType', 'Client Type', 'client_type', 'client'])) {
          console.warn(`Row ${rows.indexOf(row) + 1}: Using default clientType 'Seller'`)
        }
        const source = mapField(['source', 'Source', 'leadSource', 'lead_source'])
        const address = mapField(['address', 'Address', 'propertyAddress', 'property_address'])
        const city = mapField(['city', 'City', 'propertyCity', 'property_city'])
        
        // Determine transaction type - check CSV first, then auto-detect based on data
        let transactionType = mapField(['Transaction Type', 'transactionType', 'transaction_type', 'type']) || 'Sale'
        
        // Auto-detect transaction type based on data patterns
        // Parse referralFeeReceived first to check if it's a referral transaction
        const referralFeeReceivedRaw = mapField(['Referral Fee Received', 'referralFeeReceived', 'referral_fee_received', 'feeReceived'])
        const referralFeeReceivedParsed = referralFeeReceivedRaw ? parseMoney(referralFeeReceivedRaw) : null
        const commissionPctCheck = mapField(['commissionPct', 'Commission %', 'commission_pct', 'commission', 'Commission', 'commPct'])
        const commissionPctNum = commissionPctCheck ? parseFloat(String(commissionPctCheck).replace(/[%,]/g, '')) : 0
        
        // If referral fee received exists (> 0) and commission % is 0 or missing, it's a referral received transaction
        // This overrides the CSV transaction type if the data indicates it's a referral
        if (referralFeeReceivedParsed && referralFeeReceivedParsed > 0 && (commissionPctNum === 0 || !commissionPctCheck)) {
          transactionType = 'Referral $ Received'
        }

        // Pricing fields - NetVolume maps to closedPrice in CSV
        const listPrice = parseMoney(mapField(['listPrice', 'List Price', 'list_price', 'listingPrice', 'listing_price']))
        // Closed price might be in closedPrice OR NetVolume column
        const closedPriceRaw = mapField(['closedPrice', 'Closed Price', 'closed_price', 'salePrice', 'sale_price'])
        const netVolumeRaw = mapField(['netVolume', 'NetVolume', 'net_volume'])
        const closedPrice = parseMoney(closedPriceRaw) || parseMoney(netVolumeRaw)
        
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
        
        // Brokerage - use default if missing
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
          console.warn(`Row ${rows.indexOf(row) + 1}: Using default brokerage 'BDH'`)
        }

        // Commission fields - handle percentage conversion
        const commissionPctRaw = mapField(['commissionPct', 'Commission %', 'commission_pct', 'commission', 'Commission', 'commPct'])
        const commissionPct = normalizePercentage(commissionPctRaw)
        const referralPctRaw = mapField(['referralPct', 'Referral %', 'referral_pct', 'referral', 'Referral'])
        const referralPct = normalizePercentage(referralPctRaw)
        
        // Debug logging for commission percentage issues
        // Only warn if commissionPct is 0 but it's NOT a referral transaction
        // Referral transactions legitimately have commissionPct = 0
        if (commissionPctRaw && (!commissionPct || commissionPct === 0) && transactionType !== 'Referral $ Received') {
          console.warn('Commission % may be incorrectly parsed:', {
            raw: commissionPctRaw,
            normalized: commissionPct,
            transactionType: transactionType,
            row: JSON.stringify(row, null, 2)
          })
        }
        const referralDollar = parseMoney(mapField(['referralDollar', 'Referral $', 'referral_dollar', 'referralAmount', 'referral_amount']))
        // Use the already-parsed referralFeeReceived from above if available, otherwise parse again
        const referralFeeReceived = referralFeeReceivedParsed || parseMoney(mapField(['Referral Fee Received', 'referralFeeReceived', 'referral_fee_received', 'feeReceived']))
        const referringAgent = mapField(['Referring Agent', 'referringAgent', 'referring_agent', 'agent'])
        
        // Status - use default if missing
        const status = mapField(['status', 'Status']) || 'Closed'
        if (!mapField(['status', 'Status'])) {
          console.warn(`Row ${rows.indexOf(row) + 1}: Using default status 'Closed'`)
        }

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
        const preSplitDeduction = parseMoney(mapField(['preSplitDeduction', 'Pre-Split Deduction', 'pre_split_deduction', 'presplitdeduction']))

        // Universal - handle combined columns from CSV
        // adminfees-otherdeductions column is the TOTAL for both admin fees and other deductions
        const adminfeesOther = parseMoney(mapField(['adminfees-otherdeductions', 'adminfees-otherdeductions', 'adminFees-otherDeductions', 'Admin Fees-Other Deductions']))
        const brokerageSplit = parseMoney(mapField(['brokeragesplit', 'brokerageSplit', 'Brokerage Split', 'brokerage_split']))
        
        // IMPORTANT: adminfees-otherdeductions is a COMBINED total, not separate values
        // If we have separate columns, use those. Otherwise use the combined value for adminFee only.
        // Do NOT add adminfeesOther to both adminFee and otherDeductions (that would double count!)
        let finalAdminFee = adminFee
        let finalOtherDeductions = parseMoney(mapField(['otherDeductions', 'Other Deductions', 'other_deductions']))
        
        // Only use adminfeesOther if we don't have separate values
        if (finalAdminFee === null && finalOtherDeductions === null && adminfeesOther !== null) {
          // Use the combined value as adminFee (per spreadsheet formula, adminFeesCombined = adminFee + otherDeductions)
          // Since we only subtract adminFeesCombined in NCI calculation, assign it to adminFee
          finalAdminFee = adminfeesOther
          finalOtherDeductions = null
        } else if (finalAdminFee === null && adminfeesOther !== null) {
          // We have adminfeesOther but no separate adminFee, use it for adminFee
          finalAdminFee = adminfeesOther
        }
        
        // If we have both separate values, use them. Don't double count adminfeesOther.
        
        const buyersAgentSplit = parseMoney(mapField(['buyersagentsplit', 'buyersAgentSplit', "Buyer's Agent Split", 'buyers_agent_split']))
        const assistantBonus = parseMoney(mapField(['assistantbonus', 'assistantBonus', 'Assistant Bonus', 'assistant_bonus']))
        
        // NCI from CSV (especially important for referral transactions)
        const csvNci = parseMoney(mapField(['nci', 'NCI', 'Net Commission Income', 'netCommissionIncome', 'net_commission_income']))

        // Validate dates before storing - ensure they're valid Date objects or null
        // Dec 31, 1969 (Unix epoch) indicates invalid date, so reject dates before 1970
        const validatedListDate = listDate && listDate instanceof Date && !isNaN(listDate.getTime()) && listDate.getFullYear() >= 1970 ? listDate : null
        const validatedClosingDate = closingDate && closingDate instanceof Date && !isNaN(closingDate.getTime()) && closingDate.getFullYear() >= 1970 ? closingDate : null

        // Check if transaction already exists
        // Match by address + clientType (to allow buyer/seller on same property)
        // Only match if BOTH address and clientType match (strict matching)
        // Dates are used as additional criteria but not required for match
        const whereClause: any = {}
        
        // Address and clientType are required for duplicate check
        if (address) {
          whereClause.address = address
        }
        if (clientType) {
          whereClause.clientType = clientType
        }
        
        // Only check for duplicates if we have both address and clientType
        // Without these, we can't reliably identify duplicates
        let existing = null
        if (address && clientType) {
          // Try multiple matching strategies, from most specific to least specific
          
          // Strategy 1: Match by address + clientType + closingDate (most specific)
          if (validatedClosingDate) {
            existing = await prisma.transaction.findFirst({
              where: {
                address: address,
                clientType: clientType,
                closingDate: validatedClosingDate
              }
            })
            if (existing) {
              console.log(`Duplicate found (strategy 1): ${address}, ${clientType}, closingDate: ${validatedClosingDate.toISOString()}, existing ID: ${existing.id}`)
            }
          }
          
          // Strategy 2: If not found, try address + clientType + listDate
          if (!existing && validatedListDate) {
            existing = await prisma.transaction.findFirst({
              where: {
                address: address,
                clientType: clientType,
                listDate: validatedListDate
              }
            })
            if (existing) {
              console.log(`Duplicate found (strategy 2): ${address}, ${clientType}, listDate: ${validatedListDate.toISOString()}, existing ID: ${existing.id}`)
            }
          }
          
          // Strategy 3: If still not found and we have transaction type and brokerage, try exact match
          // This catches duplicates where dates weren't provided in CSV
          // BUT - only use this if we don't have dates, to avoid false matches
          if (!existing && transactionType && brokerage && !validatedClosingDate && !validatedListDate) {
            existing = await prisma.transaction.findFirst({
              where: {
                address: address,
                clientType: clientType,
                transactionType: transactionType,
                brokerage: brokerage
              }
            })
            if (existing) {
              console.log(`Duplicate found (strategy 3 - no dates): ${address}, ${clientType}, ${transactionType}, ${brokerage}, existing ID: ${existing.id}`)
            }
          }
          
          // Strategy 4: Removed - too risky, can create false matches
          // If no exact match found with dates or transaction type, treat as new transaction
        }

        // For referral transactions, store CSV NCI in notes as JSON so we can use it directly
        // Format: { "csvNci": 1234.56 } or null
        // Note: Only add notes field if it exists in the database (after migration)
        let notesData: any = null
        if (transactionType === 'Referral $ Received' && csvNci !== null && csvNci !== undefined) {
          notesData = JSON.stringify({ csvNci: csvNci })
        }

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
          referringAgent: referringAgent || null
          
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
          adminFee: finalAdminFee !== null ? finalAdminFee : undefined,
          preSplitDeduction: preSplitDeduction !== null ? preSplitDeduction : undefined,
          brokerageSplit: brokerageSplit !== null ? brokerageSplit : undefined, // Store pre-calculated value from CSV
          
          // Universal
          otherDeductions: finalOtherDeductions !== null ? finalOtherDeductions : undefined,
          buyersAgentSplit: buyersAgentSplit !== null ? buyersAgentSplit : undefined,
          assistantBonus: assistantBonus !== null ? assistantBonus : undefined
        }
        
        // Only add notes field if we have notes data
        // NOTE: This requires the database migration to be run first
        // If you're getting errors about 'notes' column, run: npx prisma migrate deploy
        if (notesData !== null) {
          transactionData.notes = notesData
        }

        // Validate required fields before attempting to save
        if (!propertyType || !clientType || !transactionType || !brokerage || !status) {
          console.error('Missing required fields (skipping):', {
            propertyType,
            clientType,
            transactionType,
            brokerage,
            status,
            address: address || 'no address',
            row: JSON.stringify(row, null, 2)
          })
          errors++
          continue
        }
        
        // Log if transaction would be updated vs imported
        if (existing) {
          console.log(`Duplicate found (will UPDATE): ${address || 'no address'}, ${clientType}, closingDate: ${validatedClosingDate ? validatedClosingDate.toISOString() : 'none'}, existing ID: ${existing.id}`)
          console.log(`  Existing: ${existing.address}, ${existing.clientType}, ${existing.closingDate ? new Date(existing.closingDate).toISOString() : 'no date'}`)
          console.log(`  New: ${address}, ${clientType}, ${validatedClosingDate ? validatedClosingDate.toISOString() : 'no date'}`)
        } else {
          console.log(`New transaction (will IMPORT): ${address || 'no address'}, ${clientType}, ${transactionType}, closingDate: ${validatedClosingDate ? validatedClosingDate.toISOString() : 'none'}`)
        }

        if (existing) {
          try {
            const updateResult = await prisma.transaction.update({
              where: { id: existing.id },
              data: transactionData
            })
            updated++
            console.log(`✓ Updated transaction: ${address || 'no address'}, ${clientType}, ${transactionType}, ID: ${existing.id}`)
          } catch (updateError: any) {
            console.error('✗ Error updating transaction:', updateError)
            console.error('Error details:', updateError?.message, updateError?.code)
            console.error('Transaction data:', JSON.stringify(transactionData, null, 2))
            errors++
          }
        } else {
          try {
            const createResult = await prisma.transaction.create({
              data: transactionData
            })
            imported++
            console.log(`✓ Imported transaction: ${address || 'no address'}, ${clientType}, ${transactionType}, ID: ${createResult.id}`)
          } catch (createError: any) {
            console.error('✗ Error creating transaction:', createError)
            console.error('Error details:', createError?.message, createError?.code)
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

