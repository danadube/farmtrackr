// Script to import data from Google Sheets into database
import { PrismaClient } from '@prisma/client'
import Papa from 'papaparse'

const prisma = new PrismaClient()

// Cielo spreadsheet
const SPREADSHEET_ID = '1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ'
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`

interface ContactRow {
  [key: string]: string | undefined
}

async function fetchGoogleSheet() {
  try {
    console.log('Fetching data from Google Sheets...')
    const response = await fetch(CSV_URL)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }
    
    const csvText = await response.text()
    console.log('CSV fetched, parsing...')
    
    return new Promise<ContactRow[]>((resolve, reject) => {
      Papa.parse<ContactRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          console.log(`Parsed ${results.data.length} rows`)
          resolve(results.data)
        },
        error: (error) => {
          reject(error)
        },
      })
    })
  } catch (error) {
    console.error('Error fetching Google Sheet:', error)
    throw error
  }
}

function mapRowToContact(row: ContactRow, farmName: string) {
  // Flexible field mapping - handles various column name formats
  const getField = (keys: string[]) => {
    for (const key of keys) {
      const value = row[key]
      if (value && value.trim()) return value.trim()
    }
    return undefined
  }

  return {
    firstName: getField(['First Name', 'firstName', 'First', 'first name', 'FIRST NAME']) || '',
    lastName: getField(['Last Name', 'lastName', 'Last', 'last name', 'LAST NAME']) || '',
    farm: farmName,
    mailingAddress: getField(['Mailing Address', 'mailingAddress', 'Address', 'address', 'MAILING ADDRESS']),
    city: getField(['City', 'city', 'CITY']),
    state: getField(['State', 'state', 'STATE']),
    zipCode: (() => {
      const zip = getField(['Zip Code', 'zipCode', 'ZIP', 'zip', 'ZIP CODE', 'Zip'])
      if (zip) {
        const zipNum = parseInt(zip.replace(/[^0-9]/g, ''))
        return isNaN(zipNum) ? undefined : zipNum
      }
      return undefined
    })(),
    email1: getField(['Email', 'email', 'Email 1', 'email1', 'EMAIL', 'Primary Email']),
    email2: getField(['Email 2', 'email2', 'EMAIL 2', 'Secondary Email']),
    phoneNumber1: getField(['Phone', 'phone', 'Phone 1', 'phoneNumber1', 'Phone Number', 'PHONE']),
    phoneNumber2: getField(['Phone 2', 'phoneNumber2', 'PHONE 2']),
    phoneNumber3: getField(['Phone 3', 'phoneNumber3', 'PHONE 3']),
    phoneNumber4: getField(['Phone 4', 'phoneNumber4', 'PHONE 4']),
    phoneNumber5: getField(['Phone 5', 'phoneNumber5', 'PHONE 5']),
    phoneNumber6: getField(['Phone 6', 'phoneNumber6', 'PHONE 6']),
    siteMailingAddress: getField(['Site Address', 'siteMailingAddress', 'Site', 'SITE ADDRESS']),
    siteCity: getField(['Site City', 'siteCity', 'SITE CITY']),
    siteState: getField(['Site State', 'siteState', 'SITE STATE']),
    siteZipCode: (() => {
      const zip = getField(['Site Zip Code', 'siteZipCode', 'SITE ZIP'])
      if (zip) {
        const zipNum = parseInt(zip.replace(/[^0-9]/g, ''))
        return isNaN(zipNum) ? undefined : zipNum
      }
      return undefined
    })(),
    notes: getField(['Notes', 'notes', 'NOTES', 'Comments']),
  }
}

async function importContacts(farmName: string = 'Cielo') {
  try {
    console.log(`\n🚀 Starting import for ${farmName}...\n`)
    
    const rows = await fetchGoogleSheet()
    
    if (rows.length === 0) {
      console.log('No data found in sheet')
      return
    }
    
    console.log(`Found ${rows.length} rows`)
    console.log('Sample row keys:', Object.keys(rows[0] || {}))
    
    let imported = 0
    let skipped = 0
    let errors = 0
    
    for (const row of rows) {
      try {
        const contactData = mapRowToContact(row, farmName)
        
        // Skip if no name data
        if (!contactData.firstName && !contactData.lastName) {
          skipped++
          continue
        }
        
        // Check for duplicates (by name and farm)
        const existing = await prisma.farmContact.findFirst({
          where: {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            farm: farmName,
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
        console.log(`✅ Imported: ${contactData.firstName} ${contactData.lastName}`)
      } catch (error) {
        errors++
        console.error(`❌ Error importing row:`, error)
      }
    }
    
    console.log(`\n📊 Import Summary:`)
    console.log(`   ✅ Imported: ${imported}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   📝 Total: ${rows.length}`)
    
  } catch (error) {
    console.error('Import failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the import
importContacts('Cielo')
  .then(() => {
    console.log('\n✨ Import complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error)
    process.exit(1)
  })

