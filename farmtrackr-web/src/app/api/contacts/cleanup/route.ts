import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatPhoneNumber } from '@/lib/formatters'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, contactIds } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Build query - either specific contacts or all
    const where: any = {}
    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
      where.id = { in: contactIds }
    }

    // Fetch contacts to update
    const contacts = await prisma.farmContact.findMany({ where })

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found to cleanup' },
        { status: 404 }
      )
    }

    let updatedCount = 0

    if (action === 'format-phones') {
      // Format all phone numbers
      for (const contact of contacts) {
        const updates: any = {}
        const phoneFields = [
          'phoneNumber1', 'phoneNumber2', 'phoneNumber3',
          'phoneNumber4', 'phoneNumber5', 'phoneNumber6'
        ]

        let hasChanges = false
        phoneFields.forEach(field => {
          const value = contact[field as keyof typeof contact]
          if (value && typeof value === 'string') {
            const formatted = formatPhoneNumber(value)
            if (formatted !== value) {
              updates[field] = formatted
              hasChanges = true
            }
          }
        })

        if (hasChanges) {
          await prisma.farmContact.update({
            where: { id: contact.id },
            data: {
              ...updates,
              dateModified: new Date(),
            },
          })
          updatedCount++
        }
      }
    } else if (action === 'normalize-emails') {
      // Normalize email addresses (lowercase, trim)
      for (const contact of contacts) {
        const updates: any = {}
        let hasChanges = false

        const emailFields = ['email1', 'email2'] as const
        emailFields.forEach(field => {
          const value = contact[field]
          if (value && typeof value === 'string') {
            const normalized = value.toLowerCase().trim()
            if (normalized !== value) {
              updates[field] = normalized
              hasChanges = true
            }
          }
        })

        if (hasChanges) {
          await prisma.farmContact.update({
            where: { id: contact.id },
            data: {
              ...updates,
              dateModified: new Date(),
            },
          })
          updatedCount++
        }
      }
    } else if (action === 'normalize-zip') {
      // Normalize ZIP codes: keep 5 digits or ZIP+4 as string
      for (const contact of contacts) {
        const updates: any = {}
        let hasChanges = false

        const zipFields = ['zipCode', 'siteZipCode']
        zipFields.forEach(field => {
          const value = contact[field as keyof typeof contact]
          if (value) {
            const valueStr = String(value)
            const digitsOnly = valueStr.replace(/\D/g, '')

            let normalized: string | undefined
            if (digitsOnly.length >= 9) {
              normalized = `${digitsOnly.slice(0,5)}-${digitsOnly.slice(5,9)}`
            } else if (digitsOnly.length >= 5) {
              normalized = digitsOnly.slice(0,5)
            } else if (digitsOnly.length > 0) {
              normalized = digitsOnly
            }

            if (normalized && normalized !== valueStr) {
              updates[field] = normalized
              hasChanges = true
            }
          }
        })

        if (hasChanges) {
          await prisma.farmContact.update({
            where: { id: contact.id },
            data: {
              ...updates,
              dateModified: new Date(),
            },
          })
          updatedCount++
        }
      }
    } else if (action === 'normalize-names') {
      // Normalize names (title case, trim)
      for (const contact of contacts) {
        const updates: any = {}
        let hasChanges = false

        const normalizeName = (name: string) => {
          return name
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        }

        if (contact.firstName && typeof contact.firstName === 'string') {
          const normalized = normalizeName(contact.firstName)
          if (normalized !== contact.firstName) {
            updates.firstName = normalized
            hasChanges = true
          }
        }

        if (contact.lastName && typeof contact.lastName === 'string') {
          const normalized = normalizeName(contact.lastName)
          if (normalized !== contact.lastName) {
            updates.lastName = normalized
            hasChanges = true
          }
        }

        if (hasChanges) {
          await prisma.farmContact.update({
            where: { id: contact.id },
            data: {
              ...updates,
              dateModified: new Date(),
            },
          })
          updatedCount++
        }
      }
    } else {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      totalContacts: contacts.length,
      message: `Successfully updated ${updatedCount} of ${contacts.length} contacts`,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cleanup contacts' },
      { status: 500 }
    )
  }
}

