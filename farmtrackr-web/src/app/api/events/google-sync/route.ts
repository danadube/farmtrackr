import { NextRequest, NextResponse } from 'next/server'
import { syncGoogleEventsToDB, syncGoogleCalendarsToDB } from '@/lib/calendarHelpers'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/events/google-sync
 * Sync events from Google Calendar to database
 */
export async function POST(request: NextRequest) {
  try {
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google account not connected',
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { calendarIds, timeMin, timeMax } = body

    // First, sync calendars to ensure they exist in DB
    await syncGoogleCalendarsToDB()

    // Get Google calendars from database
    const calendars = await prisma.calendar.findMany({
      where: {
        type: 'google',
        googleCalendarId: { not: null },
        ...(calendarIds ? { id: { in: calendarIds } } : {}),
      },
    })

    const now = new Date()
    const startDate = timeMin ? new Date(timeMin) : new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = timeMax ? new Date(timeMax) : new Date(now.getFullYear(), now.getMonth() + 2, 0)

    let totalSynced = 0
    const results = []

    for (const calendar of calendars) {
      if (!calendar.googleCalendarId) continue

      try {
        const synced = await syncGoogleEventsToDB(
          calendar.id,
          calendar.googleCalendarId,
          startDate,
          endDate
        )
        totalSynced += synced.length
        results.push({
          calendarId: calendar.id,
          calendarName: calendar.name,
          synced: synced.length,
        })
      } catch (error) {
        console.error(`Failed to sync calendar ${calendar.id}:`, error)
        results.push({
          calendarId: calendar.id,
          calendarName: calendar.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalSynced,
      results,
    })
  } catch (error) {
    console.error('Error syncing Google events:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error syncing events',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events/google-sync
 * Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId')

    const where: any = {
      source: 'google',
    }

    if (calendarId) {
      where.calendarId = calendarId
    }

    const [synced, pending, errors] = await Promise.all([
      prisma.event.count({
        where: { ...where, syncStatus: 'synced' },
      }),
      prisma.event.count({
        where: { ...where, syncStatus: 'pending' },
      }),
      prisma.event.count({
        where: { ...where, syncStatus: 'error' },
      }),
    ])

    return NextResponse.json({
      success: true,
      status: {
        synced,
        pending,
        errors,
        total: synced + pending + errors,
      },
    })
  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting sync status',
      },
      { status: 500 }
    )
  }
}

