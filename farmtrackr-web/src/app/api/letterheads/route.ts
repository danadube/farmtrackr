import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/letterheads → list letterheads
export async function GET(request: NextRequest) {
  try {
    const letterheads = await prisma.letterhead.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })
    return NextResponse.json(letterheads)
  } catch (error: any) {
    console.error('Letterheads GET error:', error)
    // Check if it's a table doesn't exist error
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.error('Letterheads table does not exist. Run: prisma db push')
      return NextResponse.json({ 
        error: 'Letterheads table not found. Please ensure database migrations have been applied.',
        code: 'TABLE_NOT_FOUND'
      }, { status: 503 })
    }
    return NextResponse.json({ 
      error: 'Failed to fetch letterheads',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
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
  } catch (error: any) {
    console.error('Letterheads POST error:', error)
    // Check if it's a table doesn't exist error
    if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
      console.error('Letterheads table does not exist. Run: prisma db push')
      return NextResponse.json({ 
        error: 'Letterheads table not found. Please ensure database migrations have been applied.',
        code: 'TABLE_NOT_FOUND'
      }, { status: 503 })
    }
    return NextResponse.json({ 
      error: 'Failed to create letterhead',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

