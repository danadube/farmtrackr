import { prisma } from './prisma'
import { saveEventToDB } from './calendarHelpers'

/**
 * Auto-generate calendar events for listings
 */

/**
 * Create calendar events for listing deadlines
 */
export async function generateListingDeadlineEvents(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      stageInstances: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where: {
              dueDate: { not: null },
              completed: false,
            },
            orderBy: { dueDate: 'asc' },
          },
        },
      },
      pipelineTemplate: true,
    },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  // Get or create a CRM calendar for listing deadlines
  let deadlineCalendar = await prisma.calendar.findFirst({
    where: {
      type: 'crm',
      name: 'Listing Deadlines',
    },
  })

  if (!deadlineCalendar) {
    deadlineCalendar = await prisma.calendar.create({
      data: {
        name: 'Listing Deadlines',
        type: 'crm',
        color: '#ea4335', // Red for deadlines
        isVisible: true,
      },
    })
  }

  const events = []

  // Create events for important deadlines
  for (const stage of listing.stageInstances) {
    for (const task of stage.tasks) {
      if (!task.dueDate) continue

      // Check if event already exists for this task
      const existingEvent = await prisma.event.findFirst({
        where: {
          crmTaskId: task.id,
          calendarId: deadlineCalendar.id,
        },
      })

      if (existingEvent) {
        // Update existing event if due date changed
        if (existingEvent.end.getTime() !== task.dueDate.getTime()) {
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: {
              title: `${listing.title || 'Listing'}: ${task.name}`,
              start: task.dueDate,
              end: new Date(task.dueDate.getTime() + 60 * 60 * 1000), // 1 hour event
              description: `Deadline for: ${task.name}\nStage: ${stage.name}\nListing: ${listing.title || 'Untitled'}`,
            },
          })
        }
        continue
      }

      // Create new event
      const event = await saveEventToDB({
        calendarId: deadlineCalendar.id,
        title: `${listing.title || 'Listing'}: ${task.name}`,
        description: `Deadline for: ${task.name}\nStage: ${stage.name}\nListing: ${listing.title || 'Untitled'}`,
        location: listing.address ? `${listing.address}, ${listing.city || ''} ${listing.state || ''}` : null,
        start: task.dueDate,
        end: new Date(task.dueDate.getTime() + 60 * 60 * 1000), // 1 hour event
        allDay: false,
        color: '#ea4335', // Red for deadlines
        googleEventId: null,
        source: 'crm',
        syncStatus: 'synced', // CRM-only, no sync needed
        crmContactId: listing.sellerId,
        crmDealId: listing.id,
        crmTaskId: task.id,
      })

      events.push(event)
    }
  }

  return events
}

/**
 * Create calendar events for listing milestones (closing, inspections, etc.)
 */
