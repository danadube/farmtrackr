'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { FarmContact, Stats } from '@/types'
import type { ListingClient, ListingTaskClient } from '@/types/listings'
import {
  Users,
  Building2,
  FileText,
  Upload,
  Printer,
  Plus,
  Calendar,
  TrendingUp,
  Home,
  DollarSign,
  Briefcase,
  Settings,
  Contact,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  CheckSquare,
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ListingDetailModal } from '@/components/listings/ListingDetailModal'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { normalizeFarmName } from '@/lib/farmNames'
import { getFarmColor } from '@/lib/farmColors'
import { validateAllContacts } from '@/lib/dataQuality'
import { calculateCommission } from '@/lib/commissionCalculations'

interface DashboardClientProps {
  contacts: FarmContact[];
  stats: Stats;
  listings?: ListingClient[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return currencyFormatter.format(value)
}

const getActiveStageInstance = (listing: ListingClient) => {
  return (
    listing.stageInstances.find((stage) => stage.status === 'ACTIVE') ??
    listing.stageInstances.find((stage) => stage.status === 'PENDING') ??
    listing.stageInstances.find((stage) => stage.status === 'COMPLETED') ??
    null
  )
}

// Get the stage key for a listing using the same logic as the listings page
const getListingStageKey = (listing: ListingClient): string | null => {
  // CRITICAL: Use currentStageKey as the source of truth first
  // This prevents listings from jumping back to intake when stages are completed
  if (listing.currentStageKey) {
    // Verify the stage exists in the listing's stage instances
    const stageExists = listing.stageInstances.some((stage) => stage.key === listing.currentStageKey)
    if (stageExists) {
      return listing.currentStageKey
    }
  }

  // Fallback: Find the active stage
  const activeStage = listing.stageInstances.find((stage) => stage.status === 'ACTIVE' && stage.key)
  if (activeStage?.key) return activeStage.key

  // Fallback: Find the first pending stage
  const pendingStage = listing.stageInstances.find((stage) => stage.status === 'PENDING' && stage.key)
  if (pendingStage?.key) return pendingStage.key

  // Fallback: Find the most recently completed stage
  const completedStage = [...listing.stageInstances]
    .reverse()
    .find((stage) => stage.status === 'COMPLETED' && stage.key)
  if (completedStage?.key) return completedStage.key

  return null
}

// Map stage keys to dashboard categories (intake, marketing, escrow)
const getDashboardCategoryForStageKey = (stageKey: string | null): 'intake' | 'marketing' | 'escrow' => {
  if (!stageKey) return 'intake'

  const key = stageKey.toLowerCase()

  // Escrow stages
  if (
    key.includes('escrow') ||
    key.includes('close') ||
    key === 'offer_acceptance_escrow' ||
    key === 'escrow_contingencies' ||
    key === 'close_preparation' ||
    key === 'close_of_escrow'
  ) {
    return 'escrow'
  }

  // Marketing stages
  if (
    key.includes('marketing') ||
    key.includes('offer') ||
    key.includes('listing_agreement') ||
    key === 'listing_agreement_execution' ||
    key === 'disclosure_period' ||
    key === 'active_marketing'
  ) {
    return 'marketing'
  }

  // Everything else is intake (pre_listing_intake, etc.)
  return 'intake'
}

const formatStageDate = (value: string | null | undefined) => {
  if (!value) return null
  try {
    const date = new Date(value)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

type GoogleCalendarApiEvent = {
  id?: string
  summary?: string | null
  description?: string | null
  location?: string | null
  start?: {
    date?: string | null
    dateTime?: string | null
  }
  end?: {
    date?: string | null
    dateTime?: string | null
  }
}

const CALENDAR_COLOR_PALETTE = [
  '#f4516c',
  '#673ab7',
  '#42a5f5',
  '#689f38',
  '#ff9800',
  '#fbc02d',
  '#8d6e63',
  '#26a69a',
  '#5c6bc0',
]

function mapEventToAppointment(event: GoogleCalendarApiEvent, index: number) {
  const start = parseCalendarDate(event.start)
  if (!start) return null
  const end = parseCalendarDate(event.end) || new Date(start.getTime() + 60 * 60 * 1000)
  const isAllDay = !!event.start?.date && !event.start?.dateTime

  return {
    id: event.id || `${start.toISOString()}-${index}`,
    title: event.summary || 'Untitled Event',
    date: start,
    time: isAllDay ? 'All Day' : formatTimeRange(start, end),
    color: pickCalendarColor(event.id || event.summary || String(index)),
  }
}

function parseCalendarDate(dateInput?: { date?: string | null; dateTime?: string | null }) {
  if (!dateInput) return null
  if (dateInput.dateTime) {
    return new Date(dateInput.dateTime)
  }
  if (dateInput.date) {
    // All-day events - parse as local date to avoid timezone offset issues
    // Format: "YYYY-MM-DD"
    const [year, month, day] = dateInput.date.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return null
}

function formatTimeRange(start: Date, end: Date) {
  const startLabel = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  const endLabel = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${startLabel} – ${endLabel}`
}

function pickCalendarColor(seed: string) {
  const hash = hashString(seed)
  const index = Math.abs(hash) % CALENDAR_COLOR_PALETTE.length
  return CALENDAR_COLOR_PALETTE[index]
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function buildCalendarRangeKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function formatInputDate(date: Date) {
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

function dashboardInputStyle(
  colors: ReturnType<typeof useThemeStyles>['colors'],
  text: ReturnType<typeof useThemeStyles>['text'],
  spacing: ReturnType<typeof useThemeStyles>['spacing']
) {
  return {
    width: '100%',
    padding: `${spacing(0.75)} ${spacing(1)}`,
    borderRadius: spacing(0.75),
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
    color: text.primary.color,
    fontSize: '13px',
    outline: 'none',
  }
}

function formatScheduleHeading(date: Date) {
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const headingDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return isToday ? `Today's Schedule` : `Schedule – ${headingDate}`
}

interface Transaction {
  id: string
  address: string | null
  city: string | null
  closedDate: string | null
  closedPrice: number | null
  brokerage: string
  transactionType: string
  clientType: string
  createdAt: string
  nci?: number | null
}

export default function DashboardClient({ contacts, stats, listings: initialListings = [] }: DashboardClientProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { colors, isDark, card, cardWithLeftBorder, headerCard, headerDivider, background, text, spacing } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [recentTransaction, setRecentTransaction] = useState<Transaction | null>(null)
  const [upcomingClosings, setUpcomingClosings] = useState<number>(0)
  const [thisMonthCommissions, setThisMonthCommissions] = useState<{ count: number; total: number }>({ count: 0, total: 0 })
  const [quickStats, setQuickStats] = useState<{ ytdTotal: number; avgDealSize: number; biggestDeal: number; pendingCount: number }>({
    ytdTotal: 0,
    avgDealSize: 0,
    biggestDeal: 0,
    pendingCount: 0
  })
  const [mostActiveFarm, setMostActiveFarm] = useState<{ name: string; count: number } | null>(null)
  const [recentActivity, setRecentActivity] = useState<Array<{ 
    type: 'contact' | 'transaction'; 
    id: string; 
    title: string; 
    date: Date; 
    link: string;
    subtitle?: string;
    metadata?: string;
    value?: number;
  }>>([])
  const [googleContactsCount, setGoogleContactsCount] = useState<number>(0)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(new Date())
  const [calendarAppointments, setCalendarAppointments] = useState<Array<{ id: string; title: string; date: Date; time?: string; color?: string }>>([])
  const [isCalendarLoading, setIsCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [calendarRequiresAuth, setCalendarRequiresAuth] = useState(false)
  const [showQuickEventModal, setShowQuickEventModal] = useState(false)
  const [isSavingQuickEvent, setIsSavingQuickEvent] = useState(false)
  const [quickEventForm, setQuickEventForm] = useState({
    title: '',
    date: formatInputDate(new Date()),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    description: '',
  })
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string; primary?: boolean }>>([])
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])
  const calendarRangeKeyRef = useRef<string | null>(null)
  const calendarsLoadedRef = useRef(false)

  const [listings, setListings] = useState<ListingClient[]>(initialListings)
  const [detailListing, setDetailListing] = useState<ListingClient | null>(null)
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Update listings when initialListings changes
  useEffect(() => {
    setListings(initialListings)
  }, [initialListings])

  const updateListingInState = (updated: ListingClient) => {
    setListings((prev) => prev.map((listing) => (listing.id === updated.id ? updated : listing)))
  }

  const snapshotCurrentListings = () =>
    listings.map((listing) => ({
      ...listing,
      stageInstances: listing.stageInstances.map((stage) => ({
        ...stage,
        tasks: stage.tasks.map((taskItem) => ({ ...taskItem }))
      }))
    }))

  const handleToggleTask = async (listingId: string, task: ListingTaskClient, completed: boolean) => {
    setUpdatingListingId(listingId)
    setFeedback(null)

    const previous = snapshotCurrentListings()
    setListings((prev) =>
      prev.map((listing) => {
        if (listing.id !== listingId) return listing
        return {
          ...listing,
          stageInstances: listing.stageInstances.map((stage) => ({
            ...stage,
            tasks: stage.tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    completed,
                    completedAt: completed ? new Date().toISOString() : null,
                    skipped: false,
                    skippedAt: null
                  }
                : t
            )
          }))
        }
      })
    )
    setDetailListing((prev) => {
      if (!prev || prev.id !== listingId) return prev
      return {
        ...prev,
        stageInstances: prev.stageInstances.map((stage) => ({
          ...stage,
          tasks: stage.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  completed,
                  completedAt: completed ? new Date().toISOString() : null,
                  skipped: false,
                  skippedAt: null
                }
              : t
          )
        }))
      }
    })

    try {
      const response = await fetch(`/api/listings/${listingId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
      setDetailListing((prev) => (prev && prev.id === updatedListing.id ? updatedListing : prev))
    } catch (error) {
      console.error('Error toggling task', error)
      setListings(previous)
      setFeedback('Something went wrong updating that task. Please try again.')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleToggleTaskSkip = async (listingId: string, task: ListingTaskClient, skipped: boolean) => {
    setUpdatingListingId(listingId)
    setFeedback(null)

    const previous = snapshotCurrentListings()
    const timestamp = new Date().toISOString()

    setListings((prev) =>
      prev.map((listing) => {
        if (listing.id !== listingId) return listing
        return {
          ...listing,
          stageInstances: listing.stageInstances.map((stage) => ({
            ...stage,
            tasks: stage.tasks.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    skipped,
                    skippedAt: skipped ? timestamp : null,
                    completed: skipped ? false : t.completed,
                    completedAt: skipped ? null : t.completedAt
                  }
                : t
            )
          }))
        }
      })
    )

    setDetailListing((prev) => {
      if (!prev || prev.id !== listingId) return prev
      return {
        ...prev,
        stageInstances: prev.stageInstances.map((stage) => ({
          ...stage,
          tasks: stage.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  skipped,
                  skippedAt: skipped ? timestamp : null,
                  completed: skipped ? false : t.completed,
                  completedAt: skipped ? null : t.completedAt
                }
              : t
          )
        }))
      }
    })

    try {
      const response = await fetch(`/api/listings/${listingId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipped })
      })

      if (!response.ok) {
        throw new Error('Failed to update task requirement')
      }

      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
      setDetailListing((prev) => (prev && prev.id === updatedListing.id ? updatedListing : prev))
    } catch (error) {
      console.error('Error skipping task', error)
      setListings(previous)
      setFeedback('Unable to update task requirement right now.')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleAddTaskToStage = async (
    stageInstanceId: string,
    payload: { name: string; dueDate?: string | null }
  ) => {
    if (!detailListing) return

    setUpdatingListingId(detailListing.id)
    setFeedback(null)

    try {
      const response = await fetch(`/api/listings/${detailListing.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageInstanceId,
          name: payload.name,
          dueDate: payload.dueDate ?? null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add task')
      }

      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
      setDetailListing(updatedListing)
      setFeedback('Task added to the checklist.')
    } catch (error) {
      console.error('Error adding task', error)
      setFeedback('Unable to add that task right now. Please try again.')
      throw error instanceof Error ? error : new Error('Unable to add task')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleUpdateTaskDetails = async (
    taskId: string,
    updates: { name?: string; dueDate?: string | null }
  ) => {
    if (!detailListing) return
    if (!updates || Object.keys(updates).length === 0) return

    setUpdatingListingId(detailListing.id)
    setFeedback(null)

    try {
      const response = await fetch(`/api/listings/${detailListing.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update task details')
      }

      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
      setDetailListing(updatedListing)
      setFeedback('Task details updated.')
    } catch (error) {
      console.error('Error updating task details', error)
      setFeedback('Unable to save those changes right now.')
      throw error instanceof Error ? error : new Error('Unable to update task details')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleAttachTaskDocument = async (taskId: string, file: File | null) => {
    if (!detailListing) {
      console.error('No detail listing available for document attachment')
      return
    }

    setUpdatingListingId(detailListing.id)
    setFeedback(null)

    try {
      let documentId: string | null = null

      if (file) {
        console.log('Starting file upload:', file.name, file.size, file.type)
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorPayload = await uploadResponse.json().catch(() => ({}))
          console.error('Upload failed:', uploadResponse.status, errorPayload)
          throw new Error(errorPayload.error || `File upload failed: ${uploadResponse.status}`)
        }

        const uploadData = await uploadResponse.json()
        console.log('Upload successful:', uploadData)
        const fileUrl = uploadData.url

        if (!fileUrl) {
          console.error('No URL returned from upload:', uploadData)
          throw new Error('Upload succeeded but no URL returned')
        }

        const descriptionParts = [
          file.name,
          detailListing.title || detailListing.address || detailListing.pipelineName || 'Listing document'
        ].filter(Boolean)

        console.log('Creating document record:', file.name, fileUrl)
        const documentResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            description: `Uploaded file ${descriptionParts.join(' • ')}`,
            fileUrl
          })
        })

        if (!documentResponse.ok) {
          const errorPayload = await documentResponse.json().catch(() => ({}))
          console.error('Document creation failed:', documentResponse.status, errorPayload)
          const errorMessage = errorPayload.error || errorPayload.message || errorPayload.details || `Document save failed: ${documentResponse.status}`
          throw new Error(errorMessage)
        }

        const document = await documentResponse.json()
        console.log('Document created:', document)
        documentId = document.id

        if (!documentId) {
          console.error('No document ID returned:', document)
          throw new Error('Document created but no ID returned')
        }
      }

      console.log('Attaching document to task:', taskId, documentId)
      const response = await fetch(`/api/listings/${detailListing.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        console.error('Task update failed:', response.status, errorPayload)
        throw new Error(errorPayload.error || `Failed to update task document: ${response.status}`)
      }

      const updatedListing: ListingClient = await response.json()
      console.log('Task updated successfully:', updatedListing)
      updateListingInState(updatedListing)
      setDetailListing(updatedListing)
      setFeedback(file ? 'Document attached to task.' : 'Document removed from task.')
    } catch (error) {
      console.error('Error updating task document:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setFeedback(`Unable to update the document: ${errorMessage}`)
      throw error instanceof Error ? error : new Error('Unable to update task document')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const listingsByStage = useMemo(() => {
    const groups: Record<'intake' | 'marketing' | 'escrow', ListingClient[]> = {
      intake: [],
      marketing: [],
      escrow: []
    }

    listings.forEach((listing) => {
      // Use the same stage detection logic as the listings page
      const stageKey = getListingStageKey(listing)
      const category = getDashboardCategoryForStageKey(stageKey)
      groups[category].push(listing)
    })

    return groups
  }, [listings])

  const listingColumnConfig = [
    {
      key: 'intake' as const,
      title: 'Pre-Listing',
      description: 'Preparing to launch',
      accent: colors.warning
    },
    {
      key: 'marketing' as const,
      title: 'Active',
      description: 'On the market now',
      accent: colors.primary
    },
    {
      key: 'escrow' as const,
      title: 'Escrow / Closing',
      description: 'Under contract & closing tasks',
      accent: colors.info
    }
  ]

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((value, index) => value === sortedB[index])
  }

  const loadCalendars = async () => {
    try {
      const response = await fetch('/api/google/calendar/list')
      if (!response.ok) {
        if (response.status === 401) {
          setCalendarRequiresAuth(true)
        }
        return
      }

      const data = await response.json()
      const calendarList: Array<{ id: string; summary: string; primary?: boolean }> = data.calendars || []
      setCalendars(calendarList)

      if (calendarList.length === 0) {
        setSelectedCalendars([])
        return
      }

      // Load selected calendars from localStorage (same key as calendar page)
      let storedSelection: string[] = []
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('calendar.selectedCalendars')
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed)) {
              storedSelection = parsed.filter((id) => typeof id === 'string')
            }
          }
        } catch (error) {
          console.error('Failed to restore calendar selection:', error)
        }
      }

      // Validate stored selection against available calendars
      const validSelection = storedSelection.filter((id) =>
        calendarList.some((calendar) => calendar.id === id)
      )

      // Default to primary calendar if no valid selection
      const nextSelection =
        validSelection.length > 0
          ? validSelection
          : [calendarList.find((calendar) => calendar.primary)?.id || calendarList[0].id]

      // Only update if selection has changed (prevents unnecessary re-renders)
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

  const loadCalendarAppointments = async (referenceDate: Date, force = false) => {
    const rangeKey = buildCalendarRangeKey(referenceDate)
    if (!force && calendarRangeKeyRef.current === rangeKey) {
      return
    }

    const previousKey = calendarRangeKeyRef.current
    calendarRangeKeyRef.current = rangeKey

    setIsCalendarLoading(true)
    setCalendarError(null)
    setCalendarRequiresAuth(false)

    try {
      // Use selected calendars from state
      const calendarsToFetch = selectedCalendars.length > 0 ? selectedCalendars : ['primary']
      
      // Don't fetch if no calendars selected
      if (calendarsToFetch.length === 0) {
        setCalendarAppointments([])
        setIsCalendarLoading(false)
        return
      }

      const today = new Date()
      const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
      const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0)
      const todayStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const todayEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      const DAY_MS = 24 * 60 * 60 * 1000
      const timeMin = new Date(Math.min(monthStart.getTime(), todayStart.getTime()) - 7 * DAY_MS).toISOString()
      const timeMax = new Date(Math.max(monthEnd.getTime(), todayEnd.getTime()) + 30 * DAY_MS).toISOString()

      // Fetch events from all selected calendars
      const results = await Promise.all(
        calendarsToFetch.map(async (calendarId) => {
          const params = new URLSearchParams({
            calendarId,
            timeMin,
            timeMax,
            maxResults: '250',
          })

          const response = await fetch(`/api/google/calendar/events?${params.toString()}`)
          return { calendarId, response }
        })
      )

      // Aggregate events from all calendars
      const aggregatedEvents: Array<{ id: string; title: string; date: Date; time?: string; color?: string }> = []
      
      for (const { calendarId, response } of results) {
        if (!response.ok) {
          if (response.status === 401) {
            setCalendarRequiresAuth(true)
          } else {
            const { error } = await response.json()
            setCalendarError(error || 'Unable to load calendar events.')
          }
          continue
        }

        const data = await response.json()
        const mapped = (data.events || [])
          .map((event: any, index: number) => mapEventToAppointment(event, index))
          .filter((event: any) => !!event)

        aggregatedEvents.push(...mapped)
      }

      // Sort all events by date
      aggregatedEvents.sort((a: { date: Date }, b: { date: Date }) => a.date.getTime() - b.date.getTime())
      setCalendarAppointments(aggregatedEvents)
    } catch (error) {
      console.error('Error loading calendar events:', error)
      setCalendarError(error instanceof Error ? error.message : 'Unexpected error loading calendar events.')
      setCalendarAppointments([])
      calendarRangeKeyRef.current = previousKey
    } finally {
      setIsCalendarLoading(false)
    }
  }

  const handleOpenQuickEventModal = (targetDate?: Date) => {
    const baseDate = targetDate ?? calendarSelectedDate ?? new Date()
    setQuickEventForm({
      title: '',
      date: formatInputDate(baseDate),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
    })
    setCalendarError(null)
    setShowQuickEventModal(true)
  }

  const handleSaveQuickEvent = async () => {
    if (!quickEventForm.title.trim()) {
      setCalendarError('Please provide an event title.')
      return
    }

    if (!quickEventForm.date) {
      setCalendarError('Select a date for the event.')
      return
    }

    const startDateTime = createDateTime(quickEventForm.date, quickEventForm.startTime)
    const endDateTime = createDateTime(quickEventForm.date, quickEventForm.endTime)

    if (startDateTime >= endDateTime) {
      setCalendarError('End time must be after start time.')
      return
    }

    setIsSavingQuickEvent(true)
    setCalendarError(null)

    try {
      const response = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: quickEventForm.title,
          description: quickEventForm.description || undefined,
          location: quickEventForm.location || undefined,
          start: { dateTime: startDateTime.toISOString() },
          end: { dateTime: endDateTime.toISOString() },
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        if (response.status === 401) {
          setCalendarRequiresAuth(true)
        }
        throw new Error(data.error || 'Failed to create event.')
      }

      setShowQuickEventModal(false)
      setQuickEventForm({
        title: '',
        date: formatInputDate(new Date()),
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        description: '',
      })
      await loadCalendarAppointments(calendarDate, true)
    } catch (error) {
      console.error('Error creating calendar event:', error)
      setCalendarError(error instanceof Error ? error.message : 'Unexpected error creating event.')
    } finally {
      setIsSavingQuickEvent(false)
    }
  }

  // Validation issue counts (subtract dismissed) – must be declared before any early returns
  const [issuesCount, setIssuesCount] = useState(0)
  const [errorsCount, setErrorsCount] = useState(0)
  const [warningsCount, setWarningsCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    // Update date/time every minute
    const updateDateTime = () => setCurrentDateTime(new Date())
    updateDateTime()
    const dateTimeInterval = setInterval(updateDateTime, 60000) // Update every minute

    // Load calendars - the useEffect will automatically fetch events when selectedCalendars is set
    loadCalendars().then(() => {
      calendarsLoadedRef.current = true
    })
    
    // Fetch Google Contacts count
    const fetchGoogleContactsCount = async () => {
      try {
        const response = await fetch('/api/google-contacts/stats')
        if (response.ok) {
          const data = await response.json()
          setGoogleContactsCount(data.totalContacts || 0)
        }
      } catch (error) {
        console.error('Error fetching Google Contacts count:', error)
      }
    }
    
    fetchGoogleContactsCount()
    
    // Fetch recent transaction and commission stats
    const fetchTransactionData = async () => {
      try {
        // Fetch all transactions (API orders by closingDate desc, so first is most recent)
        const response = await fetch('/api/transactions')
        if (response.ok) {
          const allData = await response.json()
          
          // Most recent transaction (first in array since API sorts by closingDate desc)
          if (allData.length > 0) {
            const t = allData[0]
            
            // Calculate NCI for the recent transaction
            let nci = null
            try {
              const calc = calculateCommission({
                brokerage: t.brokerage,
                transactionType: t.transactionType,
                closedPrice: parseFloat(String(t.closedPrice || 0)),
                commissionPct: parseFloat(String(t.commissionPct || 0)),
                referralPct: parseFloat(String(t.referralPct || 0)),
                referralFeeReceived: parseFloat(String(t.referralFeeReceived || 0)),
                eo: parseFloat(String(t.eo || 0)),
                royalty: t.royalty || '',
                companyDollar: t.companyDollar || '',
                hoaTransfer: parseFloat(String(t.hoaTransfer || 0)),
                homeWarranty: parseFloat(String(t.homeWarranty || 0)),
                kwCares: parseFloat(String(t.kwCares || 0)),
                kwNextGen: parseFloat(String(t.kwNextGen || 0)),
                boldScholarship: parseFloat(String(t.boldScholarship || 0)),
                tcConcierge: parseFloat(String(t.tcConcierge || 0)),
                jelmbergTeam: parseFloat(String(t.jelmbergTeam || 0)),
                bdhSplitPct: parseFloat(String(t.bdhSplitPct || 0)),
                preSplitDeduction: t.preSplitDeduction || '',
                asf: parseFloat(String(t.asf || 0)),
                foundation10: parseFloat(String(t.foundation10 || 0)),
                adminFee: parseFloat(String(t.adminFee || 0)),
                brokerageSplit: parseFloat(String((t as any).brokerageSplit || 0)),
                otherDeductions: parseFloat(String(t.otherDeductions || 0)),
                buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0)),
                nci: t.notes ? (() => {
                  try {
                    const notesData = JSON.parse(t.notes)
                    return notesData?.csvNci
                  } catch {
                    return t.netVolume
                  }
                })() : t.netVolume
              })
              nci = parseFloat(calc.nci || '0')
            } catch (error) {
              console.error('Error calculating NCI for recent transaction:', error)
            }
            
            setRecentTransaction({
              id: t.id,
              address: t.address,
              city: t.city,
              closedDate: t.closingDate || t.closedDate || null,
              closedPrice: t.closedPrice,
              brokerage: t.brokerage,
              transactionType: t.transactionType,
              clientType: t.clientType,
              createdAt: t.createdAt,
              nci: nci
            })
          }
          
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const fourteenDaysFromNow = new Date()
          fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)
          fourteenDaysFromNow.setHours(23, 59, 59, 999)
          
          // This month's closed transactions
          const thisMonth = allData.filter((t: any) => {
            const closeDate = t.closingDate || t.closedDate
            if (!closeDate) return false
            const date = new Date(closeDate)
            return date >= startOfMonth && date <= endOfMonth && t.status === 'Closed'
          })
          
          setThisMonthCommissions({
            count: thisMonth.length,
            total: thisMonth.reduce((sum: number, t: any) => {
              // Simple calculation - can be enhanced with full commission calc later
              const price = parseFloat(String(t.closedPrice || 0))
              const pct = parseFloat(String(t.commissionPct || 0))
              return sum + (price * pct)
            }, 0)
          })
          
          // Upcoming closings (next 14 days) - transactions with future closing dates (regardless of status)
          const upcoming = allData.filter((t: any) => {
            const closeDate = t.closingDate || t.closedDate
            if (!closeDate) return false
            const date = new Date(closeDate)
            date.setHours(0, 0, 0, 0)
            // Include transactions closing today or in the next 14 days
            return date >= today && date <= fourteenDaysFromNow
          })
          
          setUpcomingClosings(upcoming.length)
          
          // Quick Stats (reuse 'now' from above)
          const startOfYear = new Date(now.getFullYear(), 0, 1)
          
          // YTD transactions (closed this year)
          const ytdTransactions = allData.filter((t: any) => {
            const closeDate = t.closingDate || t.closedDate
            if (!closeDate || t.status !== 'Closed') return false
            const date = new Date(closeDate)
            return date >= startOfYear
          })
          
          // Calculate YTD total using commission calculation for accuracy
          const ytdTotal = ytdTransactions.reduce((sum: number, t: any) => {
            try {
              const calc = calculateCommission({
                brokerage: t.brokerage,
                transactionType: t.transactionType,
                closedPrice: parseFloat(String(t.closedPrice || 0)),
                commissionPct: parseFloat(String(t.commissionPct || 0)),
                referralPct: parseFloat(String(t.referralPct || 0)),
                referralFeeReceived: parseFloat(String(t.referralFeeReceived || 0)),
                eo: parseFloat(String(t.eo || 0)),
                royalty: t.royalty || '',
                companyDollar: t.companyDollar || '',
                hoaTransfer: parseFloat(String(t.hoaTransfer || 0)),
                homeWarranty: parseFloat(String(t.homeWarranty || 0)),
                kwCares: parseFloat(String(t.kwCares || 0)),
                kwNextGen: parseFloat(String(t.kwNextGen || 0)),
                boldScholarship: parseFloat(String(t.boldScholarship || 0)),
                tcConcierge: parseFloat(String(t.tcConcierge || 0)),
                jelmbergTeam: parseFloat(String(t.jelmbergTeam || 0)),
                bdhSplitPct: parseFloat(String(t.bdhSplitPct || 0)),
                preSplitDeduction: t.preSplitDeduction || '',
                asf: parseFloat(String(t.asf || 0)),
                foundation10: parseFloat(String(t.foundation10 || 0)),
                adminFee: parseFloat(String(t.adminFee || 0)),
                brokerageSplit: parseFloat(String((t as any).brokerageSplit || 0)),
                otherDeductions: parseFloat(String(t.otherDeductions || 0)),
                buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0)),
                nci: t.notes ? (() => {
                  try {
                    const notesData = JSON.parse(t.notes)
                    return notesData?.csvNci
                  } catch {
                    return t.netVolume
                  }
                })() : t.netVolume
              })
              return sum + parseFloat(calc.nci || '0')
            } catch (error) {
              // Fallback to simple calculation if commission calc fails
              const price = parseFloat(String(t.closedPrice || 0))
              const pct = parseFloat(String(t.commissionPct || 0))
              return sum + (price * pct)
            }
          }, 0)
          
          // Average deal size (all closed transactions)
          const closedTransactions = allData.filter((t: any) => t.status === 'Closed' && t.closedPrice)
          const totalValue = closedTransactions.reduce((sum: number, t: any) => sum + parseFloat(String(t.closedPrice || 0)), 0)
          const avgDealSize = closedTransactions.length > 0 ? totalValue / closedTransactions.length : 0
          
          // Biggest deal (all time)
          const biggestDeal = closedTransactions.length > 0 
            ? Math.max(...closedTransactions.map((t: any) => parseFloat(String(t.closedPrice || 0))))
            : 0
          
          // Pending transactions (not closed)
          const pendingCount = allData.filter((t: any) => t.status !== 'Closed').length
          
          setQuickStats({
            ytdTotal,
            avgDealSize,
            biggestDeal,
            pendingCount
          })
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error)
      }
    }
    
    // Fetch activity feed
    const fetchActivityFeed = async () => {
      try {
        const activities: Array<{ 
          type: 'contact' | 'transaction'; 
          id: string; 
          title: string; 
          date: Date; 
          link: string;
          subtitle?: string;
          metadata?: string;
          value?: number;
        }> = []
        
        // Recent contacts (last 10)
        const recentContacts = contacts
          .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
          .slice(0, 5)
          .map(c => ({
            type: 'contact' as const,
            id: c.id,
            title: c.organizationName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact',
            date: c.dateCreated,
            link: `/contacts/${c.id}`,
            subtitle: c.farm ? normalizeFarmName(c.farm) : undefined,
            metadata: c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || undefined
          }))
        
        activities.push(...recentContacts)
        
        // Recent transactions (if we have them)
        const transactionResponse = await fetch('/api/transactions')
        if (transactionResponse.ok) {
          const transactions = await transactionResponse.json()
          const recentTxs = transactions
            .sort((a: any, b: any) => new Date(b.createdAt || b.closingDate || 0).getTime() - new Date(a.createdAt || a.closingDate || 0).getTime())
            .slice(0, 5)
            .map((t: any) => {
              let nci = null
              try {
                const calc = calculateCommission({
                  brokerage: t.brokerage,
                  transactionType: t.transactionType,
                  closedPrice: parseFloat(String(t.closedPrice || 0)),
                  commissionPct: parseFloat(String(t.commissionPct || 0)),
                  referralPct: parseFloat(String(t.referralPct || 0)),
                  referralFeeReceived: parseFloat(String(t.referralFeeReceived || 0)),
                  eo: parseFloat(String(t.eo || 0)),
                  royalty: t.royalty || '',
                  companyDollar: t.companyDollar || '',
                  hoaTransfer: parseFloat(String(t.hoaTransfer || 0)),
                  homeWarranty: parseFloat(String(t.homeWarranty || 0)),
                  kwCares: parseFloat(String(t.kwCares || 0)),
                  kwNextGen: parseFloat(String(t.kwNextGen || 0)),
                  boldScholarship: parseFloat(String(t.boldScholarship || 0)),
                  tcConcierge: parseFloat(String(t.tcConcierge || 0)),
                  jelmbergTeam: parseFloat(String(t.jelmbergTeam || 0)),
                  bdhSplitPct: parseFloat(String(t.bdhSplitPct || 0)),
                  preSplitDeduction: t.preSplitDeduction || '',
                  asf: parseFloat(String(t.asf || 0)),
                  foundation10: parseFloat(String(t.foundation10 || 0)),
                  adminFee: parseFloat(String(t.adminFee || 0)),
                  brokerageSplit: parseFloat(String(t.brokerageSplit || 0)),
                  otherDeductions: parseFloat(String(t.otherDeductions || 0)),
                  buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0)),
                  nci: t.notes ? (() => {
                    try {
                      const notesData = JSON.parse(t.notes)
                      return notesData?.csvNci
                    } catch {
                      return t.netVolume
                    }
                  })() : t.netVolume
                })
                nci = parseFloat(calc.nci || '0')
              } catch {
                // Fallback to simple calculation
                const price = parseFloat(String(t.closedPrice || 0))
                const pct = parseFloat(String(t.commissionPct || 0))
                nci = price * pct
              }
              
              const closedDate = t.closedDate || t.closingDate
              const dateStr = closedDate ? new Date(closedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
              
              return {
                type: 'transaction' as const,
                id: t.id,
                title: t.address || 'Transaction',
                date: new Date(t.createdAt || t.closingDate || Date.now()),
                link: `/commissions`,
                subtitle: t.clientType || undefined,
                metadata: [dateStr, t.city, t.closedPrice ? `$${parseFloat(String(t.closedPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : undefined].filter(Boolean).join(' • ') || undefined,
                value: nci
              }
            })
          
          activities.push(...recentTxs)
        }
        
        // Sort by date (most recent first) and take top 8
        activities.sort((a, b) => b.date.getTime() - a.date.getTime())
        setRecentActivity(activities.slice(0, 8))
      } catch (error) {
        console.error('Error fetching activity feed:', error)
      }
    }
    
    // Calculate most active farm
    const calculateMostActiveFarm = () => {
      const farmCounts = new Map<string, number>()
      contacts.forEach(c => {
        if (c.farm) {
          const farm = normalizeFarmName(c.farm)
          farmCounts.set(farm, (farmCounts.get(farm) || 0) + 1)
        }
      })
      
      if (farmCounts.size > 0) {
        const entries = Array.from(farmCounts.entries())
        entries.sort((a, b) => b[1] - a[1])
        setMostActiveFarm({
          name: entries[0][0],
          count: entries[0][1]
        })
      }
    }
    
    if (mounted) {
      fetchTransactionData()
      fetchActivityFeed()
      calculateMostActiveFarm()
    }
    
    return () => {
      if (dateTimeInterval) clearInterval(dateTimeInterval)
    }
  }, [mounted, contacts])

  useEffect(() => {
    // Always try to fetch events - loadCalendarAppointments will fall back to 'primary' if no calendars selected
    // Only fetch after calendars have been loaded at least once (to avoid duplicate initial fetches)
    if (!calendarsLoadedRef.current && calendars.length === 0) {
      return
    }
    
    // Fetch events when calendar date or selected calendars change
    loadCalendarAppointments(calendarDate)
  }, [calendarDate, selectedCalendars, calendars.length])

  // Reload calendars when component becomes visible (in case user changed selection on calendar page)
  useEffect(() => {
    if (!mounted || !calendarsLoadedRef.current) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reload calendars to check for selection changes
        loadCalendars()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mounted])

  const computeCounts = () => {
    const allIssues = validateAllContacts(contacts)
    let dismissed = new Set<string>()
    try {
      const raw = localStorage.getItem('dq.dismissedIssues')
      if (raw) dismissed = new Set<string>(JSON.parse(raw))
    } catch {}
    const visible = allIssues.filter(i => !dismissed.has(i.id))
    setIssuesCount(visible.length)
    setErrorsCount(visible.filter(i => i.severity === 'error').length)
    setWarningsCount(visible.filter(i => i.severity === 'warning').length)
  }

  useEffect(() => {
    if (!mounted) return
    computeCounts()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dq.dismissedIssues') computeCounts()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') computeCounts()
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [mounted, contacts])

  if (!mounted) {
    return null
  }

  // Button press handlers are now provided by useButtonPress hook

  const activeFarms = Array.from(
    new Set(
      contacts
        .map(c => c.farm ? normalizeFarmName(c.farm) : '')
        .filter(Boolean)
    )
  ).sort()

  return (
    <>
    <Sidebar>
      <div 
        style={{ 
          minHeight: '100vh',
          ...background
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: spacing(6),
            paddingRight: spacing(6),
            paddingTop: spacing(4),
            paddingBottom: spacing(4)
          }}
        >
          {/* Hero Section */}
          <div style={{ marginBottom: spacing(2) }}>
            <div 
              style={{
                padding: spacing(3),
                // BRAND GREEN HEADER - Gradient from Meadow Green to Forest Green
                background: 'linear-gradient(135deg, #689f38 0%, #558b2f 100%)', // Meadow Green to Forest Green gradient
                backgroundColor: 'transparent', // Force gradient to show (remove any solid color)
                border: '1px solid #689f38',
                color: '#ffffff',
                borderRadius: '16px',
                position: 'relative' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing(3) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(3), flex: 1 }}>
                  <div 
                    style={{
                      width: spacing(8),
                      height: spacing(8),
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Home style={{ width: spacing(3.5), height: spacing(3.5), color: '#ffffff' }} />
                  </div>
                  <div>
                    <h1 
                      style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '40px',
                        marginBottom: '8px',
                        margin: '0 0 8px 0',
                        // Force white text - brand guidelines
                        backgroundColor: 'transparent'
                      }}
                    >
                      Welcome back
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', lineHeight: '24px', margin: '0' }}>
                      Manage your farm contacts and operations efficiently
                    </p>
                  </div>
                </div>
                {/* Date and Time - Inline with title */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ 
                    fontSize: '11px', 
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)', 
                    margin: '0 0 2px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                  </p>
                  <p style={{ 
                    fontSize: '28px', 
                    fontWeight: '700',
                    color: '#ffffff', 
                    margin: '0 0 2px 0',
                    lineHeight: '32px'
                  }}>
                    {currentDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p style={{ 
                    fontSize: '11px', 
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)', 
                    margin: '0 0 4px 0'
                  }}>
                    {currentDateTime.toLocaleDateString('en-US', { year: 'numeric' })}
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.9)', 
                    margin: '0',
                    letterSpacing: '0.3px'
                  }}>
                    {currentDateTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </div>
              </div>
              {/* Header divider - white on green background */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.2)'
              }} />
            </div>
          </div>

          {/* Overview Section */}
          <div style={{ marginBottom: spacing(4) }}>
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: '600',
                ...text.primary,
                lineHeight: '32px',
                marginBottom: spacing(1.5),
                margin: `0 0 ${spacing(1.5)} 0`
              }}
            >
              Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing(3), alignItems: 'start' }}>
              {/* Left Column - Row 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), gridColumn: '1', gridRow: '1', height: '100%' }}>
              {/* Combined Stats Card - Google Contacts, Farm Contacts, Active Farms */}
              <div 
                style={{
                  padding: spacing(2),
                  ...cardWithLeftBorder(colors.primary), // Green sidebar
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing(1.5),
                  flex: 1,
                  justifyContent: 'space-between'
                }}
              >
                {/* Google Contacts */}
                <Link 
                  href="/contacts?view=google"
                  {...getButtonPressHandlers('dashboard-google-contacts')}
                  style={getButtonPressStyle(
                    'dashboard-google-contacts',
                    {
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1.5),
                      textDecoration: 'none',
                      padding: spacing(1.5),
                      borderRadius: spacing(1)
                    },
                    'transparent',
                    colors.cardHover
                  )}
                >
                  <div 
                    style={{
                      width: spacing(5),
                      height: spacing(5),
                      backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                      borderRadius: spacing(1.25),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Contact style={{ width: spacing(2.5), height: spacing(2.5), color: colors.info || colors.primary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Google Contacts
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {googleContactsCount}
                    </p>
                  </div>
                </Link>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: colors.border, margin: `0 ${spacing(-2)}` }} />

                {/* Farm Contacts */}
                <Link 
                  href="/contacts"
                  {...getButtonPressHandlers('dashboard-farm-contacts')}
                  style={getButtonPressStyle(
                    'dashboard-farm-contacts',
                    {
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1.5),
                      textDecoration: 'none',
                      padding: spacing(1.5),
                      borderRadius: spacing(1)
                    },
                    'transparent',
                    colors.cardHover
                  )}
                >
                  <div 
                    style={{
                      width: spacing(5),
                      height: spacing(5),
                      backgroundColor: colors.iconBg,
                      borderRadius: spacing(1.25),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Users style={{ width: spacing(2.5), height: spacing(2.5), color: colors.primary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Farm Contacts
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {stats.totalContacts}
                    </p>
                  </div>
                </Link>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: colors.border, margin: `0 ${spacing(-2)}` }} />

                {/* Active Farms */}
                <Link 
                  href="/google-sheets"
                  {...getButtonPressHandlers('dashboard-active-farms')}
                  style={getButtonPressStyle(
                    'dashboard-active-farms',
                    {
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1.5),
                      textDecoration: 'none',
                      padding: spacing(1.5),
                      borderRadius: spacing(1)
                    },
                    'transparent',
                    colors.cardHover
                  )}
                >
                  <div 
                    style={{
                      width: spacing(5),
                      height: spacing(5),
                      backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                      borderRadius: spacing(1.25),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Building2 style={{ width: spacing(2.5), height: spacing(2.5), color: colors.success }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Active Farms
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {activeFarms.length}
                    </p>
                  </div>
                </Link>
              </div>
              </div>

              {/* Middle Column - Row 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2), gridColumn: '2', gridRow: '1', height: '100%' }}>
              {/* Most Recent Transaction */}
              {recentTransaction && (
                <Link 
                  href="/commissions"
                  {...getButtonPressHandlers('dashboard-recent-transaction')}
                  style={getButtonPressStyle(
                    'dashboard-recent-transaction',
                    {
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      padding: spacing(2),
                      ...cardWithLeftBorder(colors.info), // Sky Blue for transaction cards
                      flex: 1,
                      justifyContent: 'center'
                    },
                    colors.card,
                    colors.cardHover
                  )}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has('dashboard-recent-transaction')) {
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                        : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                      // Preserve left border color, only change other borders to match sidebar (info/blue)
                      const computed = window.getComputedStyle(e.currentTarget)
                      const leftBorderColor = computed.borderLeftColor
                      const hoverColor = colors.info || colors.primary // Match sidebar color
                      ;(e.currentTarget as HTMLElement).style.borderTopColor = hoverColor
                      ;(e.currentTarget as HTMLElement).style.borderRightColor = hoverColor
                      ;(e.currentTarget as HTMLElement).style.borderBottomColor = hoverColor
                      ;(e.currentTarget as HTMLElement).style.borderLeftColor = leftBorderColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has('dashboard-recent-transaction')) {
                      e.currentTarget.style.boxShadow = card.boxShadow
                      // Preserve left border color, restore other borders
                      const computed = window.getComputedStyle(e.currentTarget)
                      const leftBorderColor = computed.borderLeftColor
                      ;(e.currentTarget as HTMLElement).style.borderTopColor = colors.border
                      ;(e.currentTarget as HTMLElement).style.borderRightColor = colors.border
                      ;(e.currentTarget as HTMLElement).style.borderBottomColor = colors.border
                      ;(e.currentTarget as HTMLElement).style.borderLeftColor = leftBorderColor
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
                    <div 
                      style={{
                        width: spacing(5),
                        height: spacing(5),
                        backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                        borderRadius: spacing(1.25),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Briefcase style={{ width: spacing(2.5), height: spacing(2.5), color: colors.info || colors.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        Recent Transaction
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recentTransaction.address || 'No address'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
                        {recentTransaction.nci !== null && recentTransaction.nci !== undefined && recentTransaction.nci > 0 && (
                          <p style={{ fontSize: '14px', fontWeight: '600', color: colors.success, margin: '0' }}>
                            NCI: ${recentTransaction.nci.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                          {recentTransaction.closedDate 
                            ? new Date(recentTransaction.closedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'No date'}
                          {recentTransaction.city && ` • ${recentTransaction.city}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* Quick Stats Card */}
              {quickStats.ytdTotal > 0 || quickStats.pendingCount > 0 ? (
                <Link 
                  href="/commissions"
                  {...getButtonPressHandlers('dashboard-quick-stats')}
                  style={getButtonPressStyle(
                    'dashboard-quick-stats',
                    {
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      padding: spacing(2),
                      ...cardWithLeftBorder(colors.warning), // Tangerine for financial cards
                      flex: 1,
                      justifyContent: 'center'
                    },
                    colors.card,
                    colors.cardHover
                  )}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has('dashboard-quick-stats')) {
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                        : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                      // Preserve left border color, only change other borders to match sidebar (warning/orange)
                      const computed = window.getComputedStyle(e.currentTarget)
                      const leftBorderColor = computed.borderLeftColor
                      const hoverColor = colors.warning // Match sidebar color (orange)
                      ;(e.currentTarget as HTMLElement).style.borderTopColor = hoverColor
                      ;(e.currentTarget as HTMLElement).style.borderRightColor = hoverColor
                      ;(e.currentTarget as HTMLElement).style.borderBottomColor = hoverColor
                      ;(e.currentTarget as HTMLElement).style.borderLeftColor = leftBorderColor
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has('dashboard-quick-stats')) {
                      e.currentTarget.style.boxShadow = card.boxShadow
                      // Preserve left border color, restore other borders
                      const computed = window.getComputedStyle(e.currentTarget)
                      const leftBorderColor = computed.borderLeftColor
                      ;(e.currentTarget as HTMLElement).style.borderTopColor = colors.border
                      ;(e.currentTarget as HTMLElement).style.borderRightColor = colors.border
                      ;(e.currentTarget as HTMLElement).style.borderBottomColor = colors.border
                      ;(e.currentTarget as HTMLElement).style.borderLeftColor = leftBorderColor
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
                    <div 
                      style={{
                        width: spacing(5),
                        height: spacing(5),
                        backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                        borderRadius: spacing(1.25),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <TrendingUp style={{ width: spacing(2.5), height: spacing(2.5), color: colors.info || colors.primary }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        Quick Stats
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
                        {quickStats.ytdTotal > 0 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            YTD: ${(quickStats.ytdTotal / 1000).toFixed(1)}k
                          </p>
                        )}
                        {quickStats.avgDealSize > 0 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            Avg: ${(quickStats.avgDealSize / 1000).toFixed(1)}k
                          </p>
                        )}
                        {quickStats.biggestDeal > 0 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            Biggest: ${(quickStats.biggestDeal / 1000).toFixed(1)}k
                          </p>
                        )}
                        {quickStats.pendingCount > 0 && (
                          <p style={{ fontSize: '12px', color: colors.warning, margin: `${spacing(0.5)} 0 0 0`, fontWeight: '600' }}>
                            {quickStats.pendingCount} pending
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}
              </div>

              {/* Farms Card - Spans columns 1 and 2, same size as Tasks - Row 2 */}
              {activeFarms.length > 0 && (
                <div 
                  style={{
                    padding: spacing(2),
                    ...cardWithLeftBorder(colors.success), // Green sidebar
                    gridColumn: '1 / span 2',
                    gridRow: '2',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5), marginBottom: spacing(1.5) }}>
                    <div 
                      style={{
                        width: spacing(5),
                        height: spacing(5),
                        backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                        borderRadius: spacing(1.25),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Building2 style={{ width: spacing(2.5), height: spacing(2.5), color: colors.success }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: spacing(1.5), margin: `0 0 ${spacing(1.5)} 0` }}>
                        Farms
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>
                        {activeFarms.map((farm) => {
                          const c = getFarmColor(farm)
                          return (
                            <span
                              key={farm}
                              style={{
                                padding: `${spacing(0.5)} ${spacing(1.5)}`,
                                borderRadius: '9999px',
                                backgroundColor: c.bg,
                                border: `1px solid ${c.border}`,
                                fontSize: '12px',
                                color: c.text,
                                fontWeight: 600,
                              }}
                            >
                              {farm}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks and Reminders - Spans columns 1 and 2 - Row 3 */}
              <div 
                style={{
                  padding: spacing(2),
                  ...cardWithLeftBorder(colors.primary), // Green sidebar
                  gridColumn: '1 / span 2',
                  gridRow: '3',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5), marginBottom: spacing(1.5) }}>
                  <div 
                    style={{
                      width: spacing(5),
                      height: spacing(5),
                      backgroundColor: colors.iconBg,
                      borderRadius: spacing(1.25),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CheckSquare style={{ width: spacing(2.5), height: spacing(2.5), color: colors.primary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Tasks & Reminders
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Coming Soon
                    </p>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: `${spacing(0.5)} 0 0 0` }}>
                      Task management (v0.10.0)
                    </p>
                  </div>
                </div>
              </div>

              {/* Calendar Card - Row 1, Column 3 */}
              <div 
                style={{
                  padding: spacing(2),
                  ...cardWithLeftBorder(colors.info || colors.primary), // Sky Blue sidebar
                  display: 'flex',
                  flexDirection: 'column',
                  gridColumn: '3',
                  gridRow: '1',
                  height: '100%',
                  overflow: 'hidden',
                  minWidth: 0
                }}
              >
                {/* Calendar Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(2) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <Calendar style={{ width: '20px', height: '20px', color: colors.primary }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: 0 }}>
                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate)
                        newDate.setMonth(newDate.getMonth() - 1)
                        setCalendarDate(newDate)
                        setCalendarSelectedDate(newDate)
                      }}
                      {...getButtonPressHandlers('calendar-prev')}
                      style={getButtonPressStyle(
                        'calendar-prev',
                        {
                          padding: spacing(0.5),
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.text.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: spacing(0.75)
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <ChevronLeft style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate)
                        newDate.setMonth(newDate.getMonth() + 1)
                        setCalendarDate(newDate)
                        setCalendarSelectedDate(newDate)
                      }}
                      {...getButtonPressHandlers('calendar-next')}
                      style={getButtonPressStyle(
                        'calendar-next',
                        {
                          padding: spacing(0.5),
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.text.secondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: spacing(0.75)
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <ChevronRight style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                  {isCalendarLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing(1), padding: spacing(1.5) }}>
                      <Loader2 style={{ width: '16px', height: '16px', color: colors.primary, animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '12px', ...text.secondary }}>Loading events…</span>
                    </div>
                  )}
                  {!isCalendarLoading && calendarRequiresAuth && (
                    <p style={{ fontSize: '12px', ...text.secondary, margin: `0 0 ${spacing(1)} 0` }}>
                      Connect Google Calendar to view upcoming events.
                    </p>
                  )}
                  {!isCalendarLoading && !calendarRequiresAuth && calendarError && (
                    <p style={{ fontSize: '12px', color: colors.error, margin: `0 0 ${spacing(1)} 0` }}>
                      {calendarError}
                    </p>
                  )}
                  {/* Day Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: spacing(0.25), marginBottom: spacing(1), minWidth: 0 }}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                      <div
                        key={idx}
                        style={{
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: text.primary.color,
                          padding: `${spacing(0.75)} ${spacing(0.25)}`
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: spacing(0.25), flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    {(() => {
                      const year = calendarDate.getFullYear()
                      const month = calendarDate.getMonth()
                      const firstDay = new Date(year, month, 1)
                      const lastDay = new Date(year, month + 1, 0)
                      const startDate = new Date(firstDay)
                      startDate.setDate(startDate.getDate() - startDate.getDay())
                      
                      const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }> = []
                      const currentDate = new Date(startDate)
                      
                      for (let i = 0; i < 42; i++) {
                        const isCurrentMonth = currentDate.getMonth() === month
                        const today = new Date()
                        const isToday = currentDate.toDateString() === today.toDateString()
                        const isSelected = currentDate.toDateString() === calendarSelectedDate.toDateString()
                        
                        days.push({
                          date: new Date(currentDate),
                          isCurrentMonth,
                          isToday,
                          isSelected
                        })
                        
                        currentDate.setDate(currentDate.getDate() + 1)
                      }
                      
                      return days.map((day, idx) => {
                        const dayAppointments = calendarAppointments.filter(apt => {
                          const aptDate = new Date(apt.date)
                          return aptDate.toDateString() === day.date.toDateString()
                        })
                        
                        return (
                          <div
                            key={idx}
                            {...getButtonPressHandlers(`calendar-day-${idx}`)}
                            style={getButtonPressStyle(
                              `calendar-day-${idx}`,
                              {
                                aspectRatio: '1',
                                minHeight: spacing(3.5),
                                padding: spacing(0.25),
                                borderRadius: spacing(0.5),
                                backgroundColor: day.isSelected
                                  ? (isDark ? 'rgba(104, 159, 56, 0.25)' : 'rgba(104, 159, 56, 0.15)')
                                  : day.isToday
                                    ? (isDark ? 'rgba(104, 159, 56, 0.2)' : 'rgba(104, 159, 56, 0.1)')
                                    : 'transparent',
                                border: day.isSelected
                                  ? `2px solid ${colors.primary}`
                                  : day.isToday
                                    ? `1px solid ${colors.primary}`
                                    : '1px solid transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                boxSizing: 'border-box'
                              },
                              day.isSelected
                                ? (isDark ? 'rgba(104, 159, 56, 0.25)' : 'rgba(104, 159, 56, 0.15)')
                                : day.isToday 
                                  ? (isDark ? 'rgba(104, 159, 56, 0.2)' : 'rgba(104, 159, 56, 0.1)')
                                  : 'transparent',
                              colors.cardHover
                            )}
                            onMouseEnter={(e) => {
                              if (!day.isSelected && !pressedButtons.has(`calendar-day-${idx}`)) {
                                (e.currentTarget as HTMLElement).style.backgroundColor = colors.cardHover
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!day.isSelected && !pressedButtons.has(`calendar-day-${idx}`)) {
                                (e.currentTarget as HTMLElement).style.backgroundColor = day.isToday
                                  ? (isDark ? 'rgba(104, 159, 56, 0.2)' : 'rgba(104, 159, 56, 0.1)')
                                  : 'transparent'
                              }
                            }}
                            onClick={() => {
                              setCalendarSelectedDate(day.date)
                              if (day.date.getMonth() !== calendarDate.getMonth()) {
                                setCalendarDate(new Date(day.date))
                              }
                            }}
                            onDoubleClick={() => {
                              setCalendarSelectedDate(day.date)
                              if (day.date.getMonth() !== calendarDate.getMonth()) {
                                setCalendarDate(new Date(day.date))
                              }
                              handleOpenQuickEventModal(day.date)
                            }}
                          >
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: day.isSelected ? '700' : day.isToday ? '600' : '500',
                                color: day.isCurrentMonth 
                                  ? (day.isSelected ? colors.primary : day.isToday ? colors.primary : text.primary.color)
                                  : text.tertiary.color,
                                marginBottom: '1px'
                              }}
                            >
                              {day.date.getDate()}
                            </span>
                            {dayAppointments.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.125), width: '100%', alignItems: 'center' }}>
                                {dayAppointments.slice(0, 2).map((apt, aptIdx) => (
                                  <div
                                    key={aptIdx}
                                    style={{
                                      width: '100%',
                                      height: '2px',
                                      borderRadius: '1px',
                                      backgroundColor: apt.color || colors.primary,
                                      fontSize: '7px'
                                    }}
                                    title={apt.title}
                                  />
                                ))}
                                {dayAppointments.length > 2 && (
                                  <span style={{ fontSize: '7px', ...text.tertiary }}>
                                    +{dayAppointments.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>

              {/* Schedule Card - spans rows 2-3 */}
              <div
                style={{
                  padding: spacing(2),
                  ...cardWithLeftBorder(colors.info || colors.primary), // Sky Blue sidebar
                  display: 'flex',
                  flexDirection: 'column',
                  gridColumn: '3',
                  gridRow: '2 / span 2',
                  alignSelf: 'stretch',
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1.5), gap: spacing(1) }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: 0 }}>
                    {formatScheduleHeading(calendarSelectedDate)}
                  </h4>
                  <button
                    type="button"
                    {...getButtonPressHandlers('today-add-event')}
                    onClick={() => handleOpenQuickEventModal(calendarSelectedDate)}
                    style={getButtonPressStyle(
                      'today-add-event',
                      {
                        padding: `${spacing(0.5)} ${spacing(1.5)}`,
                        borderRadius: spacing(0.75),
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardHover,
                        fontSize: '12px',
                        fontWeight: 500,
                        color: text.secondary.color,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing(0.5),
                        cursor: 'pointer',
                      },
                      colors.cardHover,
                      colors.borderHover
                    )}
                  >
                    <Plus style={{ width: '12px', height: '12px' }} />
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), maxHeight: '200px', overflowY: 'auto' }}>
                  {(() => {
                    const scheduleDate = calendarSelectedDate || new Date()
                    const scheduleAppointments = calendarAppointments.filter(apt => {
                      const aptDate = new Date(apt.date)
                      return aptDate.toDateString() === scheduleDate.toDateString()
                    })

                    if (isCalendarLoading) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing(1) }}>
                          <Loader2 style={{ width: '16px', height: '16px', color: colors.primary, animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '12px', ...text.secondary }}>
                            Loading today's events…
                          </span>
                        </div>
                      )
                    }

                    if (calendarRequiresAuth) {
                      return (
                        <p style={{ fontSize: '12px', ...text.secondary, margin: 0 }}>
                          Connect Google Calendar to manage your schedule.
                        </p>
                      )
                    }

                    if (calendarError) {
                      return (
                        <p style={{ fontSize: '12px', color: colors.error, margin: 0 }}>
                          {calendarError}
                        </p>
                      )
                    }
                    
                    if (scheduleAppointments.length === 0) {
                      return (
                        <p style={{ fontSize: '12px', ...text.tertiary, margin: 0, fontStyle: 'italic' }}>
                          No appointments for this day
                        </p>
                      )
                    }
                    
                    return scheduleAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing(1.5),
                          padding: spacing(1.5),
                          borderRadius: spacing(0.75),
                          backgroundColor: colors.cardHover
                        }}
                      >
                        <div
                          style={{
                            width: '3px',
                            height: '100%',
                            minHeight: spacing(4),
                            borderRadius: spacing(0.25),
                            backgroundColor: apt.color || colors.primary,
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', ...text.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {apt.title}
                          </p>
                          {apt.time && (
                            <p style={{ fontSize: '12px', ...text.tertiary, margin: `${spacing(0.5)} 0 0 0` }}>
                              {apt.time}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          </div>

        {listings.length > 0 && (
          <div style={{ marginBottom: spacing(4) }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: spacing(2),
                marginBottom: spacing(1.5),
                flexWrap: 'wrap'
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    ...text.primary,
                    margin: 0,
                    marginBottom: spacing(0.5)
                  }}
                >
                  Current Listings
                </h2>
                <p
                  style={{
                    fontSize: '14px',
                    ...text.secondary,
                    margin: 0
                  }}
                >
                  Live snapshot of seller pipeline stages.
                </p>
              </div>
              <Link
                href="/listings"
                style={{
                  padding: `${spacing(1)} ${spacing(1.75)}`,
                  borderRadius: '999px',
                  border: `1px solid ${colors.border}`,
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text.primary,
                  background: 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                View full pipeline
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: spacing(3)
              }}
            >
              {listingColumnConfig.map((column) => {
                const columnListings = listingsByStage[column.key]
                return (
                  <div
                    key={column.key}
                    style={{
                      ...card,
                      borderTop: `4px solid ${column.accent}`,
                      padding: spacing(2),
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing(1.5),
                      minHeight: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing(1) }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, ...text.primary }}>{column.title}</h3>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: column.accent }}>
                          {columnListings.length}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', ...text.secondary }}>{column.description}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5), flex: 1 }}>
                      {columnListings.length === 0 ? (
                        <div
                          style={{
                            padding: spacing(1.5),
                            borderRadius: spacing(1),
                            border: `1px dashed ${colors.border}`,
                            color: colors.text.secondary,
                            fontSize: '13px',
                            textAlign: 'center'
                          }}
                        >
                          Nothing here yet.
                        </div>
                      ) : (
                        columnListings.map((listing) => {
                          const stage = getActiveStageInstance(listing)
                          const stageLabel = stage?.name ?? column.title
                          const stageStartedAt = formatStageDate(stage?.startedAt ?? listing.currentStageStartedAt)
                          const title = listing.title || listing.address || 'Untitled Listing'
                          const showAddressLine =
                            listing.address &&
                            (!listing.title || listing.title.trim().toLowerCase() !== listing.address.trim().toLowerCase())
                          const locationLine = [
                            showAddressLine ? listing.address : null,
                            listing.city,
                            listing.state,
                            listing.zipCode
                          ]
                            .filter(Boolean)
                            .join(', ')

                          return (
                            <div
                              key={listing.id}
                              onClick={() => setDetailListing(listing)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault()
                                  setDetailListing(listing)
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              style={{
                                ...cardWithLeftBorder(column.accent),
                                padding: spacing(1.75),
                                display: 'flex',
                                flexDirection: 'column',
                                gap: spacing(1),
                                cursor: 'pointer'
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    ...text.primary
                                  }}
                                >
                                  {title}
                                </p>
                                {locationLine ? (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '13px',
                                      ...text.secondary
                                    }}
                                  >
                                    {locationLine}
                                  </p>
                                ) : null}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing(1) }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '12px', ...text.secondary }}>List Price</span>
                                  <span style={{ fontSize: '16px', fontWeight: 700, ...text.primary }}>
                                    {formatCurrency(listing.listPrice)}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: spacing(0.5),
                                    padding: `${spacing(0.5)} ${spacing(1)}`,
                                    borderRadius: '999px',
                                    backgroundColor: `${column.accent}1A`,
                                    color: column.accent,
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}
                                >
                                  {stageLabel}
                                  {stageStartedAt ? (
                                    <span style={{ fontSize: '11px', color: column.accent, fontWeight: 500 }}>
                                      • {stageStartedAt}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

          {/* Recent Activity */}
          <div style={{ marginBottom: spacing(4) }}>
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: '600',
                ...text.primary,
                lineHeight: '32px',
                marginBottom: spacing(1.5),
                margin: `0 0 ${spacing(1.5)} 0`
              }}
            >
              Recent Activity
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
              {recentActivity.length === 0 ? (
                <div style={{ padding: spacing(4), ...card, textAlign: 'center' }}>
                  <p style={{ fontSize: '14px', ...text.tertiary, margin: 0 }}>
                    No recent activity
                  </p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    {...getButtonPressHandlers(`activity-${activity.id}`)}
                    style={getButtonPressStyle(
                      `activity-${activity.id}`,
                      {
                        padding: '20px 24px',
                        ...card,
                        cursor: 'pointer',
                        border: `1px solid ${colors.border}`,
                        textDecoration: 'none'
                      },
                      colors.card,
                      colors.cardHover
                    )}
                    onMouseEnter={(e) => {
                      if (!pressedButtons.has(`activity-${activity.id}`)) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
                        e.currentTarget.style.borderColor = colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!pressedButtons.has(`activity-${activity.id}`)) {
                        e.currentTarget.style.backgroundColor = colors.card
                        e.currentTarget.style.borderColor = colors.border
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ flex: '1', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '18px', margin: '0' }}>
                            {activity.title}
                          </h3>
                          {activity.subtitle && (
                            <span style={{ 
                              padding: '4px 12px', 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              backgroundColor: activity.type === 'contact' 
                                ? (isDark ? 'rgba(104, 159, 56, 0.2)' : 'rgba(104, 159, 56, 0.1)')
                                : (activity.subtitle === 'Buyer' 
                                    ? (isDark ? '#1e3a5f' : '#3b82f6')
                                    : (isDark ? '#78350f' : '#f59e0b')), 
                              color: activity.type === 'contact' 
                                ? colors.primary
                                : (activity.subtitle === 'Buyer' 
                                    ? (isDark ? colors.info : '#ffffff')
                                    : (isDark ? colors.warning : '#ffffff')), 
                              borderRadius: '999px', 
                              flexShrink: 0 
                            }}>
                              {activity.type === 'contact' ? '🏠' : (activity.subtitle === 'Buyer' ? '🔵' : '⭐')} {activity.subtitle}
                            </span>
                          )}
                          <span style={{ 
                            padding: '4px 12px', 
                            fontSize: '12px', 
                            fontWeight: '500', 
                            backgroundColor: activity.type === 'contact' 
                              ? (isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(96, 165, 250, 0.1)')
                              : (isDark ? '#1a2542' : '#9273FF'),
                            color: activity.type === 'contact' 
                              ? colors.info || colors.primary
                              : '#ffffff',
                            borderRadius: '999px', 
                            flexShrink: 0 
                          }}>
                            {activity.type === 'contact' ? '👤 Contact' : '💰 Transaction'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', ...text.secondary, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '600', color: colors.text.primary }}>
                            📅 {activity.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {activity.metadata && (
                            <>
                              <span>•</span>
                              <span>{activity.metadata}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {activity.value !== undefined && activity.value !== null && (
                        <div style={{ 
                          minWidth: '120px', 
                          textAlign: 'right', 
                          padding: '12px', 
                          borderRadius: '8px', 
                          backgroundColor: colors.successLight, 
                          border: `2px solid ${colors.success}` 
                        }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>NCI</p>
                          <p style={{ fontSize: '16px', fontWeight: '700', color: colors.success, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            ${activity.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>


        </div>
      </div>
    </Sidebar>

    <ListingDetailModal
      key={detailListing?.id || 'no-listing'}
      listing={detailListing}
      onClose={() => setDetailListing(null)}
      onOpenPipeline={() => router.push('/listings')}
      onToggleTask={handleToggleTask}
      onToggleSkip={handleToggleTaskSkip}
      onAddTask={handleAddTaskToStage}
      onUpdateTask={handleUpdateTaskDetails}
      onAttachDocument={handleAttachTaskDocument}
      isUpdating={detailListing ? updatingListingId === detailListing.id : false}
    />

    {showQuickEventModal && (
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
            if (!isSavingQuickEvent) {
              setShowQuickEventModal(false)
            }
          }}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: '420px',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: spacing(3),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(1.5),
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, ...text.primary }}>Add Calendar Event</h3>
              <p style={{ margin: `${spacing(0.5)} 0 0 0`, fontSize: '13px', ...text.secondary }}>
                Create a quick appointment for your Google Calendar.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, ...text.tertiary, marginBottom: spacing(0.5) }}>
                  Title
                </label>
                <input
                  type="text"
                  value={quickEventForm.title}
                  onChange={(e) => setQuickEventForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Client meeting, property showing..."
                  style={dashboardInputStyle(colors, text, spacing)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing(1) }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, ...text.tertiary, marginBottom: spacing(0.5) }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={quickEventForm.date}
                    onChange={(e) => setQuickEventForm((prev) => ({ ...prev, date: e.target.value }))}
                    style={dashboardInputStyle(colors, text, spacing)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, ...text.tertiary, marginBottom: spacing(0.5) }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={quickEventForm.startTime}
                    onChange={(e) => setQuickEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    style={dashboardInputStyle(colors, text, spacing)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, ...text.tertiary, marginBottom: spacing(0.5) }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={quickEventForm.endTime}
                    onChange={(e) => setQuickEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    style={dashboardInputStyle(colors, text, spacing)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, ...text.tertiary, marginBottom: spacing(0.5) }}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={quickEventForm.location}
                    onChange={(e) => setQuickEventForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="123 Main St, Palm Desert"
                    style={dashboardInputStyle(colors, text, spacing)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, ...text.tertiary, marginBottom: spacing(0.5) }}>
                  Description
                </label>
                <textarea
                  value={quickEventForm.description}
                  onChange={(e) => setQuickEventForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  placeholder="Include notes, attendees, or reminders."
                  style={{ ...dashboardInputStyle(colors, text, spacing), resize: 'vertical' }}
                />
              </div>

              {calendarError && (
                <p style={{ fontSize: '12px', color: colors.error, margin: 0 }}>
                  {calendarError}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing(1) }}>
              <button
                type="button"
                {...getButtonPressHandlers('quick-event-cancel')}
                onClick={() => {
                  if (!isSavingQuickEvent) {
                    setShowQuickEventModal(false)
                  }
                }}
                disabled={isSavingQuickEvent}
                style={getButtonPressStyle(
                  'quick-event-cancel',
                  {
                    padding: `${spacing(0.75)} ${spacing(2)}`,
                    borderRadius: spacing(0.75),
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.surface,
                    fontSize: '13px',
                    color: text.secondary.color,
                    cursor: isSavingQuickEvent ? 'not-allowed' : 'pointer',
                  },
                  colors.surface,
                  colors.cardHover
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                {...getButtonPressHandlers('quick-event-save')}
                onClick={handleSaveQuickEvent}
                disabled={isSavingQuickEvent}
                style={getButtonPressStyle(
                  'quick-event-save',
                  {
                    padding: `${spacing(0.75)} ${spacing(2.5)}`,
                    borderRadius: spacing(0.75),
                    border: 'none',
                    backgroundColor: colors.primary,
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(0.75),
                    cursor: isSavingQuickEvent ? 'wait' : 'pointer',
                  },
                  colors.primary,
                  colors.primaryHover
                )}
              >
                {isSavingQuickEvent && <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />}
                Save Event
              </button>
            </div>
          </div>
        </div>
    )}
    </>
  )
}