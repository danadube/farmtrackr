/**
 * Quick script to check what brokerage values are in the database
 * Run: npx tsx scripts/check-brokerages.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBrokerages() {
  try {
    const transactions = await prisma.transaction.findMany({
      select: {
        id: true,
        brokerage: true,
        address: true,
      },
      take: 20, // Just get first 20 to check
    })
    
    console.log(`\n📊 Found ${transactions.length} transactions:\n`)
    
    transactions.forEach((t, i) => {
      console.log(`${i + 1}. ID: ${t.id}`)
      console.log(`   Address: ${t.address}`)
      console.log(`   Brokerage: "${t.brokerage}" (type: ${typeof t.brokerage})`)
      console.log('')
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBrokerages()

