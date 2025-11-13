import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEventsFromDB, saveEventToDB } from '@/lib/calendarHelpers'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedCalendarClient } from '@/lib/googleAuth'
import { generateRecurringInstances, parseRRULE, type RecurrenceRule } from '@/lib/recurringEvents'

export const dynamic = 'force-dynamic'

/**
 * GET /api/events
 * Get events from database (optionally merge with Google)
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database not configured. Please set DATABASE_URL environment variable.',
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const calendarIds = searchParams.get('calendarIds')?.split(',') || []
    const timeMin = searchParams.get('timeMin')
    const timeMax = searchParams.get('timeMax')
    const includeGoogle = searchParams.get('includeGoogle') !== 'false'

    if (calendarIds.length === 0) {
      return NextResponse.json({
        success: true,
        events: [],
      })
    }

    const startDate = timeMin ? new Date(timeMin) : new Date()
    startDate.setMonth(startDate.getMonth() - 1)
    const endDate = timeMax ? new Date(timeMax) : new Date()
    endDate.setMonth(endDate.getMonth() + 2)

    // Get events from database (query a wider range to catch recurring events that start before but recur into range)
    const queryStartDate = new Date(startDate)
    queryStartDate.setFullYear(queryStartDate.getFullYear() - 1) // Look back 1 year for recurring events
    const dbEvents = await getEventsFromDB(calendarIds, queryStartDate, endDate)

    // Optionally fetch from Google and merge
    let googleEvents: any[] = []
    if (includeGoogle) {
      try {
        const accessToken = await getGoogleAccessToken()
        if (accessToken) {
          const calendar = getAuthenticatedCalendarClient(accessToken)
          
          // Get Google calendars for these calendar IDs
          const calendars = await prisma.calendar.findMany({
            where: {
              id: { in: calendarIds },
              type: 'google',
              googleCalendarId: { not: null },
            },
          })

          const googleResults = await Promise.all(
            calendars.map(async (cal) => {
              if (!cal.googleCalendarId) return []
              try {
                const response = await calendar.events.list({
                  calendarId: cal.googleCalendarId,
                  singleEvents: true,
                  orderBy: 'startTime',
                  timeMin: startDate.toISOString(),
                  timeMax: endDate.toISOString(),
                })
                return (response.data.items || []).map((event) => ({
                  ...event,
                  _calendarId: cal.id,
                  _calendarName: cal.name,
                  _calendarColor: cal.color,
                }))
              } catch (error) {
                console.error(`Failed to fetch events for calendar ${cal.googleCalendarId}:`, error)
                return []
              }
            })
          )

          googleEvents = googleResults.flat()
        }
      } catch (error) {
        console.error('Failed to fetch Google events:', error)
        // Continue with DB events only
      }
    }

    // Expand recurring events into instances for the visible date range
    const expandedEvents: any[] = []
    for (const event of dbEvents) {
      if (event.isRecurring && event.repeatRule) {
        // Parse the recurrence rule
        const rrule = event.repeatRule.rrule
        if (rrule) {
          const recurrenceRule = parseRRULE(rrule)
          if (recurrenceRule) {
            // Generate instances for the visible date range (pass view range for optimization)
            const instances = generateRecurringInstances(
              new Date(event.start),
              new Date(event.end),
              recurrenceRule,
              1000, // Max instances (should be enough for any reasonable view)
              startDate, // Only generate instances from view start
              endDate // Only generate instances until view end
            )
            
            // Instances are already filtered by the function, but double-check
            const visibleInstances = instances.filter(
              (instance) => instance.start <= endDate && instance.end >= startDate
            )
            
            // Create event instances with unique IDs
            for (const instance of visibleInstances) {
              expandedEvents.push({
                ...event,
                id: `${event.id}_${instance.start.toISOString()}`, // Unique ID for this instance
                start: instance.start,
                end: instance.end,
                isRecurringInstance: true, // Flag to indicate this is an instance
                recurrenceId: event.id, // Reference to the parent recurring event
              })
            }
          } else {
            // If we can't parse the RRULE, just include the base event
            expandedEvents.push(event)
          }
        } else {
          // No RRULE, just include the base event
          expandedEvents.push(event)
        }
      } else {
        // Non-recurring event, include as-is
        expandedEvents.push(event)
      }
    }

    // Merge events: prefer DB events (they have sync info), supplement with Google events not in DB
    const dbEventGoogleIds = new Set(
      expandedEvents.filter((e) => e.googleEventId).map((e) => e.googleEventId!)
    )

    const uniqueGoogleEvents = googleEvents.filter(
      (e) => e.id && !dbEventGoogleIds.has(e.id)
    )

    return NextResponse.json({
      success: true,
      events: expandedEvents,
      googleEvents: uniqueGoogleEvents, // Return separately for client to merge
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please check your DATABASE_URL environment variable and ensure the database server is running.',
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching events',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/events
 * Create event (save to DB and optionally sync to Google)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      calendarId,
      title,
      description,
      location,
      start,
      end,
      allDay,
      color,
      syncToGoogle = true, // Default to syncing
      crmContactId,
      crmDealId,
      crmTaskId,
      isRecurring,
      recurrenceRule,
      rrule,
    } = body

    if (!calendarId || !title || !start || !end) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse dates
    const startDate = new Date(start)
    const endDate = new Date(end)

    // Get calendar - can be DB ID or Google calendar ID
    let calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    })

    // If not found by DB ID, try finding by Google calendar ID
    if (!calendar) {
      calendar = await prisma.calendar.findUnique({
        where: { googleCalendarId: calendarId },
      })
    }

    if (!calendar) {
      // If still not found, try to sync calendars and find again
      try {
        const { syncGoogleCalendarsToDB } = await import('@/lib/calendarHelpers')
        await syncGoogleCalendarsToDB()
        calendar = await prisma.calendar.findUnique({
          where: { googleCalendarId: calendarId },
        })
      } catch (error) {
        console.error('Failed to sync calendars:', error)
      }

      if (!calendar) {
        return NextResponse.json(
          { success: false, error: 'Calendar not found. Please sync calendars first.' },
          { status: 404 }
        )
      }
    }

    let googleEventId: string | null = null
    let syncStatus: 'synced' | 'pending' | 'error' = 'pending'

    // If syncing to Google and calendar is Google type
    if (syncToGoogle && calendar.type === 'google' && calendar.googleCalendarId) {
      try {
        const accessToken = await getGoogleAccessToken()
        if (!accessToken) {
          throw new Error('Google account not connected')
        }

        const googleCalendar = getAuthenticatedCalendarClient(accessToken)
        
        // Format dates for Google
        const googleStart = allDay
          ? { date: startDate.toISOString().split('T')[0] }
          : { dateTime: startDate.toISOString() }
        
        const googleEnd = allDay
          ? { date: endDate.toISOString().split('T')[0] }
          : { dateTime: endDate.toISOString() }

        // Build recurrence rule for Google Calendar if recurring
        const googleRecurrence: string[] | undefined = rrule
          ? [rrule]
          : undefined

        const response = await googleCalendar.events.insert({
          calendarId: calendar.googleCalendarId,
          requestBody: {
            summary: title,
            description: description || undefined,
            location: location || undefined,
            start: googleStart,
            end: googleEnd,
            recurrence: googleRecurrence,
          },
        })

        googleEventId = response.data.id || null
        syncStatus = 'synced'
      } catch (error) {
        console.error('Failed to sync event to Google:', error)
        syncStatus = 'error'
        // Still save to DB even if Google sync fails
      }
    } else if (calendar.type === 'crm') {
      // CRM-only event, no Google sync
      syncStatus = 'synced' // Considered "synced" since there's nothing to sync to
    }

    // Save to database
    const event = await saveEventToDB({
      calendarId,
      title,
      description: description || null,
      location: location || null,
      start: startDate,
      end: endDate,
      allDay: allDay || false,
      color: color || null,
      googleEventId,
      source: syncToGoogle && calendar.type === 'google' ? 'google' : 'crm',
      syncStatus,
      crmContactId: crmContactId || null,
      crmDealId: crmDealId || null,
      crmTaskId: crmTaskId || null,
      isRecurring: isRecurring || false,
      recurrenceRule: recurrenceRule || null,
      rrule: rrule || null,
    })

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating event',
      },
      { status: 500 }
    )
  }
}

