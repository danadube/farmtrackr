import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// POST /api/documents → create document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, type, content, fileUrl, contactId } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const created = await prisma.document.create({
      data: {
        title,
        description: description || null,
        type: type || null,
        content: content || null,
        fileUrl: fileUrl || null,
        contactId: contactId || null,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}


