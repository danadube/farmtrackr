import { NextRequest, NextResponse } from 'next/server'
import { FARM_SPREADSHEETS } from '@/lib/farmSpreadsheets'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const spreadsheetId = searchParams.get('spreadsheetId')
    
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 })
    }

    // For now, we'll use a mock service since we need Google credentials
    // In production, you'll need to set up Google Service Account credentials
    const mockData = [
      ['First Name', 'Last Name', 'Farm', 'Address', 'City', 'State', 'ZIP', 'Email', 'Phone'],
      ['John', 'Doe', 'Sample Farm', '123 Farm Rd', 'Farmville', 'CA', '90210', 'john@farm.com', '555-1234'],
      ['Jane', 'Smith', 'Green Acres', '456 Ranch Way', 'Ranchville', 'TX', '75001', 'jane@green.com', '555-5678']
    ]

    return NextResponse.json({
      success: true,
      data: mockData,
      spreadsheetId
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch spreadsheet data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, contacts } = await request.json()
    
    if (!spreadsheetId || !contacts) {
      return NextResponse.json({ error: 'Spreadsheet ID and contacts are required' }, { status: 400 })
    }

    // Mock response for now
    return NextResponse.json({
      success: true,
      message: `Successfully exported ${contacts.length} contacts to spreadsheet`,
      spreadsheetId
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export to spreadsheet' }, { status: 500 })
  }
}