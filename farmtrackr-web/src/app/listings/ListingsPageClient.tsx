'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { Home } from 'lucide-react'
import { ListingDetailModal } from '@/components/listings/ListingDetailModal'
import type {
  ListingClient,
  ListingStageClient,
  ListingTaskClient,
  PipelineTemplateClient
} from '@/types/listings'

type ListingsPageClientProps = {
  initialListings: ListingClient[]
  pipelineTemplates: PipelineTemplateClient[]
}

type CreateListingFormState = {
  pipelineTemplateId: string
  title: string
  address: string
  city: string
  state: string
  zipCode: string
  listPrice: string
  notes: string
}

const defaultFormState = (templates: PipelineTemplateClient[]): CreateListingFormState => ({
  pipelineTemplateId: templates[0]?.id ?? '',
  title: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  listPrice: '',
  notes: ''
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const formatCurrency = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return '—'
  }
  return currencyFormatter.format(value)
}

const formatDate = (value: string | null) => {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

const getListingColumnKey = (listing: ListingClient, pipeline: PipelineTemplateClient | null) => {
  const activeStage = listing.stageInstances.find((stage) => stage.status === 'ACTIVE' && stage.key)
  if (activeStage?.key) return activeStage.key

  const nextStage = listing.stageInstances.find((stage) => stage.status === 'PENDING' && stage.key)
  if (nextStage?.key) return nextStage.key

  const completedStage = [...listing.stageInstances]
    .reverse()
    .find((stage) => stage.status === 'COMPLETED' && stage.key)
  if (completedStage?.key) return completedStage.key

  const pipelineStageKeys = pipeline?.stages?.map((stage) => stage.key) ?? []
  return pipelineStageKeys[pipelineStageKeys.length - 1] ?? null
}

const getStageInstanceForListing = (listing: ListingClient, stageKey: string | null) => {
  if (!stageKey || stageKey === '__closed__') {
    const finalStage = [...listing.stageInstances]
      .reverse()
      .find((stage) => stage.key && stage.status === 'COMPLETED')
    return finalStage ?? listing.stageInstances[listing.stageInstances.length - 1] ?? null
  }
  return listing.stageInstances.find((stage) => stage.key === stageKey) ?? null
}

const hasOpenTasks = (stageInstance: ListingStageClient | null) => {
  if (!stageInstance) return false
  return stageInstance.tasks.some((task) => !task.completed)
}

const stageHeaderLabel = (stage: PipelineTemplateClient['stages'][number] | { key: string; name: string }) =>
  stage.name || 'Stage'

const statusColorForStage = (
  status: ListingStageClient['status'],
  palette: ReturnType<typeof useThemeStyles>['colors']
) => {
  switch (status) {
    case 'ACTIVE':
      return palette.primary
    case 'PENDING':
      return palette.warning
    case 'COMPLETED':
      return palette.success
    case 'SKIPPED':
      return palette.info
    default:
      return palette.border
  }
}

const stageStatusBadgeLabel = (status: ListingStageClient['status']) => {
  switch (status) {
    case 'ACTIVE':
      return 'In Progress'
    case 'PENDING':
      return 'Pending'
    case 'COMPLETED':
      return 'Completed'
    case 'SKIPPED':
      return 'Skipped'
    default:
      return status
  }
}

const TaskList = ({
  stageInstance,
  colors
}: {
  stageInstance: ListingStageClient | null
  colors: ReturnType<typeof useThemeStyles>['colors']
}) => {
  if (!stageInstance || stageInstance.tasks.length === 0) {
    return (
      <div
        style={{
          padding: '12px',
          borderRadius: '10px',
          backgroundColor: colors.lightSage ? `${colors.lightSage}22` : colors.cardHover,
          color: colors.text.secondary,
          fontSize: '13px',
          textAlign: 'center'
        }}
      >
        No tasks for this stage yet.
      </div>
    )
  }

  const completedOrSkippedCount = stageInstance.tasks.filter((task) => task.completed || task.skipped).length
  const skippedCount = stageInstance.tasks.filter((task) => task.skipped).length
  const totalCount = stageInstance.tasks.length

  const latestCompletionDate = stageInstance.tasks
    .filter((task) => task.completedAt)
    .map((task) => task.completedAt!)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ fontSize: '13px', color: colors.text.secondary }}>
        Completed or skipped {completedOrSkippedCount} of {totalCount} task{totalCount === 1 ? '' : 's'}
        {skippedCount > 0 ? ` • ${skippedCount} not required` : ''}
      </div>
      {latestCompletionDate ? (
        <div style={{ fontSize: '12px', color: colors.success }}>
          Latest completion: {formatDate(latestCompletionDate)}
        </div>
      ) : null}
    </div>
  )
}

