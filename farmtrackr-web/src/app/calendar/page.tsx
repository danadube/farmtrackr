'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Loader2, RefreshCw, X, MapPin, Edit, Share2, UserPlus } from 'lucide-react'
import { generateRRULE, type RecurrenceRule } from '@/lib/recurringEvents'

type CalendarView = 'month' | 'week' | 'day'

type GoogleCalendar = {
  id: string
  summary?: string
  name?: string
  description?: string | null
  backgroundColor?: string | null
  color?: string
  foregroundColor?: string | null
  primary?: boolean | null
  type?: 'google' | 'crm'
  googleCalendarId?: string | null
}

type ApiCalendarEvent = {
  id: string
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
  htmlLink?: string | null
}

type NormalizedEvent = {
  id: string
  title: string
  description?: string
  location?: string
  start: Date
  end: Date
  isAllDay: boolean
  startLabel: string
  endLabel: string
  htmlLink?: string
  calendarId?: string
  calendarName?: string
  calendarColor?: string
  crmContactId?: string
  crmDealId?: string
  crmTaskId?: string
  linkedContact?: { id: string; name: string }
  linkedListing?: { id: string; title: string }
}

type AttendeeInput = {
  email: string
  displayName?: string
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  isOrganizer?: boolean
  isOptional?: boolean
}

type CreateEventState = {
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  description: string
  calendarId: string
  isAllDay: boolean
  syncToGoogle: boolean // Whether to sync to Google Calendar
  crmContactId: string // Link to contact (FarmContact or GeneralContact)
  crmDealId: string // Link to listing/deal
  crmTaskId: string // Link to task
  attendees: AttendeeInput[] // Event attendees
  isRecurring: boolean // Whether this is a recurring event
  recurrenceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | ''
  recurrenceInterval: number // e.g., every 2 weeks = 2
  recurrenceCount?: number // Number of occurrences
  recurrenceUntil?: string // End date (YYYY-MM-DD)
  recurrenceByDay: string[] // e.g., ['MO', 'WE', 'FR']
}

const INITIAL_CREATE_EVENT_STATE: CreateEventState = {
  title: '',
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  location: '',
  description: '',
  calendarId: 'primary',
  isAllDay: false,
  syncToGoogle: true, // Default to syncing to Google
  crmContactId: '',
  crmDealId: '',
  crmTaskId: '',
  attendees: [],
  isRecurring: false,
  recurrenceFrequency: '',
  recurrenceInterval: 1,
  recurrenceCount: undefined,
  recurrenceUntil: undefined,
  recurrenceByDay: [],
}

