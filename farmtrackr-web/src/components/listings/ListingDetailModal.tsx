'use client'

import { Home, CheckSquare } from 'lucide-react'
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

        {uniqueDocumentTasks.length > 0 ? (
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
                  Track required paperwork across listing and buyer pipelines.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
              {uniqueDocumentTasks.map(({ stageId, stageName, task }) => (
                <label
                  key={`${stageId}-${task.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(1),
                    padding: `${spacing(0.75)} ${spacing(1)}`,
                    borderRadius: spacing(0.75),
                    backgroundColor: task.completed ? colors.cardHover : 'transparent',
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
                    <span style={{ fontSize: '14px', fontWeight: 500, ...text.primary }}>{task.name}</span>
                    <span style={{ fontSize: '12px', ...text.secondary }}>
                      {stageName}
                      {task.dueDate
                        ? ` • Due ${formatDate(task.dueDate)}`
                        : task.dueInDays !== null && task.dueInDays !== undefined
                        ? ` • Due in ${task.dueInDays} day${task.dueInDays === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </div>
                </label>
              ))}
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

