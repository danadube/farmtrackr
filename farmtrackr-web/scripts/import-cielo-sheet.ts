// Script to import Cielo Google Sheet data directly into database
import { PrismaClient } from '@prisma/client'
import Papa from 'papaparse'

const prisma = new PrismaClient()

// Cielo spreadsheet - using the sharing URL format
const SPREADSHEET_ID = '1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ'
// Try different export formats
const CSV_URLS = [
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`,
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`,
]

interface ContactRow {
  [key: string]: string | undefined
}

async function fetchGoogleSheet(): Promise<string> {
  for (const url of CSV_URLS) {
    try {
      console.log(`Trying: ${url}`)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      })
      
      if (response.ok) {
        const text = await response.text()
        // Check if we got HTML (error page) or actual CSV
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.log('Got HTML response, trying next URL...')
          continue
        }
        return text
      }
    } catch (error) {
      console.log(`Failed: ${error}`)
      continue
    }
  }
  throw new Error('Unable to fetch CSV from Google Sheets. The sheet may be private.')
}

function mapRowToContact(row: ContactRow): any | null {
  // Map based on actual column structure from the sheet
  const getField = (keys: string[]) => {
    for (const key of keys) {
      const value = row[key]
      if (value && String(value).trim()) return String(value).trim()
    }
    return undefined
  }

  // Try to get first and last name - handle cases where there's no last name
  const firstName = getField(['First Name', 'firstName', 'First', 'first name'])
  const lastName = getField(['Last Name', 'lastName', 'Last', 'last name'])
  
  // Skip if no name data
  if (!firstName && !lastName) {
    return null
  }

  // Parse zip code
  const parseZip = (zip: string | undefined): number | undefined => {
    if (!zip) return undefined
    const zipStr = String(zip).replace(/[^0-9]/g, '')
    const zipNum = parseInt(zipStr)
    return isNaN(zipNum) || zipNum < 10000 || zipNum > 99999 ? undefined : zipNum
  }

  return {
    firstName: firstName || '',
    lastName: lastName || '',
    farm: 'Cielo',
    mailingAddress: getField(['Mailing Address', 'mailingAddress', 'Address', 'address']),
    city: getField(['City', 'city']),
    state: getField(['State', 'state']),
    zipCode: parseZip(getField(['Zip Code', 'zipCode', 'ZIP', 'zip'])),
    email1: getField(['Email 1', 'email1', 'Email', 'email']),
    email2: getField(['Email 2', 'email2']),
    phoneNumber1: getField(['Phone Number 1', 'phoneNumber1', 'Phone', 'phone']),
    phoneNumber2: getField(['Phone Number 2', 'phoneNumber2']),
    phoneNumber3: getField(['Phone Number 3', 'phoneNumber3']),
    phoneNumber4: getField(['Phone Number 4', 'phoneNumber4']),
    phoneNumber5: getField(['Phone Number 5', 'phoneNumber5']),
    phoneNumber6: getField(['Phone Number 6', 'phoneNumber6']),
    siteMailingAddress: getField(['Site Mailing Address', 'siteMailingAddress', 'Site Address']),
    siteCity: getField(['Site City', 'siteCity']),
    siteState: getField(['Site State', 'siteState']),
    siteZipCode: parseZip(getField(['Site Zip Code', 'siteZipCode'])),
    notes: getField(['Notes', 'notes']),
  }
}

async function importContacts() {
  try {
    console.log('\n🚀 Starting Cielo sheet import...\n')
    
    const csvText = await fetchGoogleSheet()
    console.log(`✅ Fetched CSV (${csvText.length} characters)`)
    
    const rows: ContactRow[] = await new Promise((resolve, reject) => {
      Papa.parse<ContactRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          console.log(`📄 Parsed ${results.data.length} rows`)
          if (results.data.length > 0) {
            console.log('📋 Column headers:', Object.keys(results.data[0]))
          }
          resolve(results.data)
        },
        error: reject,
      })
    })

    if (rows.length === 0) {
      console.log('⚠️  No data found in sheet')
      return
    }

    let imported = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const contactData = mapRowToContact(row)
        
        if (!contactData) {
          skipped++
          continue
        }

        // Check for duplicates
        const existing = await prisma.farmContact.findFirst({
          where: {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            farm: 'Cielo',
          },
        })

        if (existing) {
          console.log(`⏭️  Skipping duplicate: ${contactData.firstName} ${contactData.lastName}`)
          skipped++
          continue
        }

        await prisma.farmContact.create({
          data: contactData,
        })

        imported++
        console.log(`✅ ${i + 1}. ${contactData.firstName} ${contactData.lastName}`)
      } catch (error) {
        errors++
        console.error(`❌ Row ${i + 1} error:`, error)
      }
    }

    console.log(`\n📊 Import Summary:`)
    console.log(`   ✅ Imported: ${imported}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📝 Total rows: ${rows.length}\n`)
    
  } catch (error) {
    console.error('💥 Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

importContacts()
  .then(() => {
    console.log('✨ Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error)
    console.log('\n💡 If the sheet is private, you can:')
    console.log('   1. Make it publicly viewable (Share > Anyone with link)')
    console.log('   2. Export as CSV and use: npx tsx scripts/seed-from-csv.ts path/to/file.csv Cielo')
    process.exit(1)
  })

