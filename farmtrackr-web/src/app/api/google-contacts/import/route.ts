import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedPeopleClient } from '@/lib/googleAuth'
import { prisma } from '@/lib/prisma'

/**
 * Import contacts from Google Contacts
 * Fetches all contacts from user's Google Contacts and imports them into GeneralContact table
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const accessToken = await getGoogleAccessToken()
    
    if (!accessToken) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'Please connect your Google account in Settings > Google Integration'
      }, { status: 401 })
    }

    // Create authenticated People API client
    const people = getAuthenticatedPeopleClient(accessToken)
    
    // Fetch all contacts from Google Contacts
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 1000,
      personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,biographies,tagLine,miscKeywords'
    })

    const connections = response.data.connections || []
    
    if (connections.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        total: 0,
        message: 'No contacts found in Google Contacts'
      })
    }

    // Import contacts
    let imported = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const person of connections) {
      try {
        // Extract contact data from Google Contacts person object
        const firstName = person.names?.[0]?.givenName || ''
        const lastName = person.names?.[0]?.familyName || ''
        const middleName = person.names?.[0]?.middleName || ''
        
        // If middle name exists, add it to first name
        const fullFirstName = middleName ? `${firstName} ${middleName}`.trim() : firstName
        
        const googleContactsId = person.resourceName?.replace('people/', '') || ''
        
        // Skip if no name at all
        if (!fullFirstName && !lastName) {
          skipped++
          continue
        }

        // Extract organization name
        const organizationName = person.organizations?.[0]?.name || ''

        // Extract email addresses
        const email1 = person.emailAddresses?.[0]?.value || ''
        const email2 = person.emailAddresses?.[1]?.value || ''

        // Extract phone numbers
        const phoneNumber1 = person.phoneNumbers?.[0]?.value || ''
        const phoneNumber2 = person.phoneNumbers?.[1]?.value || ''
        const phoneNumber3 = person.phoneNumbers?.[2]?.value || ''
        const phoneNumber4 = person.phoneNumbers?.[3]?.value || ''
        const phoneNumber5 = person.phoneNumbers?.[4]?.value || ''
        const phoneNumber6 = person.phoneNumbers?.[5]?.value || ''

        // Extract addresses
        const mailingAddress = person.addresses?.[0]?.streetAddress || ''
        const city = person.addresses?.[0]?.city || ''
        const state = person.addresses?.[0]?.region || ''
        const zipCode = person.addresses?.[0]?.postalCode || ''

        // Extract notes/biography
        const notes = person.biographies?.[0]?.value || person.taglines?.[0]?.value || ''

        // Extract tags from miscKeywords (Google Contacts labels)
        const tags: string[] = []
        if (person.miscKeywords && person.miscKeywords.length > 0) {
          person.miscKeywords.forEach(keyword => {
            if (keyword.value) {
              tags.push(keyword.value)
            }
          })
        }

        // Find existing contact by Google Contacts ID or by name/email
        const existing = await prisma.generalContact.findFirst({
          where: {
            OR: [
              { googleContactsId: googleContactsId },
              email1 ? {
                email1: email1
              } : undefined
            ].filter(Boolean)
          }
        })

        const contactData = {
          firstName: fullFirstName,
          lastName,
          organizationName,
          tags,
          mailingAddress,
          city,
          state,
          zipCode,
          email1,
          email2,
          phoneNumber1,
          phoneNumber2,
          phoneNumber3,
          phoneNumber4,
          phoneNumber5,
          phoneNumber6,
          notes,
          googleContactsId
        }

        if (existing) {
          // Update existing contact
          await prisma.generalContact.update({
            where: { id: existing.id },
            data: contactData
          })
          updated++
        } else {
          // Create new contact
          await prisma.generalContact.create({
            data: contactData
          })
          imported++
        }
      } catch (error) {
        errors++
        console.error('Error importing Google contact:', error)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
      skipped,
      errors,
      total: connections.length,
      message: `Imported ${imported}, updated ${updated}, skipped ${skipped} of ${connections.length} contacts`
    })
  } catch (error) {
    console.error('Google Contacts import error:', error)
    return NextResponse.json({
      error: 'Failed to import Google Contacts',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

