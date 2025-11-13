import { prisma } from './prisma'
import { getGoogleAccessToken } from './googleTokenHelper'
import { getAuthenticatedCalendarClient } from './googleAuth'

/**
 * Sync Google calendars to database
 * Creates Calendar records for each Google calendar
 */
export async function syncGoogleCalendarsToDB() {
  const accessToken = await getGoogleAccessToken()
  if (!accessToken) {
    throw new Error('Google account not connected')
  }

  const calendar = getAuthenticatedCalendarClient(accessToken)
  const response = await calendar.calendarList.list({
    minAccessRole: 'reader',
    showHidden: false,
    showDeleted: false,
  })

  const googleCalendars = response.data.items || []
  const syncedCalendars = []

  for (const googleCal of googleCalendars) {
    if (!googleCal.id) continue

    const calendarData = {
      name: googleCal.summary || googleCal.id || 'Untitled Calendar',
      color: googleCal.backgroundColor || '#4285f4',
      type: 'google' as const,
      googleCalendarId: googleCal.id,
      isPrimary: googleCal.primary || false,
      isVisible: true,
    }

    // Upsert calendar (using unique constraint on googleCalendarId)
    const calendar = await prisma.calendar.upsert({
      where: {
        googleCalendarId: googleCal.id,
      },
      update: {
        ...calendarData,
        updatedAt: new Date(),
      },
      create: calendarData,
    })

    syncedCalendars.push(calendar)
  }

  return syncedCalendars
}

/**
 * Get or create a calendar in database
 */
export async function getOrCreateCalendar(
  googleCalendarId: string,
  name: string,
  color: string = '#4285f4',
  isPrimary: boolean = false
) {
  return prisma.calendar.upsert({
    where: {
      googleCalendarId,
    },
    update: {
      name,
      color,
      isPrimary,
      updatedAt: new Date(),
    },
    create: {
      name,
      color,
      type: 'google',
      googleCalendarId,
      isPrimary,
      isVisible: true,
    },
  })
}

/**
 * Create CRM-only calendar
 */
export async function createCRMCalendar(
  name: string,
  color: string = '#4285f4',
  ownerId?: string
) {
  return prisma.calendar.create({
    data: {
      name,
      color,
      type: 'crm',
      ownerId,
      isVisible: true,
    },
  })
}

/**
 * Save event to database (for synced events)
 */
export async function saveEventToDB(data: {
  calendarId: string
  title: string
  description?: string | null
  location?: string | null
  start: Date
  end: Date
  allDay: boolean
  color?: string | null
  googleEventId?: string | null
  source: 'crm' | 'google'
  syncStatus?: 'synced' | 'pending' | 'error'
  crmContactId?: string | null
  crmDealId?: string | null
  crmTaskId?: string | null
}) {
  // If googleEventId exists, check for existing event
  if (data.googleEventId) {
    const existing = await prisma.event.findUnique({
      where: {
        googleEventId: data.googleEventId,
      },
    })

    if (existing) {
      return prisma.event.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          description: data.description,
          location: data.location,
          start: data.start,
          end: data.end,
          allDay: data.allDay,
          color: data.color,
          syncStatus: data.syncStatus || 'synced',
          lastSyncedAt: new Date(),
          crmContactId: data.crmContactId,
          crmDealId: data.crmDealId,
          crmTaskId: data.crmTaskId,
        },
      })
    }
  }

  return prisma.event.create({
    data: {
      calendarId: data.calendarId,
      title: data.title,
      description: data.description,
      location: data.location,
      start: data.start,
      end: data.end,
      allDay: data.allDay,
      color: data.color,
      googleEventId: data.googleEventId,
      source: data.source,
      syncStatus: data.syncStatus || (data.googleEventId ? 'synced' : 'pending'),
      lastSyncedAt: data.googleEventId ? new Date() : null,
      crmContactId: data.crmContactId,
      crmDealId: data.crmDealId,
      crmTaskId: data.crmTaskId,
    },
  })
}

/**
 * Sync Google events to database
 */
export async function syncGoogleEventsToDB(
  calendarId: string,
  googleCalendarId: string,
  timeMin: Date,
  timeMax: Date
) {
  const accessToken = await getGoogleAccessToken()
  if (!accessToken) {
    throw new Error('Google account not connected')
  }

  const calendar = getAuthenticatedCalendarClient(accessToken)
  const response = await calendar.events.list({
    calendarId: googleCalendarId,
    singleEvents: true,
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  })

  const googleEvents = response.data.items || []
  const syncedEvents = []

  for (const googleEvent of googleEvents) {
    if (!googleEvent.id) continue

    // Parse dates
    const startDate = googleEvent.start?.dateTime
      ? new Date(googleEvent.start.dateTime)
      : googleEvent.start?.date
        ? new Date(googleEvent.start.date + 'T00:00:00')
        : null

    const endDate = googleEvent.end?.dateTime
      ? new Date(googleEvent.end.dateTime)
      : googleEvent.end?.date
        ? new Date(googleEvent.end.date + 'T00:00:00')
        : null

    if (!startDate || !endDate) continue

    const isAllDay = !!googleEvent.start?.date && !googleEvent.start?.dateTime

    // Save to database
    const event = await saveEventToDB({
      calendarId,
      title: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || null,
      location: googleEvent.location || null,
      start: startDate,
      end: endDate,
      allDay: isAllDay,
      color: null, // Could extract from calendar
      googleEventId: googleEvent.id,
      source: 'google',
      syncStatus: 'synced',
      crmContactId: null,
      crmDealId: null,
      crmTaskId: null,
    })

    syncedEvents.push(event)

    // Sync attendees if present
    if (googleEvent.attendees && googleEvent.attendees.length > 0) {
      // Delete existing attendees first, then recreate (simpler than upsert without unique constraint)
      await prisma.attendee.deleteMany({
        where: { eventId: event.id },
      })

      await prisma.attendee.createMany({
        data: googleEvent.attendees
          .filter((a) => a.email)
          .map((attendee) => ({
            eventId: event.id,
            email: attendee.email!,
            displayName: attendee.displayName || null,
            responseStatus: (attendee.responseStatus as any) || 'needsAction',
            isOrganizer: attendee.organizer || false,
          })),
      })
    }
  }

  return syncedEvents
}

/**
 * Get events from database (merged with Google events)
 */
export async function getEventsFromDB(
  calendarIds: string[],
  timeMin: Date,
  timeMax: Date
) {
  return prisma.event.findMany({
    where: {
      calendarId: {
        in: calendarIds,
      },
      start: {
        lte: timeMax,
      },
      end: {
        gte: timeMin,
      },
    },
    include: {
      calendar: true,
      attendees: true,
    },
    orderBy: {
      start: 'asc',
    },
  })
}

