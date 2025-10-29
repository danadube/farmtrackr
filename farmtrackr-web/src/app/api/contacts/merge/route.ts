import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactIds } = body

    if (!Array.isArray(contactIds) || contactIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 contact IDs are required to merge' },
        { status: 400 }
      )
    }

    // Fetch all contacts to merge
    const contacts = await prisma.farmContact.findMany({
      where: {
        id: { in: contactIds },
      },
    })

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        { error: 'Some contacts were not found' },
        { status: 404 }
      )
    }

    // Merge strategy: Take the first non-empty value for each field, prioritizing the oldest contact
    // Sort by dateCreated to use oldest as base
    const sortedContacts = [...contacts].sort((a, b) => {
      const dateA = a.dateCreated instanceof Date ? a.dateCreated.getTime() : new Date(a.dateCreated).getTime()
      const dateB = b.dateCreated instanceof Date ? b.dateCreated.getTime() : new Date(b.dateCreated).getTime()
      return dateA - dateB
    })

    const baseContact = sortedContacts[0]
    const mergedContact: any = { ...baseContact }

    // Merge fields - prefer non-empty values, and prefer more complete data
    for (let i = 1; i < sortedContacts.length; i++) {
      const contact = sortedContacts[i]
      
      // For each field, use the value from the contact with the most complete data
      const fields = [
        'firstName', 'lastName', 'farm', 'mailingAddress', 'city', 'state', 
        'zipCode', 'email1', 'email2', 'phoneNumber1', 'phoneNumber2', 
        'phoneNumber3', 'phoneNumber4', 'phoneNumber5', 'phoneNumber6',
        'siteMailingAddress', 'siteCity', 'siteState', 'siteZipCode', 'notes'
      ]

      fields.forEach(field => {
        const key = field as keyof typeof contact
        // Use value from contact if:
        // 1. Merged contact field is empty, OR
        // 2. Contact has a longer/more complete value
        if (contact[key]) {
          if (!mergedContact[key] || 
              (typeof contact[key] === 'string' && 
               typeof mergedContact[key] === 'string' &&
               contact[key]!.toString().length > mergedContact[key]!.toString().length)) {
            mergedContact[key] = contact[key]
          }
        }
      })
    }

    // Prepare update data (exclude fields that shouldn't be updated)
    const updateData: any = {}
    const fieldsToUpdate = [
      'firstName', 'lastName', 'farm', 'mailingAddress', 'city', 'state', 
      'zipCode', 'email1', 'email2', 'phoneNumber1', 'phoneNumber2', 
      'phoneNumber3', 'phoneNumber4', 'phoneNumber5', 'phoneNumber6',
      'siteMailingAddress', 'siteCity', 'siteState', 'siteZipCode', 'notes'
    ]

    fieldsToUpdate.forEach(field => {
      if (mergedContact[field] !== undefined) {
        updateData[field] = mergedContact[field]
      }
    })

    // Update the base contact with merged data
    const updatedContact = await prisma.farmContact.update({
      where: { id: baseContact.id },
      data: {
        ...updateData,
        dateModified: new Date(),
      },
    })

    // Delete the other contacts
    const idsToDelete = contactIds.filter(id => id !== baseContact.id)
    await prisma.farmContact.deleteMany({
      where: {
        id: { in: idsToDelete },
      },
    })

    return NextResponse.json({
      success: true,
      mergedContact: updatedContact,
      deletedCount: idsToDelete.length,
      message: `Successfully merged ${contacts.length} contacts into 1`,
    })
  } catch (error) {
    console.error('Merge error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge contacts' },
      { status: 500 }
    )
  }
}