export default function CalendarPage() {
  const { colors, text, card, cardWithLeftBorder, headerCard, headerDivider, spacing, isDark } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle, pressedButtons } = useButtonPress()

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<NormalizedEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateEventState>(INITIAL_CREATE_EVENT_STATE)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])
  const [showCalendarPicker, setShowCalendarPicker] = useState(false)
  const [showCreateCalendarModal, setShowCreateCalendarModal] = useState(false)
  const [editingCalendar, setEditingCalendar] = useState<{ id: string; name: string; color: string } | null>(null)
  const [newCalendarName, setNewCalendarName] = useState('')
  const [newCalendarColor, setNewCalendarColor] = useState('#4285f4')
  const [isSavingCalendar, setIsSavingCalendar] = useState(false)
  const [sharingCalendar, setSharingCalendar] = useState<{ id: string; name: string } | null>(null)
  const [calendarShares, setCalendarShares] = useState<Array<{ id: string; userId: string; role: string }>>([])
  const [newShareUserId, setNewShareUserId] = useState('')
  const [newShareRole, setNewShareRole] = useState<'viewer' | 'editor' | 'owner'>('viewer')
  const [isLoadingShares, setIsLoadingShares] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Array<{ id: string; name: string }>>([])
  const [listings, setListings] = useState<Array<{ id: string; title: string }>>([])
  const [tasks, setTasks] = useState<Array<{ id: string; name: string; listingId: string; listingTitle: string }>>([])
  const [googleContacts, setGoogleContacts] = useState<Array<{ id: string; email1?: string; email2?: string; firstName?: string; lastName?: string; organizationName?: string }>>([])
  const [linkedContact, setLinkedContact] = useState<{ id: string; name: string } | null>(null)
  const [linkedListing, setLinkedListing] = useState<{ id: string; title: string } | null>(null)
  const [linkedTask, setLinkedTask] = useState<{ id: string; name: string; listingId: string; listingTitle: string } | null>(null)
  const [eventAttendees, setEventAttendees] = useState<Array<{ email: string; displayName?: string; responseStatus?: string; isOrganizer?: boolean }>>([])

  useEffect(() => {
    let storedSelection: string[] | undefined
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('calendar.selectedCalendars')
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            storedSelection = parsed.filter((id) => typeof id === 'string')
            if (storedSelection.length > 0) {
              setSelectedCalendars(storedSelection)
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore calendar selection:', error)
      }
    }
    loadCalendars(storedSelection)
    loadContacts()
    loadListings()
    loadTasks()
    loadGoogleContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts?search=')
      if (response.ok) {
        const data = await response.json()
        setContacts(
          data.map((contact: any) => ({
            id: contact.id,
            name: contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact',
          }))
        )
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
    }
  }

  const loadListings = async () => {
    try {
      const response = await fetch('/api/listings')
      if (response.ok) {
        const data = await response.json()
        setListings(
          data.listings?.map((listing: any) => ({
            id: listing.id,
            title: listing.title || 'Untitled Listing',
          })) || data.map((listing: any) => ({
            id: listing.id,
            title: listing.title || 'Untitled Listing',
          }))
        )
      }
    } catch (error) {
      console.error('Failed to load listings:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/listings')
      if (response.ok) {
        const data = await response.json()
        const listings = data.listings || data
        const allTasks: Array<{ id: string; name: string; listingId: string; listingTitle: string }> = []
        
        // Extract tasks from all listings
        for (const listing of listings) {
          if (listing.stageInstances) {
            for (const stage of listing.stageInstances) {
              if (stage.tasks) {
                for (const task of stage.tasks) {
                  allTasks.push({
                    id: task.id,
                    name: task.name,
                    listingId: listing.id,
                    listingTitle: listing.title || 'Untitled Listing',
                  })
                }
              }
            }
          }
        }
        
        setTasks(allTasks)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const loadGoogleContacts = async () => {
    try {
      const response = await fetch('/api/google-contacts')
      if (response.ok) {
        const contacts = await response.json()
        setGoogleContacts(contacts)
      }
    } catch (error) {
      console.error('Failed to load Google Contacts:', error)
    }
  }
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('calendar.selectedCalendars', JSON.stringify(selectedCalendars))
    } catch (error) {
      console.error('Failed to persist calendar selection:', error)
    }
  }, [selectedCalendars])

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view, selectedCalendars])

  useEffect(() => {
    if (!showCalendarPicker) return
    const handleClickOutside = (event: MouseEvent) => {
      const popover = document.getElementById('calendar-picker-popover')
      const toggle = document.getElementById('calendar-picker-toggle')
      if (popover && !popover.contains(event.target as Node) && toggle && !toggle.contains(event.target as Node)) {
        setShowCalendarPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendarPicker])

  const fetchEvents = async (forceRefresh = false) => {
    setIsLoading((prev) => prev || !forceRefresh)
    setIsRefreshing(forceRefresh)
    setError(null)
    setRequiresAuth(false)

    try {
      if (selectedCalendars.length === 0) {
        setEvents([])
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      const { start, end } = getViewDateRange(currentDate, view)

      // Fetch from new API that merges DB + Google events
      const params = new URLSearchParams({
        calendarIds: selectedCalendars.join(','),
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        includeGoogle: 'true', // Include live Google events
      })

      const dbResponse = await fetch(`/api/events?${params.toString()}`)
      
      if (!dbResponse.ok) {
        if (dbResponse.status === 401) {
          setRequiresAuth(true)
        } else {
          const { error: apiError } = await dbResponse.json()
          setError((prev) => prev || apiError || 'Unable to load calendar events.')
        }
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      const dbData = await dbResponse.json()
      
      // Also fetch from Google API for live events (fallback/merge)
      const googleResults = await Promise.all(
        selectedCalendars.map(async (calendarId) => {
          const googleParams = new URLSearchParams({
            calendarId,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: '250',
          })

          try {
            const response = await fetch(`/api/google/calendar/events?${googleParams.toString()}`)
            if (!response.ok) {
              if (response.status === 401) {
                setRequiresAuth(true)
              }
              return { calendarId, events: [] }
            }
            const data = await response.json()
            return { calendarId, events: data.events || [] }
          } catch (error) {
            console.error(`Failed to fetch Google events for ${calendarId}:`, error)
            return { calendarId, events: [] }
          }
        })
      )

      // Merge DB events and Google events
      const dbEvents = dbData.events || []
      const googleEventsMap = new Map<string, ApiCalendarEvent>()
      
      // Create map of Google events by ID
      for (const { calendarId, events } of googleResults) {
        const meta = calendars.find((calendar) => calendar.id === calendarId)
        for (const event of events) {
          if (event.id) {
            googleEventsMap.set(event.id, event)
          }
        }
      }

      // Normalize DB events
      const normalizedDbEvents: NormalizedEvent[] = dbEvents
        .map((event: any) => {
          const meta = calendars.find((calendar) => calendar.id === event.calendarId)
          return {
            id: event.googleEventId || event.id,
            title: event.title,
            description: event.description || undefined,
            location: event.location || undefined,
            start: new Date(event.start),
            end: new Date(event.end),
            isAllDay: event.allDay,
            startLabel: event.allDay 
              ? new Date(event.start).toLocaleDateString()
              : new Date(event.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            endLabel: event.allDay
              ? new Date(event.end).toLocaleDateString()
              : new Date(event.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            calendarId: event.calendarId,
            calendarName: meta?.summary || event.calendar?.name || 'Unknown',
            calendarColor: meta?.backgroundColor || event.calendar?.color || '#4285f4',
            htmlLink: event.googleEventId ? `https://calendar.google.com/calendar/event?eid=${event.googleEventId}` : undefined,
          }
        })
        .filter((event: NormalizedEvent | null): event is NormalizedEvent => !!event)

      // Normalize Google events that aren't in DB
      const normalizedGoogleEvents: NormalizedEvent[] = []
      const dbGoogleIds = new Set(dbEvents.filter((e: any) => e.googleEventId).map((e: any) => e.googleEventId))
      
      // Convert Map to Array for iteration
      const googleEventsArray = Array.from(googleEventsMap.entries())
      for (const [googleEventId, googleEvent] of googleEventsArray) {
        if (!dbGoogleIds.has(googleEventId)) {
          const meta = calendars.find((calendar) => 
            selectedCalendars.includes(calendar.id)
          )
          const normalized = normalizeEvent(googleEvent, meta)
          if (normalized) {
            normalizedGoogleEvents.push(normalized)
          }
        }
      }

      // Merge and deduplicate
      const allEvents = [...normalizedDbEvents, ...normalizedGoogleEvents]
      const uniqueEvents = Array.from(
        new Map(allEvents.map((event) => [event.id, event])).values()
      )

      uniqueEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
      setEvents(uniqueEvents)
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error while loading events.')
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleSyncFromGoogle = async () => {
    setIsSyncing(true)
    setSyncStatus(null)
    setError(null)

    try {
      const { start, end } = getViewDateRange(currentDate, view)
      
      const response = await fetch('/api/events/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarIds: selectedCalendars,
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync from Google')
      }

      setSyncStatus(
        `Synced ${data.totalSynced} events (${data.stats.created} new, ${data.stats.updated} updated)`
      )
      
      // Refresh events after sync
      await fetchEvents(true)
    } catch (err) {
      console.error('Failed to sync from Google:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error while syncing.')
    } finally {
      setIsSyncing(false)
      // Clear status message after 5 seconds
      setTimeout(() => setSyncStatus(null), 5000)
    }
  }

  const loadCalendars = async (initialSelection?: string[]) => {
    try {
      // Sync Google calendars to DB first
      try {
        await fetch('/api/calendar?syncGoogle=true')
      } catch (error) {
        console.error('Failed to sync calendars to DB:', error)
        // Continue even if sync fails
      }

      // Get calendars from Google API (for display)
      const googleResponse = await fetch('/api/google/calendar/list')
      let googleCalendars: GoogleCalendar[] = []
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json()
        googleCalendars = googleData.calendars || []
      } else if (googleResponse.status === 401) {
        setRequiresAuth(true)
      }

      // Get CRM calendars from database
      let crmCalendars: GoogleCalendar[] = []
      try {
        const dbResponse = await fetch('/api/calendar')
        if (dbResponse.ok) {
          const dbData = await dbResponse.json()
          // Convert DB calendars to GoogleCalendar format for compatibility
          crmCalendars = (dbData.calendars || [])
            .filter((cal: any) => cal.type === 'crm')
            .map((cal: any) => ({
              id: cal.id,
              summary: cal.name,
              name: cal.name,
              backgroundColor: cal.color,
              color: cal.color,
              foregroundColor: '#ffffff',
              primary: cal.isPrimary,
              description: null,
              type: 'crm' as const,
              googleCalendarId: null,
            }))
        }
      } catch (error) {
        console.error('Failed to load CRM calendars:', error)
      }

      // Merge Google and CRM calendars (Google first, then CRM)
      const allCalendars = [...googleCalendars, ...crmCalendars]
      setCalendars(allCalendars)

      if (allCalendars.length === 0) {
        setSelectedCalendars([])
        return
      }

      const baseSelection = initialSelection ?? selectedCalendars
      const validSelection = baseSelection.filter((id) =>
        allCalendars.some((calendar) => calendar.id === id)
      )

      const nextSelection =
        validSelection.length > 0
          ? validSelection
          : [allCalendars.find((calendar) => calendar.primary)?.id || allCalendars[0].id]

      setSelectedCalendars((prev) => {
        if (arraysEqual(prev, nextSelection)) {
          return prev
        }
        return nextSelection
      })
    } catch (error) {
      console.error('Failed to load calendar list:', error)
    }
  }

  const handlePrev = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === 'month') {
        newDate.setMonth(prev.getMonth() - 1)
      } else if (view === 'week') {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() - 1)
      }
      return newDate
    })
  }

  const handleNext = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (view === 'month') {
        newDate.setMonth(prev.getMonth() + 1)
      } else if (view === 'week') {
        newDate.setDate(prev.getDate() + 7)
      } else {
        newDate.setDate(prev.getDate() + 1)
      }
      return newDate
    })
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const handleOpenCreateModal = () => {
    const startDate = toInputDate(selectedDate)
    const endDate = toInputDate(selectedDate)
    // Use primary calendar or first available calendar
    const defaultCalendarId = calendars.find((cal) => cal.primary)?.id || calendars[0]?.id || 'primary'
    setCreateForm({
      ...INITIAL_CREATE_EVENT_STATE,
      startDate,
      endDate,
      calendarId: defaultCalendarId,
    })
    setIsCreateModalOpen(true)
  }

  const handleStartEdit = () => {
    if (!selectedEvent) return
    
    const startDate = toInputDate(selectedEvent.start)
    // For all-day events, Google Calendar end date is exclusive (one day after), so subtract one day
    let endDate = toInputDate(selectedEvent.end)
    if (selectedEvent.isAllDay) {
      const endDateObj = new Date(selectedEvent.end)
      endDateObj.setDate(endDateObj.getDate() - 1)
      endDate = toInputDate(endDateObj)
    }
    const startTime = selectedEvent.isAllDay ? '09:00' : toInputTime(selectedEvent.start)
    const endTime = selectedEvent.isAllDay ? '10:00' : toInputTime(selectedEvent.end)
    
    setCreateForm({
      title: selectedEvent.title,
      startDate,
      startTime,
      endDate,
      endTime,
      location: selectedEvent.location || '',
      description: selectedEvent.description || '',
      calendarId: selectedEvent.calendarId || 'primary',
      isAllDay: selectedEvent.isAllDay,
      syncToGoogle: true, // Default to syncing when editing (can be changed)
      crmContactId: selectedEvent.crmContactId || '',
      crmDealId: selectedEvent.crmDealId || '',
      crmTaskId: selectedEvent.crmTaskId || '',
      attendees: eventAttendees.map((a) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: (a.responseStatus as any) || 'needsAction',
        isOrganizer: a.isOrganizer || false,
      })),
      isRecurring: false, // Will be populated from event data if available
      recurrenceFrequency: '',
      recurrenceInterval: 1,
      recurrenceCount: undefined,
      recurrenceUntil: undefined,
      recurrenceByDay: [],
    })
    setEditingEventId(selectedEvent.id)
    setIsEditingEvent(true)
  }

  const handleCancelEdit = () => {
    setIsEditingEvent(false)
    setEditingEventId(null)
    setCreateForm(INITIAL_CREATE_EVENT_STATE)
  }

  const handleSaveCalendar = async () => {
    if (!newCalendarName.trim()) {
      alert('Calendar name is required')
      return
    }

    setIsSavingCalendar(true)
    try {
      if (editingCalendar) {
        // Update existing calendar
        const response = await fetch('/api/calendar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCalendar.id,
            name: newCalendarName.trim(),
            color: newCalendarColor,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update calendar')
        }
      } else {
        // Create new calendar
        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCalendarName.trim(),
            color: newCalendarColor,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create calendar')
        }
      }

      // Reload calendars and close modal
      await loadCalendars()
      setShowCreateCalendarModal(false)
      setEditingCalendar(null)
      setNewCalendarName('')
      setNewCalendarColor('#4285f4')
    } catch (error) {
      console.error('Failed to save calendar:', error)
      alert(error instanceof Error ? error.message : 'Failed to save calendar')
    } finally {
      setIsSavingCalendar(false)
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEventId || !selectedEvent) {
      setError('No event selected for editing.')
      return
    }

    if (!createForm.title.trim()) {
      setError('Please provide an event title.')
      return
    }

    if (!createForm.startDate || !createForm.endDate) {
      setError('Start and end dates are required.')
      return
    }

    setIsSavingEvent(true)
    setError(null)

    try {
      let start: { date?: string; dateTime?: string; timeZone?: string }
      let end: { date?: string; dateTime?: string; timeZone?: string }

      if (createForm.isAllDay) {
        const startDate = new Date(createForm.startDate + 'T00:00:00')
        const endDate = new Date(createForm.endDate + 'T00:00:00')
        endDate.setDate(endDate.getDate() + 1)

        const formatDate = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        start = { date: formatDate(startDate) }
        end = { date: formatDate(endDate) }
      } else {
        const startDateTime = createDateTime(createForm.startDate, createForm.startTime)
        const endDateTime = createDateTime(createForm.endDate, createForm.endTime)

        if (startDateTime >= endDateTime) {
          setError('End time must be after start time.')
          setIsSavingEvent(false)
          return
        }

        start = { dateTime: startDateTime.toISOString() }
        end = { dateTime: endDateTime.toISOString() }
      }

      // Calculate actual start/end dates for DB
      const startDate = createForm.isAllDay
        ? new Date(createForm.startDate + 'T00:00:00')
        : createDateTime(createForm.startDate, createForm.startTime)
      const endDate = createForm.isAllDay
        ? new Date(createForm.endDate + 'T00:00:00')
        : createDateTime(createForm.endDate, createForm.endTime)

      // Find event in DB by Google event ID if needed
      // For now, try to update via Google API first (backward compatibility)
      // Then also update in DB if event exists there
      let dbEventId: string | null = null
      try {
        // Try to find event in DB by Google event ID
        const findResponse = await fetch(`/api/events?calendarIds=${createForm.calendarId}&timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}`)
        if (findResponse.ok) {
          const findData = await findResponse.json()
          const foundEvent = findData.events?.find((e: any) => e.googleEventId === editingEventId)
          if (foundEvent) {
            dbEventId = foundEvent.id
          }
        }
      } catch (error) {
        console.error('Failed to find event in DB:', error)
      }

      // Update via Google API (existing flow - preserve backward compatibility)
      const googleResponse = await fetch('/api/google/calendar/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: createForm.calendarId,
          eventId: editingEventId,
          summary: createForm.title,
          description: createForm.description || undefined,
          location: createForm.location || undefined,
          start,
          end,
        }),
      })

      const googleData = await googleResponse.json()
      if (!googleResponse.ok || !googleData.success) {
        throw new Error(googleData.error || 'Failed to update event.')
      }

      // Also update in DB if we found the event
      if (dbEventId) {
        try {
          await fetch(`/api/events/${dbEventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: createForm.title,
              description: createForm.description || undefined,
              location: createForm.location || undefined,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              allDay: createForm.isAllDay,
              syncToGoogle: false, // Already synced above
            }),
          })
        } catch (error) {
          console.error('Failed to update event in DB:', error)
          // Don't fail the whole operation if DB update fails
        }
      }

      setIsEditingEvent(false)
      setEditingEventId(null)
      setCreateForm(INITIAL_CREATE_EVENT_STATE)
      setIsEventModalOpen(false)
      setSelectedEvent(null)
      await fetchEvents(true)
    } catch (err) {
      console.error('Failed to update calendar event:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error while updating event.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!createForm.title.trim()) {
      setError('Please provide an event title.')
      return
    }

    if (!createForm.startDate || !createForm.endDate) {
      setError('Start and end dates are required.')
      return
    }

    setIsSavingEvent(true)
    setError(null)

    try {
      let start: { date?: string; dateTime?: string; timeZone?: string }
      let end: { date?: string; dateTime?: string; timeZone?: string }

      if (createForm.isAllDay) {
        // For all-day events, use date format (YYYY-MM-DD)
        // Google Calendar expects the end date to be exclusive (day after the last day)
        const startDate = new Date(createForm.startDate + 'T00:00:00')
        const endDate = new Date(createForm.endDate + 'T00:00:00')
        endDate.setDate(endDate.getDate() + 1) // Add one day for exclusive end date

        const formatDate = (date: Date) => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        start = { date: formatDate(startDate) }
        end = { date: formatDate(endDate) }
      } else {
        // For timed events, use dateTime format
        const startDateTime = createDateTime(createForm.startDate, createForm.startTime)
        const endDateTime = createDateTime(createForm.endDate, createForm.endTime)

        if (startDateTime >= endDateTime) {
          setError('End time must be after start time.')
          setIsSavingEvent(false)
          return
        }

        start = { dateTime: startDateTime.toISOString() }
        end = { dateTime: endDateTime.toISOString() }
      }

      // Calculate actual start/end dates for DB
      const startDate = createForm.isAllDay
        ? new Date(createForm.startDate + 'T00:00:00')
        : createDateTime(createForm.startDate, createForm.startTime)
      const endDate = createForm.isAllDay
        ? new Date(createForm.endDate + 'T00:00:00')
        : createDateTime(createForm.endDate, createForm.endTime)

      // Build recurrence rule if recurring
      let recurrenceRule: RecurrenceRule | undefined
      let rruleString: string | undefined
      
      if (createForm.isRecurring && createForm.recurrenceFrequency) {
        recurrenceRule = {
          frequency: createForm.recurrenceFrequency as RecurrenceRule['frequency'],
          interval: createForm.recurrenceInterval,
          count: createForm.recurrenceCount,
          until: createForm.recurrenceUntil ? new Date(createForm.recurrenceUntil) : undefined,
          byDay: createForm.recurrenceByDay.length > 0 ? createForm.recurrenceByDay : undefined,
        }
        rruleString = generateRRULE(recurrenceRule)
      }

      // Use new API route that saves to DB and optionally syncs to Google
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: createForm.calendarId, // Can be Google calendar ID or DB ID
          title: createForm.title,
          description: createForm.description || undefined,
          location: createForm.location || undefined,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay: createForm.isAllDay,
          syncToGoogle: createForm.syncToGoogle, // Use form value
          crmContactId: createForm.crmContactId || undefined,
          crmDealId: createForm.crmDealId || undefined,
          crmTaskId: createForm.crmTaskId || undefined,
          attendees: createForm.attendees.length > 0 ? createForm.attendees : undefined,
          isRecurring: createForm.isRecurring,
          recurrenceRule: recurrenceRule,
          rrule: rruleString,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create event.')
      }

      setIsCreateModalOpen(false)
      setCreateForm(INITIAL_CREATE_EVENT_STATE)
      await fetchEvents(true)
    } catch (err) {
      console.error('Failed to create calendar event:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error while creating event.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  const segmentedEvents = useMemo(() => {
    const eventsByDate = new Map<string, NormalizedEvent[]>()
    events.forEach((event) => {
      const key = event.start.toDateString()
      const existing = eventsByDate.get(key) || []
      existing.push(event)
      eventsByDate.set(key, existing)
    })

    // Sort events within each day by start time
    return new Map(
      Array.from(eventsByDate.entries()).map(([key, dayEvents]) => {
        const sorted = dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
        return [key, sorted]
      })
    )
  }, [events])

  const selectedDateEvents = useMemo(() => {
    const key = selectedDate.toDateString()
    return segmentedEvents.get(key) || []
  }, [segmentedEvents, selectedDate])

  const calendarCells = useMemo(() => {
    return buildCalendarGrid(currentDate, view)
  }, [currentDate, view])

  return (
    <>
    <Sidebar>
      <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
        <div
          style={{
            width: '100%',
            maxWidth: '100%',
            padding: '32px 48px 64px 48px',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(2.5),
            boxSizing: 'border-box',
          }}
        >
          {/* Page Header */}
          <div style={{ ...headerCard, padding: spacing(3) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
              <div
                style={{
                  width: spacing(5),
                  height: spacing(5),
                  borderRadius: spacing(1.5),
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                <CalendarIcon style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#ffffff' }}>Calendar</h1>
                <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                  Stay on top of showings, closings, and follow-ups synced with Google Calendar.
                </p>
              </div>
            </div>
          </div>

          {/* Calendar Controls Card */}
          <div style={{ ...card, padding: spacing(3), display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing(2) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
              <button
                type="button"
                {...getButtonPressHandlers('calendar-today')}
                onClick={handleToday}
                style={getButtonPressStyle(
                  'calendar-today',
                  {
                    padding: `${spacing(1)} ${spacing(2)}`,
                    borderRadius: spacing(0.75),
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.surface,
                    color: text.primary.color,
                    fontSize: '13px',
                    cursor: 'pointer',
                  },
                  colors.surface,
                  colors.cardHover
                )}
              >
                Today
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(0.5) }}>
                <button
                  type="button"
                  {...getButtonPressHandlers('calendar-prev')}
                  onClick={handlePrev}
                  style={getButtonPressStyle(
                    'calendar-prev',
                    {
                      width: spacing(4),
                      height: spacing(4),
                      borderRadius: spacing(0.75),
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    },
                    colors.surface,
                    colors.cardHover
                  )}
                >
                  <ChevronLeft style={{ width: '18px', height: '18px', color: text.secondary.color }} />
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('calendar-next')}
                  onClick={handleNext}
                  style={getButtonPressStyle(
                    'calendar-next',
                    {
                      width: spacing(4),
                      height: spacing(4),
                      borderRadius: spacing(0.75),
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    },
                    colors.surface,
                    colors.cardHover
                  )}
                >
                  <ChevronRight style={{ width: '18px', height: '18px', color: text.secondary.color }} />
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text.primary.color, paddingLeft: spacing(1) }}>
                {formatViewHeader(currentDate, view)}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  id="calendar-picker-toggle"
                  {...getButtonPressHandlers('calendar-picker-toggle')}
                  onClick={() => setShowCalendarPicker((prev) => !prev)}
                  style={getButtonPressStyle(
                    'calendar-picker-toggle',
                    {
                      padding: `${spacing(1)} ${spacing(2)}`,
                      borderRadius: spacing(0.75),
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      color: text.secondary.color,
                    },
                    colors.surface,
                    colors.cardHover
                  )}
                >
                  <CalendarIcon style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '12px', color: text.tertiary.color }}>
                    {selectedCalendars.length === 0 ? 'None' : `${selectedCalendars.length} selected`}
                  </span>
                </button>
                  {showCalendarPicker && (
                    <div
                      id="calendar-picker-popover"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '260px',
                        maxHeight: '320px',
                        overflowY: 'auto',
                        borderRadius: spacing(1),
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.18)',
                        padding: spacing(1.5),
                        display: 'flex',
                        flexDirection: 'column',
                        gap: spacing(1),
                        zIndex: 40,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(0.5) }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: text.primary.color }}>
                          Visible calendars
                        </p>
                        <button
                          type="button"
                          {...getButtonPressHandlers('calendar-select-all')}
                          onClick={() => setSelectedCalendars(calendars.map((calendar) => calendar.id))}
                          style={getButtonPressStyle(
                            'calendar-select-all',
                            {
                              border: 'none',
                              background: 'transparent',
                              color: colors.primary,
                              fontSize: '12px',
                              cursor: 'pointer',
                            },
                            'transparent',
                            colors.cardHover
                          )}
                        >
                          Select all
                        </button>
                      </div>

                      {calendars.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '12px', color: text.tertiary.color }}>
                          No calendars available. Connect Google Calendar from settings.
                        </p>
                      ) : (
                        calendars.map((calendar) => {
                          const checked = selectedCalendars.includes(calendar.id)
                          const isCRMCalendar = calendar.type === 'crm' || (!calendar.googleCalendarId && calendar.id)
                          return (
                            <div
                              key={calendar.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing(1),
                                padding: spacing(0.75),
                                borderRadius: spacing(0.75),
                                backgroundColor: checked ? colors.cardHover : 'transparent',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: spacing(1),
                                  flex: 1,
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  color: text.primary.color,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    setSelectedCalendars((prev) => {
                                      if (e.target.checked) {
                                        return Array.from(new Set([...prev, calendar.id]))
                                      }
                                      return prev.filter((id) => id !== calendar.id)
                                    })
                                  }}
                                />
                                <span
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: calendar.backgroundColor || calendar.color || '#2563eb',
                                    flexShrink: 0,
                                  }}
                                />
                                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {calendar.summary || calendar.name}
                                  {calendar.primary && (
                                    <span style={{ marginLeft: spacing(0.5), fontSize: '11px', color: colors.primary }}>
                                      (Primary)
                                    </span>
                                  )}
                                  {isCRMCalendar && (
                                    <span style={{ marginLeft: spacing(0.5), fontSize: '11px', color: text.tertiary.color }}>
                                      (CRM)
                                    </span>
                                  )}
                                </span>
                              </label>
                              {isCRMCalendar && (
                                <div style={{ display: 'flex', gap: spacing(0.5) }}>
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      setSharingCalendar({
                                        id: calendar.id,
                                        name: calendar.summary || calendar.name || '',
                                      })
                                      setIsLoadingShares(true)
                                      try {
                                        const response = await fetch(`/api/calendar/${calendar.id}/share`)
                                        if (response.ok) {
                                          const data = await response.json()
                                          setCalendarShares(data.shares || [])
                                        }
                                      } catch (error) {
                                        console.error('Failed to load shares:', error)
                                      } finally {
                                        setIsLoadingShares(false)
                                      }
                                    }}
                                    style={{
                                      padding: spacing(0.5),
                                      border: 'none',
                                      background: 'transparent',
                                      color: text.secondary.color,
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                    }}
                                    title="Share calendar"
                                  >
                                    <Share2 style={{ width: '14px', height: '14px' }} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setEditingCalendar({
                                        id: calendar.id,
                                        name: calendar.summary || calendar.name || '',
                                        color: calendar.backgroundColor || calendar.color || '#4285f4',
                                      })
                                      setNewCalendarName(calendar.summary || calendar.name || '')
                                      setNewCalendarColor(calendar.backgroundColor || calendar.color || '#4285f4')
                                      setShowCreateCalendarModal(true)
                                    }}
                                    style={{
                                      padding: spacing(0.5),
                                      border: 'none',
                                      background: 'transparent',
                                      color: text.secondary.color,
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                    }}
                                    title="Edit calendar"
                                  >
                                    <Edit style={{ width: '14px', height: '14px' }} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async (e) => {
                                      e.stopPropagation()
                                      if (confirm(`Delete calendar "${calendar.summary || calendar.name}"? This will also delete all events in this calendar.`)) {
                                        try {
                                          const response = await fetch(`/api/calendar/${calendar.id}?userId=current`, {
                                            method: 'DELETE',
                                          })
                                          if (response.ok) {
                                            await loadCalendars()
                                            await fetchEvents(true)
                                          } else {
                                            const data = await response.json()
                                            alert(data.error || 'Failed to delete calendar')
                                          }
                                        } catch (error) {
                                          console.error('Failed to delete calendar:', error)
                                          alert('Failed to delete calendar')
                                        }
                                      }
                                    }}
                                    style={{
                                      padding: spacing(0.5),
                                      border: 'none',
                                      background: 'transparent',
                                      color: colors.error || '#ef4444',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                    }}
                                    title="Delete calendar"
                                  >
                                    <X style={{ width: '14px', height: '14px' }} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}

                      <div style={{ marginTop: spacing(1), paddingTop: spacing(1), borderTop: `1px solid ${colors.border}` }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCalendar(null)
                            setNewCalendarName('')
                            setNewCalendarColor('#4285f4')
                            setShowCreateCalendarModal(true)
                          }}
                          style={{
                            width: '100%',
                            padding: `${spacing(0.75)} ${spacing(1.5)}`,
                            borderRadius: spacing(0.75),
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.primary,
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing(0.5),
                          }}
                          {...getButtonPressHandlers('create-calendar')}
                        >
                          <Plus style={{ width: '16px', height: '16px' }} />
                          Create CRM Calendar
                        </button>
                      </div>

                      <button
                        type="button"
                        {...getButtonPressHandlers('calendar-picker-close')}
                        onClick={() => setShowCalendarPicker(false)}
                        style={getButtonPressStyle(
                          'calendar-picker-close',
                          {
                            marginTop: spacing(1),
                            padding: `${spacing(0.75)} ${spacing(2)}`,
                            borderRadius: spacing(0.75),
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.surface,
                            color: text.secondary.color,
                            fontSize: '12px',
                            cursor: 'pointer',
                          },
                          colors.surface,
                          colors.cardHover
                        )}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: spacing(0.5), backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: spacing(0.75), border: `1px solid rgba(255,255,255,0.2)`, padding: spacing(0.5) }}>
                  {(['month', 'week', 'day'] as CalendarView[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      {...getButtonPressHandlers(`calendar-view-${option}`)}
                      onClick={() => setView(option)}
                      style={getButtonPressStyle(
                        `calendar-view-${option}`,
                        {
                          padding: `${spacing(0.75)} ${spacing(1.5)}`,
                          borderRadius: spacing(0.5),
                          border: 'none',
                          backgroundColor: view === option ? 'rgba(255,255,255,0.25)' : 'transparent',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: view === option ? 600 : 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        },
                        view === option ? 'rgba(255,255,255,0.25)' : 'transparent',
                        view === option ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  {...getButtonPressHandlers('calendar-new-event')}
                  onClick={handleOpenCreateModal}
                  style={getButtonPressStyle(
                    'calendar-new-event',
                    {
                      padding: `${spacing(0.75)} ${spacing(1.5)}`,
                      borderRadius: spacing(0.75),
                      border: 'none',
                      backgroundColor: '#ffffff',
                      color: colors.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(0.75),
                      fontSize: '13px',
                      fontWeight: 600,
                    },
                    '#ffffff',
                    'rgba(255,255,255,0.9)'
                  )}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  New Event
                </button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {requiresAuth && (
            <div style={{ ...cardWithLeftBorder(colors.primary), padding: spacing(2) }}>
              <p style={{ margin: 0, fontSize: '14px', color: text.primary.color }}>
                Connect your Google account to sync calendar events. Visit the Google settings page to authorize access.
              </p>
            </div>
          )}
          {error && !requiresAuth && (
            <div style={{ ...cardWithLeftBorder(colors.error), padding: spacing(2) }}>
              <p style={{ margin: 0, fontSize: '14px', color: colors.error }}>
                {error}
              </p>
            </div>
          )}

          {/* Main Calendar Layout with Mini Calendar Sidebar */}
          <div style={{ display: 'flex', gap: spacing(2), alignItems: 'flex-start', width: '100%' }}>
            {/* Mini Calendar Sidebar */}
            <div style={{ ...card, padding: spacing(3), width: '280px', flexShrink: 0, position: 'sticky', top: spacing(2) }}>
              <div style={{ marginBottom: spacing(2) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1.5) }}>
                  <button
                    type="button"
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setCurrentDate(newDate)
                    }}
                    style={{
                      padding: spacing(0.5),
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: text.secondary.color,
                      borderRadius: spacing(0.5),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <ChevronLeft style={{ width: '18px', height: '18px' }} />
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: text.primary.color }}>
                    {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setCurrentDate(newDate)
                    }}
                    style={{
                      padding: spacing(0.5),
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: text.secondary.color,
                      borderRadius: spacing(0.5),
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <ChevronRight style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: spacing(1) }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div
                      key={idx}
                      style={{
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: text.tertiary.color,
                        padding: spacing(0.5),
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {(() => {
                    const year = currentDate.getFullYear()
                    const month = currentDate.getMonth()
                    const firstDay = new Date(year, month, 1)
                    const lastDay = new Date(year, month + 1, 0)
                    const firstDayOfWeek = firstDay.getDay()
                    const daysInMonth = lastDay.getDate()
                    const today = new Date()
                    const cells: JSX.Element[] = []
                    
                    // Previous month days
                    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                      const date = new Date(year, month, -i)
                      cells.push(
                        <button
                          key={`prev-${i}`}
                          type="button"
                          onClick={() => {
                            setCurrentDate(date)
                            setSelectedDate(date)
                            setView('month')
                          }}
                          style={{
                            aspectRatio: '1',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: text.tertiary.color,
                            borderRadius: spacing(0.5),
                            padding: spacing(0.5),
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {date.getDate()}
                        </button>
                      )
                    }
                    
                    // Current month days
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(year, month, day)
                      const isToday = date.toDateString() === today.toDateString()
                      const isSelected = date.toDateString() === selectedDate.toDateString()
                      const hasEvents = events.some((e) => {
                        const eventDate = new Date(e.start)
                        return eventDate.toDateString() === date.toDateString()
                      })
                      
                      cells.push(
                        <button
                          key={`day-${day}`}
                          type="button"
                          onClick={() => {
                            setCurrentDate(date)
                            setSelectedDate(date)
                            setView('month')
                          }}
                          style={{
                            aspectRatio: '1',
                            border: 'none',
                            background: isSelected ? colors.primary : isToday ? colors.primaryLight || 'rgba(104, 159, 56, 0.15)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: isToday ? 700 : isSelected ? 600 : 400,
                            color: isSelected ? '#ffffff' : isToday ? colors.primary : text.primary.color,
                            borderRadius: spacing(0.5),
                            padding: spacing(0.5),
                            position: 'relative',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected && !isToday) {
                              e.currentTarget.style.backgroundColor = colors.cardHover
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected && !isToday) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          {day}
                          {hasEvents && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '2px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: isSelected ? '#ffffff' : colors.primary,
                              }}
                            />
                          )}
                        </button>
                      )
                    }
                    
                    // Next month days
                    const totalCells = 42
                    const remainingCells = totalCells - cells.length
                    for (let i = 1; i <= remainingCells; i++) {
                      const date = new Date(year, month + 1, i)
                      cells.push(
                        <button
                          key={`next-${i}`}
                          type="button"
                          onClick={() => {
                            setCurrentDate(date)
                            setSelectedDate(date)
                            setView('month')
                          }}
                          style={{
                            aspectRatio: '1',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: text.tertiary.color,
                            borderRadius: spacing(0.5),
                            padding: spacing(0.5),
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {date.getDate()}
                        </button>
                      )
                    }
                    
                    return cells
                  })()}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div style={{ marginTop: spacing(2), paddingTop: spacing(2), borderTop: `1px solid ${colors.border}` }}>
                <button
                  type="button"
                  onClick={handleToday}
                  style={{
                    width: '100%',
                    padding: `${spacing(0.75)} ${spacing(1.5)}`,
                    borderRadius: spacing(0.75),
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.surface,
                    color: text.primary.color,
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    marginBottom: spacing(1),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.surface
                  }}
                >
                  Go to Today
                </button>
              </div>

              {/* Day Details - Event Card */}
              <div style={{ marginTop: spacing(2), paddingTop: spacing(2), borderTop: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1.5), gap: spacing(1) }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: text.primary.color }}>
                      {formatDateHeading(selectedDate)}
                    </h3>
                    <p style={{ margin: `${spacing(0.25)} 0 0 0`, fontSize: '11px', color: text.tertiary.color }}>
                      {selectedDateEvents.length} event{selectedDateEvents.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <button
                    type="button"
                    {...getButtonPressHandlers('calendar-add-selected')}
                    onClick={handleOpenCreateModal}
                    style={getButtonPressStyle(
                      'calendar-add-selected',
                      {
                        padding: `${spacing(0.5)} ${spacing(1)}`,
                        borderRadius: spacing(0.5),
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      },
                      colors.surface,
                      colors.cardHover
                    )}
                  >
                    Add Event
                  </button>
                </div>

                {selectedDateEvents.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: text.tertiary.color }}>No events on this day.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={async () => {
                          setSelectedEvent(event)
                          setIsEventModalOpen(true)
                          
                          // Load linked entity details
                          if (event.crmContactId) {
                            try {
                              const contactResponse = await fetch(`/api/contacts/${event.crmContactId}`)
                              if (contactResponse.ok) {
                                const contact = await contactResponse.json()
                                setLinkedContact({
                                  id: contact.id,
                                  name: contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact',
                                })
                              }
                            } catch (error) {
                              console.error('Failed to load linked contact:', error)
                            }
                          } else {
                            setLinkedContact(null)
                          }
                          
                          if (event.crmDealId) {
                            try {
                              const listingResponse = await fetch(`/api/listings/${event.crmDealId}`)
                              if (listingResponse.ok) {
                                const listingData = await listingResponse.json()
                                const listing = listingData.listing || listingData
                                setLinkedListing({
                                  id: listing.id,
                                  title: listing.title || 'Untitled Listing',
                                })
                              }
                            } catch (error) {
                              console.error('Failed to load linked listing:', error)
                            }
                          } else {
                            setLinkedListing(null)
                          }
                          
                          // Load linked task
                          if (event.crmTaskId) {
                            // First try to find in loaded tasks
                            const task = tasks.find((t) => t.id === event.crmTaskId)
                            if (task) {
                              setLinkedTask(task)
                            } else {
                              // If not found, try to fetch from listings
                              try {
                                const listingsResponse = await fetch('/api/listings')
                                if (listingsResponse.ok) {
                                  const listingsData = await listingsResponse.json()
                                  const listings = listingsData.listings || listingsData
                                  for (const listing of listings) {
                                    if (listing.stageInstances) {
                                      for (const stage of listing.stageInstances) {
                                        if (stage.tasks) {
                                          const foundTask = stage.tasks.find((t: any) => t.id === event.crmTaskId)
                                          if (foundTask) {
                                            setLinkedTask({
                                              id: foundTask.id,
                                              name: foundTask.name,
                                              listingId: listing.id,
                                              listingTitle: listing.title || 'Untitled Listing',
                                            })
                                            break
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              } catch (error) {
                                console.error('Failed to load linked task:', error)
                              }
                            }
                          } else {
                            setLinkedTask(null)
                          }
                          
                          // Load attendees
                          if (event.id && !event.id.includes('_')) {
                            // Only load for non-instance events (instances share the same attendees)
                            try {
                              const eventResponse = await fetch(`/api/events/${event.id}`)
                              if (eventResponse.ok) {
                                const eventData = await eventResponse.json()
                                if (eventData.event?.attendees) {
                                  setEventAttendees(eventData.event.attendees.map((a: any) => ({
                                    email: a.email,
                                    displayName: a.displayName,
                                    responseStatus: a.responseStatus,
                                    isOrganizer: a.isOrganizer,
                                  })))
                                } else {
                                  setEventAttendees([])
                                }
                              }
                            } catch (error) {
                              console.error('Failed to load attendees:', error)
                              setEventAttendees([])
                            }
                          } else {
                            setEventAttendees([])
                          }
                        }}
                        style={{
                          padding: spacing(1),
                          borderRadius: spacing(0.75),
                          backgroundColor: colors.cardHover,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: spacing(0.25),
                          borderLeft: `3px solid ${event.calendarColor || colors.primary}`,
                          cursor: event.htmlLink ? 'pointer' : 'default',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (event.htmlLink) {
                            e.currentTarget.style.backgroundColor = colors.borderHover || colors.card
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (event.htmlLink) {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: text.primary.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.title}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: text.secondary.color }}>
                          {event.isAllDay ? 'All day' : `${event.startLabel} – ${event.endLabel}`}
                        </p>
                        {event.location && (
                          <p style={{ margin: 0, fontSize: '11px', color: text.secondary.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.location}
                          </p>
                        )}
                        {event.htmlLink && (
                          <span style={{ marginTop: spacing(0.25), fontSize: '11px', fontWeight: 500, color: colors.primary }}>
                            Open in Google →
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Main Calendar Content */}
            <div style={{ ...card, padding: spacing(3), minHeight: '600px', display: 'flex', flexDirection: 'column', gap: spacing(2), flex: 1 }}>
            {view === 'month' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: '4px',
                  marginBottom: spacing(1),
                }}
              >
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                  <div
                    key={dayName}
                    style={{
                      padding: spacing(1),
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: text.secondary.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {dayName}
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                ...gridTemplateForView(view),
                gap: view === 'month' ? '4px' : spacing(1),
                flex: 1,
              }}
            >
              {renderCalendarGrid({
                view,
                calendarCells,
                eventsByDate: segmentedEvents,
                selectedDate,
                setSelectedDate,
                pressedButtons,
                getButtonPressHandlers,
                getButtonPressStyle,
                colors,
                text,
                spacing,
                setSelectedEvent,
                setIsEventModalOpen,
              })}
            </div>

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing(1.5), padding: spacing(2), borderRadius: spacing(1), backgroundColor: colors.surface }}>
                <Loader2 style={{ width: '18px', height: '18px', color: colors.primary, animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, fontSize: '13px', color: text.secondary.color }}>
                  Loading events…
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>

    {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: spacing(2),
          }}
          onClick={() => {
            if (!isSavingEvent) {
              setIsCreateModalOpen(false)
            }
          }}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: spacing(3),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(2),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text.primary.color }}>Create Event</h2>
              <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '13px', color: text.secondary.color }}>
                Add a new appointment to your calendar.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Title
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Property showing, closing, follow-up..."
                  style={inputStyle(colors, text, spacing)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Calendar
                </label>
                <select
                  value={createForm.calendarId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, calendarId: e.target.value }))}
                  style={inputStyle(colors, text, spacing)}
                >
                  {calendars.length === 0 ? (
                    <option value="primary">Primary Calendar</option>
                  ) : (
                    calendars.map((calendar) => (
                      <option key={calendar.id} value={calendar.id}>
                        {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                <input
                  type="checkbox"
                  id="all-day-checkbox"
                  checked={createForm.isAllDay}
                  onChange={(e) => {
                    setCreateForm((prev) => {
                      const newForm = { ...prev, isAllDay: e.target.checked }
                      // When enabling all-day, set end date to start date if they're different
                      if (e.target.checked && prev.startDate && prev.endDate !== prev.startDate) {
                        newForm.endDate = prev.startDate
                      }
                      return newForm
                    })
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: colors.primary,
                  }}
                />
                <label
                  htmlFor="all-day-checkbox"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: text.primary.color,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  All Day
                </label>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: createForm.isAllDay ? '1fr 1fr' : '1fr 1fr',
                  gap: spacing(1),
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => {
                      setCreateForm((prev) => {
                        const newForm = { ...prev, startDate: e.target.value }
                        // If all-day and end date is before new start date, update end date
                        if (prev.isAllDay && prev.endDate && e.target.value > prev.endDate) {
                          newForm.endDate = e.target.value
                        }
                        return newForm
                      })
                    }}
                    style={inputStyle(colors, text, spacing)}
                  />
                </div>
                {!createForm.isAllDay && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={createForm.startTime}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      style={inputStyle(colors, text, spacing)}
                    />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    min={createForm.startDate}
                    style={inputStyle(colors, text, spacing)}
                  />
                </div>
                {!createForm.isAllDay && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={createForm.endTime}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, endTime: e.target.value }))}
                      style={inputStyle(colors, text, spacing)}
                    />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Location
                </label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="123 Main St, Palm Desert"
                  style={inputStyle(colors, text, spacing)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Include notes or agenda items for this appointment."
                  style={{ ...inputStyle(colors, text, spacing), resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), padding: spacing(1.5), backgroundColor: colors.surface, borderRadius: spacing(1), border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: text.tertiary.color }}>
                  Link to CRM
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    Contact
                  </label>
                  <select
                    value={createForm.crmContactId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, crmContactId: e.target.value }))}
                    style={inputStyle(colors, text, spacing)}
                  >
                    <option value="">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    Listing/Deal
                  </label>
                  <select
                    value={createForm.crmDealId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, crmDealId: e.target.value }))}
                    style={inputStyle(colors, text, spacing)}
                  >
                    <option value="">None</option>
                    {listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    Task
                  </label>
                  <select
                    value={createForm.crmTaskId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, crmTaskId: e.target.value }))}
                    style={inputStyle(colors, text, spacing)}
                  >
                    <option value="">None</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name} ({task.listingTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), padding: spacing(1.5), backgroundColor: colors.surface, borderRadius: spacing(1), border: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Attendees
                </div>
                
                {createForm.attendees.map((attendee, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
                      <input
                        type="email"
                        value={attendee.email}
                        onChange={(e) => {
                          const newAttendees = [...createForm.attendees]
                          newAttendees[index] = { ...newAttendees[index], email: e.target.value }
                          setCreateForm((prev) => ({ ...prev, attendees: newAttendees }))
                        }}
                        placeholder="email@example.com"
                        style={{ ...inputStyle(colors, text, spacing), fontSize: '13px' }}
                      />
                      {attendee.displayName && (
                        <input
                          type="text"
                          value={attendee.displayName}
                          onChange={(e) => {
                            const newAttendees = [...createForm.attendees]
                            newAttendees[index] = { ...newAttendees[index], displayName: e.target.value }
                            setCreateForm((prev) => ({ ...prev, attendees: newAttendees }))
                          }}
                          placeholder="Display name (optional)"
                          style={{ ...inputStyle(colors, text, spacing), fontSize: '12px' }}
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateForm((prev) => ({
                          ...prev,
                          attendees: prev.attendees.filter((_, i) => i !== index),
                        }))
                      }}
                      style={{
                        padding: spacing(0.75),
                        backgroundColor: colors.error || '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: spacing(0.5),
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px',
                      }}
                      {...getButtonPressHandlers(`remove-attendee-${index}`)}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))}
                
                <div style={{ display: 'flex', gap: spacing(1) }}>
                  <select
                    value=""
                    onChange={(e) => {
                      const contactId = e.target.value
                      if (contactId) {
                        const contact = googleContacts.find((c) => c.id === contactId)
                        if (contact) {
                          const email = contact.email1 || contact.email2
                          const name = contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || undefined
                          if (email) {
                            setCreateForm((prev) => ({
                              ...prev,
                              attendees: [...prev.attendees, { email, displayName: name }],
                            }))
                          }
                        }
                        e.target.value = ''
                      }
                    }}
                    style={{ ...inputStyle(colors, text, spacing), flex: 1, fontSize: '13px' }}
                  >
                    <option value="">Add from Google Contacts...</option>
                    {googleContacts
                      .filter((c) => c.email1 || c.email2)
                      .map((contact) => {
                        const email = contact.email1 || contact.email2
                        const name = contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || email
                        return (
                          <option key={contact.id} value={contact.id}>
                            {name} ({email})
                          </option>
                        )
                      })}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateForm((prev) => ({
                        ...prev,
                        attendees: [...prev.attendees, { email: '', displayName: undefined }],
                      }))
                    }}
                    style={{
                      padding: `0 ${spacing(1.5)}`,
                      backgroundColor: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: spacing(0.5),
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                    {...getButtonPressHandlers('add-attendee')}
                  >
                    <Plus style={{ width: '16px', height: '16px', marginRight: spacing(0.5) }} />
                    Add
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), padding: spacing(1.5), backgroundColor: colors.surface, borderRadius: spacing(1), border: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                  <input
                    type="checkbox"
                    id="recurring-checkbox"
                    checked={createForm.isRecurring}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, isRecurring: e.target.checked }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: colors.primary,
                    }}
                  />
                  <label
                    htmlFor="recurring-checkbox"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: text.primary.color,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Recurring Event
                  </label>
                </div>

                {createForm.isRecurring && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), paddingLeft: spacing(2) }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing(1) }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          Frequency
                        </label>
                        <select
                          value={createForm.recurrenceFrequency}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, recurrenceFrequency: e.target.value as any }))}
                          style={inputStyle(colors, text, spacing)}
                        >
                          <option value="">Select...</option>
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          Every
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={createForm.recurrenceInterval}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, recurrenceInterval: parseInt(e.target.value) || 1 }))}
                          style={inputStyle(colors, text, spacing)}
                        />
                      </div>
                    </div>

                    {createForm.recurrenceFrequency === 'WEEKLY' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          Days of Week
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(0.75) }}>
                          {[
                            { value: 'MO', label: 'Mon' },
                            { value: 'TU', label: 'Tue' },
                            { value: 'WE', label: 'Wed' },
                            { value: 'TH', label: 'Thu' },
                            { value: 'FR', label: 'Fri' },
                            { value: 'SA', label: 'Sat' },
                            { value: 'SU', label: 'Sun' },
                          ].map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                setCreateForm((prev) => {
                                  const byDay = prev.recurrenceByDay.includes(day.value)
                                    ? prev.recurrenceByDay.filter((d) => d !== day.value)
                                    : [...prev.recurrenceByDay, day.value]
                                  return { ...prev, recurrenceByDay: byDay }
                                })
                              }}
                              style={{
                                padding: `${spacing(0.5)} ${spacing(1)}`,
                                borderRadius: spacing(0.5),
                                border: `1px solid ${colors.border}`,
                                backgroundColor: createForm.recurrenceByDay.includes(day.value) ? colors.primary : colors.surface,
                                color: createForm.recurrenceByDay.includes(day.value) ? '#fff' : text.primary.color,
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: createForm.recurrenceByDay.includes(day.value) ? 600 : 400,
                              }}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing(1) }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          End After (occurrences)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={createForm.recurrenceCount || ''}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, recurrenceCount: e.target.value ? parseInt(e.target.value) : undefined, recurrenceUntil: undefined }))}
                          placeholder="No limit"
                          style={inputStyle(colors, text, spacing)}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={createForm.recurrenceUntil || ''}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, recurrenceUntil: e.target.value || undefined, recurrenceCount: undefined }))}
                          min={createForm.startDate}
                          style={inputStyle(colors, text, spacing)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1), padding: spacing(1.5), backgroundColor: colors.surface, borderRadius: spacing(1), border: `1px solid ${colors.border}` }}>
                <input
                  type="checkbox"
                  id="sync-to-google-checkbox"
                  checked={createForm.syncToGoogle}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, syncToGoogle: e.target.checked }))}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: colors.primary,
                  }}
                />
                <label
                  htmlFor="sync-to-google-checkbox"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: text.primary.color,
                    cursor: 'pointer',
                    userSelect: 'none',
                    flex: 1,
                  }}
                >
                  Sync to Google Calendar
                </label>
                {!createForm.syncToGoogle && (
                  <span style={{ fontSize: '12px', color: text.secondary.color, fontStyle: 'italic' }}>
                    (CRM-only event)
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing(1) }}>
              <button
                type="button"
                {...getButtonPressHandlers('calendar-create-cancel')}
                onClick={() => {
                  if (!isSavingEvent) {
                    setIsCreateModalOpen(false)
                  }
                }}
                disabled={isSavingEvent}
                style={getButtonPressStyle(
                  'calendar-create-cancel',
                  {
                    padding: `${spacing(1)} ${spacing(2)}`,
                    borderRadius: spacing(0.75),
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.surface,
                    color: text.secondary.color,
                    fontSize: '13px',
                    cursor: isSavingEvent ? 'not-allowed' : 'pointer',
                  },
                  colors.surface,
                  colors.cardHover
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                {...getButtonPressHandlers('calendar-create-save')}
                onClick={handleCreateEvent}
                disabled={isSavingEvent}
                style={getButtonPressStyle(
                  'calendar-create-save',
                  {
                    padding: `${spacing(1)} ${spacing(2.5)}`,
                    borderRadius: spacing(0.75),
                    border: 'none',
                    backgroundColor: colors.primary,
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isSavingEvent ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(0.75),
                  },
                  colors.primary,
                  colors.primaryHover
                )}
              >
                {isSavingEvent && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {isEventModalOpen && selectedEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing(2),
            zIndex: 1000,
          }}
          onClick={() => {
            setIsEventModalOpen(false)
            setSelectedEvent(null)
            setLinkedContact(null)
            setLinkedListing(null)
          }}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: '520px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: spacing(3),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(2),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing(2) }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: text.primary.color }}>
                  {isEditingEvent ? 'Edit Event' : selectedEvent.title}
                </h2>
                {!isEditingEvent && selectedEvent.calendarName && (
                  <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '13px', color: text.secondary.color }}>
                    {selectedEvent.calendarName}
                  </p>
                )}
              </div>
              <button
                type="button"
                {...getButtonPressHandlers('calendar-event-close')}
                onClick={() => {
                  if (isEditingEvent) {
                    handleCancelEdit()
                  }
                  setIsEventModalOpen(false)
                  setSelectedEvent(null)
                  setLinkedContact(null)
                  setLinkedListing(null)
                }}
                style={getButtonPressStyle(
                  'calendar-event-close',
                  {
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: spacing(0.5),
                    padding: spacing(0.5),
                    cursor: 'pointer',
                    color: text.tertiary.color,
                  },
                  'transparent',
                  colors.cardHover
                )}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {error && (
              <div style={{ padding: spacing(1), backgroundColor: isDark ? '#7f1d1d' : '#fef2f2', borderRadius: spacing(0.75), border: `1px solid ${colors.error}` }}>
                <p style={{ margin: 0, fontSize: '13px', color: colors.error }}>{error}</p>
              </div>
            )}

            {isEditingEvent ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={createForm.title}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Property showing, closing, follow-up..."
                      style={inputStyle(colors, text, spacing)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                      Calendar
                    </label>
                    <select
                      value={createForm.calendarId}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, calendarId: e.target.value }))}
                      style={inputStyle(colors, text, spacing)}
                    >
                      {calendars.length === 0 ? (
                        <option value="primary">Primary Calendar</option>
                      ) : (
                        calendars.map((calendar) => (
                          <option key={calendar.id} value={calendar.id}>
                            {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                    <input
                      type="checkbox"
                      id="edit-all-day-checkbox"
                      checked={createForm.isAllDay}
                      onChange={(e) => {
                        setCreateForm((prev) => {
                          const newForm = { ...prev, isAllDay: e.target.checked }
                          if (e.target.checked && prev.startDate && prev.endDate !== prev.startDate) {
                            newForm.endDate = prev.startDate
                          }
                          return newForm
                        })
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: colors.primary,
                      }}
                    />
                    <label
                      htmlFor="edit-all-day-checkbox"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: text.primary.color,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      All Day
                    </label>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: createForm.isAllDay ? '1fr 1fr' : '1fr 1fr',
                      gap: spacing(1),
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={createForm.startDate}
                        onChange={(e) => {
                          setCreateForm((prev) => {
                            const newForm = { ...prev, startDate: e.target.value }
                            if (prev.isAllDay && prev.endDate && e.target.value > prev.endDate) {
                              newForm.endDate = e.target.value
                            }
                            return newForm
                          })
                        }}
                        style={inputStyle(colors, text, spacing)}
                      />
                    </div>
                    {!createForm.isAllDay && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={createForm.startTime}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, startTime: e.target.value }))}
                          style={inputStyle(colors, text, spacing)}
                        />
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={createForm.endDate}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}
                        min={createForm.startDate}
                        style={inputStyle(colors, text, spacing)}
                      />
                    </div>
                    {!createForm.isAllDay && (
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                          End Time
                        </label>
                        <input
                          type="time"
                          value={createForm.endTime}
                          onChange={(e) => setCreateForm((prev) => ({ ...prev, endTime: e.target.value }))}
                          style={inputStyle(colors, text, spacing)}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                      Location
                    </label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="123 Main St, Palm Desert"
                      style={inputStyle(colors, text, spacing)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                      Description
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      placeholder="Include notes or agenda items for this appointment."
                      style={{ ...inputStyle(colors, text, spacing), resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing(1), paddingTop: spacing(1), borderTop: `1px solid ${colors.border}` }}>
                  <button
                    type="button"
                    {...getButtonPressHandlers('calendar-edit-cancel')}
                    onClick={handleCancelEdit}
                    disabled={isSavingEvent}
                    style={getButtonPressStyle(
                      'calendar-edit-cancel',
                      {
                        padding: `${spacing(1)} ${spacing(2)}`,
                        borderRadius: spacing(0.75),
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        color: text.secondary.color,
                        fontSize: '13px',
                        cursor: isSavingEvent ? 'not-allowed' : 'pointer',
                      },
                      colors.surface,
                      colors.cardHover
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    {...getButtonPressHandlers('calendar-edit-save')}
                    onClick={handleUpdateEvent}
                    disabled={isSavingEvent}
                    style={getButtonPressStyle(
                      'calendar-edit-save',
                      {
                        padding: `${spacing(1)} ${spacing(2.5)}`,
                        borderRadius: spacing(0.75),
                        border: 'none',
                        backgroundColor: colors.primary,
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: isSavingEvent ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing(0.75),
                      },
                      colors.primary,
                      colors.primaryHover
                    )}
                  >
                    {isSavingEvent && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                    <CalendarIcon style={{ width: '16px', height: '16px', color: text.tertiary.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: text.primary.color }}>
                        {selectedEvent.isAllDay
                          ? 'All Day'
                          : `${selectedEvent.start.toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })} at ${selectedEvent.startLabel} – ${selectedEvent.endLabel}`}
                      </p>
                      {!selectedEvent.isAllDay &&
                        selectedEvent.end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) !==
                          selectedEvent.start.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) && (
                          <p style={{ margin: `${spacing(0.25)} 0 0 0`, fontSize: '12px', color: text.secondary.color }}>
                            Ends {selectedEvent.end.toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })} at {selectedEvent.endLabel}
                          </p>
                        )}
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing(1) }}>
                      <MapPin style={{ width: '16px', height: '16px', color: text.tertiary.color, flexShrink: 0, marginTop: '2px' }} />
                      <p style={{ margin: 0, fontSize: '14px', color: text.primary.color }}>{selectedEvent.location}</p>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div>
                      <p style={{ margin: `0 0 ${spacing(0.5)} 0`, fontSize: '12px', fontWeight: 600, color: text.tertiary.color, textTransform: 'uppercase' }}>
                        Description
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: text.primary.color, whiteSpace: 'pre-wrap' }}>
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}

                  {eventAttendees.length > 0 && (
                    <div style={{ padding: spacing(1.5), backgroundColor: colors.surface, borderRadius: spacing(1), border: `1px solid ${colors.border}` }}>
                      <p style={{ margin: `0 0 ${spacing(1)} 0`, fontSize: '12px', fontWeight: 600, color: text.tertiary.color, textTransform: 'uppercase' }}>
                        Attendees ({eventAttendees.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.75) }}>
                        {eventAttendees.map((attendee, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: spacing(1), fontSize: '14px' }}>
                            <span style={{ color: text.primary.color, fontWeight: attendee.isOrganizer ? 600 : 400 }}>
                              {attendee.displayName || attendee.email}
                            </span>
                            {attendee.isOrganizer && (
                              <span style={{ fontSize: '11px', color: text.tertiary.color, textTransform: 'uppercase' }}>
                                Organizer
                              </span>
                            )}
                            {attendee.responseStatus && attendee.responseStatus !== 'needsAction' && (
                              <span style={{ fontSize: '11px', color: text.secondary.color, textTransform: 'capitalize' }}>
                                ({attendee.responseStatus})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(linkedContact || linkedListing || linkedTask) && (
                    <div style={{ padding: spacing(1.5), backgroundColor: colors.surface, borderRadius: spacing(1), border: `1px solid ${colors.border}` }}>
                      <p style={{ margin: `0 0 ${spacing(1)} 0`, fontSize: '12px', fontWeight: 600, color: text.tertiary.color, textTransform: 'uppercase' }}>
                        Linked to CRM
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
                        {linkedContact && (
                          <a
                            href={`/contacts/${linkedContact.id}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/contacts/${linkedContact.id}`
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1),
                              fontSize: '14px',
                              color: colors.primary,
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none'
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>Contact:</span>
                            <span>{linkedContact.name}</span>
                          </a>
                        )}
                        {linkedListing && (
                          <a
                            href={`/listings/${linkedListing.id}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/listings/${linkedListing.id}`
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1),
                              fontSize: '14px',
                              color: colors.primary,
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none'
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>Listing:</span>
                            <span>{linkedListing.title}</span>
                          </a>
                        )}
                        {linkedTask && (
                          <a
                            href={`/listings/${linkedTask.listingId}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              window.location.href = `/listings/${linkedTask.listingId}`
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1),
                              fontSize: '14px',
                              color: colors.primary,
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none'
                            }}
                          >
                            <span style={{ fontWeight: 500 }}>Task:</span>
                            <span>{linkedTask.name}</span>
                            <span style={{ fontSize: '12px', color: text.secondary.color }}>({linkedTask.listingTitle})</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing(1), paddingTop: spacing(1), borderTop: `1px solid ${colors.border}` }}>
                  <button
                    type="button"
                    {...getButtonPressHandlers('calendar-event-edit')}
                    onClick={handleStartEdit}
                    style={getButtonPressStyle(
                      'calendar-event-edit',
                      {
                        padding: `${spacing(1)} ${spacing(2.5)}`,
                        borderRadius: spacing(0.75),
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.surface,
                        color: text.primary.color,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing(0.75),
                      },
                      colors.surface,
                      colors.cardHover
                    )}
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                    Edit
                  </button>
                  {selectedEvent.htmlLink && (
                    <button
                      type="button"
                      {...getButtonPressHandlers('calendar-event-open-google')}
                      onClick={() => {
                        window.open(selectedEvent.htmlLink, '_blank', 'noopener,noreferrer')
                      }}
                      style={getButtonPressStyle(
                        'calendar-event-open-google',
                        {
                          padding: `${spacing(1)} ${spacing(2.5)}`,
                          borderRadius: spacing(0.75),
                          border: 'none',
                          backgroundColor: colors.primary,
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing(0.75),
                        },
                        colors.primary,
                        colors.primaryHover
                      )}
                    >
                      <CalendarIcon style={{ width: '16px', height: '16px' }} />
                      Open in Google Calendar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {sharingCalendar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: spacing(2),
          }}
          onClick={() => {
            setSharingCalendar(null)
            setCalendarShares([])
            setNewShareUserId('')
            setNewShareRole('viewer')
          }}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: '500px',
              padding: spacing(3),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(2),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text.primary.color }}>
                Share Calendar: {sharingCalendar.name}
              </h2>
              <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '13px', color: text.secondary.color }}>
                Manage who can view or edit this calendar.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Add User
                </label>
                <div style={{ display: 'flex', gap: spacing(1) }}>
                  <input
                    type="text"
                    value={newShareUserId}
                    onChange={(e) => setNewShareUserId(e.target.value)}
                    placeholder="User ID or email"
                    style={{ ...inputStyle(colors, text, spacing), flex: 1 }}
                  />
                  <select
                    value={newShareRole}
                    onChange={(e) => setNewShareRole(e.target.value as 'viewer' | 'editor' | 'owner')}
                    style={inputStyle(colors, text, spacing)}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newShareUserId.trim()) {
                        alert('Please enter a user ID')
                        return
                      }
                      try {
                        const response = await fetch(`/api/calendar/${sharingCalendar.id}/share`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: newShareUserId.trim(),
                            role: newShareRole,
                          }),
                        })
                        if (response.ok) {
                          const data = await response.json()
                          setCalendarShares([...calendarShares, data.share])
                          setNewShareUserId('')
                          setNewShareRole('viewer')
                        } else {
                          const data = await response.json()
                          alert(data.error || 'Failed to share calendar')
                        }
                      } catch (error) {
                        console.error('Failed to share calendar:', error)
                        alert('Failed to share calendar')
                      }
                    }}
                    style={{
                      padding: `${spacing(0.75)} ${spacing(2)}`,
                      borderRadius: spacing(0.75),
                      border: 'none',
                      backgroundColor: colors.primary,
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(0.5),
                    }}
                  >
                    <UserPlus style={{ width: '16px', height: '16px' }} />
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Shared With ({calendarShares.length})
                </label>
                {isLoadingShares ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: spacing(2) }}>
                    <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : calendarShares.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: text.tertiary.color, padding: spacing(1) }}>
                    No shares yet. Add a user above to share this calendar.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
                    {calendarShares.map((share) => (
                      <div
                        key={share.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: spacing(1),
                          borderRadius: spacing(0.75),
                          backgroundColor: colors.cardHover,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: text.primary.color }}>
                            {share.userId}
                          </div>
                          <div style={{ fontSize: '11px', color: text.secondary.color, textTransform: 'capitalize' }}>
                            {share.role}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Remove access for ${share.userId}?`)) {
                              try {
                                const response = await fetch(`/api/calendar/${sharingCalendar.id}/share?userId=${encodeURIComponent(share.userId)}`, {
                                  method: 'DELETE',
                                })
                                if (response.ok) {
                                  setCalendarShares(calendarShares.filter((s) => s.id !== share.id))
                                } else {
                                  const data = await response.json()
                                  alert(data.error || 'Failed to remove share')
                                }
                              } catch (error) {
                                console.error('Failed to remove share:', error)
                                alert('Failed to remove share')
                              }
                            }
                          }}
                          style={{
                            padding: spacing(0.5),
                            border: 'none',
                            background: 'transparent',
                            color: colors.error || '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                          title="Remove access"
                        >
                          <X style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing(1), paddingTop: spacing(1), borderTop: `1px solid ${colors.border}` }}>
              <button
                type="button"
                onClick={() => {
                  setSharingCalendar(null)
                  setCalendarShares([])
                  setNewShareUserId('')
                  setNewShareRole('viewer')
                }}
                style={{
                  padding: `${spacing(1)} ${spacing(2.5)}`,
                  borderRadius: spacing(0.75),
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: text.primary.color,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateCalendarModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: spacing(2),
          }}
          onClick={() => {
            if (!isSavingCalendar) {
              setShowCreateCalendarModal(false)
              setEditingCalendar(null)
              setNewCalendarName('')
              setNewCalendarColor('#4285f4')
            }
          }}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: '400px',
              padding: spacing(3),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(2),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text.primary.color }}>
                {editingCalendar ? 'Edit Calendar' : 'Create CRM Calendar'}
              </h2>
              <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '13px', color: text.secondary.color }}>
                {editingCalendar ? 'Update calendar name and color.' : 'Create a new calendar for CRM-only events.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Calendar Name
                </label>
                <input
                  type="text"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="My CRM Calendar"
                  style={inputStyle(colors, text, spacing)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                  Color
                </label>
                <div style={{ display: 'flex', gap: spacing(1), alignItems: 'center' }}>
                  <input
                    type="color"
                    value={newCalendarColor}
                    onChange={(e) => setNewCalendarColor(e.target.value)}
                    style={{
                      width: '60px',
                      height: '40px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(0.5),
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={newCalendarColor}
                    onChange={(e) => setNewCalendarColor(e.target.value)}
                    placeholder="#4285f4"
                    style={{ ...inputStyle(colors, text, spacing), flex: 1, fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing(1), paddingTop: spacing(1), borderTop: `1px solid ${colors.border}` }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateCalendarModal(false)
                  setEditingCalendar(null)
                  setNewCalendarName('')
                  setNewCalendarColor('#4285f4')
                }}
                disabled={isSavingCalendar}
                style={{
                  padding: `${spacing(1)} ${spacing(2.5)}`,
                  borderRadius: spacing(0.75),
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: text.primary.color,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isSavingCalendar ? 'not-allowed' : 'pointer',
                  opacity: isSavingCalendar ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCalendar}
                disabled={isSavingCalendar || !newCalendarName.trim()}
                style={{
                  padding: `${spacing(1)} ${spacing(2.5)}`,
                  borderRadius: spacing(0.75),
                  border: 'none',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isSavingCalendar || !newCalendarName.trim() ? 'not-allowed' : 'pointer',
                  opacity: isSavingCalendar || !newCalendarName.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(0.75),
                }}
              >
                {isSavingCalendar && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                {editingCalendar ? 'Save Changes' : 'Create Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function normalizeEvent(event: ApiCalendarEvent, calendar?: GoogleCalendar): NormalizedEvent | null {
  const startDate = parseEventDate(event.start)
  const endDate = parseEventDate(event.end)
  if (!startDate || !endDate) return null
  const isAllDay = !!event.start?.date && !event.start?.dateTime

  return {
    id: event.id || `${startDate.getTime()}-${endDate.getTime()}`,
    title: event.summary || 'Untitled Event',
    description: event.description || undefined,
    location: event.location || undefined,
    start: startDate,
    end: endDate,
    isAllDay,
    startLabel: formatTime(startDate),
    endLabel: formatTime(endDate),
    htmlLink: event.htmlLink || undefined,
    calendarId: calendar?.id,
    calendarName: calendar?.summary,
    calendarColor: calendar?.backgroundColor || undefined,
  }
}

function parseEventDate(dateInput: ApiCalendarEvent['start'] | ApiCalendarEvent['end']): Date | null {
  if (dateInput?.dateTime) {
    return new Date(dateInput.dateTime)
  }
  if (dateInput?.date) {
    // All-day events - parse as local date to avoid timezone offset issues
    // Format: "YYYY-MM-DD"
    const [year, month, day] = dateInput.date.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return null
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function formatDateHeading(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatViewHeader(date: Date, view: CalendarView) {
  if (view === 'month') {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  }

  if (view === 'week') {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const startLabel = startOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const endLabel = endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startLabel} – ${endLabel}`
  }

  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function getViewDateRange(date: Date, view: CalendarView) {
  if (view === 'month') {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    start.setDate(start.getDate() - 7) // preload previous week
    end.setDate(end.getDate() + 7) // preload next week
    return { start, end }
  }

  if (view === 'week') {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  const start = new Date(date)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function buildCalendarGrid(date: Date, view: CalendarView) {
  if (view === 'month') {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const firstDayOfGrid = new Date(firstDay)
    firstDayOfGrid.setDate(firstDayOfGrid.getDate() - firstDayOfGrid.getDay())

    const cells: Date[] = []
    const iterator = new Date(firstDayOfGrid)
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(iterator))
      iterator.setDate(iterator.getDate() + 1)
    }
    return cells
  }

  if (view === 'week') {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const cells: Date[] = []
    for (let i = 0; i < 7; i++) {
      const current = new Date(start)
      current.setDate(start.getDate() + i)
      cells.push(current)
    }
    return cells
  }

  return [new Date(date)]
}

type RenderCalendarGridParams = {
  view: CalendarView
  calendarCells: Date[]
  eventsByDate: Map<string, NormalizedEvent[]>
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  pressedButtons: Set<string>
  getButtonPressHandlers: ReturnType<typeof useButtonPress>['getButtonPressHandlers']
  getButtonPressStyle: ReturnType<typeof useButtonPress>['getButtonPressStyle']
  colors: ReturnType<typeof useThemeStyles>['colors']
  text: ReturnType<typeof useThemeStyles>['text']
  spacing: ReturnType<typeof useThemeStyles>['spacing']
  setSelectedEvent: (event: NormalizedEvent | null) => void
  setIsEventModalOpen: (open: boolean) => void
}

function renderCalendarGrid({
  view,
  calendarCells,
  eventsByDate,
  selectedDate,
  setSelectedDate,
  pressedButtons,
  getButtonPressHandlers,
  getButtonPressStyle,
  colors,
  text,
  spacing,
  setSelectedEvent,
  setIsEventModalOpen,
}: RenderCalendarGridParams) {
  if (view === 'month') {
    const today = new Date()
    const currentMonth = calendarCells[15]?.getMonth() // central cell to determine month

    return calendarCells.map((cellDate, index) => {
      const key = `calendar-cell-${cellDate.toISOString()}`
      const isToday = cellDate.toDateString() === today.toDateString()
      const isSelected = cellDate.toDateString() === selectedDate.toDateString()
      const isCurrentMonth = cellDate.getMonth() === currentMonth
      const dayEvents = eventsByDate.get(cellDate.toDateString()) || []

      return (
        <div
          key={key}
          {...getButtonPressHandlers(key)}
          onClick={() => setSelectedDate(cellDate)}
          style={getButtonPressStyle(
            key,
            {
              minHeight: '110px',
              borderRadius: spacing(1),
              border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
              backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : colors.surface,
              padding: spacing(1),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(0.75),
              cursor: 'pointer',
            },
            isSelected ? 'rgba(255,255,255,0.05)' : colors.surface,
            colors.cardHover
          )}
          onMouseEnter={(e) => {
            if (!pressedButtons.has(key)) {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.cardHover
            }
          }}
          onMouseLeave={(e) => {
            if (!pressedButtons.has(key)) {
              (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? 'rgba(255,255,255,0.05)' : colors.surface
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: isToday ? 700 : 500,
                color: isCurrentMonth ? text.primary.color : text.tertiary.color,
              }}
            >
              {cellDate.getDate()}
            </span>
            {isToday && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.primary,
                  backgroundColor: colors.primaryLight || 'rgba(104, 159, 56, 0.15)',
                  borderRadius: spacing(0.5),
                  padding: `${spacing(0.25)} ${spacing(0.75)}`,
                }}
              >
                Today
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.5), overflow: 'hidden' }}>
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEvent(event)
                  setIsEventModalOpen(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(0.75),
                  borderRadius: spacing(0.5),
                  backgroundColor: colors.cardHover,
                  padding: `${spacing(0.5)} ${spacing(0.75)}`,
                  cursor: event.htmlLink ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (event.htmlLink) {
                    e.currentTarget.style.backgroundColor = colors.borderHover || colors.card
                  }
                }}
                onMouseLeave={(e) => {
                  if (event.htmlLink) {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: event.calendarColor || colors.primary, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25), minWidth: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: text.primary.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.title}
                  </span>
                  {!event.isAllDay && (
                    <span style={{ fontSize: '10px', color: text.secondary.color }}>
                      {event.startLabel} – {event.endLabel}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <span style={{ fontSize: '10px', color: colors.primary, fontWeight: 600 }}>
                +{dayEvents.length - 3} more
              </span>
            )}
          </div>
        </div>
      )
    })
  }

  // Week and day views share similar structure
  const today = new Date()
  return calendarCells.map((cellDate, index) => {
    const key = `calendar-cell-${cellDate.toISOString()}`
    const isSelected = cellDate.toDateString() === selectedDate.toDateString()
    const isToday = cellDate.toDateString() === today.toDateString()
    const dayEvents = eventsByDate.get(cellDate.toDateString()) || []

    return (
      <div
        key={key}
        {...getButtonPressHandlers(key)}
        onClick={() => setSelectedDate(cellDate)}
        style={getButtonPressStyle(
          key,
          {
            borderRadius: spacing(1),
            border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            padding: spacing(1.5),
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(0.75),
            minHeight: view === 'day' ? '380px' : '260px',
            cursor: 'pointer',
          },
          colors.surface,
          colors.cardHover
        )}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(0.75) }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: text.primary.color }}>
              {cellDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            {isToday && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.primary,
                  backgroundColor: colors.primaryLight || 'rgba(104, 159, 56, 0.15)',
                  borderRadius: spacing(0.5),
                  padding: `${spacing(0.25)} ${spacing(0.75)}`,
                }}
              >
                Today
              </span>
            )}
          </div>
          <span style={{ fontSize: '12px', color: text.secondary.color }}>
            {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1), flex: 1 }}>
          {dayEvents.length === 0 ? (
            <p style={{ margin: 0, fontSize: '12px', color: text.tertiary.color }}>No events</p>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEvent(event)
                  setIsEventModalOpen(true)
                }}
                style={{
                  borderRadius: spacing(0.75),
                  backgroundColor: colors.cardHover,
                  padding: spacing(1),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing(0.5),
                  borderLeft: `4px solid ${event.calendarColor || colors.primary}`,
                  cursor: event.htmlLink ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (event.htmlLink) {
                    e.currentTarget.style.backgroundColor = colors.borderHover || colors.card
                  }
                }}
                onMouseLeave={(e) => {
                  if (event.htmlLink) {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: text.primary.color }}>
                  {event.title}
                </span>
                <span style={{ fontSize: '12px', color: text.secondary.color }}>
                  {event.isAllDay ? 'All day' : `${event.startLabel} – ${event.endLabel}`}
                </span>
                {event.location && (
                  <span style={{ fontSize: '12px', color: text.tertiary.color }}>
                    {event.location}
                  </span>
                )}
                {event.description && (
                  <span style={{ fontSize: '12px', color: text.tertiary.color }}>
                    {event.description}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    )
  })
}

function gridTemplateForView(view: CalendarView) {
  if (view === 'month') {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
      gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
    }
  }

  if (view === 'week') {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
      gap: '8px',
    }
  }

  // Day view
  return {
    display: 'grid',
    gridTemplateColumns: '1fr',
  }
}

function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toInputTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function createDateTime(date: string, time: string) {
  if (!date) {
    return new Date()
  }

  if (!time) {
    return new Date(date)
  }

  return new Date(`${date}T${time}`)
}

function inputStyle(colors: ReturnType<typeof useThemeStyles>['colors'], text: ReturnType<typeof useThemeStyles>['text'], spacing: ReturnType<typeof useThemeStyles>['spacing']) {
  return {
    width: '100%',
    padding: `${spacing(0.75)} ${spacing(1)}`,
    borderRadius: spacing(0.75),
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
    color: text.primary.color,
    fontSize: '13px',
    outline: 'none',
  } as React.CSSProperties
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

