import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const farm = searchParams.get('farm') || undefined

    // Build Prisma query with filters
    const where: any = {}
    
    if (farm) {
      where.farm = farm
    }
    
    if (search) {
      // SQLite doesn't support case-insensitive mode, so we'll handle it in application code
      // For now, we'll use a case-sensitive search and filter in-memory if needed
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { organizationName: { contains: search } },
        { farm: { contains: search } },
        { email1: { contains: search } },
        { email2: { contains: search } },
        { city: { contains: search } },
      ]
    }

    const contacts = await prisma.farmContact.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, any>
    
    // Convert empty strings to undefined
    const cleanBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [
        key, 
        value === '' || value === null ? undefined : value
      ])
    ) as Record<string, any>
    
    const contact = await prisma.farmContact.create({
      data: {
        firstName: cleanBody.firstName || '',
        lastName: cleanBody.lastName || '',
        organizationName: cleanBody.organizationName,
        farm: cleanBody.farm,
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
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}