import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Get statistics for General Contacts (Google Contacts)
 */
export async function GET() {
  try {
    const totalContacts = await prisma.generalContact.count()
    
    // Get the most recently modified contact
    const lastModified = await prisma.generalContact.findFirst({
      orderBy: { dateModified: 'desc' },
      select: { dateModified: true }
    })
    
    return NextResponse.json({
      totalContacts,
      lastSyncedAt: lastModified?.dateModified || null
    })
  } catch (error) {
    console.error('Error fetching Google Contacts stats:', error)
    return NextResponse.json({
      error: 'Failed to fetch statistics'
    }, { status: 500 })
  }
}

