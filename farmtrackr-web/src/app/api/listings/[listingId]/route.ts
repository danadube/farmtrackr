import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    listingId: string
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { listingId } = params

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    console.log('Delete API: Deleting listing:', listingId)

    // Delete all related records first (in case cascade isn't set up)
    await prisma.listingTaskInstance.deleteMany({
      where: { listingId }
    })

    await prisma.listingStageInstance.deleteMany({
      where: { listingId }
    })

    // Delete the listing
    await prisma.listing.delete({
      where: { id: listingId }
    })

    console.log('Delete API: Successfully deleted listing:', listingId)

    return NextResponse.json({ success: true, message: 'Listing deleted successfully' })
  } catch (error) {
    console.error('Delete API: Error deleting listing:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        error: 'Failed to delete listing',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

