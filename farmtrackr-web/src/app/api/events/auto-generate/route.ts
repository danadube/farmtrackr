import { NextRequest, NextResponse } from 'next/server'
import { generateAllListingEvents, generateFollowUpEvent } from '@/lib/autoCalendarEvents'

export const dynamic = 'force-dynamic'

/**
 * POST /api/events/auto-generate
 * Auto-generate calendar events for a listing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingId, followUpEventId, daysAfter } = body

    if (followUpEventId) {
      // Generate follow-up event
      const followUp = await generateFollowUpEvent(followUpEventId, daysAfter || 3)
      return NextResponse.json({
        success: true,
        event: followUp,
        type: 'follow-up',
      })
    }

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'listingId is required' },
        { status: 400 }
      )
    }

    // Generate all events for listing
    const result = await generateAllListingEvents(listingId)

    return NextResponse.json({
      success: true,
      ...result,
      type: 'listing',
    })
  } catch (error) {
    console.error('Error auto-generating events:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error generating events',
      },
      { status: 500 }
    )
  }
}

