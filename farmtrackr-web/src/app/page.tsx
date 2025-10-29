import { prisma } from '@/lib/prisma'
import { Stats } from '@/types'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  // Fetch real data from the database
  const contacts = await prisma.farmContact.findMany({
    orderBy: { dateCreated: 'desc' },
    take: 5, // Get recent contacts
  })

  // Calculate stats
  const totalContacts = await prisma.farmContact.count()
  const farms = await prisma.farmContact.findMany({
    select: { farm: true },
    distinct: ['farm'],
  })
  const farmsWithContacts = farms.filter(f => f.farm).length
  
  const recentDate = new Date()
  recentDate.setDate(recentDate.getDate() - 7)
  const recentContacts = await prisma.farmContact.count({
    where: { dateCreated: { gte: recentDate } }
  })

  const stats: Stats = {
    totalContacts,
    farmsWithContacts,
    recentContacts
  }

  return <DashboardClient contacts={contacts} stats={stats} />
}