import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveEventToDB } from '@/lib/calendarHelpers'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedCalendarClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/events/[id]
 * Get a single event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        calendar: true,
        attendees: true,
        repeatRule: true,
      },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching event',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/events/[id]
 * Update event (update DB and optionally sync to Google)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { calendar: true },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      location,
      start,
      end,
      allDay,
      color,
      syncToGoogle,
      crmContactId,
      crmDealId,
      crmTaskId,
    } = body

    // Parse dates
    const startDate = start ? new Date(start) : event.start
    const endDate = end ? new Date(end) : event.end

    let googleEventId = event.googleEventId
    let syncStatus: 'synced' | 'pending' | 'error' = event.syncStatus as any || 'pending'

    // If event is synced to Google and we should update it
    const shouldSyncToGoogle =
      syncToGoogle !== false && // Default to true if not specified
      event.calendar.type === 'google' &&
      event.calendar.googleCalendarId &&
      event.googleEventId

    if (shouldSyncToGoogle) {
      try {
        const accessToken = await getGoogleAccessToken()
        if (!accessToken) {
          throw new Error('Google account not connected')
        }

        const googleCalendar = getAuthenticatedCalendarClient(accessToken)

        // Format dates for Google
        const googleStart = (allDay !== undefined ? allDay : event.allDay)
          ? { date: startDate.toISOString().split('T')[0] }
          : { dateTime: startDate.toISOString() }

        const googleEnd = (allDay !== undefined ? allDay : event.allDay)
          ? { date: endDate.toISOString().split('T')[0] }
          : { dateTime: endDate.toISOString() }

        await googleCalendar.events.update({
          calendarId: event.calendar.googleCalendarId!,
          eventId: event.googleEventId!,
          requestBody: {
            summary: title !== undefined ? title : event.title,
            description: description !== undefined ? description : event.description || undefined,
            location: location !== undefined ? location : event.location || undefined,
            start: googleStart,
            end: googleEnd,
          },
        })

        syncStatus = 'synced'
      } catch (error) {
        console.error('Failed to sync event update to Google:', error)
        syncStatus = 'error'
        // Still update DB even if Google sync fails
      }
    }

    // Update in database
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : event.title,
        description: description !== undefined ? description : event.description,
        location: location !== undefined ? location : event.location,
        start: startDate,
        end: endDate,
        allDay: allDay !== undefined ? allDay : event.allDay,
        color: color !== undefined ? color : event.color,
        syncStatus,
        lastSyncedAt: syncStatus === 'synced' ? new Date() : event.lastSyncedAt,
        crmContactId: crmContactId !== undefined ? crmContactId : event.crmContactId,
        crmDealId: crmDealId !== undefined ? crmDealId : event.crmDealId,
        crmTaskId: crmTaskId !== undefined ? crmTaskId : event.crmTaskId,
      },
      include: {
        calendar: true,
        attendees: true,
      },
    })

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating event',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/events/[id]
 * Delete event (delete from DB and optionally from Google)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { calendar: true },
    })

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    // If event is synced to Google, delete it there too
    if (
      event.calendar.type === 'google' &&
      event.calendar.googleCalendarId &&
      event.googleEventId
    ) {
      try {
        const accessToken = await getGoogleAccessToken()
        if (accessToken) {
          const googleCalendar = getAuthenticatedCalendarClient(accessToken)
          await googleCalendar.events.delete({
            calendarId: event.calendar.googleCalendarId,
            eventId: event.googleEventId,
          })
        }
      } catch (error) {
        console.error('Failed to delete event from Google:', error)
        // Still delete from DB even if Google delete fails
      }
    }

    // Delete from database (cascade will delete attendees)
    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error deleting event',
      },
      { status: 500 }
    )
  }
}

