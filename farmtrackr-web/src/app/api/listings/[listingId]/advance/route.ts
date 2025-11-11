import { NextRequest, NextResponse } from 'next/server'
import { advanceListingStage, serializeListing } from '@/lib/listings'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    listingId: string
  }
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { listingId } = params

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    console.log('Advancing listing stage:', { listingId })
    const listing = await advanceListingStage(listingId)
    return NextResponse.json(serializeListing(listing))
  } catch (error) {
    console.error('Error advancing listing stage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      {
        error: 'Failed to advance stage',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

