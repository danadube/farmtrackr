import { NextRequest, NextResponse } from 'next/server'
import { advanceListingStage } from '@/lib/listings'

type RouteContext = {
  params: {
    listingId: string
  }
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const listing = await advanceListingStage(params.listingId)
    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error advancing listing stage:', error)
    return NextResponse.json({ error: 'Failed to advance stage' }, { status: 500 })
  }
}

