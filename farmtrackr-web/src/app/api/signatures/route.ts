import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/signatures → list signatures
export async function GET(request: NextRequest) {
  try {
    const signatures = await prisma.signature.findMany({
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    })
    return NextResponse.json(signatures)
  } catch (error) {
    console.error('Signatures GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
  }
}

// POST /api/signatures → create signature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, closing, signature, isDefault } = body

    if (!name || !closing || !signature) {
      return NextResponse.json({ error: 'Name, closing, and signature are required' }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.signature.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const created = await prisma.signature.create({
      data: {
        name,
        type: type || 'CUSTOM',
        closing,
        signature,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Signatures POST error:', error)
    return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 })
  }
}

