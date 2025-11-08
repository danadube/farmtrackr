import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedCalendarClient } from '@/lib/googleAuth'

type CalendarEvent = {
  id: string
  htmlLink?: string | null
  status?: string | null
  summary?: string | null
  description?: string | null
  location?: string | null
  start?: {
    date?: string | null
    dateTime?: string | null
    timeZone?: string | null
  }
  end?: {
    date?: string | null
    dateTime?: string | null
    timeZone?: string | null
  }
  attendees?: Array<{
    email?: string | null
    displayName?: string | null
    responseStatus?: string | null
  }> | null
  creator?: {
    email?: string | null
    displayName?: string | null
  } | null
  organizer?: {
    email?: string | null
    displayName?: string | null
  } | null
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId') || 'primary'
    const timeMinParam = searchParams.get('timeMin')
    const timeMaxParam = searchParams.get('timeMax')
    const maxResultsParam = searchParams.get('maxResults')

    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1)
    defaultStart.setMonth(defaultStart.getMonth() - 1)
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0)

    const timeMin = timeMinParam ? new Date(timeMinParam).toISOString() : defaultStart.toISOString()
    const timeMax = timeMaxParam ? new Date(timeMaxParam).toISOString() : defaultEnd.toISOString()

    const calendar = getAuthenticatedCalendarClient(accessToken)
    const response = await calendar.events.list({
      calendarId,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin,
      timeMax,
      maxResults: maxResultsParam ? Number(maxResultsParam) : undefined,
    })

    const events: CalendarEvent[] =
      response.data.items?.map((event) => ({
        id: event.id || '',
        htmlLink: event.htmlLink,
        status: event.status,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: {
          date: event.start?.date || null,
          dateTime: event.start?.dateTime || null,
          timeZone: event.start?.timeZone || null,
        },
        end: {
          date: event.end?.date || null,
          dateTime: event.end?.dateTime || null,
          timeZone: event.end?.timeZone || null,
        },
        attendees: event.attendees?.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })) || null,
        creator: event.creator
          ? {
              email: event.creator.email || null,
              displayName: event.creator.displayName || null,
            }
          : null,
        organizer: event.organizer
          ? {
              email: event.organizer.email || null,
              displayName: event.organizer.displayName || null,
            }
          : null,
      })) ?? []

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching calendar events',
      },
      { status: 500 }
    )
  }
}

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
    const calendarId = (body.calendarId as string | undefined) || 'primary'
    const summary = body.summary as string | undefined
    const description = body.description as string | undefined
    const location = body.location as string | undefined
    const attendees = Array.isArray(body.attendees) ? body.attendees : undefined
    const reminders = body.reminders
    const colorId = body.colorId as string | undefined

    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Event summary is required' },
        { status: 400 }
      )
    }

    const start = body.start
    const end = body.end

    if (!start || !end) {
      return NextResponse.json(
        { success: false, error: 'Event start and end are required' },
        { status: 400 }
      )
    }

    const calendar = getAuthenticatedCalendarClient(accessToken)
    const insertResponse = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        location,
        colorId,
        start,
        end,
        attendees,
        reminders,
      },
    })

    return NextResponse.json({
      success: true,
      event: insertResponse.data,
    })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating calendar event',
      },
      { status: 500 }
    )
  }
}

