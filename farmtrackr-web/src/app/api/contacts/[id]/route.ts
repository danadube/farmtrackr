import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.farmContact.findUnique({
      where: { id: params.id },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const contact = await prisma.farmContact.update({
      where: { id: params.id },
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

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.farmContact.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
