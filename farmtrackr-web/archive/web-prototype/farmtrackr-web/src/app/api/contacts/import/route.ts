import { NextRequest, NextResponse } from 'next/server'
import { createContact } from '@/lib/contacts'
import { ContactFormData } from '@/types/contact'

export async function POST(request: NextRequest) {
  try {
    const { contacts }: { contacts: ContactFormData[] } = await request.json()
    
    const results = []
    const errors = []
    
    for (const contactData of contacts) {
      try {
        const contact = await createContact(contactData)
        results.push(contact)
      } catch (error) {
        errors.push(`Failed to create contact: ${error}`)
      }
    }
    
    return NextResponse.json({
      success: errors.length === 0,
      created: results.length,
      errors,
      contacts: results
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
  }
}
