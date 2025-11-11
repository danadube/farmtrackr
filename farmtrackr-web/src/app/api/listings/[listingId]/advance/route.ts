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
      console.error('Advance API: Missing listing ID')
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    console.log('Advance API: Starting stage advancement for listing:', listingId)
    
    try {
      const listing = await advanceListingStage(listingId)
      console.log('Advance API: Successfully advanced stage for listing:', listingId)
      return NextResponse.json(serializeListing(listing))
    } catch (stageError) {
      console.error('Advance API: Error in advanceListingStage:', {
        listingId,
        error: stageError instanceof Error ? stageError.message : String(stageError),
        stack: stageError instanceof Error ? stageError.stack : undefined,
        errorType: stageError instanceof Error ? stageError.constructor.name : typeof stageError
      })
      throw stageError // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Advance API: Error advancing listing stage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.constructor.name : typeof error
    
    console.error('Advance API: Error details:', { 
      errorMessage, 
      errorStack,
      errorName 
    })
    
    // Always return error details (not just in development) for debugging
    return NextResponse.json(
      {
        error: 'Failed to advance stage',
        message: errorMessage,
        type: errorName,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}

