import { NextRequest, NextResponse } from 'next/server'
import { getAllContacts, getContactById, createContact, updateContact, deleteContact } from '@/lib/contacts'

export async function GET() {
  try {
    const contacts = await getAllContacts()
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const contact = await createContact(data)
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}