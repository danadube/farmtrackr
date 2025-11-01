/**
 * Commission Calculation Utilities
 * Ported from Commission Dashboard for FarmTrackr
 */

export interface TransactionInput {
  brokerage: string
  transactionType?: string
  closedPrice?: string | number
  commissionPct?: string | number
  referralPct?: string | number
  referralFeeReceived?: string | number
  
  // KW specific
  eo?: string | number
  royalty?: string | number | ''
  companyDollar?: string | number | ''
  hoaTransfer?: string | number
  homeWarranty?: string | number
  kwCares?: string | number
  kwNextGen?: string | number
  boldScholarship?: string | number
  tcConcierge?: string | number
  jelmbergTeam?: string | number
  
  // BDH specific
  bdhSplitPct?: string | number
  preSplitDeduction?: string | number | ''
  asf?: string | number
  foundation10?: string | number
  adminFee?: string | number
  brokerageSplit?: string | number // Brokerage split (flat value OR calculated from percentage)
  brokerageSplitPct?: string | number // Percentage to calculate brokerageSplit if not provided as flat value
  
  // Universal
  otherDeductions?: string | number
  buyersAgentSplit?: string | number
  
  // Pre-calculated NCI from CSV (used for referral transactions)
  nci?: string | number
}

export interface CommissionResult {
  gci: string
  referralDollar: string
  adjustedGci: string
  royalty?: string
  companyDollar?: string
  preSplitDeduction?: string
  totalBrokerageFees: string
  nci: string
  netVolume: string
  bdhSplit?: string // BDH Split value for tooltip
}

/**
 * Calculate commission breakdown for a transaction
 */
