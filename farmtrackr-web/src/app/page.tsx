import { Stats, FarmContact } from '@/types'
import DashboardClient from './DashboardClient'
import { prisma } from '@/lib/prisma'
import { getListings, serializeListing } from '@/lib/listings'

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic'

// Fetch data directly from database
async function getContacts(): Promise<FarmContact[]> {
  try {
    const contacts = await prisma.farmContact.findMany({
      orderBy: { dateCreated: 'desc' },
    })
    return contacts
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return []
  }
}

async function getStats(): Promise<Stats> {
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

    return {
      totalContacts,
      farmsWithContacts,
      recentContacts,
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalContacts: 0,
      farmsWithContacts: 0,
      recentContacts: 0
    }
  }
}

export default async function DashboardPage() {
  const contacts = await getContacts()
  const stats = await getStats()
  const listings = await getListings()
  
  return <DashboardClient contacts={contacts} stats={stats} listings={listings.map(serializeListing)} />
}