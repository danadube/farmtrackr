import { NextRequest, NextResponse } from 'next/server'
import { moveListingToStage, serializeListing } from '@/lib/listings'

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

    if (stageKey !== null && typeof stageKey !== 'string') {
      return NextResponse.json({ error: 'stageKey must be a string or null' }, { status: 400 })
    }

    const listing = await moveListingToStage(listingId, stageKey)

    return NextResponse.json(serializeListing(listing))
  } catch (error) {
    console.error('Error moving listing to stage:', error)
    return NextResponse.json({ error: 'Failed to move listing' }, { status: 500 })
  }
}

