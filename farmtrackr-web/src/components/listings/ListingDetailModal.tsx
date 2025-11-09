'use client'

import { Home } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { ListingClient } from '@/types/listings'

type ListingDetailModalProps = {
  listing: ListingClient | null
  onClose: () => void
  onOpenPipeline?: () => void
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

export function ListingDetailModal({ listing, onClose, onOpenPipeline }: ListingDetailModalProps) {
  const { colors, card, cardWithLeftBorder, text, spacing } = useThemeStyles()

  if (!listing) return null

  const locationLine = [listing.address, listing.city, listing.state, listing.zipCode].filter(Boolean).join(', ')
  const activeStage =
    listing.stageInstances.find((stage) => stage.status === 'ACTIVE') ||
    listing.stageInstances.find((stage) => stage.status === 'PENDING') ||
    listing.stageInstances[0]

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
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                          color: task.completed ? colors.text.secondary : colors.text.primary
                        }}
                      >
                        <span>{task.name}</span>
                        <span style={{ fontSize: '12px', color: task.completed ? colors.success : colors.text.secondary }}>
                          {task.completed
                            ? `Done ${formatDate(task.completedAt)}`
                            : task.dueDate
                            ? `Due ${formatDate(task.dueDate)}`
                            : task.dueInDays !== null && task.dueInDays !== undefined
                            ? `Due in ${task.dueInDays} day${task.dueInDays === 1 ? '' : 's'}`
                            : ''}
                        </span>
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

