import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/documents/mail-merge → generate letters from template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, farms, content, signatureId, letterheadId } = body

    if (!templateId || !farms || farms.length === 0 || !content || !signatureId) {
      return NextResponse.json(
        { error: 'Template ID, farms, content, and signature ID are required' },
        { status: 400 }
      )
    }

    // Get signature
    const signature = await prisma.signature.findUnique({
      where: { id: signatureId },
    })

    if (!signature) {
      return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
    }

    // Get letterhead (optional)
    let letterhead = null
    if (letterheadId) {
      letterhead = await prisma.letterhead.findUnique({
        where: { id: letterheadId },
      })
    }

    // Get contacts for selected farms
    const contacts = await prisma.farmContact.findMany({
      where: {
        farm: { in: farms },
      },
      orderBy: { farm: 'asc' },
    })

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found for selected farms' }, { status: 400 })
    }

    // Generate letters for each contact
    const generatedLetters = contacts.map((contact) => {
      let letterContent = content

      // Replace variables
      const variables: Record<string, string> = {
        '{{farm}}': contact.farm || '',
        '{{contact_name}}': `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Valued Partner',
        '{{contact_first_name}}': contact.firstName || '',
        '{{contact_last_name}}': contact.lastName || '',
        '{{mailing_address}}': contact.mailingAddress || '',
        '{{city}}': contact.city || '',
        '{{state}}': contact.state || '',
        '{{zip_code}}': contact.zipCode?.toString() || '',
        '{{email}}': contact.email1 || contact.email2 || '',
        '{{phone}}': contact.phoneNumber1 || contact.phoneNumber2 || '',
      }

      Object.entries(variables).forEach(([key, value]) => {
        letterContent = letterContent.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value)
      })

      // Build full letter with letterhead, content, and signature
      let fullLetter = ''
      
      // Add letterhead header if available
      if (letterhead?.headerHtml) {
        fullLetter += `${letterhead.headerHtml}\n\n`
      } else if (letterhead?.headerText) {
        fullLetter += `${letterhead.headerText}\n\n`
      }
      
      // Add letter content
      fullLetter += `${letterContent}\n\n`
      
      // Add signature
      fullLetter += `${signature.closing}\n\n${signature.signature}`
      
      // Add letterhead footer if available
      if (letterhead?.footerHtml) {
        fullLetter += `\n\n${letterhead.footerHtml}`
      } else if (letterhead?.footerText) {
        fullLetter += `\n\n${letterhead.footerText}`
      }

      return {
        contactId: contact.id,
        farm: contact.farm,
        contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        content: fullLetter,
      }
    })

    // Save generated letters as documents
    const savedDocuments = await Promise.all(
      generatedLetters.map((letter) =>
        prisma.document.create({
          data: {
            title: `Letter to ${letter.contactName} - ${letter.farm}`,
            description: `Mail merge letter generated on ${new Date().toLocaleDateString()}`,
            content: letter.content,
            contactId: letter.contactId,
          },
        })
      )
    )

    return NextResponse.json({
      count: savedDocuments.length,
      documents: savedDocuments,
    })
  } catch (error) {
    console.error('Mail merge error:', error)
    return NextResponse.json({ error: 'Failed to generate letters' }, { status: 500 })
  }
}

