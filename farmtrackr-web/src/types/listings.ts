export type ContactSummary = {
  id: string
  displayName: string
  email: string | null
  phone: string | null
}

export type ListingTaskClient = {
  id: string
  name: string
  stageInstanceId: string | null
  dueInDays: number | null
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  skipped: boolean
  skippedAt: string | null
  notes: string | null
  autoRepeat: boolean
  autoComplete: boolean
  triggerOn: string | null
  documentId: string | null
  documentTitle: string | null
  documentUrl: string | null
}

export type ListingStageStatusType = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'SKIPPED'

export type ListingStageClient = {
  id: string
  key: string | null
  name: string | null
  order: number
  status: ListingStageStatusType
  startedAt: string | null
  completedAt: string | null
  tasks: ListingTaskClient[]
}

export type ListingClient = {
  id: string
  title: string | null
  status: 'DRAFT' | 'ACTIVE' | 'UNDER_CONTRACT' | 'CLOSED' | 'CANCELLED' | 'ARCHIVED'
  pipelineTemplateId: string | null
  pipelineName: string | null
  pipelineType: string | null
  currentStageKey: string | null
  currentStageStartedAt: string | null
  seller: ContactSummary | null
  buyerClient: ContactSummary | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  listPrice: number | null
  targetListDate: string | null
  projectedCloseDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  stageInstances: ListingStageClient[]
}

export type PipelineStageClient = {
  id: string
  key: string
  name: string
  sequence: number
  durationDays: number | null
  trigger: string | null
  taskCount: number
}

export type PipelineTemplateClient = {
  id: string
  name: string
  type: string
  description: string | null
  stageCount: number
  taskCount: number
  stages: PipelineStageClient[]
}

