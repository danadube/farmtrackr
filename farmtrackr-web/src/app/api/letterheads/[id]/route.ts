import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/letterheads/[id] → get single letterhead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const letterhead = await prisma.letterhead.findUnique({
      where: { id: params.id },
    })

    if (!letterhead) {
      return NextResponse.json({ error: 'Letterhead not found' }, { status: 404 })
    }

    return NextResponse.json(letterhead)
  } catch (error) {
    console.error('Letterhead GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch letterhead' }, { status: 500 })
  }
}

// PUT /api/letterheads/[id] → update letterhead
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, headerHtml, headerText, footerHtml, footerText, isDefault } = body

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.letterhead.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.letterhead.update({
      where: { id: params.id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        headerHtml: headerHtml !== undefined ? headerHtml : undefined,
        headerText: headerText !== undefined ? headerText : undefined,
        footerHtml: footerHtml !== undefined ? footerHtml : undefined,
        footerText: footerText !== undefined ? footerText : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Letterhead PUT error:', error)
    return NextResponse.json({ error: 'Failed to update letterhead' }, { status: 500 })
  }
}

// DELETE /api/letterheads/[id] → delete letterhead
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.letterhead.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Letterhead DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete letterhead' }, { status: 500 })
  }
}

