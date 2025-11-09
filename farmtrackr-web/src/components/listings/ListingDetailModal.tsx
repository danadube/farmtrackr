'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Home, CheckSquare, ChevronDown, Paperclip, ExternalLink, Plus, Pencil, Save, X as CloseIcon, Trash2 } from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { ListingClient, ListingTaskClient } from '@/types/listings'

type ListingDetailModalProps = {
  listing: ListingClient | null
  onClose: () => void
  onOpenPipeline?: () => void
  onToggleTask?: (listingId: string, task: ListingTaskClient, completed: boolean) => void
  isUpdating?: boolean
  onAddTask?: (stageInstanceId: string, payload: { name: string; dueDate?: string | null }) => Promise<void> | void
  onUpdateTask?: (taskId: string, updates: { name?: string; dueDate?: string | null }) => Promise<void> | void
  onAttachDocument?: (taskId: string, file: File | null) => Promise<void> | void
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

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskName, setEditTaskName] = useState('')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const [activeAddStageId, setActiveAddStageId] = useState<string | null>(null)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [creatingStageId, setCreatingStageId] = useState<string | null>(null)
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({})

  const toDateInputValue = (value: string | null) => {
    if (!value) return ''
    try {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const resetEditState = () => {
    setEditingTaskId(null)
    setEditTaskName('')
    setEditTaskDueDate('')
  }

  const resetNewTaskState = () => {
    setActiveAddStageId(null)
    setNewTaskName('')
    setNewTaskDueDate('')
    setCreatingStageId(null)
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
                      <div style={{ padding: `${spacing(1)} ${spacing(1.25)}`, display: 'flex', flexDirection: 'column', gap: spacing(1), backgroundColor: colors.cardHover }}>
                        {group.tasks.map((task) => {
                          const isEditing = editingTaskId === task.id
                          const isSaving = savingTaskId === task.id || !!isUpdating
                          const isUploading = uploadingTaskId === task.id
                          const dueInputValue = isEditing ? editTaskDueDate : toDateInputValue(task.dueDate)

                          return (
                            <div
                              key={task.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: spacing(0.5),
                                padding: `${spacing(0.5)} ${spacing(0.75)}`,
                                borderRadius: spacing(0.5),
                                backgroundColor: task.completed ? colors.card : 'transparent'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: spacing(1)
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  disabled={!canToggleTasks || isSaving || isUploading}
                                  onChange={(event) => {
                                    event.stopPropagation()
                                    onToggleTask?.(listing.id, task, event.target.checked)
                                  }}
                                  onClick={(event) => event.stopPropagation()}
                                  style={{ width: '16px', height: '16px', cursor: canToggleTasks && !isSaving && !isUploading ? 'pointer' : 'not-allowed', marginTop: spacing(0.5) }}
                                />

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
                                      <input
                                        type="text"
                                        value={editTaskName}
                                        onChange={(event) => setEditTaskName(event.target.value)}
                                        disabled={isSaving}
                                        style={{
                                          padding: '8px',
                                          borderRadius: '8px',
                                          border: `1px solid ${colors.border}`,
                                          fontSize: '13px',
                                          width: '100%'
                                        }}
                                      />
                                      <div style={{ display: 'flex', gap: spacing(0.75), flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
                                          <span style={{ fontSize: '12px', color: colors.text.secondary }}>Due Date</span>
                                          <input
                                            type="date"
                                            value={editTaskDueDate}
                                            onChange={(event) => setEditTaskDueDate(event.target.value)}
                                            disabled={isSaving}
                                            style={{
                                              padding: '6px 8px',
                                              borderRadius: '8px',
                                              border: `1px solid ${colors.border}`,
                                              fontSize: '13px'
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
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
                                          : 'No due date'}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', gap: spacing(0.5), alignItems: 'center' }}>
                                  {isEditing ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={async (event) => {
                                          event.stopPropagation()
                                          if (!onUpdateTask) {
                                            resetEditState()
                                            return
                                          }
                                          const trimmedName = editTaskName.trim()
                                          const updates: { name?: string; dueDate?: string | null } = {}
                                          if (trimmedName && trimmedName !== task.name) {
                                            updates.name = trimmedName
                                          }
                                          if (editTaskDueDate !== toDateInputValue(task.dueDate)) {
                                            updates.dueDate = editTaskDueDate ? editTaskDueDate : null
                                          }

                                          if (Object.keys(updates).length === 0) {
                                            resetEditState()
                                            return
                                          }

                                          try {
                                            setSavingTaskId(task.id)
                                            await onUpdateTask(task.id, updates)
                                            resetEditState()
                                          } catch (error) {
                                            console.error('Failed to update task details', error)
                                          } finally {
                                            setSavingTaskId(null)
                                          }
                                        }}
                                        disabled={isSaving || !editTaskName.trim()}
                                        style={{
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          border: 'none',
                                          backgroundColor: colors.primary,
                                          color: '#ffffff',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          cursor: isSaving ? 'wait' : 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <Save style={{ width: '14px', height: '14px' }} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          resetEditState()
                                        }}
                                        disabled={isSaving}
                                        style={{
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          border: `1px solid ${colors.border}`,
                                          backgroundColor: 'transparent',
                                          color: colors.text.secondary,
                                          fontSize: '12px',
                                          cursor: isSaving ? 'wait' : 'pointer'
                                        }}
                                      >
                                        <CloseIcon style={{ width: '14px', height: '14px' }} />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setEditingTaskId(task.id)
                                          setEditTaskName(task.name)
                                          setEditTaskDueDate(dueInputValue)
                                        }}
                                        disabled={isSaving || isUploading || isUpdating}
                                        style={{
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          border: `1px solid ${colors.border}`,
                                          backgroundColor: 'transparent',
                                          color: colors.text.secondary,
                                          fontSize: '12px',
                                          cursor: isSaving || isUploading || isUpdating ? 'not-allowed' : 'pointer'
                                        }}
                                      >
                                        <Pencil style={{ width: '14px', height: '14px' }} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          if (!onAttachDocument) return
                                          fileInputsRef.current[task.id]?.click()
                                        }}
                                        disabled={!onAttachDocument || isUploading || isUpdating}
                                        style={{
                                          padding: '6px 10px',
                                          borderRadius: '8px',
                                          border: `1px solid ${colors.border}`,
                                          backgroundColor: 'transparent',
                                          color: colors.text.secondary,
                                          fontSize: '12px',
                                          cursor: !onAttachDocument || isUploading || isUpdating ? 'not-allowed' : 'pointer'
                                        }}
                                      >
                                        <Paperclip style={{ width: '14px', height: '14px' }} />
                                      </button>
                                      {task.documentId ? (
                                        <button
                                          type="button"
                                          onClick={async (event) => {
                                            event.stopPropagation()
                                            if (!onAttachDocument) return
                                            try {
                                              setUploadingTaskId(task.id)
                                              await onAttachDocument(task.id, null)
                                            } catch (error) {
                                              console.error('Failed to remove document', error)
                                            } finally {
                                              setUploadingTaskId(null)
                                            }
                                          }}
                                          disabled={!onAttachDocument || isUploading || isUpdating}
                                          style={{
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            border: `1px solid ${colors.border}`,
                                            backgroundColor: 'transparent',
                                            color: colors.text.secondary,
                                            fontSize: '12px',
                                            cursor: !onAttachDocument || isUploading || isUpdating ? 'not-allowed' : 'pointer'
                                          }}
                                        >
                                          <Trash2 style={{ width: '14px', height: '14px' }} />
                                        </button>
                                      ) : null}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
                                {task.documentId && task.documentTitle ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(0.5), fontSize: '12px', color: colors.text.secondary }}>
                                    <ExternalLink style={{ width: '12px', height: '12px' }} />
                                    <span>{task.documentTitle}</span>
                                    {task.documentUrl ? (
                                      <a
                                        href={task.documentUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: colors.primary, textDecoration: 'none', fontWeight: 600 }}
                                      >
                                        View
                                      </a>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', ...text.tertiary }}>No document attached</span>
                                )}
                                {isUploading ? (
                                  <span style={{ fontSize: '12px', ...text.secondary }}>Uploading...</span>
                                ) : null}
                              </div>

                              {onAttachDocument ? (
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                  style={{ display: 'none' }}
                                  ref={(element) => {
                                    fileInputsRef.current[task.id] = element
                                  }}
                                  onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                                    event.stopPropagation()
                                    const file = event.target.files?.[0]
                                    if (!file || !onAttachDocument) {
                                      event.target.value = ''
                                      return
                                    }
                                    try {
                                      setUploadingTaskId(task.id)
                                      await onAttachDocument(task.id, file)
                                    } catch (error) {
                                      console.error('Failed to attach document', error)
                                    } finally {
                                      setUploadingTaskId(null)
                                      event.target.value = ''
                                    }
                                  }}
                                />
                              ) : null}
                            </div>
                          )
                        })}

                        {activeAddStageId === group.stageId ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: spacing(0.75),
                              padding: `${spacing(0.5)} ${spacing(0.75)}`,
                              borderRadius: spacing(0.5),
                              border: `1px dashed ${colors.border}`,
                              backgroundColor: colors.card
                            }}
                          >
                            <input
                              type="text"
                              value={newTaskName}
                              onChange={(event) => setNewTaskName(event.target.value)}
                              placeholder="Task name"
                              disabled={creatingStageId === group.stageId || !!isUpdating}
                              style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
                            />
                            <div style={{ display: 'flex', gap: spacing(0.75), flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
                                <span style={{ fontSize: '12px', color: colors.text.secondary }}>Due Date</span>
                                <input
                                  type="date"
                                  value={newTaskDueDate}
                                  onChange={(event) => setNewTaskDueDate(event.target.value)}
                                  disabled={creatingStageId === group.stageId || !!isUpdating}
                                  style={{ padding: '6px 8px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: spacing(0.5) }}>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!onAddTask) {
                                    resetNewTaskState()
                                    return
                                  }
                                  if (!newTaskName.trim()) return
                                  try {
                                    setCreatingStageId(group.stageId)
                                    await onAddTask(group.stageId, {
                                      name: newTaskName.trim(),
                                      dueDate: newTaskDueDate || null
                                    })
                                    resetNewTaskState()
                                  } catch (error) {
                                    console.error('Failed to add task', error)
                                  } finally {
                                    setCreatingStageId(null)
                                  }
                                }}
                                disabled={!newTaskName.trim() || creatingStageId === group.stageId || !!isUpdating}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  backgroundColor: colors.primary,
                                  color: '#ffffff',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: !newTaskName.trim() || creatingStageId === group.stageId || isUpdating ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: spacing(0.5)
                                }}
                              >
                                <Save style={{ width: '14px', height: '14px' }} />
                                Save Task
                              </button>
                              <button
                                type="button"
                                onClick={resetNewTaskState}
                                disabled={creatingStageId === group.stageId}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  border: `1px solid ${colors.border}`,
                                  backgroundColor: 'transparent',
                                  color: colors.text.secondary,
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  cursor: creatingStageId === group.stageId ? 'not-allowed' : 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAddStageId(group.stageId)
                              setNewTaskName('')
                              setNewTaskDueDate('')
                            }}
                            disabled={!!isUpdating || creatingStageId !== null || savingTaskId !== null || uploadingTaskId !== null}
                            style={{
                              marginTop: spacing(0.5),
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: `1px dashed ${colors.primary}`,
                              backgroundColor: `${colors.primary}12`,
                              color: colors.primary,
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: spacing(0.5),
                              cursor: isUpdating ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Plus style={{ width: '14px', height: '14px' }} />
                            Add Task
                          </button>
                        )}
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