const ListingsPageClient = ({ initialListings, pipelineTemplates }: ListingsPageClientProps) => {
  const theme = useThemeStyles()
  const { colors, card, cardWithLeftBorder, headerCard, headerDivider, background } = theme

  const [listings, setListings] = useState<ListingClient[]>(initialListings)
  const [detailListing, setDetailListing] = useState<ListingClient | null>(null)
  const [draggingListingId, setDraggingListingId] = useState<string | null>(null)
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(() => {
    const preferred =
      pipelineTemplates.find((template) => template.type === 'listing') ??
      pipelineTemplates.find((template) => template.name.toLowerCase().includes('listing'))
    return (
      preferred?.id ??
      pipelineTemplates[0]?.id ??
      initialListings[0]?.pipelineTemplateId ??
      ''
    )
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateListingFormState>(defaultFormState(pipelineTemplates))
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const closeCreateModal = () => {
    setShowCreateModal(false)
    if (typeof window !== 'undefined' && window.location.hash === '#new') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hash === '#new') {
      setShowCreateModal(true)
      setFormError(null)
    }
  }, [])

  const selectedPipeline = useMemo<PipelineTemplateClient | null>(() => {
    if (!pipelineTemplates.length) return null
    const explicit = pipelineTemplates.find((template) => template.id === selectedPipelineId)
    return explicit ?? pipelineTemplates[0]
  }, [pipelineTemplates, selectedPipelineId])

  const filteredListings = useMemo(() => {
    if (!selectedPipeline) return listings
    return listings.filter((listing) => listing.pipelineTemplateId === selectedPipeline.id)
  }, [listings, selectedPipeline])

  const pipelineColumns = useMemo(() => {
    const columns: Array<{
      key: string
      name: string
      listings: ListingClient[]
    }> = []

    if (selectedPipeline) {
      selectedPipeline.stages.forEach((stage) => {
        const listingsForStage = filteredListings.filter(
          (listing) => getListingColumnKey(listing, selectedPipeline) === stage.key
        )
        columns.push({
          key: stage.key,
          name: stageHeaderLabel(stage),
          listings: listingsForStage
        })
      })

      const closedListings = filteredListings.filter(
        (listing) => getListingColumnKey(listing, selectedPipeline) === null
      )
      if (closedListings.length > 0) {
        columns.push({
          key: '__closed__',
          name: 'Closed',
          listings: closedListings
        })
      }
    }

    return columns
  }, [filteredListings, selectedPipeline])

  const draggingListing = draggingListingId ? listings.find((listing) => listing.id === draggingListingId) : null
  const draggingStageKey =
    draggingListing && selectedPipeline ? getListingColumnKey(draggingListing, selectedPipeline) : null

  const refreshListings = async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true)
      setFeedback(null)
    }
    try {
      const response = await fetch('/api/listings', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }
      const data: ListingClient[] = await response.json()
      setListings(data)
    } catch (error) {
      console.error('Refresh listings failed', error)
      if (!silent) {
        setFeedback('Unable to refresh listings right now.')
      }
    } finally {
      if (!silent) {
        setIsRefreshing(false)
      }
    }
  }

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
    if (!detailListing) return

    setUpdatingListingId(detailListing.id)
    setFeedback(null)

    try {
      let documentId: string | null = null

      if (file) {
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          const errorPayload = await uploadResponse.json().catch(() => ({}))
          throw new Error(errorPayload.error || 'File upload failed')
        }

        const { url: fileUrl } = await uploadResponse.json()

        const descriptionParts = [
          file.name,
          detailListing.title || detailListing.address || detailListing.pipelineName || 'Listing document'
        ].filter(Boolean)

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
          throw new Error(errorPayload.error || 'Document save failed')
        }

        const document = await documentResponse.json()
        documentId = document.id
      }

      const response = await fetch(`/api/listings/${detailListing.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      })

      if (!response.ok) {
        throw new Error('Failed to update task document')
      }

      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
      setDetailListing(updatedListing)
      setFeedback(file ? 'Document attached to task.' : 'Document removed from task.')
    } catch (error) {
      console.error('Error updating task document', error)
      setFeedback('Unable to update the document right now.')
      throw error instanceof Error ? error : new Error('Unable to update task document')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleAdvanceStage = async (listingId: string) => {
    setUpdatingListingId(listingId)
    setFeedback(null)

    try {
      const response = await fetch(`/api/listings/${listingId}/advance`, { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to advance stage')
      }
      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
      setFeedback('Stage advanced successfully.')
    } catch (error) {
      console.error('Error advancing stage', error)
      setFeedback('Unable to advance the stage right now. Please retry.')
    } finally {
      setUpdatingListingId(null)
    }
  }

  const handleMoveListing = async (listingId: string, targetStageKey: string | null) => {
    const currentListing = listings.find((listing) => listing.id === listingId)
    if (!currentListing) return

    const currentKey = getListingColumnKey(currentListing, selectedPipeline ?? null)
    if ((currentKey ?? null) === targetStageKey) {
      setDraggingListingId(null)
      return
    }

    setUpdatingListingId(listingId)
    setFeedback(null)

    try {
      const response = await fetch(`/api/listings/${listingId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageKey: targetStageKey })
      })

      if (!response.ok) {
        throw new Error('Failed to move listing')
      }

      const updatedListing: ListingClient = await response.json()
      updateListingInState(updatedListing)
    } catch (error) {
      console.error('Error moving listing', error)
      setFeedback('Unable to move that listing. Please try again.')
    } finally {
      setUpdatingListingId(null)
      setDraggingListingId(null)
    }
  }

  const toggleCardExpansion = (listingId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [listingId]: !prev[listingId]
    }))
  }

  const openDetailModal = (listing: ListingClient) => {
    setDetailListing(listing)
  }

  const closeDetailModal = () => setDetailListing(null)
  const handleOpenPipelineFromModal = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/listings'
    }
  }

  const handleCreateListing = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFeedback(null)

    if (!createForm.pipelineTemplateId) {
      setFormError('Choose a pipeline before creating a listing.')
      return
    }

    if (!createForm.title.trim()) {
      setFormError('Give this listing a working title.')
      return
    }

    setIsCreating(true)
    try {
      const payload = {
        pipelineTemplateId: createForm.pipelineTemplateId,
        title: createForm.title.trim(),
        address: createForm.address.trim() || null,
        city: createForm.city.trim() || null,
        state: createForm.state.trim() || null,
        zipCode: createForm.zipCode.trim() || null,
        listPrice: createForm.listPrice ? Number(createForm.listPrice) : null,
        notes: createForm.notes.trim() || null
      }

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to create listing')
      }

      const newListing: ListingClient = await response.json()
      setListings((prev) => [newListing, ...prev])
      closeCreateModal()
      setCreateForm(defaultFormState(pipelineTemplates))
      setFeedback('Listing created and staged at the starting step.')
      setSelectedPipelineId(newListing.pipelineTemplateId ?? selectedPipelineId)
    } catch (error) {
      console.error('Error creating listing', error)
      setFormError('We could not create that listing. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const renderListingCard = (listing: ListingClient, stageKey: string | null) => {
    const stageInstance = getStageInstanceForListing(listing, stageKey)
    const cardExpanded = expandedCards[listing.id] ?? true
    const stageStatus = stageInstance?.status ?? 'COMPLETED'
    const stageColor = statusColorForStage(stageStatus, colors)
    const disableActions = updatingListingId === listing.id

    return (
      <div
        key={listing.id}
        style={{
          ...cardWithLeftBorder(stageColor),
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          cursor: 'pointer'
        }}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (draggingListingId) return
          openDetailModal(listing)
        }}
        onKeyDown={(event) => {
          if (draggingListingId) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openDetailModal(listing)
          }
        }}
        draggable
        onDragStart={(event) => {
          setDraggingListingId(listing.id)
          event.dataTransfer?.setData('text/plain', listing.id)
          event.dataTransfer.effectAllowed = 'move'
        }}
        onDragEnd={() => setDraggingListingId(null)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: colors.text.primary,
                marginBottom: '4px'
              }}
            >
              {listing.title || listing.address || 'Untitled Listing'}
            </div>
            <div style={{ fontSize: '13px', color: colors.text.secondary }}>
              {listing.address ? `${listing.address}${listing.city ? `, ${listing.city}` : ''}` : 'No address yet'}
            </div>
            <div style={{ fontSize: '13px', color: colors.text.secondary }}>
              List price: {formatCurrency(listing.listPrice)}
            </div>
            <div style={{ fontSize: '12px', color: colors.text.tertiary, marginTop: '6px' }}>
              Last updated {formatDate(listing.updatedAt)}
            </div>
          </div>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: `${stageColor}1F`,
              color: stageColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {stageStatusBadgeLabel(stageStatus)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleCardExpansion(listing.id)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.primary,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            {cardExpanded ? 'Hide tasks' : 'Show tasks'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.text.secondary }}>
            {stageInstance && stageInstance.tasks.length > 0 ? (
              <span>
                {stageInstance.tasks.filter((task) => task.completed).length}/{stageInstance.tasks.length} complete
              </span>
            ) : (
              <span>No tasks</span>
            )}
            {hasOpenTasks(stageInstance) ? (
              <span style={{ color: colors.warning, fontWeight: 600 }}>•</span>
            ) : (
              <span style={{ color: colors.success }}>•</span>
            )}
          </div>
        </div>

        {cardExpanded ? (
          <TaskList
            stageInstance={stageInstance}
            colors={colors}
          />
        ) : null}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ fontSize: '12px', color: colors.text.tertiary }}>
            Stage started {formatDate(stageInstance?.startedAt ?? listing.currentStageStartedAt)}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleAdvanceStage(listing.id)
            }}
            disabled={disableActions}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: disableActions ? colors.border : colors.primary,
              color: '#ffffff',
              fontWeight: 600,
              cursor: disableActions ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease'
            }}
          >
            Advance Stage
          </button>
        </div>
      </div>
    )
  }

  const renderModal = () => {
    if (!showCreateModal) return null

    const inputStyle: CSSProperties = {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '10px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.card,
      color: colors.text.primary,
      fontSize: '14px'
    }

    const labelStyle: CSSProperties = {
      fontWeight: 600,
      fontSize: '13px',
      color: colors.text.secondary,
      marginBottom: '6px'
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}
      >
        <div
          style={{
            ...card,
            borderLeft: `4px solid ${colors.primary}`,
            width: 'min(560px, 100%)',
            padding: '28px',
            borderRadius: '16px',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={closeCreateModal}
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.text.secondary,
              lineHeight: 1
            }}
            aria-label="Close create listing modal"
          >
            ×
          </button>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: colors.text.primary }}>Create Listing</h2>
            <p style={{ margin: '6px 0 0', color: colors.text.secondary, fontSize: '14px' }}>
              Choose a pipeline template and add basic details. You can always refine tasks later.
            </p>
          </div>

          <form
            onSubmit={handleCreateListing}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="pipelineTemplateId">
                Pipeline Template
              </label>
              <select
                id="pipelineTemplateId"
                value={createForm.pipelineTemplateId}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, pipelineTemplateId: event.target.value }))
                }
                style={inputStyle}
              >
                <option value="" disabled>
                  Select a pipeline
                </option>
                {pipelineTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="title">
                Listing Title
              </label>
              <input
                id="title"
                value={createForm.title}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. 123 Main Street Preparation"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  value={createForm.address}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Street address"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  value={createForm.city}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, city: event.target.value }))}
                  placeholder="City"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="state">
                  State
                </label>
                <input
                  id="state"
                  value={createForm.state}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, state: event.target.value }))}
                  placeholder="State"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={labelStyle} htmlFor="zipCode">
                  Zip Code
                </label>
                <input
                  id="zipCode"
                  value={createForm.zipCode}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, zipCode: event.target.value }))}
                  placeholder="Zip"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="listPrice">
                List Price (optional)
              </label>
              <input
                id="listPrice"
                type="number"
                min={0}
                value={createForm.listPrice}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, listPrice: event.target.value }))}
                placeholder="450000"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle} htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                value={createForm.notes}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Anything we should remember for this listing?"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {formError ? (
              <div style={{ color: colors.error, fontSize: '13px', fontWeight: 600 }}>{formError}</div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={closeCreateModal}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.text.primary,
                  fontWeight: 600,
                  cursor: isCreating ? 'not-allowed' : 'pointer'
                }}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: isCreating ? colors.border : colors.primary,
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                  minWidth: '120px'
                }}
              >
                {isCreating ? 'Creating…' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <Sidebar>
      <div style={{ ...background, minHeight: '100vh' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 40px 48px' }}>
        <section
          style={{
            ...headerCard,
            padding: '28px',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <Home style={{ width: '28px', height: '28px' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '30px', fontWeight: 700, color: '#ffffff' }}>Listings Pipeline</h1>
                <p style={{ margin: '8px 0 0', fontSize: '16px', maxWidth: '520px', color: 'rgba(255,255,255,0.85)' }}>
                  Track every listing from preparation through close. Each column reflects a pipeline stage with its
                  associated tasks.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const base = window.location.pathname + window.location.search
                    window.history.replaceState(null, '', `${base}#new`)
                  }
                  setShowCreateModal(true)
                  setFormError(null)
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: '#ffffff',
                  color: colors.primary,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + New Listing
              </button>
              <button
                type="button"
                onClick={() => refreshListings()}
                disabled={isRefreshing}
                style={{
                  padding: '12px 18px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.6)',
                  background: 'transparent',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: isRefreshing ? 'not-allowed' : 'pointer'
                }}
              >
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
          <div style={{ ...headerDivider, marginTop: '24px' }} />
        </section>

        {feedback ? (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: colors.infoLight,
              color: colors.info,
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            {feedback}
          </div>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          {pipelineTemplates.map((pipeline) => {
            const isActive = pipeline.id === selectedPipeline?.id
            return (
              <button
                key={pipeline.id}
                type="button"
                onClick={() => setSelectedPipelineId(pipeline.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: isActive ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  backgroundColor: isActive ? colors.primaryLight ?? `${colors.primary}1A` : 'transparent',
                  color: isActive ? colors.primary : colors.text.secondary,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {pipeline.name}
              </button>
            )
          })}
        </div>

        {selectedPipeline ? (
          <div
            style={{
              display: 'flex',
              gap: '18px',
              overflowX: 'auto',
              paddingBottom: '12px'
            }}
          >
            {pipelineColumns.map((column) => {
              const targetStageKey = column.key === '__closed__' ? null : column.key
              const isDifferentStage =
                !!draggingListingId && (draggingStageKey ?? null) !== (targetStageKey ?? null)
              const isDroppable =
                isDifferentStage && (targetStageKey !== null || column.key === '__closed__')

              return (
                <div
                  key={column.key}
                  onDragOver={(event) => {
                    if (!draggingListingId || !isDroppable) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    if (!draggingListingId || !isDroppable) return
                    event.preventDefault()
                    handleMoveListing(draggingListingId, targetStageKey)
                  }}
                  style={{
                    minWidth: '320px',
                    flex: '0 0 320px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: colors.text.primary }}>{column.name}</div>
                    <div style={{ fontSize: '13px', color: colors.text.secondary }}>
                      {column.listings.length} listing{column.listings.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      padding: isDroppable ? '4px' : 0,
                      borderRadius: isDroppable ? '14px' : undefined,
                      backgroundColor: isDroppable ? colors.cardHover : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {column.listings.length === 0 ? (
                      <div
                        style={{
                          ...card,
                          padding: '18px',
                          color: colors.text.secondary,
                          fontSize: '13px',
                          textAlign: 'center',
                          border: isDroppable ? `1px dashed ${colors.primary}` : `1px solid ${colors.border}`,
                          backgroundColor: isDroppable ? colors.cardHover : card.backgroundColor
                        }}
                      >
                        Nothing here yet. As listings move, they’ll land in this stage.
                      </div>
                    ) : (
                      column.listings.map((listing) => renderListingCard(listing, column.key))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div
            style={{
              ...card,
              padding: '24px',
              borderLeft: `4px solid ${colors.warning}`,
              color: colors.text.secondary,
              fontSize: '15px'
            }}
          >
            Add a pipeline template to get started with listings.
          </div>
        )}
        </div>
      </div>
      {renderModal()}
      <ListingDetailModal
        listing={detailListing}
        onClose={closeDetailModal}
        onToggleTask={handleToggleTask}
        onToggleSkip={handleToggleTaskSkip}
        onOpenPipeline={handleOpenPipelineFromModal}
        onAddTask={handleAddTaskToStage}
        onUpdateTask={handleUpdateTaskDetails}
        onAttachDocument={handleAttachTaskDocument}
        isUpdating={detailListing ? updatingListingId === detailListing.id : false}
      />
    </Sidebar>
  )
}

export default ListingsPageClient

