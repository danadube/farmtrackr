import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const farm = searchParams.get('farm')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { farm: { contains: search, mode: 'insensitive' } },
        { email1: { contains: search, mode: 'insensitive' } },
        { email2: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (farm) {
      where.farm = farm
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
    const body = await request.json()
    
    const contact = await prisma.farmContact.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        farm: body.farm,
        mailingAddress: body.mailingAddress,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode ? parseInt(body.zipCode) : null,
        email1: body.email1,
        email2: body.email2,
        phoneNumber1: body.phoneNumber1,
        phoneNumber2: body.phoneNumber2,
        phoneNumber3: body.phoneNumber3,
        phoneNumber4: body.phoneNumber4,
        phoneNumber5: body.phoneNumber5,
        phoneNumber6: body.phoneNumber6,
        siteMailingAddress: body.siteMailingAddress,
        siteCity: body.siteCity,
        siteState: body.siteState,
        siteZipCode: body.siteZipCode ? parseInt(body.siteZipCode) : null,
        notes: body.notes,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
