import { NextRequest, NextResponse } from 'next/server'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { farm } = body

    if (!farm || !FARM_SPREADSHEETS[farm as FarmName]) {
      return NextResponse.json({ error: 'Invalid farm name' }, { status: 400 })
    }

    const farmConfig = FARM_SPREADSHEETS[farm as FarmName]
    
    // Fetch CSV from Google Sheets (public export URL)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${farmConfig.id}/export?format=csv`
    
    try {
      const response = await fetch(csvUrl)
      
      if (!response.ok) {
        // If direct access fails, return instructions
        return NextResponse.json({
          error: 'Unable to access Google Sheet directly',
          message: 'Please make the sheet publicly viewable (File > Share > Anyone with the link can view) or export as CSV and upload manually',
          csvUrl,
          spreadsheetUrl: farmConfig.url,
        }, { status: 403 })
      }

      const csvText = await response.text()
      
      // Parse CSV
      const parsed = Papa.parse<any>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      })

      const rows = parsed.data
      
      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          imported: 0,
          skipped: 0,
          total: 0,
          message: 'No data found in sheet'
        })
      }

      // Map fields flexibly
      const mapRow = (row: any) => {
        const getField = (keys: string[]) => {
          for (const key of keys) {
            const value = row[key]
            if (value && String(value).trim()) return String(value).trim()
          }
          return undefined
        }

        const fullName = getField(['Name', 'Full Name', 'FULL NAME'])
        let firstName = getField(['First Name', 'firstName', 'First', 'first name', 'FIRST NAME']) || ''
        let lastName = getField(['Last Name', 'lastName', 'Last', 'last name', 'LAST NAME']) || ''
        let organizationName = getField(['Organization', 'organization', 'Organization Name', 'organizationName', 'Trust', 'trust', 'ORGANIZATION', 'TRUST'])

        // Business/Trust rule: if only one name provided, move to organizationName field
        if (!organizationName) {
          if (fullName && !firstName && !lastName) {
            organizationName = fullName
          } else if ((firstName && !lastName) || (lastName && !firstName)) {
            organizationName = (firstName || lastName) as string
            firstName = ''
            lastName = ''
          }
        }

        return {
          firstName,
          lastName,
          organizationName,
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

      // Import contacts
      let imported = 0
      let skipped = 0
      let errors = 0

      for (const row of rows) {
        try {
          const contactData = mapRow(row)

          // Skip if no useful identifiers at all
          if (!contactData.firstName && !contactData.lastName && !contactData.organizationName && !contactData.farm) {
            skipped++
            continue
          }

          // Check for duplicates
          const existing = await prisma.farmContact.findFirst({
            where: contactData.firstName || contactData.lastName
              ? {
                  firstName: contactData.firstName || '',
                  lastName: contactData.lastName || '',
                  farm: contactData.farm || farm,
                }
              : contactData.organizationName
              ? {
                  firstName: '',
                  lastName: '',
                  organizationName: contactData.organizationName,
                  farm: contactData.farm || farm,
                }
              : {
                  firstName: '',
                  lastName: '',
                  organizationName: '',
                  farm: contactData.farm || farm,
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
        message: `Successfully imported ${imported} of ${rows.length} contacts${skipped > 0 ? ` (${skipped} skipped)` : ''}`
      })
    } catch (fetchError) {
      console.error('Error fetching Google Sheet:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch Google Sheet',
        message: 'Make sure the sheet is publicly accessible or export as CSV and upload manually',
        spreadsheetUrl: farmConfig.url,
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Google Sheets import error:', error)
    return NextResponse.json({ error: 'Failed to import from Google Sheets' }, { status: 500 })
  }
}
