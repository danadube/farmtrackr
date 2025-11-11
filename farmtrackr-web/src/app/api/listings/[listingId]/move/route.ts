import { NextRequest, NextResponse } from 'next/server'
import { moveListingToStage, serializeListing } from '@/lib/listings'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    listingId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { listingId } = params
    const body = await request.json()
    const stageKey = body?.stageKey ?? null

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    if (stageKey !== null && typeof stageKey !== 'string') {
      return NextResponse.json({ error: 'stageKey must be a string or null' }, { status: 400 })
    }

    console.log('Moving listing to stage:', { listingId, stageKey })
    const listing = await moveListingToStage(listingId, stageKey)

    return NextResponse.json(serializeListing(listing))
  } catch (error) {
    console.error('Error moving listing to stage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      {
        error: 'Failed to move listing',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

