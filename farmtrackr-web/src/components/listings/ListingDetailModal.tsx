'use client'

import { useEffect, useMemo, useState } from 'react'
import { Home, CheckSquare, ChevronDown } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { ListingClient, ListingTaskClient } from '@/types/listings'

type ListingDetailModalProps = {
  listing: ListingClient | null
  onClose: () => void
  onOpenPipeline?: () => void
  onToggleTask?: (listingId: string, task: ListingTaskClient, completed: boolean) => void
  isUpdating?: boolean
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value))
}

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const stageAccent = (status: string, colors: ReturnType<typeof useThemeStyles>['colors']) => {
  switch (status) {
    case 'COMPLETED':
      return colors.success
    case 'ACTIVE':
      return colors.primary
    default:
      return colors.warning
  }
}

export function ListingDetailModal({ listing, onClose, onOpenPipeline, onToggleTask, isUpdating }: ListingDetailModalProps) {
  const { colors, card, cardWithLeftBorder, text, spacing } = useThemeStyles()

  if (!listing) return null

  const locationLine = [listing.address, listing.city, listing.state, listing.zipCode].filter(Boolean).join(', ')
  const activeStage =
    listing.stageInstances.find((stage) => stage.status === 'ACTIVE') ||
    listing.stageInstances.find((stage) => stage.status === 'PENDING') ||
    listing.stageInstances[0]
  const canToggleTasks = Boolean(onToggleTask)
  const documentTasks = listing.stageInstances.flatMap((stage) => {
    const stageName = stage.name?.toLowerCase() || ''
    const isDocumentStage =
      stageName.includes('document') ||
      stageName.includes('paperwork') ||
      stageName.includes('contract') ||
      stageName.includes('checklist') ||
      stage.tasks.some((task) => (task.name || '').toLowerCase().includes('document'))
    if (!isDocumentStage) {
      return []
    }
    return stage.tasks.map((task) => ({ stageId: stage.id, stageName: stage.name || 'Stage', task }))
  })
  const uniqueDocumentTasks: Array<{ stageId: string; stageName: string; task: ListingTaskClient }> = []
  const seenDocumentTaskIds = new Set<string>()
  documentTasks.forEach((entry) => {
    if (!seenDocumentTaskIds.has(entry.task.id)) {
      seenDocumentTaskIds.add(entry.task.id)
      uniqueDocumentTasks.push(entry)
    }
  })

  const documentGroups = useMemo(() => {
    const groups = new Map<string, { stageId: string; stageName: string; tasks: ListingTaskClient[] }>()
    uniqueDocumentTasks.forEach(({ stageId, stageName, task }) => {
      if (!groups.has(stageId)) {
        groups.set(stageId, { stageId, stageName, tasks: [] })
      }
      groups.get(stageId)!.tasks.push(task)
    })
    return Array.from(groups.values()).sort((a, b) => {
      const aStage = listing.stageInstances.find((stage) => stage.id === a.stageId)
      const bStage = listing.stageInstances.find((stage) => stage.id === b.stageId)
      return (aStage?.order ?? 0) - (bStage?.order ?? 0)
    })
  }, [uniqueDocumentTasks, listing.stageInstances])

  const [openDocumentGroups, setOpenDocumentGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    documentGroups.forEach((group, index) => {
      initial[group.stageId] = index === 0
    })
    return initial
  })

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    documentGroups.forEach((group, index) => {
      initial[group.stageId] = openDocumentGroups[group.stageId] ?? index === 0
    })
    setOpenDocumentGroups(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...card,
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          borderLeft: `4px solid ${colors.primary}`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(2)
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.text.secondary,
            lineHeight: 1
          }}
          aria-label="Close listing details"
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: `${colors.primary}22`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary
            }}
          >
            <Home style={{ width: '26px', height: '26px' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, ...text.primary }}>
              {listing.title || listing.address || 'Listing Details'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', ...text.secondary }}>
              {locationLine || 'No address on file'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', ...text.secondary }}>List Price</span>
            <strong style={{ fontSize: '18px', ...text.primary }}>{formatCurrency(listing.listPrice)}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', ...text.secondary }}>Pipeline</span>
            <strong style={{ fontSize: '16px', ...text.primary }}>{listing.pipelineName || '—'}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', ...text.secondary }}>Stage</span>
            <strong style={{ fontSize: '16px', ...text.primary }}>{activeStage?.name || listing.currentStageKey || 'Not started'}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', ...text.secondary }}>Last Updated</span>
            <strong style={{ fontSize: '16px', ...text.primary }}>{formatDate(listing.updatedAt)}</strong>
          </div>
        </div>

        {documentGroups.length > 0 ? (
          <div
            style={{
              ...card,
              border: `1px solid ${colors.border}`,
              padding: spacing(2),
              display: 'flex',
              flexDirection: 'column',
              gap: spacing(1.5)
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
              <CheckSquare style={{ width: '18px', height: '18px', color: colors.primary }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, ...text.primary }}>
                  Document Checklist
                </h3>
                <p style={{ margin: `${spacing(0.25)} 0 0 0`, fontSize: '13px', ...text.secondary }}>
                  Track paperwork requirements by stage and mark each as it’s completed.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
              {documentGroups.map((group) => {
                const isOpen = openDocumentGroups[group.stageId] ?? false
                return (
                  <div key={group.stageId} style={{ border: `1px solid ${colors.border}`, borderRadius: spacing(0.75), overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDocumentGroups((prev) => ({
                          ...prev,
                          [group.stageId]: !isOpen
                        }))
                      }
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${spacing(1)} ${spacing(1.25)}`,
                        backgroundColor: isOpen ? colors.cardHover : colors.card,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: spacing(0.25) }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, ...text.primary }}>{group.stageName}</span>
                        <span style={{ fontSize: '12px', ...text.secondary }}>
                          {group.tasks.length} item{group.tasks.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <ChevronDown
                        style={{
                          width: '16px',
                          height: '16px',
                          transition: 'transform 0.2s ease',
                          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: `${spacing(1)} ${spacing(1.25)}`, display: 'flex', flexDirection: 'column', gap: spacing(0.5), backgroundColor: colors.cardHover }}>
                        {group.tasks.map((task) => (
                          <label
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1),
                              padding: `${spacing(0.5)} ${spacing(0.75)}`,
                              borderRadius: spacing(0.5),
                              backgroundColor: task.completed ? colors.card : 'transparent',
                              cursor: canToggleTasks ? 'pointer' : 'default'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              disabled={!canToggleTasks || isUpdating}
                              onChange={(event) => {
                                event.stopPropagation()
                                onToggleTask?.(listing.id, task, event.target.checked)
                              }}
                              onClick={(event) => event.stopPropagation()}
                              style={{ width: '16px', height: '16px', cursor: canToggleTasks && !isUpdating ? 'pointer' : 'not-allowed' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25), flex: 1 }}>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: task.completed ? colors.text.secondary : colors.text.primary
                                }}
                              >
                                {task.name}
                              </span>
                              <span style={{ fontSize: '12px', color: task.completed ? colors.success : colors.text.secondary }}>
                                {task.completed
                                  ? `Done ${formatDate(task.completedAt)}`
                                  : task.dueDate
                                  ? `Due ${formatDate(task.dueDate)}`
                                  : task.dueInDays !== null && task.dueInDays !== undefined
                                  ? `Due in ${task.dueInDays} day${task.dueInDays === 1 ? '' : 's'}`
                                  : ''}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
          {listing.stageInstances.map((stage) => {
            const accent = stageAccent(stage.status, colors)
            return (
              <div
                key={stage.id}
                style={{
                  ...cardWithLeftBorder(accent),
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing(1)
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px', ...text.primary }}>{stage.name || 'Stage'}</strong>
                    <div style={{ fontSize: '12px', ...text.secondary, marginTop: '4px' }}>
                      {stage.status === 'COMPLETED'
                        ? `Completed ${formatDate(stage.completedAt)}`
                        : stage.status === 'ACTIVE'
                        ? `Started ${formatDate(stage.startedAt) || 'recently'}`
                        : 'Pending'}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: accent
                    }}
                  >
                    {stage.status.replace('_', ' ')}
                  </span>
                </div>

                {stage.tasks.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: spacing(0.75) }}>
                    {stage.tasks.map((task) => (
                      <li
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: spacing(1)
                        }}
                      >
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing(1),
                            flex: 1,
                            cursor: canToggleTasks ? 'pointer' : 'default'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            disabled={!canToggleTasks || isUpdating}
                            onChange={(event) => {
                              event.stopPropagation()
                              onToggleTask?.(listing.id, task, event.target.checked)
                            }}
                            onClick={(event) => event.stopPropagation()}
                            style={{ width: '16px', height: '16px', cursor: canToggleTasks && !isUpdating ? 'pointer' : 'not-allowed' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25), flex: 1 }}>
                            <span
                              style={{
                                fontSize: '14px',
                                color: task.completed ? colors.text.secondary : colors.text.primary,
                                fontWeight: 500
                              }}
                            >
                              {task.name}
                            </span>
                            <span style={{ fontSize: '12px', color: task.completed ? colors.success : colors.text.secondary }}>
                              {task.completed
                                ? `Done ${formatDate(task.completedAt)}`
                                : task.dueDate
                                ? `Due ${formatDate(task.dueDate)}`
                                : task.dueInDays !== null && task.dueInDays !== undefined
                                ? `Due in ${task.dueInDays} day${task.dueInDays === 1 ? '' : 's'}`
                                : ''}
                            </span>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '13px', ...text.secondary, margin: 0 }}>No tasks for this stage.</p>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              borderRadius: '999px',
              border: `1px solid ${colors.border}`,
              backgroundColor: 'transparent',
              color: colors.text.primary,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {onOpenPipeline ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onOpenPipeline()
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Open in Listings
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ListingDetailModal

