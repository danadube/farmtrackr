/**
 * Script to import data from local SQLite database to production PostgreSQL
 * Run this after setting up PostgreSQL in production
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ContactData {
  id: string
  firstName: string | null
  lastName: string | null
  farm: string | null
  mailingAddress: string | null
  city: string | null
  state: string | null
  zipCode: number | null
  email1: string | null
  email2: string | null
  phoneNumber1: string | null
  phoneNumber2: string | null
  phoneNumber3: string | null
  phoneNumber4: string | null
  phoneNumber5: string | null
  phoneNumber6: string | null
  siteMailingAddress: string | null
  siteCity: string | null
  siteState: string | null
  siteZipCode: number | null
  notes: string | null
  dateCreated: number
  dateModified: number
}

async function importData() {
  try {
    console.log('🚀 Starting data import...')
    
    // Read the exported JSON file
    const dataPath = path.join(process.cwd(), 'contacts_export.json')
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ contacts_export.json not found!')
      console.log('💡 Run this command first to export data:')
      console.log('   sqlite3 prisma/dev.db ".mode json" ".output contacts_export.json" "SELECT * FROM farm_contacts;"')
      process.exit(1)
    }
    
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const contacts: ContactData[] = JSON.parse(fileContent)
    
    console.log(`📊 Found ${contacts.length} contacts to import`)
    
    // Check if database is accessible
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Import contacts
    let imported = 0
    let skipped = 0
    
    for (const contact of contacts) {
      try {
        // Convert SQLite timestamp (milliseconds) to Date
        const dateCreated = new Date(contact.dateCreated)
        const dateModified = new Date(contact.dateModified)
        
        // Check if contact already exists
        const existing = await prisma.farmContact.findUnique({
          where: { id: contact.id },
        })
        
        if (existing) {
          console.log(`⏭️  Skipping ${contact.firstName} ${contact.lastName} (already exists)`)
          skipped++
          continue
        }
        
        await prisma.farmContact.create({
          data: {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            farm: contact.farm,
            mailingAddress: contact.mailingAddress,
            city: contact.city,
            state: contact.state,
            zipCode: contact.zipCode,
            email1: contact.email1,
            email2: contact.email2,
            phoneNumber1: contact.phoneNumber1,
            phoneNumber2: contact.phoneNumber2,
            phoneNumber3: contact.phoneNumber3,
            phoneNumber4: contact.phoneNumber4,
            phoneNumber5: contact.phoneNumber5,
            phoneNumber6: contact.phoneNumber6,
            siteMailingAddress: contact.siteMailingAddress,
            siteCity: contact.siteCity,
            siteState: contact.siteState,
            siteZipCode: contact.siteZipCode,
            notes: contact.notes,
            dateCreated,
            dateModified,
          },
        })
        
        imported++
        console.log(`✅ Imported ${contact.firstName} ${contact.lastName} (${imported}/${contacts.length})`)
      } catch (error) {
        console.error(`❌ Error importing ${contact.firstName} ${contact.lastName}:`, error)
      }
    }
    
    console.log('\n📈 Import Summary:')
    console.log(`   ✅ Imported: ${imported}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   📊 Total: ${contacts.length}`)
    console.log('\n🎉 Data import completed!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()

