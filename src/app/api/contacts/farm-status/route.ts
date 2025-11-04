import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeFarmName } from '@/lib/farmNames'

export async function GET() {
  try {
    const rows = await prisma.farmContact.findMany({
      select: { farm: true },
    })

    const counts: Record<string, number> = {}
    for (const r of rows) {
      const farm = r.farm ? normalizeFarmName(r.farm) : ''
      if (!farm) continue
      counts[farm] = (counts[farm] || 0) + 1
    }

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('Error fetching farm status:', error)
    return NextResponse.json({ error: 'Failed to fetch farm status' }, { status: 500 })
  }
}


