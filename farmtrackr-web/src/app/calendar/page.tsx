'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Loader2, RefreshCw } from 'lucide-react'

type CalendarView = 'month' | 'week' | 'day'

type GoogleCalendar = {
  id: string
  summary: string
  description?: string | null
  backgroundColor?: string | null
  foregroundColor?: string | null
  primary?: boolean | null
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
}

type CreateEventState = {
  title: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  location: string
  description: string
}

const INITIAL_CREATE_EVENT_STATE: CreateEventState = {
  title: '',
  startDate: '',
  startTime: '09:00',
  endDate: '',
  endTime: '10:00',
  location: '',
  description: '',
}

export default function CalendarPage() {
  const { colors, text, card, cardWithLeftBorder, headerCard, headerDivider, spacing } = useThemeStyles()
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
  }, [])
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

      const results = await Promise.all(
        selectedCalendars.map(async (calendarId) => {
          const params = new URLSearchParams({
            calendarId,
            timeMin: start.toISOString(),
            timeMax: end.toISOString(),
            maxResults: '250',
          })

          const response = await fetch(`/api/google/calendar/events?${params.toString()}`)
          return { calendarId, response }
        })
      )

      const aggregatedEvents: NormalizedEvent[] = []
      for (const { calendarId, response } of results) {
        if (!response.ok) {
          if (response.status === 401) {
            setRequiresAuth(true)
          } else {
            const { error: apiError } = await response.json()
            setError((prev) => prev || apiError || 'Unable to load calendar events.')
          }
          continue
        }

        const data = await response.json()
        const meta = calendars.find((calendar) => calendar.id === calendarId)
        const normalized = (data.events || [])
          .map((event: ApiCalendarEvent) => normalizeEvent(event, meta))
          .filter((event: NormalizedEvent | null): event is NormalizedEvent => !!event)

        aggregatedEvents.push(...normalized)
      }

      aggregatedEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
      setEvents(aggregatedEvents)
    } catch (err) {
      console.error('Failed to fetch calendar events:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error while loading events.')
      setEvents([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const loadCalendars = async (initialSelection?: string[]) => {
    try {
      const response = await fetch('/api/google/calendar/list')
      if (!response.ok) {
        if (response.status === 401) {
          setRequiresAuth(true)
        }
        return
      }

      const data = await response.json()
      const calendarList: GoogleCalendar[] = data.calendars || []
      setCalendars(calendarList)

      if (calendarList.length === 0) {
        setSelectedCalendars([])
        return
      }

      const baseSelection = initialSelection ?? selectedCalendars
      const validSelection = baseSelection.filter((id) =>
        calendarList.some((calendar) => calendar.id === id)
      )

      const nextSelection =
        validSelection.length > 0
          ? validSelection
          : [calendarList.find((calendar) => calendar.primary)?.id || calendarList[0].id]

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
    setCreateForm({
      ...INITIAL_CREATE_EVENT_STATE,
      startDate,
      endDate,
    })
    setIsCreateModalOpen(true)
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
      const startDateTime = createDateTime(createForm.startDate, createForm.startTime)
      const endDateTime = createDateTime(createForm.endDate, createForm.endTime)

      if (startDateTime >= endDateTime) {
        setError('End time must be after start time.')
        setIsSavingEvent(false)
        return
      }

      const response = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: createForm.title,
          description: createForm.description || undefined,
          location: createForm.location || undefined,
          start: {
            dateTime: startDateTime.toISOString(),
          },
          end: {
            dateTime: endDateTime.toISOString(),
          },
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
    <Sidebar>
      <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '32px 48px 64px 48px',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing(2.5),
          }}
        >
          {/* Page Header */}
          <div style={{ ...headerCard, padding: spacing(3), display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing(2) }}>
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

              <div style={{ display: 'flex', gap: spacing(1) }}>
                <button
                  type="button"
                  {...getButtonPressHandlers('calendar-refresh')}
                  onClick={() => fetchEvents(true)}
                  disabled={isRefreshing}
                  style={getButtonPressStyle(
                    'calendar-refresh',
                    {
                      padding: `${spacing(1.5)} ${spacing(2)}`,
                      borderRadius: spacing(1),
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.surface,
                      cursor: isRefreshing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      fontSize: '14px',
                      color: text.secondary.color,
                    },
                    colors.surface,
                    colors.cardHover
                  )}
                >
                  <RefreshCw
                    style={{
                      width: '16px',
                      height: '16px',
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('calendar-new-event')}
                  onClick={handleOpenCreateModal}
                  style={getButtonPressStyle(
                    'calendar-new-event',
                    {
                      padding: `${spacing(1.5)} ${spacing(2.5)}`,
                      borderRadius: spacing(1),
                      border: 'none',
                      backgroundColor: colors.primary,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      fontSize: '14px',
                      fontWeight: 600,
                    },
                    colors.primary,
                    colors.primaryHover
                  )}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  New Event
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing(2), flexWrap: 'wrap' }}>
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
                <p style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: text.primary.color }}>
                  {formatViewHeader(currentDate, view)}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1), flexWrap: 'wrap' }}>
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
                    Calendars
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
                          return (
                            <label
                              key={calendar.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing(1),
                                padding: spacing(0.75),
                                borderRadius: spacing(0.75),
                                backgroundColor: checked ? colors.cardHover : 'transparent',
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
                                  backgroundColor: calendar.backgroundColor || '#2563eb',
                                  flexShrink: 0,
                                }}
                              />
                              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {calendar.summary}
                                {calendar.primary && (
                                  <span style={{ marginLeft: spacing(0.5), fontSize: '11px', color: colors.primary }}>
                                    (Primary)
                                  </span>
                                )}
                              </span>
                            </label>
                          )
                        })
                      )}

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

                <div style={{ display: 'flex', gap: spacing(0.5), backgroundColor: colors.surface, borderRadius: spacing(0.75), border: `1px solid ${colors.border}`, padding: spacing(0.5) }}>
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
                          backgroundColor: view === option ? colors.primary : 'transparent',
                          color: view === option ? '#fff' : text.secondary.color,
                          fontSize: '13px',
                          fontWeight: view === option ? 600 : 500,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        },
                        view === option ? colors.primary : 'transparent',
                        view === option ? colors.primaryHover : colors.cardHover
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ ...headerDivider, marginTop: spacing(1) }} />
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

          {/* Day Details */}
          <div style={{ ...card, padding: spacing(2.5), display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing(1) }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: text.primary.color }}>
                  {formatDateHeading(selectedDate)}
                </h2>
                <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '12px', color: text.tertiary.color }}>
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
                    padding: `${spacing(0.75)} ${spacing(1.5)}`,
                    borderRadius: spacing(0.75),
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.surface,
                    fontSize: '12px',
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
              <p style={{ margin: 0, fontSize: '13px', color: text.tertiary.color }}>No events on this day.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => {
                      if (event.htmlLink) {
                        window.open(event.htmlLink, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    style={{
                      padding: spacing(1.25),
                      borderRadius: spacing(1),
                      backgroundColor: colors.cardHover,
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
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: text.primary.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: text.secondary.color }}>
                      {event.isAllDay ? 'All day' : `${event.startLabel} – ${event.endLabel}`}
                    </p>
                    {event.location && (
                      <p style={{ margin: 0, fontSize: '12px', color: text.secondary.color }}>
                        {event.location}
                      </p>
                    )}
                    {event.description && (
                      <p style={{ margin: 0, fontSize: '12px', color: text.tertiary.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.description}
                      </p>
                    )}
                    {event.htmlLink && (
                      <span style={{ marginTop: spacing(0.5), fontSize: '12px', fontWeight: 500, color: colors.primary }}>
                        Click to open in Google Calendar →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Content */}
          <div style={{ ...card, padding: spacing(2.5), minHeight: '600px', display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing(1) }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    style={inputStyle(colors, text, spacing)}
                  />
                </div>
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
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: text.tertiary.color, marginBottom: spacing(0.5) }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    style={inputStyle(colors, text, spacing)}
                  />
                </div>
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
    </Sidebar>
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
                  if (event.htmlLink) {
                    window.open(event.htmlLink, '_blank', 'noopener,noreferrer')
                  }
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
                  if (event.htmlLink) {
                    window.open(event.htmlLink, '_blank', 'noopener,noreferrer')
                  }
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