export function calculateCommission(data: TransactionInput): CommissionResult {
  const {
    brokerage,
    transactionType = 'Sale',
    closedPrice = 0,
    commissionPct = 0,
    referralPct = 0,
    referralFeeReceived = 0,
    
    // KW fields
    eo = 0,
    royalty = '',
    companyDollar = '',
    hoaTransfer = 0,
    homeWarranty = 0,
    kwCares = 0,
    kwNextGen = 0,
    boldScholarship = 0,
    tcConcierge = 0,
    jelmbergTeam = 0,
    
    // BDH fields
    bdhSplitPct = 0,
    preSplitDeduction = '',
    asf = 0,
    foundation10 = 0,
    adminFee = 0,
    brokerageSplit = 0, // Brokerage split (flat value OR calculated from percentage)
    brokerageSplitPct = undefined, // Percentage to calculate brokerageSplit if not provided as flat value
    
    // Universal
    otherDeductions = 0,
    buyersAgentSplit = 0,
    
    // Pre-calculated NCI from CSV (used for referral transactions)
    nci: providedNci = undefined
  } = data

  // Parse all values as numbers
  const price = parseFloat(String(closedPrice)) || 0
  const commPct = parseFloat(String(commissionPct)) || 0
  const refPct = parseFloat(String(referralPct)) || 0
  const refFeeReceived = parseFloat(String(referralFeeReceived)) || 0

  let gci: number
  let referralDollar: number
  let adjustedGci: number

  // REFERRAL $ RECEIVED: You refer client to another agent, receive referral fee
  if (transactionType === 'Referral $ Received') {
    gci = refFeeReceived // GCI is the referral fee itself
    referralDollar = 0 // You're not paying a referral
    adjustedGci = gci // No adjustment needed
    
    // For referral transactions, use NCI directly from CSV if provided
    // Referrals are calculated differently and shouldn't use the standard formula
    if (providedNci !== undefined && providedNci !== null && providedNci !== '') {
      const csvNci = parseFloat(String(providedNci)) || 0
      return {
        gci: gci.toFixed(2),
        referralDollar: '0.00',
        adjustedGci: adjustedGci.toFixed(2),
        totalBrokerageFees: (gci - csvNci).toFixed(2), // Calculate fees as difference for display
        nci: csvNci.toFixed(2), // Use CSV value directly
        netVolume: price.toFixed(2)
      }
    }
  } 
  // REGULAR SALE or REFERRAL $ PAID: Calculate from property price
  else {
    // Calculate GCI (Gross Commission Income)
    // Handle both decimal (0.03) and whole number (3.0) percentage formats
    // If commPct > 1, assume it's a whole number percentage and divide by 100
    // If commPct <= 1, assume it's already a decimal
    const normalizedCommPct = commPct > 1 ? commPct / 100 : commPct
    gci = price * normalizedCommPct
    
    // Calculate Referral Dollar if referral percentage is provided
    // Handle both decimal (0.25) and whole number (25.0) percentage formats
    const normalizedRefPct = refPct > 1 ? refPct / 100 : refPct
    referralDollar = refPct > 0 ? gci * normalizedRefPct : 0
    
    // Calculate Adjusted GCI (after referral)
    adjustedGci = gci - referralDollar
  }

  let totalBrokerageFees = 0
  let nci = 0

  if (brokerage === 'KW' || brokerage === 'Keller Williams') {
    // KW Commission Calculation
    // Use manual values if provided, otherwise calculate
    const royaltyValue = royalty !== '' && royalty !== null && royalty !== undefined 
      ? parseFloat(String(royalty)) 
      : adjustedGci * 0.06 // 6% of Adjusted GCI
    const companyDollarValue = companyDollar !== '' && companyDollar !== null && companyDollar !== undefined 
      ? parseFloat(String(companyDollar)) 
      : adjustedGci * 0.10 // 10% of Adjusted GCI
    
    totalBrokerageFees = 
      (parseFloat(String(eo)) || 0) +
      royaltyValue +
      companyDollarValue +
      (parseFloat(String(hoaTransfer)) || 0) +
      (parseFloat(String(homeWarranty)) || 0) +
      (parseFloat(String(kwCares)) || 0) +
      (parseFloat(String(kwNextGen)) || 0) +
      (parseFloat(String(boldScholarship)) || 0) +
      (parseFloat(String(tcConcierge)) || 0) +
      (parseFloat(String(jelmbergTeam)) || 0) +
      (parseFloat(String(otherDeductions)) || 0) +
      (parseFloat(String(buyersAgentSplit)) || 0)

    nci = adjustedGci - totalBrokerageFees

    return {
      gci: gci.toFixed(2),
      referralDollar: referralDollar.toFixed(2),
      adjustedGci: adjustedGci.toFixed(2),
      royalty: royaltyValue.toFixed(2),
      companyDollar: companyDollarValue.toFixed(2),
      totalBrokerageFees: totalBrokerageFees.toFixed(2),
      nci: nci.toFixed(2),
      netVolume: price.toFixed(2)
    }
  } else if (brokerage === 'BDH' || brokerage === 'Bennion Deville Homes' || brokerage?.includes('Bennion Deville')) {
    // BDH Commission Calculation (Exact Formula Chain)
    // Step 4: Pre-Split Deduction (amount remaining after 6% + $10 deduction)
    // Formula: PreSplitDeduction = AdjustedGCI - (AdjustedGCI * 0.06) - 10
    // IMPORTANT: CSV "presplitdeduction" column may contain:
    //   - The amount DEDUCTED (6% + $10), OR
    //   - The amount REMAINING after deduction
    // We need to detect which one it is by comparing to expected deduction
    const expectedDeduction = (adjustedGci * 0.06) + 10 // 6% + $10
    let preSplitDeductionValue: number
    
    if (preSplitDeduction !== '' && preSplitDeduction !== null && preSplitDeduction !== undefined) {
      const csvValue = parseFloat(String(preSplitDeduction))
      // If CSV value is close to expected deduction amount (within $50), it's the amount DEDUCTED
      // Otherwise, treat it as the amount REMAINING
      if (Math.abs(csvValue - expectedDeduction) < 50) {
        // CSV has the amount DEDUCTED, calculate remaining
        preSplitDeductionValue = adjustedGci - csvValue
      } else {
        // CSV has the amount REMAINING, use it directly
        preSplitDeductionValue = csvValue
      }
    } else {
      // Calculate: AdjustedGCI * 0.94 - 10
      preSplitDeductionValue = adjustedGci - (adjustedGci * 0.06) - 10
    }
    
    // Step 5: BDH Split = PreSplitDeduction * 0.10 (10% of Pre-Split Deduction)
    // This is CALCULATED (always 10%)
    // If manual override provided, use it; otherwise calculate
    const bdhSplitValue = brokerageSplit !== '' && brokerageSplit !== null && brokerageSplit !== undefined && parseFloat(String(brokerageSplit)) > 0
      ? parseFloat(String(brokerageSplit)) // Manual override
      : preSplitDeductionValue * 0.10 // Calculated: 10% of Pre-Split Deduction
    
    // Admin Fees / Other Deductions: Combined
    const adminFeesCombined = 
      (parseFloat(String(adminFee)) || 0) +
      (parseFloat(String(otherDeductions)) || 0)
    
    // Total Fees = BDHSplit + AdminFees (only these two)
    totalBrokerageFees = bdhSplitValue + adminFeesCombined
    
    // Step 6: NCI = PreSplitDeduction - Total Fees
    nci = preSplitDeductionValue - totalBrokerageFees

      return {
      gci: gci.toFixed(2),
      referralDollar: referralDollar.toFixed(2),
      adjustedGci: adjustedGci.toFixed(2),
      preSplitDeduction: preSplitDeductionValue.toFixed(2),
      totalBrokerageFees: totalBrokerageFees.toFixed(2),
      nci: nci.toFixed(2),
      netVolume: price.toFixed(2),
      // BDH specific values for tooltip
      bdhSplit: bdhSplitValue.toFixed(2)
    }
  }

  return {
    gci: gci.toFixed(2),
    referralDollar: referralDollar.toFixed(2),
    adjustedGci: adjustedGci.toFixed(2),
    totalBrokerageFees: '0.00',
    nci: adjustedGci.toFixed(2),
    netVolume: price.toFixed(2)
  }
}

