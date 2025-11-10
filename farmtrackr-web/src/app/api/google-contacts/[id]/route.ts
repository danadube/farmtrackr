import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.generalContact.findUnique({
      where: { id: params.id },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching Google Contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as Record<string, any>

    const cleanBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key,
        value === '' || value === null ? undefined : value
      ])
    )

    const tags: string[] = Array.isArray(cleanBody.tags)
      ? cleanBody.tags
          .filter((tag: unknown): tag is string => typeof tag === 'string')
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : typeof cleanBody.tags === 'string'
      ? cleanBody.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean)
      : []

    const updated = await prisma.generalContact.update({
      where: { id: params.id },
      data: {
        firstName: cleanBody.firstName,
        lastName: cleanBody.lastName,
        organizationName: cleanBody.organizationName,
        mailingAddress: cleanBody.mailingAddress,
        city: cleanBody.city,
        state: cleanBody.state,
        zipCode: cleanBody.zipCode ? String(cleanBody.zipCode).trim() : undefined,
        email1: cleanBody.email1,
        email2: cleanBody.email2,
        phoneNumber1: cleanBody.phoneNumber1,
        phoneNumber2: cleanBody.phoneNumber2,
        phoneNumber3: cleanBody.phoneNumber3,
        phoneNumber4: cleanBody.phoneNumber4,
        phoneNumber5: cleanBody.phoneNumber5,
        phoneNumber6: cleanBody.phoneNumber6,
        siteMailingAddress: cleanBody.siteMailingAddress,
        siteCity: cleanBody.siteCity,
        siteState: cleanBody.siteState,
        siteZipCode: cleanBody.siteZipCode ? String(cleanBody.siteZipCode).trim() : undefined,
        website: cleanBody.website,
        notes: cleanBody.notes,
        tags,
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    console.error('Error updating Google Contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

