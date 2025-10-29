import { NextResponse } from 'next/server'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'

export async function POST(request: Request) {
  try {
    const { farm } = await request.json()
    
    if (!farm || !FARM_SPREADSHEETS[farm as FarmName]) {
      return NextResponse.json({ error: 'Invalid farm specified' }, { status: 400 })
    }

    // For now, return mock CSV data since we don't have Google Sheets API set up yet
    // In production, this would export actual contact data to CSV format
    const mockCsvData = `firstName,lastName,farm,email1,phoneNumber1,mailingAddress,city,state,zipCode
John,Doe,${farm},john.doe@example.com,(555) 123-4567,123 Farm Road,Farm City,CA,90210
Jane,Smith,${farm},jane.smith@example.com,(555) 987-6543,456 Ranch Lane,Ranch Town,CA,90211`

    return new NextResponse(mockCsvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${farm}-contacts.csv"`
      }
    })
  } catch (error) {
    console.error('Google Sheets export error:', error)
    return NextResponse.json({ error: 'Failed to export to CSV' }, { status: 500 })
  }
}
