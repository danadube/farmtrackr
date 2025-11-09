'use client'

import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Home,
  CheckSquare,
  ChevronDown,
  Paperclip,
  ExternalLink,
  Plus,
  Pencil,
  Save,
  X as CloseIcon,
  Trash2,
  CircleSlash2,
  Megaphone,
  ClipboardList
} from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import type { ListingClient, ListingTaskClient } from '@/types/listings'

type TaskCategory = 'document' | 'marketing' | 'workflow'

const DOCUMENT_KEYWORDS = ['agreement', 'disclosure', 'contract', 'escrow', 'contingency', 'document', 'advisory', 'package', 'instructions', 'deed', 'hud', 'rpa', 'settlement', 'closing', 'verification', 'repair', 'offer', 'addenda', 'invoice', 'statement']
const MARKETING_KEYWORDS = ['marketing', 'photo', 'photography', 'videography', 'staging', 'signage', 'flyer', 'brochure', 'open house', 'floorplan', 'floor plan', 'cubi casa', 'website', 'social', 'syndication', 'mls remarks', 'virtual tour', 'tour', 'media']

const normalizeTaskName = (value: string) => value.trim().toLowerCase().replace(/’/g, "'")

const EXACT_TASK_CATEGORY = new Map<string, TaskCategory>(
  (
    [
      ['Execute Residential Listing Agreement (RLA)', 'document'],
      ['Provide Seller’s Advisory (SA)', 'document'],
      ['Obtain Agency Disclosure (AD)', 'document'],
      ['Sign Wire Fraud Advisory (WFA)', 'document'],
      ['Prepare Seller’s Estimated Net Sheet', 'document'],
      ['Collect MLS Exclusion (SELM) if applicable', 'document'],
      ['Gather property data & disclosures', 'document'],
      ['Complete Transfer Disclosure Statement (TDS)', 'document'],
      ['Complete Seller Property Questionnaire (SPQ)', 'document'],
      ['Order Natural Hazard Disclosure (NHD)', 'document'],
      ['Provide all disclosures to buyer', 'document'],
      ['Verify EMD deposit with escrow', 'document'],
      ['Respond to Request for Repairs (RFR/SCO)', 'document'],
      ['Track contingency removals (CR)', 'document'],
      ['Prepare closing documents', 'document'],
      ['Verify final walkthrough (VP)', 'document'],
      ['Confirm closing and fund disbursement', 'document'],
      ['Send post-closing package to seller', 'document'],
      ['Upload fully executed purchase agreement (RPA)', 'document'],
      ['Log counter offer signatures', 'document'],
      ['Deliver escrow instructions', 'document'],
      ['Collect signed contingency removal forms', 'document'],
      ['Confirm closing disclosure / settlement statement (HUD/CD)', 'document'],
      ['Schedule professional photography and videography', 'marketing'],
      ['Order Cubi Casa floorplan for MLS', 'marketing'],
      ['Launch marketing campaign (MLS, photos, flyers, open houses)', 'marketing'],
      ['Design listing brochure and flyer', 'marketing'],
      ['Publish property website & MLS remarks', 'marketing'],
      ['Plan open house schedule', 'marketing']
    ] as Array<[string, TaskCategory]>
  ).map(([name, category]) => [normalizeTaskName(name), category])
)

const categorizeTaskName = (name: string | null | undefined): TaskCategory => {
  if (!name) return 'workflow'
  const normalized = normalizeTaskName(name)
  const exact = EXACT_TASK_CATEGORY.get(normalized)
  if (exact) {
    return exact
  }
  if (DOCUMENT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'document'
  }
  if (MARKETING_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'marketing'
  }
  return 'workflow'
}

