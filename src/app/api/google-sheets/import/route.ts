import { NextRequest, NextResponse } from 'next/server'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'
import { prisma } from '@/lib/prisma'
import { normalizeAddressCasing, normalizeCityCasing } from '@/lib/address'
import Papa from 'papaparse'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedSheetsClient } from '@/lib/googleAuth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { farm } = body

    if (!farm || !FARM_SPREADSHEETS[farm as FarmName]) {
      return NextResponse.json({ error: 'Invalid farm name' }, { status: 400 })
    }

    const farmConfig = FARM_SPREADSHEETS[farm as FarmName]
    
    // Try authenticated API first, fallback to public CSV
    let rows: any[] = []
    
    // Check if user is authenticated with Google
    const accessToken = await getGoogleAccessToken()
    
    if (accessToken) {
      // Use authenticated Google Sheets API
      try {
        const sheets = getAuthenticatedSheetsClient(accessToken)
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: farmConfig.id,
          range: `${farmConfig.sheetName}!1:1000`, // Get up to 1000 rows
        })
        
        const values = response.data.values
        if (values && values.length > 0) {
          // First row is headers
          const headers = values[0]
          rows = values.slice(1).map((row: any[]) => {
            const obj: any = {}
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index] || ''
            })
            return obj
          })
        }
      } catch (apiError) {
        console.error('Authenticated API error, falling back to CSV:', apiError)
        // Fall through to CSV method below
      }
    }
    
    // Fallback to public CSV if no auth or API failed
    if (rows.length === 0) {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${farmConfig.id}/export?format=csv`
      
      try {
        const response = await fetch(csvUrl)
        
        if (!response.ok) {
          // If direct access fails, return instructions
          return NextResponse.json({
            error: 'Unable to access Google Sheet',
            message: accessToken 
              ? 'Please check that you have access to this spreadsheet or make it publicly viewable'
              : 'Please connect your Google account in Settings > Google Integration, or make the sheet publicly viewable',
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

        rows = parsed.data
      } catch (fetchError) {
        console.error('Error fetching Google Sheet:', fetchError)
        return NextResponse.json({
          error: 'Failed to fetch Google Sheet',
          message: 'Make sure the sheet is accessible or you have connected your Google account',
          spreadsheetUrl: farmConfig.url,
        }, { status: 500 })
      }
    }
    
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
      // Case-insensitive getter for header names
      const lowerKeyToActual: Record<string, string> = {}
      Object.keys(row).forEach((k) => {
        lowerKeyToActual[k.trim().toLowerCase()] = k
      })
      const getField = (keys: string[]) => {
        for (const key of keys) {
          const actual = lowerKeyToActual[key.trim().toLowerCase()]
          const value = actual ? row[actual] : undefined
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
        mailingAddress: normalizeAddressCasing(getField(['Mailing Address', 'mailingAddress', 'Address', 'address', 'MAILING ADDRESS'])),
        city: normalizeCityCasing(getField(['City', 'city', 'CITY'])),
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
        siteMailingAddress: normalizeAddressCasing(getField([
          'Site Mailing Address',
          'Site Address',
          'Site Street Address',
          'Physical Address',
          'siteMailingAddress'
        ])),
        siteCity: normalizeCityCasing(getField(['Site City', 'siteCity', 'SITE CITY'])),
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

    // Import contacts (upsert: update existing, create new)
    let imported = 0
    let skipped = 0
    let updated = 0
    let errors = 0

    for (const row of rows) {
      try {
        const contactData = mapRow(row)

        // Skip if no useful identifiers at all
        if (!contactData.firstName && !contactData.lastName && !contactData.organizationName && !contactData.farm) {
          skipped++
          continue
        }

        // Find existing by person (first+last) or by organization
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
            : undefined,
        })

        if (existing) {
          // Only update fields that are provided in sheet
          const updateData: any = {}
          Object.keys(contactData).forEach((k) => {
            const key = k as keyof typeof contactData
            if (contactData[key] !== undefined && key !== 'farm') {
              updateData[key] = contactData[key as keyof typeof contactData]
            }
          })
          if (Object.keys(updateData).length > 0) {
            await prisma.farmContact.update({ where: { id: existing.id }, data: updateData })
            updated++
          } else {
            skipped++
          }
        } else {
          await prisma.farmContact.create({ data: contactData })
          imported++
        }
      } catch (error) {
        errors++
        console.error('Error importing contact:', error)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
      errors,
      total: rows.length,
      message: `Imported ${imported}, updated ${updated}, skipped ${skipped} of ${rows.length}`,
      method: accessToken ? 'authenticated' : 'csv'
    })
  } catch (error) {
    console.error('Google Sheets import error:', error)
    return NextResponse.json({ error: 'Failed to import from Google Sheets' }, { status: 500 })
  }
}
