/**
 * Script to import commission transaction data from CSV
 * Run: npx tsx scripts/import-commission-data.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const prisma = new PrismaClient()

interface TransactionRow {
  propertyType: string
  clientType: string
  source: string
  address: string
  city: string
  listPrice: string
  closedPrice: string
  listDate: string
  closingDate: string
  brokerage: string
  commissionPct: string
  gci: string
  referralPct: string
  referralDollar: string
  adjustedGci: string
  totalBrokerageFees: string
  nci: string
  status: string
}

function parseCSV(filePath: string): TransactionRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',')
  
  const transactions: TransactionRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''))
    if (values.length < headers.length) continue
    
    transactions.push({
      propertyType: values[0] || 'Residential',
      clientType: values[1] || 'Seller',
      source: values[2] || '',
      address: values[3] || '',
      city: values[4] || '',
      listPrice: values[5] || '',
      closedPrice: values[6] || '',
      listDate: values[7] || '',
      closingDate: values[8] || '',
      brokerage: values[9] || 'Bennion Deville Homes',
      commissionPct: values[10] || '',
      gci: values[11] || '',
      referralPct: values[12] || '',
      referralDollar: values[13] || '',
      adjustedGci: values[14] || '',
      totalBrokerageFees: values[15] || '',
      nci: values[16] || '',
      status: values[17] || 'Closed'
    })
  }
  
  return transactions
}

async function importData() {
  try {
    console.log('🚀 Starting commission data import...')
    
    const csvPath = path.join(process.cwd(), '../../commission-dashboard/public/assets/Real Estate Transactions Oct 26 2025.csv')
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found!')
      process.exit(1)
    }
    
    const transactions = parseCSV(csvPath)
    console.log(`📊 Found ${transactions.length} transactions to import`)
    
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    let imported = 0
    let skipped = 0
    
    for (const t of transactions) {
      try {
        // Parse transaction data
        const listPrice = t.listPrice ? parseFloat(t.listPrice) : null
        const closedPrice = t.closedPrice ? parseFloat(t.closedPrice) : null
        const commissionPct = t.commissionPct ? parseFloat(t.commissionPct) : null
        const referralPct = t.referralPct ? parseFloat(t.referralPct) : null
        const referralDollar = t.referralDollar ? parseFloat(t.referralDollar) : null
        const listDate = t.listDate ? new Date(t.listDate) : null
        const closingDate = t.closingDate ? new Date(t.closingDate) : null
        
        // Map brokerage names
        const brokerage = t.brokerage === 'Bennion Deville Homes' ? 'Bennion Deville Homes' : t.brokerage
        
        // Check if transaction already exists (by address and closing date)
        const existing = await prisma.transaction.findFirst({
          where: {
            address: t.address,
            closingDate: closingDate
          }
        })
        
        if (existing) {
          skipped++
          continue
        }
        
        // Determine transaction type
        let transactionType = 'Sale'
        if (t.source.toLowerCase().includes('referral')) {
          if (parseFloat(t.referralDollar) > 0) {
            transactionType = parseFloat(t.commissionPct) === 0 ? 'Referral $ Received' : 'Sale'
          }
        }
        
        // Map to BDH specific fields based on brokerage
        let asf: number | null = null
        let foundation10: number | null = null
        let adminFee: number | null = null
        let preSplitDeduction: number | null = null
        let bdhSplitPct: number | null = null
        
        if (brokerage === 'Bennion Deville Homes') {
          const totalFees = parseFloat(t.totalBrokerageFees) || 0
          const adjustedGci = parseFloat(t.adjustedGci) || listPrice ? (listPrice * (commissionPct || 0)) : 0
          
          // Rough estimates for BDH fields
          if (totalFees > 0) {
            // Split fees proportionally (these are approximate)
            asf = totalFees * 0.4
            foundation10 = totalFees * 0.1
            adminFee = totalFees * 0.3
            preSplitDeduction = totalFees * 0.2
          }
          
          bdhSplitPct = 0.02 // Default 2% split
        }
        
        await prisma.transaction.create({
          data: {
            propertyType: t.propertyType,
            clientType: t.clientType,
            transactionType,
            source: t.source || null,
            address: t.address || null,
            city: t.city || null,
            listPrice,
            closedPrice,
            listDate,
            closingDate,
            status: t.status || 'Closed',
            brokerage,
            commissionPct,
            referralPct,
            referralDollar,
            
            // BDH fields
            bdhSplitPct,
            asf,
            foundation10,
            adminFee,
            preSplitDeduction,
            
            // Other fields
            otherDeductions: null,
            buyersAgentSplit: null,
            assistantBonus: null
          }
        })
        
        imported++
        if (imported % 10 === 0) {
          console.log(`✅ Imported ${imported}/${transactions.length} transactions...`)
        }
      } catch (error) {
        console.error(`❌ Error importing transaction:`, error)
      }
    }
    
    console.log('\n📈 Import Summary:')
    console.log(`   ✅ Imported: ${imported}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   📊 Total: ${transactions.length}`)
    console.log('\n🎉 Commission data import completed!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()

