import { NextResponse } from 'next/server'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'

export async function POST(request: Request) {
  try {
    const { farm } = await request.json()
    
    if (!farm || !FARM_SPREADSHEETS[farm as FarmName]) {
      return NextResponse.json({ error: 'Invalid farm specified' }, { status: 400 })
    }

    const farmConfig = FARM_SPREADSHEETS[farm as FarmName]
    
    // For now, return mock data since we don't have Google Sheets API set up yet
    // In production, this would connect to Google Sheets API
    const mockContacts = [
      {
        firstName: 'John',
        lastName: 'Doe',
        farm: farm,
        email1: 'john.doe@example.com',
        phoneNumber1: '(555) 123-4567',
        mailingAddress: '123 Farm Road',
        city: 'Farm City',
        state: 'CA',
        zipCode: 90210
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        farm: farm,
        email1: 'jane.smith@example.com',
        phoneNumber1: '(555) 987-6543',
        mailingAddress: '456 Ranch Lane',
        city: 'Ranch Town',
        state: 'CA',
        zipCode: 90211
      }
    ]

    return NextResponse.json({ 
      success: true, 
      count: mockContacts.length,
      contacts: mockContacts,
      message: `Mock import from ${farm} Google Sheet`
    })
  } catch (error) {
    console.error('Google Sheets import error:', error)
    return NextResponse.json({ error: 'Failed to import from Google Sheets' }, { status: 500 })
  }
}
