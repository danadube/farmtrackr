// Script to seed database from a local CSV file
// Usage: npx tsx scripts/seed-from-csv.ts path/to/file.csv [farmName]
import { PrismaClient } from '@prisma/client'
import Papa from 'papaparse'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const csvFilePath = process.argv[2]
const farmName = process.argv[3] || 'Cielo'

if (!csvFilePath) {
  console.error('Usage: npx tsx scripts/seed-from-csv.ts <csv-file-path> [farm-name]')
  process.exit(1)
}

function mapRowToContact(row: any, farm: string) {
  const getField = (keys: string[]) => {
    for (const key of keys) {
      const value = row[key]
      if (value && String(value).trim()) return String(value).trim()
    }
    return undefined
  }

  return {
    firstName: getField(['First Name', 'firstName', 'First', 'first name', 'FIRST NAME']) || '',
    lastName: getField(['Last Name', 'lastName', 'Last', 'last name', 'LAST NAME']) || '',
    farm: farm,
    mailingAddress: getField(['Mailing Address', 'mailingAddress', 'Address', 'address', 'MAILING ADDRESS']),
    city: getField(['City', 'city', 'CITY']),
    state: getField(['State', 'state', 'STATE']),
    zipCode: (() => {
      const zip = getField(['Zip Code', 'zipCode', 'ZIP', 'zip', 'ZIP CODE', 'Zip'])
      if (!zip) return undefined
      const s = String(zip).trim()
      const digits = s.replace(/[^0-9]/g, '')
      if (digits.length === 9) return `${digits.slice(0,5)}-${digits.slice(5)}`
      if (digits.length === 5) return digits
      return s
    })(),
    email1: getField(['Email', 'email', 'Email 1', 'email1', 'EMAIL', 'Primary Email']),
    email2: getField(['Email 2', 'email2', 'EMAIL 2', 'Secondary Email']),
    phoneNumber1: getField(['Phone', 'phone', 'Phone 1', 'phoneNumber1', 'Phone Number', 'PHONE']),
    phoneNumber2: getField(['Phone 2', 'phoneNumber2', 'PHONE 2']),
    phoneNumber3: getField(['Phone 3', 'phoneNumber3', 'PHONE 3']),
    phoneNumber4: getField(['Phone 4', 'phoneNumber4', 'PHONE 4']),
    phoneNumber5: getField(['Phone 5', 'phoneNumber5', 'PHONE 5']),
    phoneNumber6: getField(['Phone 6', 'phoneNumber6', 'PHONE 6']),
    siteMailingAddress: getField([
      'Site Address',
      'Site Street Address',
      'Physical Address',
      'siteMailingAddress',
      'Site',
      'SITE ADDRESS',
      'SITE STREET ADDRESS',
      'PHYSICAL ADDRESS'
    ]),
    siteCity: getField(['Site City', 'siteCity', 'SITE CITY']),
    siteState: getField(['Site State', 'siteState', 'SITE STATE']),
    siteZipCode: (() => {
      const zip = getField(['Site Zip Code', 'siteZipCode', 'SITE ZIP'])
      if (!zip) return undefined
      const s = String(zip).trim()
      const digits = s.replace(/[^0-9]/g, '')
      if (digits.length === 9) return `${digits.slice(0,5)}-${digits.slice(5)}`
      if (digits.length === 5) return digits
      return s
    })(),
    notes: getField(['Notes', 'notes', 'NOTES', 'Comments']),
  }
}

async function seedFromCSV() {
  try {
    console.log(`\n🚀 Starting import from CSV: ${csvFilePath}\n`)
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ File not found: ${csvFilePath}`)
      process.exit(1)
    }

    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    
    const rows = await new Promise<any[]>((resolve, reject) => {
      Papa.parse<any>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          console.log(`📄 Parsed ${results.data.length} rows`)
          resolve(results.data)
        },
        error: reject,
      })
    })

    if (rows.length === 0) {
      console.log('⚠️  No data found in CSV')
      return
    }

    console.log('📋 Sample columns:', Object.keys(rows[0] || {}))
    console.log(`🏡 Farm: ${farmName}\n`)

    let imported = 0
    let skipped = 0
    let errors = 0

    for (const row of rows) {
      try {
        const contactData = mapRowToContact(row, farmName)

        if (!contactData.firstName && !contactData.lastName) {
          skipped++
          continue
        }

        // Check for duplicates
        const existing = await prisma.farmContact.findFirst({
          where: {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            farm: farmName,
          },
        })

        if (existing) {
          skipped++
          continue
        }

        await prisma.farmContact.create({
          data: contactData,
        })

        imported++
        console.log(`✅ ${contactData.firstName} ${contactData.lastName}`)
      } catch (error) {
        errors++
        console.error(`❌ Error importing row:`, error)
      }
    }

    console.log(`\n📊 Import Summary:`)
    console.log(`   ✅ Imported: ${imported}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📝 Total: ${rows.length}\n`)
  } catch (error) {
    console.error('💥 Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedFromCSV()
  .then(() => {
    console.log('✨ Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Failed:', error)
    process.exit(1)
  })

