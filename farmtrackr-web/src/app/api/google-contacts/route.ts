import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * List all general contacts (Google Contacts)
 * GET /api/google-contacts
 */
export async function GET(request: NextRequest) {
  try {
    const contacts = await prisma.generalContact.findMany({
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
        { organizationName: 'asc' }
      ]
    })
    
    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching Google Contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

