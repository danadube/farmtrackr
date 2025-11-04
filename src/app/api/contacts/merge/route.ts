import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectDuplicates } from '@/lib/dataQuality'

async function mergeContactsByIds(contactIds: string[]) {
  // Fetch all contacts to merge
  const contacts = await prisma.farmContact.findMany({
    where: { id: { in: contactIds } },
  })
  if (contacts.length !== contactIds.length) {
    throw new Error('Some contacts were not found')
  }

  // Sort by oldest dateCreated; keep oldest as base
  const sortedContacts = [...contacts].sort((a, b) => {
    const dateA = a.dateCreated instanceof Date ? a.dateCreated.getTime() : new Date(a.dateCreated as any).getTime()
    const dateB = b.dateCreated instanceof Date ? b.dateCreated.getTime() : new Date(b.dateCreated as any).getTime()
    return dateA - dateB
  })
  const baseContact = sortedContacts[0]
  const mergedContact: any = { ...baseContact }
  const fields = [
    'firstName','lastName','organizationName','farm','mailingAddress','city','state','zipCode','email1','email2',
    'phoneNumber1','phoneNumber2','phoneNumber3','phoneNumber4','phoneNumber5','phoneNumber6',
    'siteMailingAddress','siteCity','siteState','siteZipCode','notes'
  ]
  for (let i = 1; i < sortedContacts.length; i++) {
    const c: any = sortedContacts[i]
    fields.forEach((f) => {
      if (c[f]) {
        if (!mergedContact[f] || (typeof c[f] === 'string' && String(c[f]).length > String(mergedContact[f] || '').length)) {
          mergedContact[f] = c[f]
        }
      }
    })
  }
  const updateData: any = {}
  fields.forEach((f) => {
    if (mergedContact[f] !== undefined) updateData[f] = mergedContact[f]
  })
  const updated = await prisma.farmContact.update({
    where: { id: baseContact.id },
    data: { ...updateData, dateModified: new Date() },
  })
  const idsToDelete = contactIds.filter((id) => id !== baseContact.id)
  if (idsToDelete.length > 0) {
    await prisma.farmContact.deleteMany({ where: { id: { in: idsToDelete } } })
  }
  return { updated, deletedCount: idsToDelete.length, mergedCount: contactIds.length }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactIds, mergeAll } = body

    if (mergeAll) {
      // Merge all detected duplicate groups
      const contacts = await prisma.farmContact.findMany()
      const groups = detectDuplicates(contacts)
      let totalMerged = 0
      let groupsMerged = 0
      for (const group of groups) {
        if (group.contacts.length < 2) continue
        const ids = group.contacts.map((c) => c.id)
        const { mergedCount } = await mergeContactsByIds(ids)
        totalMerged += mergedCount
        groupsMerged++
      }
      return NextResponse.json({
        success: true,
        message: `Merged ${totalMerged} contacts across ${groupsMerged} groups`,
        groupsMerged,
        totalMerged,
      })
    }

    if (!Array.isArray(contactIds) || contactIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 contact IDs are required to merge' },
        { status: 400 }
      )
    }

    const result = await mergeContactsByIds(contactIds)
    return NextResponse.json({
      success: true,
      mergedContact: result.updated,
      deletedCount: result.deletedCount,
      message: `Successfully merged ${result.mergedCount} contacts into 1`,
    })
  } catch (error) {
    console.error('Merge error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge contacts' },
      { status: 500 }
    )
  }
}

