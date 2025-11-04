import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const totalContacts = await prisma.farmContact.count()
    
    // Get unique farms count
    const farms = await prisma.farmContact.findMany({
      select: { farm: true },
      distinct: ['farm'],
    })
    const farmsWithContacts = farms.filter(f => f.farm).length
    
    // Get recent contacts (created in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentContacts = await prisma.farmContact.count({
      where: {
        dateCreated: {
          gte: thirtyDaysAgo,
        },
      },
    })

    const latest = await prisma.farmContact.findFirst({
      select: { dateModified: true },
      orderBy: { dateModified: 'desc' },
    })

    return NextResponse.json({
      totalContacts,
      farmsWithContacts,
      recentContacts,
      lastSyncedAt: latest?.dateModified ?? null,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

