import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/documents → list documents with optional search and type filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const type = searchParams.get('type') || undefined // template|contact|report

    const where: any = {}
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (type && ['template', 'contact', 'report'].includes(type)) {
      where.type = type
    }

    const docs = await prisma.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(docs)
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch documents',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/documents → create document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Creating document:', body)
    const { title, description, type, content, fileUrl, contactId } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Make title unique by appending timestamp if a document with the same title exists
    let uniqueTitle = title
    const existingDoc = await prisma.document.findUnique({
      where: { title: uniqueTitle }
    })

    if (existingDoc) {
      // Append timestamp to make it unique
      const timestamp = Date.now()
      const extIndex = title.lastIndexOf('.')
      if (extIndex > 0) {
        const nameWithoutExt = title.substring(0, extIndex)
        const ext = title.substring(extIndex)
        uniqueTitle = `${nameWithoutExt}-${timestamp}${ext}`
      } else {
        uniqueTitle = `${title}-${timestamp}`
      }
      console.log('Title already exists, using unique title:', uniqueTitle)
    }

    const created = await prisma.document.create({
      data: {
        title: uniqueTitle,
        description: description || null,
        type: type || null,
        content: content || null,
        fileUrl: fileUrl || null,
        contactId: contactId || null,
      },
    })

    console.log('Document created successfully:', created.id)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isUniqueError = errorMessage.includes('Unique constraint') || errorMessage.includes('unique constraint')
    
    return NextResponse.json({ 
      error: isUniqueError ? 'A document with this name already exists' : 'Failed to create document',
      message: errorMessage,
      details: errorMessage
    }, { status: isUniqueError ? 409 : 500 })
  }
}


