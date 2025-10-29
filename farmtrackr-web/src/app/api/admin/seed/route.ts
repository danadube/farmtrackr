// Admin endpoint to seed production database with Cielo data
// This is a one-time use endpoint to populate the production database
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

// Cielo spreadsheet data (CSV format from the Google Sheet)
const CIELO_CSV_URL = 'https://docs.google.com/spreadsheets/d/1tDS3ZuuzqQvV2HWEPhce3B1Pvd4hboAVu6QGR7KAPMQ/export?format=csv'

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const authHeader = request.headers.get('authorization')
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('Starting production seed...')
    
    // Fetch CSV from Google Sheets
    const response = await fetch(CIELO_CSV_URL)
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Unable to fetch Google Sheet',
        message: 'Sheet may be private. Please make it publicly viewable or provide CSV data.',
      }, { status: 400 })
    }

    const csvText = await response.text()
    
    // Parse CSV
    const rows: any[] = await new Promise((resolve, reject) => {
      Papa.parse<any>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => resolve(results.data),
        error: reject,
      })
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in sheet' }, { status: 400 })
    }

    // Map rows to contact data
    const mapRow = (row: any) => {
      const getField = (keys: string[]) => {
        for (const key of keys) {
          const value = row[key]
          if (value && String(value).trim()) return String(value).trim()
        }
        return undefined
      }

      const parseZip = (zip: string | undefined): number | undefined => {
        if (!zip) return undefined
        const zipStr = String(zip).replace(/[^0-9]/g, '')
        const zipNum = parseInt(zipStr)
        return isNaN(zipNum) || zipNum < 10000 || zipNum > 99999 ? undefined : zipNum
      }

      return {
        firstName: getField(['First Name', 'firstName']) || '',
        lastName: getField(['Last Name', 'lastName']) || '',
        farm: 'Cielo',
        mailingAddress: getField(['Mailing Address', 'mailingAddress']),
        city: getField(['City', 'city']),
        state: getField(['State', 'state']),
        zipCode: parseZip(getField(['Zip Code', 'zipCode'])),
        email1: getField(['Email 1', 'email1', 'Email']),
        email2: getField(['Email 2', 'email2']),
        phoneNumber1: getField(['Phone Number 1', 'phoneNumber1', 'Phone']),
        phoneNumber2: getField(['Phone Number 2', 'phoneNumber2']),
        phoneNumber3: getField(['Phone Number 3', 'phoneNumber3']),
        phoneNumber4: getField(['Phone Number 4', 'phoneNumber4']),
        phoneNumber5: getField(['Phone Number 5', 'phoneNumber5']),
        phoneNumber6: getField(['Phone Number 6', 'phoneNumber6']),
        siteMailingAddress: getField(['Site Mailing Address', 'siteMailingAddress']),
        siteCity: getField(['Site City', 'siteCity']),
        siteState: getField(['Site State', 'siteState']),
        siteZipCode: parseZip(getField(['Site Zip Code', 'siteZipCode'])),
        notes: getField(['Notes', 'notes']),
      }
    }

    // Import contacts
    let imported = 0
    let skipped = 0
    let errors = 0

    for (const row of rows) {
      try {
        const contactData = mapRow(row)

        if (!contactData.firstName && !contactData.lastName) {
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
          skipped++
          continue
        }

        await prisma.farmContact.create({
          data: contactData,
        })

        imported++
      } catch (error) {
        errors++
        console.error('Error importing contact:', error)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      total: rows.length,
      message: `Successfully imported ${imported} of ${rows.length} contacts${skipped > 0 ? ` (${skipped} skipped)` : ''}`,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      error: 'Failed to seed database',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