export function ListingDetailModal({
  listing,
  onClose,
  onOpenPipeline,
  onToggleTask,
  onToggleSkip,
  isUpdating,
  onAddTask,
  onUpdateTask,
  onAttachDocument
}: ListingDetailModalProps) {
  const { colors, card, cardWithLeftBorder, text, spacing } = useThemeStyles()

  if (!listing) return null

  const locationLine = [listing.address, listing.city, listing.state, listing.zipCode].filter(Boolean).join(', ')
  const activeStage =
    listing.stageInstances.find((stage) => stage.status === 'ACTIVE') ||
    listing.stageInstances.find((stage) => stage.status === 'PENDING') ||
    listing.stageInstances[0]
  const canToggleTasks = Boolean(onToggleTask)
  type ChecklistGroup = { stageId: string; stageName: string; order: number; tasks: ListingTaskClient[] }

  const { documentGroups, marketingGroups, workflowGroups } = useMemo(() => {
    const documentMap = new Map<string, ChecklistGroup>()
    const marketingMap = new Map<string, ChecklistGroup>()
    const workflowMap = new Map<string, ChecklistGroup>()

    listing.stageInstances.forEach((stage) => {
      const stageId = stage.id
      const stageName = stage.name || 'Stage'
      const order = stage.order ?? 0

      stage.tasks.forEach((task) => {
        const category = categorizeTaskName(task.name)
        const targetMap =
          category === 'document' ? documentMap : category === 'marketing' ? marketingMap : workflowMap

        if (!targetMap.has(stageId)) {
          targetMap.set(stageId, { stageId, stageName, order, tasks: [] })
        }

        targetMap.get(stageId)!.tasks.push(task)
      })
    })

    const sortGroups = (map: Map<string, ChecklistGroup>) =>
      Array.from(map.values())
        .map((group) => ({
          ...group,
          tasks: [...group.tasks]
        }))
        .sort((a, b) => {
          if (a.order !== b.order) {
            return a.order - b.order
          }
          return a.stageName.localeCompare(b.stageName)
        })

    return {
      documentGroups: sortGroups(documentMap),
      marketingGroups: sortGroups(marketingMap),
      workflowGroups: sortGroups(workflowMap)
    }
  }, [listing.stageInstances])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setOpenGroups((prev) => {
      const next: Record<string, boolean> = {}
      const register = (categoryKey: 'document' | 'marketing' | 'workflow', groups: ChecklistGroup[]) => {
        groups.forEach((group, index) => {
          const key = `${categoryKey}:${group.stageId}`
          next[key] = prev[key] ?? index === 0
        })
      }

      register('document', documentGroups)
      register('marketing', marketingGroups)
      register('workflow', workflowGroups)

      return next
    })
  }, [documentGroups, marketingGroups, workflowGroups])

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

  const renderTaskRow = (task: ListingTaskClient, stageId: string) => {
    const isEditing = editingTaskId === task.id
    const isSaving = savingTaskId === task.id || !!isUpdating
    const isUploading = uploadingTaskId === task.id
    const isSkipped = task.skipped
    const dueInputValue = isEditing ? editTaskDueDate : toDateInputValue(task.dueDate)

    const statusLabel = isSkipped
      ? 'Marked not required'
      : task.completed
      ? task.completedAt
        ? `Done ${formatDate(task.completedAt)}`
        : 'Marked complete'
      : task.dueDate
      ? `Due ${formatDate(task.dueDate)}`
      : task.dueInDays !== null && task.dueInDays !== undefined
      ? `Due in ${task.dueInDays} day${task.dueInDays === 1 ? '' : 's'}`
      : 'No due date'

    const statusColor = isSkipped
      ? colors.warning
      : task.completed
      ? colors.success
      : colors.text.secondary

    return (
      <div
        key={task.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(0.5),
          padding: `${spacing(0.5)} ${spacing(0.75)}`,
          borderRadius: spacing(0.5),
          backgroundColor: task.completed ? colors.card : 'transparent',
          opacity: isSkipped ? 0.7 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing(1), flexWrap: 'wrap' }}>
          <input
            type="checkbox"
            checked={task.completed}
            disabled={!canToggleTasks || isSaving || isUploading || isSkipped}
            onChange={(event) => {
              event.stopPropagation()
              onToggleTask?.(listing.id, task, event.target.checked)
            }}
            onClick={(event) => event.stopPropagation()
            }
            style={{
              width: '16px',
              height: '16px',
              cursor: canToggleTasks && !isSaving && !isUploading && !isSkipped ? 'pointer' : 'not-allowed',
              marginTop: spacing(0.5)
            }}
          />

          <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
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
                    color: task.completed ? colors.text.secondary : colors.text.primary,
                    textDecoration: isSkipped ? 'line-through' : 'none'
                  }}
                >
                  {task.name}
                </span>
                <span style={{ fontSize: '12px', color: statusColor }}>{statusLabel}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(0.5), alignItems: 'center' }}>
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
                {onToggleSkip ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onToggleSkip(listing.id, task, !task.skipped)
                    }}
                    disabled={!onToggleSkip || isUploading || isUpdating}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${task.skipped ? colors.warning : colors.border}`,
                      backgroundColor: task.skipped ? `${colors.warning}1A` : 'transparent',
                      color: task.skipped ? colors.warning : colors.text.secondary,
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: spacing(0.25),
                      cursor: isUploading || isUpdating ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <CircleSlash2 style={{ width: '14px', height: '14px' }} />
                    {task.skipped ? 'Mark Required' : 'Not Required'}
                  </button>
                ) : null}

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
                    if (!onAttachDocument || isSkipped) return
                    fileInputsRef.current[task.id]?.click()
                  }}
                  disabled={!onAttachDocument || isUploading || isUpdating || isSkipped}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: 'transparent',
                    color: colors.text.secondary,
                    fontSize: '12px',
                    cursor: !onAttachDocument || isUploading || isUpdating || isSkipped ? 'not-allowed' : 'pointer'
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
            <span style={{ fontSize: '12px', ...text.tertiary }}>
              {isSkipped ? 'Document not required' : 'No document attached'}
            </span>
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
  }

  const renderAddTaskControls = (stageId: string) => {
    if (!onAddTask) return null
    const isActive = activeAddStageId === stageId
    const isCreating = creatingStageId === stageId

    if (isActive) {
      return (
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
            disabled={isCreating || !!isUpdating}
            style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '13px' }}
          />
          <div style={{ display: 'flex', gap: spacing(0.75), flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25) }}>
              <span style={{ fontSize: '12px', color: colors.text.secondary }}>Due Date</span>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(event) => setNewTaskDueDate(event.target.value)}
                disabled={isCreating || !!isUpdating}
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
                  setCreatingStageId(stageId)
                  await onAddTask(stageId, {
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
              disabled={!newTaskName.trim() || isCreating || !!isUpdating}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: !newTaskName.trim() || isCreating || isUpdating ? 'not-allowed' : 'pointer',
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
              disabled={isCreating}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: isCreating ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => {
          setActiveAddStageId(stageId)
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
    )
  }

  const renderedAddFormStages = new Set<string>()

  const renderChecklistSection = (
    sectionKey: 'document' | 'marketing' | 'workflow',
    {
      title,
      description,
      icon,
      groups
    }: {
      title: string
      description: string
      icon: ReactNode
      groups: ChecklistGroup[]
    }
  ) => {
    if (!groups.length) {
      return null
    }

    return (
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
          {icon}
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, ...text.primary }}>{title}</h3>
            <p style={{ margin: `${spacing(0.25)} 0 0 0`, fontSize: '13px', ...text.secondary }}>{description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
          {groups.map((group) => {
            const groupKey = `${sectionKey}:${group.stageId}`
            const isOpen = openGroups[groupKey] ?? false
            const allowAddTask = onAddTask && !renderedAddFormStages.has(group.stageId)
            if (allowAddTask) {
              renderedAddFormStages.add(group.stageId)
            }

            return (
              <div
                key={groupKey}
                style={{ border: `1px solid ${colors.border}`, borderRadius: spacing(0.75), overflow: 'hidden' }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((prev) => ({
                      ...prev,
                      [groupKey]: !isOpen
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
                {isOpen ? (
                  <div
                    style={{
                      padding: `${spacing(1)} ${spacing(1.25)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing(1),
                      backgroundColor: colors.cardHover
                    }}
                  >
                    {group.tasks.map((task) => renderTaskRow(task, group.stageId))}
                    {allowAddTask ? renderAddTaskControls(group.stageId) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    )
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

        {renderChecklistSection('document', {
          title: 'Document Checklist',
          description: 'Track paperwork requirements by stage and mark each as completed or not required.',
          icon: <CheckSquare style={{ width: '18px', height: '18px', color: colors.primary }} />,
          groups: documentGroups
        })}
        {renderChecklistSection('marketing', {
          title: 'Marketing Checklist',
          description: 'Manage marketing deliverables, media, and launch tasks.',
          icon: <Megaphone style={{ width: '18px', height: '18px', color: colors.warning }} />,
          groups: marketingGroups
        })}
        {renderChecklistSection('workflow', {
          title: 'Workflow Tasks',
          description: 'Operational and follow-up items supporting this listing.',
          icon: <ClipboardList style={{ width: '18px', height: '18px', color: colors.text.secondary }} />,
          groups: workflowGroups
        })}

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
                            disabled={!canToggleTasks || isUpdating || task.skipped}
                            onChange={(event) => {
                              event.stopPropagation()
                              onToggleTask?.(listing.id, task, event.target.checked)
                            }}
                            onClick={(event) => event.stopPropagation()}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: canToggleTasks && !isUpdating && !task.skipped ? 'pointer' : 'not-allowed'
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.25), flex: 1 }}>
                            <span
                              style={{
                                fontSize: '14px',
                                color: task.skipped
                                  ? colors.text.secondary
                                  : task.completed
                                  ? colors.text.secondary
                                  : colors.text.primary,
                                fontWeight: 500,
                                textDecoration: task.skipped ? 'line-through' : 'none'
                              }}
                            >
                              {task.name}
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                color: task.skipped ? colors.warning : task.completed ? colors.success : colors.text.secondary
                              }}
                            >
                              {task.skipped
                                ? 'Marked not required'
                                : task.completed
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

