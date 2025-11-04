import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_request: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_ENABLE_ADMIN !== 'true') {
      return NextResponse.json({ error: 'Admin tools disabled' }, { status: 403 })
    }

    const deleted = await prisma.farmContact.deleteMany({})
    return NextResponse.json({ success: true, deleted: deleted.count })
  } catch (error) {
    console.error('Purge contacts error:', error)
    return NextResponse.json({ error: 'Failed to purge contacts' }, { status: 500 })
  }
}


