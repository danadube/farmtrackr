import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/letterheads → list letterheads
export async function GET(request: NextRequest) {
  try {
    const letterheads = await prisma.letterhead.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })
    return NextResponse.json(letterheads)
  } catch (error) {
    console.error('Letterheads GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch letterheads' }, { status: 500 })
  }
}

// POST /api/letterheads → create letterhead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, headerHtml, headerText, footerHtml, footerText, isDefault } = body

    if (!name || (!headerHtml && !headerText)) {
      return NextResponse.json(
        { error: 'Name and at least header HTML or text is required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.letterhead.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const created = await prisma.letterhead.create({
      data: {
        name,
        description: description || null,
        headerHtml: headerHtml || null,
        headerText: headerText || null,
        footerHtml: footerHtml || null,
        footerText: footerText || null,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Letterheads POST error:', error)
    return NextResponse.json({ error: 'Failed to create letterhead' }, { status: 500 })
  }
}

