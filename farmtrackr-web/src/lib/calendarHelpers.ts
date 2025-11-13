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
  isRecurring?: boolean
  recurrenceRule?: any // RecurrenceRule object
  rrule?: string | null // RRULE string
}) {
  // If googleEventId exists, check for existing event
  if (data.googleEventId) {
    const existing = await prisma.event.findFirst({
      where: {
        googleEventId: data.googleEventId,
      },
    })

    if (existing) {
      // Handle recurrence rule update
      let repeatRuleId: string | null = existing.repeatRuleId
      
      if (data.isRecurring && data.recurrenceRule && data.rrule) {
        if (existing.repeatRuleId) {
          // Update existing rule
          await prisma.repeatRule.update({
            where: { id: existing.repeatRuleId },
            data: {
              frequency: data.recurrenceRule.frequency.toLowerCase(),
              interval: data.recurrenceRule.interval || 1,
              count: data.recurrenceRule.count || null,
              until: data.recurrenceRule.until || null,
              byDay: data.recurrenceRule.byDay || [],
              byMonth: data.recurrenceRule.byMonth || [],
              byMonthDay: data.recurrenceRule.byMonthDay || [],
              rrule: data.rrule,
            },
          })
        } else {
          // Create new rule
          const repeatRule = await prisma.repeatRule.create({
            data: {
              frequency: data.recurrenceRule.frequency.toLowerCase(),
              interval: data.recurrenceRule.interval || 1,
              count: data.recurrenceRule.count || null,
              until: data.recurrenceRule.until || null,
              byDay: data.recurrenceRule.byDay || [],
              byMonth: data.recurrenceRule.byMonth || [],
              byMonthDay: data.recurrenceRule.byMonthDay || [],
              rrule: data.rrule,
            },
          })
          repeatRuleId = repeatRule.id
        }
      } else if (!data.isRecurring && existing.repeatRuleId) {
        // Remove recurrence if unchecked
        repeatRuleId = null
      }

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
          isRecurring: data.isRecurring || false,
          repeatRuleId: repeatRuleId,
        },
      })
    }
  }

  // Create recurrence rule if provided
  let repeatRuleId: string | null = null
  if (data.isRecurring && data.recurrenceRule && data.rrule) {
    const repeatRule = await prisma.repeatRule.create({
      data: {
        frequency: data.recurrenceRule.frequency.toLowerCase(),
        interval: data.recurrenceRule.interval || 1,
        count: data.recurrenceRule.count || null,
        until: data.recurrenceRule.until || null,
        byDay: data.recurrenceRule.byDay || [],
        byMonth: data.recurrenceRule.byMonth || [],
        byMonthDay: data.recurrenceRule.byMonthDay || [],
        rrule: data.rrule,
      },
    })
    repeatRuleId = repeatRule.id
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
      isRecurring: data.isRecurring || false,
      repeatRuleId: repeatRuleId,
    },
  })
}

/**
 * Sync Google events to database with conflict resolution
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
  const stats = {
    created: 0,
    updated: 0,
    skipped: 0,
    conflicts: 0,
  }

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

    // Check if event exists in DB
    const existing = await prisma.event.findFirst({
      where: {
        googleEventId: googleEvent.id,
      },
    })

    // Conflict resolution: If event exists and was modified in CRM, check timestamps
    if (existing) {
      const googleUpdated = googleEvent.updated ? new Date(googleEvent.updated) : new Date()
      const dbUpdated = existing.updatedAt

      // If CRM event was modified more recently, skip Google update (CRM wins)
      if (dbUpdated > googleUpdated && existing.source === 'crm') {
        stats.skipped++
        syncedEvents.push(existing)
        continue
      }

      // If both were modified, it's a conflict (Google wins for now, but log it)
      if (Math.abs(dbUpdated.getTime() - googleUpdated.getTime()) < 60000) {
        // Within 1 minute = likely same edit
        stats.conflicts++
      }

      // Update existing event (Google wins)
      const updated = await prisma.event.update({
        where: { id: existing.id },
        data: {
          title: googleEvent.summary || existing.title,
          description: googleEvent.description ?? existing.description,
          location: googleEvent.location ?? existing.location,
          start: startDate,
          end: endDate,
          allDay: isAllDay,
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          // Preserve CRM links
          crmContactId: existing.crmContactId,
          crmDealId: existing.crmDealId,
          crmTaskId: existing.crmTaskId,
        },
      })

      stats.updated++
      syncedEvents.push(updated)
    } else {
      // Create new event
      const event = await saveEventToDB({
        calendarId,
        title: googleEvent.summary || 'Untitled Event',
        description: googleEvent.description || null,
        location: googleEvent.location || null,
        start: startDate,
        end: endDate,
        allDay: isAllDay,
        color: null,
        googleEventId: googleEvent.id,
        source: 'google',
        syncStatus: 'synced',
        crmContactId: null,
        crmDealId: null,
        crmTaskId: null,
      })

      stats.created++
      syncedEvents.push(event)
    }

    // Sync attendees if present (for both new and updated events)
    const currentEvent = existing
      ? await prisma.event.findUnique({ where: { id: existing.id } })
      : syncedEvents[syncedEvents.length - 1]
    
    if (!currentEvent) continue

    if (currentEvent && googleEvent.attendees && googleEvent.attendees.length > 0) {
      // Delete existing attendees first, then recreate
      await prisma.attendee.deleteMany({
        where: { eventId: currentEvent.id },
      })

      await prisma.attendee.createMany({
        data: googleEvent.attendees
          .filter((a) => a.email)
          .map((attendee) => ({
            eventId: currentEvent.id,
            email: attendee.email!,
            displayName: attendee.displayName || null,
            responseStatus: (attendee.responseStatus as any) || 'needsAction',
            isOrganizer: attendee.organizer || false,
          })),
      })
    }
  }

  return { events: syncedEvents, stats }
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
      repeatRule: true, // Include repeat rule for recurring events
    },
    orderBy: {
      start: 'asc',
    },
  })
}

