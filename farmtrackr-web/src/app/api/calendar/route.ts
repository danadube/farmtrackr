import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncGoogleCalendarsToDB, createCRMCalendar } from '@/lib/calendarHelpers'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar
 * List all calendars (Google + CRM)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const syncGoogle = searchParams.get('syncGoogle') === 'true'

    // Optionally sync Google calendars to DB
    if (syncGoogle) {
      try {
        await syncGoogleCalendarsToDB()
      } catch (error) {
        console.error('Failed to sync Google calendars:', error)
        // Continue even if sync fails
      }
    }

    // Get all calendars from database
    const calendars = await prisma.calendar.findMany({
      where: {
        isVisible: true,
      },
      include: {
        _count: {
          select: { events: true },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      calendars,
    })
  } catch (error) {
    console.error('Error fetching calendars:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching calendars',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar
 * Create a new calendar (CRM-only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, ownerId } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Calendar name is required' },
        { status: 400 }
      )
    }

    const calendar = await createCRMCalendar(name, color || '#4285f4', ownerId)

    return NextResponse.json({
      success: true,
      calendar,
    })
  } catch (error) {
    console.error('Error creating calendar:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating calendar',
      },
      { status: 500 }
    )
  }
}

