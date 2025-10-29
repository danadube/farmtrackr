import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectDuplicates, validateAllContacts, calculateQualityScore } from '@/lib/dataQuality'
import { FarmContact } from '@/types'

export async function GET() {
  try {
    // Fetch all contacts from database
    const contactsData = await prisma.farmContact.findMany({
      orderBy: { dateCreated: 'desc' },
    })
    
    // Convert Prisma data to FarmContact format (convert date strings to Date objects)
    const contacts: FarmContact[] = contactsData.map(contact => ({
      ...contact,
      dateCreated: new Date(contact.dateCreated),
      dateModified: new Date(contact.dateModified),
    }))
    
    // Detect duplicates
    const duplicates = detectDuplicates(contacts)
    
    // Validate all contacts
    const validationIssues = validateAllContacts(contacts)
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(contacts, duplicates, validationIssues)
    
    return NextResponse.json({
      duplicates,
      validationIssues,
      qualityScore,
      totalContacts: contacts.length,
      duplicateGroups: duplicates.length,
      validationIssueCount: validationIssues.length,
    })
  } catch (error) {
    console.error('Data quality analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze data quality' },
      { status: 500 }
    )
  }
}