export async function generateListingMilestoneEvents(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      stageInstances: {
        orderBy: { order: 'asc' },
      },
      pipelineTemplate: true,
    },
  })

  if (!listing) {
    throw new Error('Listing not found')
  }

  // Get or create a CRM calendar for milestones
  let milestoneCalendar = await prisma.calendar.findFirst({
    where: {
      type: 'crm',
      name: 'Listing Milestones',
    },
  })

  if (!milestoneCalendar) {
    milestoneCalendar = await prisma.calendar.create({
      data: {
        name: 'Listing Milestones',
        type: 'crm',
        color: '#34a853', // Green for milestones
        isVisible: true,
      },
    })
  }

  const events = []
  const now = new Date()

  // Create events for key milestones
  if (listing.targetListDate) {
    const listDate = new Date(listing.targetListDate)
    if (listDate >= now) {
      const existingEvent = await prisma.event.findFirst({
        where: {
          crmDealId: listing.id,
          title: { contains: 'List Date' },
        },
      })

      if (!existingEvent) {
        const event = await saveEventToDB({
          calendarId: milestoneCalendar.id,
          title: `${listing.title || 'Listing'}: Target List Date`,
          description: `Target listing date for: ${listing.title || 'Untitled Listing'}`,
          location: listing.address ? `${listing.address}, ${listing.city || ''} ${listing.state || ''}` : null,
          start: listDate,
          end: new Date(listDate.getTime() + 24 * 60 * 60 * 1000), // All day
          allDay: true,
          color: '#34a853',
          googleEventId: null,
          source: 'crm',
          syncStatus: 'synced',
          crmContactId: listing.sellerId,
          crmDealId: listing.id,
          crmTaskId: null,
        })
        events.push(event)
      }
    }
  }

  if (listing.projectedCloseDate) {
    const closeDate = new Date(listing.projectedCloseDate)
    if (closeDate >= now) {
      const existingEvent = await prisma.event.findFirst({
        where: {
          crmDealId: listing.id,
          title: { contains: 'Closing' },
        },
      })

      if (!existingEvent) {
        const event = await saveEventToDB({
          calendarId: milestoneCalendar.id,
          title: `${listing.title || 'Listing'}: Closing Date`,
          description: `Projected closing date for: ${listing.title || 'Untitled Listing'}`,
          location: listing.address ? `${listing.address}, ${listing.city || ''} ${listing.state || ''}` : null,
          start: closeDate,
          end: new Date(closeDate.getTime() + 24 * 60 * 60 * 1000), // All day
          allDay: true,
          color: '#34a853',
          googleEventId: null,
          source: 'crm',
          syncStatus: 'synced',
          crmContactId: listing.sellerId,
          crmDealId: listing.id,
          crmTaskId: null,
        })
        events.push(event)
      }
    }
  }

  return events
}

/**
 * Create follow-up event after a showing
 * Call this when a showing event is created or completed
 */
export async function generateFollowUpEvent(
  showingEventId: string,
  daysAfter: number = 3
) {
  const showingEvent = await prisma.event.findUnique({
    where: { id: showingEventId },
    include: {
      calendar: true,
    },
  })

  if (!showingEvent) {
    throw new Error('Showing event not found')
  }

  // Check if follow-up already exists
  const existingFollowUp = await prisma.event.findFirst({
    where: {
      title: { contains: 'Follow-up' },
      crmDealId: showingEvent.crmDealId,
      start: {
        gte: new Date(showingEvent.end.getTime() + (daysAfter - 1) * 24 * 60 * 60 * 1000),
        lte: new Date(showingEvent.end.getTime() + (daysAfter + 1) * 24 * 60 * 60 * 1000),
      },
    },
  })

  if (existingFollowUp) {
    return existingFollowUp
  }

  const followUpDate = new Date(showingEvent.end)
  followUpDate.setDate(followUpDate.getDate() + daysAfter)

  const followUpEvent = await saveEventToDB({
    calendarId: showingEvent.calendarId,
    title: `Follow-up: ${showingEvent.title}`,
    description: `Follow-up ${daysAfter} days after showing: ${showingEvent.title}\n\nOriginal showing: ${showingEvent.start.toLocaleDateString()}`,
    location: showingEvent.location,
    start: followUpDate,
    end: new Date(followUpDate.getTime() + 30 * 60 * 1000), // 30 minute event
    allDay: false,
    color: showingEvent.color,
    googleEventId: null,
    source: 'crm',
    syncStatus: 'synced',
    crmContactId: showingEvent.crmContactId,
    crmDealId: showingEvent.crmDealId,
    crmTaskId: null,
  })

  return followUpEvent
}

/**
 * Auto-generate all events for a listing
 */
export async function generateAllListingEvents(listingId: string) {
  const deadlineEvents = await generateListingDeadlineEvents(listingId)
  const milestoneEvents = await generateListingMilestoneEvents(listingId)

  return {
    deadlineEvents,
    milestoneEvents,
    total: deadlineEvents.length + milestoneEvents.length,
  }
}