/**
 * Format currency for display in inputs
 */
export function formatCurrencyForInput(value: string | number | null | undefined): string {
  if (!value || value === '') return ''
  const num = parseFloat(String(value))
  if (isNaN(num)) return ''
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Parse currency from formatted input
 */
export function parseCurrencyFromInput(value: string): string {
  if (!value || value === '') return ''
  const cleaned = value.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? '' : num.toString()
}

/**
 * Format percentage for display in inputs
 */
export function formatPercentageForInput(value: string | number | null | undefined): string {
  if (!value || value === '') return ''
  const num = parseFloat(String(value))
  if (isNaN(num)) return ''
  // Convert decimal to percentage (0.03 -> 3%)
  return `${(num * 100).toFixed(2)}%`
}

/**
 * Parse percentage from formatted input
 */
export function parsePercentageFromInput(value: string): string {
  if (!value || value === '') return ''
  const cleaned = value.replace(/%/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? '' : (num / 100).toString()
}

/**
 * Check if a calculated field should be auto-updated
 */
export function shouldAutoUpdate(field: string, manuallyEditedFields: Set<string>): boolean {
  const autoUpdateableFields = ['gci', 'referralDollar', 'adjustedGci', 'royalty', 'companyDollar', 'preSplitDeduction', 'totalBrokerageFees', 'nci']
  if (!autoUpdateableFields.includes(field)) return true
  return !manuallyEditedFields.has(field)
}

/**
 * Format percentage for display (decimal to % string)
 */
export function formatPercentageDisplay(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

/**
 * Parse percentage input and return as decimal (for reverse calculations)
 */
export function parsePercentageInput(value: string): number {
  const cleaned = value.replace(/%/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num / 100
}

