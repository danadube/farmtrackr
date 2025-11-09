import { Prisma, PrismaClient, ListingStatus } from '@prisma/client'
import type {
  ContactSummary,
  ListingClient,
  ListingStageClient,
  ListingTaskClient,
  PipelineTemplateClient
} from '@/types/listings'
import { prisma } from '@/lib/prisma'

const LISTING_INCLUDE = Prisma.validator<Prisma.ListingInclude>()({
  pipelineTemplate: {
    select: { id: true, name: true, type: true }
  },
  seller: {
    select: { id: true, firstName: true, lastName: true, organizationName: true, email1: true, phoneNumber1: true }
  },
  buyerClient: {
    select: { id: true, firstName: true, lastName: true, organizationName: true, email1: true, phoneNumber1: true }
  },
  stageInstances: {
    orderBy: { order: 'asc' as Prisma.SortOrder },
    include: {
      tasks: {
        orderBy: { createdAt: 'asc' as Prisma.SortOrder },
        include: {
          document: {
            select: { id: true, title: true, fileUrl: true }
          }
        }
      }
    }
  }
})

const PIPELINE_INCLUDE = Prisma.validator<Prisma.ListingPipelineTemplateInclude>()({
  stages: {
    orderBy: { sequence: 'asc' as Prisma.SortOrder },
    include: {
      tasks: {
        orderBy: { createdAt: 'asc' as Prisma.SortOrder }
      }
    }
  }
})

export type ListingWithRelations = Prisma.ListingGetPayload<{ include: typeof LISTING_INCLUDE }>
export type ListingPipelineTemplateWithStages = Prisma.ListingPipelineTemplateGetPayload<{ include: typeof PIPELINE_INCLUDE }>

type StageTemplateDefinition = {
  key: string
  name: string
  order: number
  durationDays?: number
  trigger?: string
  tasks: Array<{
    name: string
    dueInDays?: number
    autoRepeat?: boolean
    autoComplete?: boolean
    triggerOn?: string
  }>
}

type PipelineTemplateDefinition = {
  name: string
  type: string
  description?: string
  stages: StageTemplateDefinition[]
}

const SELLER_PIPELINE_TEMPLATE: PipelineTemplateDefinition = {
  name: 'Listing Transaction (Seller Side)',
  type: 'listing',
  description: 'End-to-end workflow for representing the seller from pre-listing through close of escrow in California.',
  stages: [
    {
      key: 'pre_listing',
      name: 'Pre-Listing',
      order: 1,
      durationDays: 7,
      trigger: 'listingAgreementSigned',
      tasks: [
        { name: 'Conduct pre-listing consultation', dueInDays: 1 },
        { name: 'Confirm ownership & title (Prelim report)', dueInDays: 2 },
        { name: 'Gather property data & disclosures', dueInDays: 3 },
        { name: 'Execute Residential Listing Agreement (RLA)', dueInDays: 1 },
        { name: 'Provide Seller’s Advisory (SA)', dueInDays: 1 },
        { name: 'Obtain Agency Disclosure (AD)', dueInDays: 1 },
        { name: 'Sign Wire Fraud Advisory (WFA)', dueInDays: 1 },
        { name: 'Complete Property Photo & Internet Advertising Agreement (PRA)', dueInDays: 1 },
        { name: 'Input listing data into MLS', dueInDays: 2 },
        { name: 'Order Natural Hazard Disclosure (NHD)', dueInDays: 2 }
      ]
    },
    {
      key: 'active_listing',
      name: 'Active Listing',
      order: 2,
      durationDays: 21,
      trigger: 'listingPublished',
      tasks: [
        { name: 'Complete TDS and SPQ', dueInDays: 2 },
        { name: 'Provide additional disclosures (MCA, ESD, FLD, FHDS, WCMD, AVID)', dueInDays: 5 },
        { name: 'Coordinate optional inspections (home, pest, roof)', dueInDays: 7 },
        { name: 'Launch marketing campaign (MLS, photos, flyers, open houses)', dueInDays: 1 },
        { name: 'Review offers received', dueInDays: 3, autoRepeat: true },
        { name: 'Negotiate and accept offer', triggerOn: 'offerAccepted' }
      ]
    },
    {
      key: 'escrow',
      name: 'Escrow / Under Contract',
      order: 3,
      durationDays: 30,
      trigger: 'escrowOpened',
      tasks: [
        { name: 'Verify EMD deposit with escrow', dueInDays: 3 },
        { name: 'Provide all disclosures to buyer', dueInDays: 5 },
        { name: 'Coordinate buyer inspections', dueInDays: 10 },
        { name: 'Respond to Request for Repairs (RFR/SCO)', dueInDays: 5 },
        { name: 'Monitor appraisal and loan progress', dueInDays: 7, autoRepeat: true },
        { name: 'Track contingency removals (CR)', dueInDays: 17 },
        { name: 'Prepare closing documents', dueInDays: 28 },
        { name: 'Verify final walkthrough (VP)', dueInDays: 29 },
        { name: 'Confirm closing and fund disbursement', triggerOn: 'closingConfirmed' },
        { name: 'Send post-closing package to seller', dueInDays: 31 }
      ]
    }
  ]
}

const DASHBOARD_SEED_LISTINGS: Array<{
  title: string
  address: string
  city: string
  state: string
  zipCode: string
  listPrice: number
  targetStage: 'pre_listing' | 'active_listing' | 'escrow'
  notes?: string
}> = [
  {
    title: '46552 Arapahoe Circle',
    address: '46552 Arapahoe Circle',
    city: 'Indian Wells',
    state: 'CA',
    zipCode: '92210',
    listPrice: 569000,
    targetStage: 'active_listing',
    notes: 'Mountain Cove single-family retreat with vaulted ceilings, dual patios, and turnkey furnishings.'
  },
  {
    title: '479 Desert Holly Drive',
    address: '479 Desert Holly Drive',
    city: 'Palm Desert',
    state: 'CA',
    zipCode: '92211',
    listPrice: 930000,
    targetStage: 'escrow',
    notes: 'Indian Ridge Country Club condo on the 7th fairway with retractable awnings and full-time amenities.'
  },
  {
    title: '55359 Winged Foot',
    address: '55359 Winged Foot',
    city: 'La Quinta',
    state: 'CA',
    zipCode: '92253',
    listPrice: 439000,
    targetStage: 'pre_listing',
    notes: 'PGA West fifth-floor condominium with double fairway views and fully remodeled interiors.'
  }
]

async function ensureListingPipelineTemplate(client: PrismaClient = prisma) {
  const existing = await client.listingPipelineTemplate.findFirst({
    where: { name: SELLER_PIPELINE_TEMPLATE.name },
    select: { id: true }
  })

  if (existing) {
    const stageCount = await client.listingStageTemplate.count({
      where: { pipelineTemplateId: existing.id }
    })
    if (stageCount > 0) {
      return existing.id
    }
  }

  const template = existing
    ? await client.listingPipelineTemplate.update({
        where: { id: existing.id },
        data: {
          description: SELLER_PIPELINE_TEMPLATE.description ?? null,
          type: SELLER_PIPELINE_TEMPLATE.type
        }
      })
    : await client.listingPipelineTemplate.create({
        data: {
          name: SELLER_PIPELINE_TEMPLATE.name,
          description: SELLER_PIPELINE_TEMPLATE.description ?? null,
          type: SELLER_PIPELINE_TEMPLATE.type
        }
      })

  await client.listingStageTemplate.deleteMany({
    where: { pipelineTemplateId: template.id }
  })

  const stages = SELLER_PIPELINE_TEMPLATE.stages
  for (let index = 0; index < stages.length; index++) {
    const stage = stages[index]
    const stageRecord = await client.listingStageTemplate.create({
      data: {
        pipelineTemplateId: template.id,
        key: stage.key,
        name: stage.name,
        sequence: stage.order ?? index + 1,
        durationDays: stage.durationDays ?? null,
        trigger: stage.trigger ?? null
      }
    })

    if (stage.tasks.length) {
      await client.listingTaskTemplate.createMany({
        data: stage.tasks.map((task) => ({
          stageTemplateId: stageRecord.id,
          name: task.name,
          dueInDays: task.dueInDays ?? null,
          autoRepeat: task.autoRepeat ?? false,
          autoComplete: task.autoComplete ?? false,
          triggerOn: task.triggerOn ?? null
        }))
      })
    }
  }

  return template.id
}

async function ensureSeedListings(client: PrismaClient = prisma) {
  if (DASHBOARD_SEED_LISTINGS.length === 0) {
    return
  }

  const pipelineTemplateId = await ensureListingPipelineTemplate(client)

  if (!pipelineTemplateId) {
    return
  }

  for (const seed of DASHBOARD_SEED_LISTINGS) {
    const existing = await client.listing.findFirst({
      where: {
        address: seed.address,
        city: seed.city,
        state: seed.state
      },
      include: {
        stageInstances: true
      }
    })

    if (existing) {
      // Ensure the listing is attached to the seller pipeline for filtering, but don't overwrite progress.
      if (existing.pipelineTemplateId !== pipelineTemplateId) {
        await client.listing.update({
          where: { id: existing.id },
          data: {
            pipelineTemplateId,
            title: existing.title ?? seed.title,
            listPrice: seed.listPrice ? new Prisma.Decimal(seed.listPrice) : existing.listPrice,
            notes: existing.notes ?? seed.notes ?? null
          }
        })
      }
      continue
    }

    const created = await createListingFromTemplate(
      {
        pipelineTemplateId,
        title: seed.title,
        address: seed.address,
        city: seed.city,
        state: seed.state,
        zipCode: seed.zipCode,
        listPrice: seed.listPrice,
        notes: seed.notes
      },
      client
    )

    if (seed.targetStage === 'active_listing') {
      await advanceListingStage(created.id, client)
    } else if (seed.targetStage === 'escrow') {
      await advanceListingStage(created.id, client)
      await advanceListingStage(created.id, client)
    }
  }
}

export type CreateListingInput = {
  pipelineTemplateId: string
  title?: string
  sellerId?: string
  buyerClientId?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  listPrice?: number
  targetListDate?: string
  projectedCloseDate?: string
  notes?: string
}

function addDays(base: Date, days: number | null | undefined) {
  if (days === null || days === undefined) {
    return undefined
  }
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

function toDecimal(value: number | undefined) {
  if (value === undefined || value === null) return undefined
  return new Prisma.Decimal(value)
}

function deriveStatusForStage(stageKey?: string | null): ListingStatus {
  if (!stageKey) {
    return 'CLOSED'
  }
  const normalized = stageKey.toLowerCase()
  if (normalized.includes('escrow') || normalized.includes('contract')) {
    return 'UNDER_CONTRACT'
  }
  return 'ACTIVE'
}

type TxClient = Prisma.TransactionClient

async function setStageActive(tx: TxClient, stageInstanceId: string, now: Date) {
  await tx.listingStageInstance.update({
    where: { id: stageInstanceId },
    data: {
      status: 'ACTIVE',
      startedAt: now,
      completedAt: null
    }
  })

  const tasks = await tx.listingTaskInstance.findMany({
    where: { stageInstanceId }
  })

  for (const task of tasks) {
    if (task.dueDate === null && task.dueInDays !== null) {
      await tx.listingTaskInstance.update({
        where: { id: task.id },
        data: { dueDate: addDays(now, task.dueInDays) }
      })
    }
  }
}

export async function getListingPipelineTemplates(client: PrismaClient = prisma) {
  return client.listingPipelineTemplate.findMany({
    orderBy: { name: 'asc' },
    include: PIPELINE_INCLUDE
  })
}

export async function getListings(client: PrismaClient = prisma) {
  await ensureSeedListings(client)
  return client.listing.findMany({
    orderBy: { createdAt: 'desc' },
    include: LISTING_INCLUDE
  })
}

export async function createListingFromTemplate(input: CreateListingInput, client: PrismaClient = prisma) {
  const template = await client.listingPipelineTemplate.findUnique({
    where: { id: input.pipelineTemplateId },
    include: PIPELINE_INCLUDE
  })

  if (!template) {
    throw new Error('Pipeline template not found')
  }

  const now = new Date()
  const sortedStages = [...template.stages].sort((a, b) => a.sequence - b.sequence)
  const initialStageKey = sortedStages[0]?.key ?? null
  const initialStatus = deriveStatusForStage(initialStageKey)

  const result = await client.$transaction(async (tx: TxClient) => {
    const listing = await tx.listing.create({
      data: {
        title: input.title ?? template.name,
        status: initialStatus,
        pipelineTemplateId: template.id,
        sellerId: input.sellerId ?? null,
        buyerClientId: input.buyerClientId ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        zipCode: input.zipCode ?? null,
        listPrice: input.listPrice !== undefined ? toDecimal(input.listPrice) : undefined,
        targetListDate: input.targetListDate ? new Date(input.targetListDate) : null,
        projectedCloseDate: input.projectedCloseDate ? new Date(input.projectedCloseDate) : null,
        notes: input.notes ?? null,
        currentStageKey: initialStageKey,
        currentStageStartedAt: sortedStages.length > 0 ? now : null
      }
    })

    let firstStageInstanceId: string | null = null

    for (const stage of sortedStages) {
      const stageInstance = await tx.listingStageInstance.create({
        data: {
          listingId: listing.id,
          stageTemplateId: stage.id,
          key: stage.key,
          name: stage.name,
          order: stage.sequence,
          status: 'PENDING',
          startedAt: null
        }
      })

      if (!firstStageInstanceId) {
        firstStageInstanceId = stageInstance.id
      }

      if (stage.tasks.length > 0) {
        for (const task of stage.tasks) {
          await tx.listingTaskInstance.create({
            data: {
              listingId: listing.id,
              stageInstanceId: stageInstance.id,
              taskTemplateId: task.id,
              name: task.name,
              dueInDays: task.dueInDays ?? null,
              dueDate: undefined,
              autoRepeat: task.autoRepeat,
              autoComplete: task.autoComplete,
              triggerOn: task.triggerOn ?? null
            }
          })
        }
      }
    }

    if (firstStageInstanceId) {
      await setStageActive(tx, firstStageInstanceId, now)
      await tx.listing.update({
        where: { id: listing.id },
        data: {
          currentStageStartedAt: now,
          status: deriveStatusForStage(initialStageKey)
        }
      })
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: listing.id },
      include: LISTING_INCLUDE
    })
  })

  return result
}

export type UpdateListingTaskInput = {
  listingId: string
  taskId: string
  completed: boolean
  notes?: string
}

export async function completeListingTask(input: UpdateListingTaskInput, client: PrismaClient = prisma) {
  const now = new Date()

  return client.$transaction(async (tx: TxClient) => {
    const existingTask = await tx.listingTaskInstance.findUnique({
      where: { id: input.taskId }
    })

    if (!existingTask) {
      throw new Error('Task not found')
    }

    if (existingTask.listingId !== input.listingId) {
      throw new Error('Task does not belong to the specified listing')
    }

    const updatedTask = await tx.listingTaskInstance.update({
      where: { id: input.taskId },
      data: {
        completed: input.completed,
        completedAt: input.completed ? now : null,
        notes: input.notes !== undefined ? input.notes : existingTask.notes
      }
    })

    if (updatedTask.stageInstanceId) {
      const stageInstance = await tx.listingStageInstance.findUnique({
        where: { id: updatedTask.stageInstanceId },
        include: {
          tasks: true,
          listing: {
            include: {
              stageInstances: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      })

      if (stageInstance) {
        if (!input.completed && stageInstance.status === 'COMPLETED') {
          const activeStartedAt = stageInstance.startedAt ?? now
          await setStageActive(tx, stageInstance.id, activeStartedAt)

          const futureStages = stageInstance.listing.stageInstances.filter(
            (stage) => stage.order > stageInstance.order && stage.status !== 'COMPLETED'
          )

          for (const future of futureStages) {
            await tx.listingStageInstance.update({
              where: { id: future.id },
              data: {
                status: 'PENDING',
                startedAt: null
              }
            })
          }

          await tx.listing.update({
            where: { id: input.listingId },
            data: {
              currentStageKey: stageInstance.key ?? null,
              currentStageStartedAt: activeStartedAt,
              status: deriveStatusForStage(stageInstance.key)
            }
          })
        } else if (input.completed && stageInstance.status === 'ACTIVE') {
          const allCompleted = stageInstance.tasks.every((taskItem) =>
            taskItem.id === updatedTask.id ? input.completed : taskItem.completed
          )

          if (allCompleted) {
            await tx.listingStageInstance.update({
              where: { id: stageInstance.id },
              data: {
                status: 'COMPLETED',
                completedAt: now
              }
            })

            const nextStage = stageInstance.listing.stageInstances
              .filter((stage) => stage.order > stageInstance.order)
              .sort((a, b) => a.order - b.order)
              .find((stage) => stage.status !== 'COMPLETED')

            if (nextStage) {
              await setStageActive(tx, nextStage.id, now)
              await tx.listing.update({
                where: { id: input.listingId },
                data: {
                  currentStageKey: nextStage.key ?? null,
                  currentStageStartedAt: now,
                  status: deriveStatusForStage(nextStage.key)
                }
              })
            } else {
              await tx.listing.update({
                where: { id: input.listingId },
                data: {
                  currentStageKey: null,
                  currentStageStartedAt: null,
                  status: 'CLOSED'
                }
              })
            }
          }
        }
      }
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: input.listingId },
      include: LISTING_INCLUDE
    })
  })
}

export type CreateListingTaskInput = {
  listingId: string
  stageInstanceId: string
  name: string
  dueDate?: string | null
  notes?: string | null
}

export async function createListingTask(input: CreateListingTaskInput, client: PrismaClient = prisma) {
  return client.$transaction(async (tx: TxClient) => {
    const stageInstance = await tx.listingStageInstance.findUnique({
      where: { id: input.stageInstanceId },
      select: { id: true, listingId: true }
    })

    if (!stageInstance || stageInstance.listingId !== input.listingId) {
      throw new Error('Stage instance not found for this listing')
    }

    await tx.listingTaskInstance.create({
      data: {
        listingId: input.listingId,
        stageInstanceId: input.stageInstanceId,
        name: input.name,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        notes: input.notes ?? null
      }
    })

    return tx.listing.findUniqueOrThrow({
      where: { id: input.listingId },
      include: LISTING_INCLUDE
    })
  })
}

export type UpdateListingTaskDetailsInput = {
  listingId: string
  taskId: string
  name?: string
  dueDate?: string | null
  notes?: string | null
}

export async function updateListingTaskDetails(input: UpdateListingTaskDetailsInput, client: PrismaClient = prisma) {
  if (
    input.name === undefined &&
    input.dueDate === undefined &&
    input.notes === undefined
  ) {
    throw new Error('No updates provided for task')
  }

  return client.$transaction(async (tx: TxClient) => {
    const task = await tx.listingTaskInstance.findUnique({ where: { id: input.taskId } })

    if (!task) {
      throw new Error('Task not found')
    }

    if (task.listingId !== input.listingId) {
      throw new Error('Task does not belong to the specified listing')
    }

    await tx.listingTaskInstance.update({
      where: { id: input.taskId },
      data: {
        name: input.name ?? task.name,
        dueDate: input.dueDate !== undefined ? (input.dueDate ? new Date(input.dueDate) : null) : task.dueDate,
        notes: input.notes !== undefined ? input.notes : task.notes
      }
    })

    return tx.listing.findUniqueOrThrow({
      where: { id: input.listingId },
      include: LISTING_INCLUDE
    })
  })
}

export type SetListingTaskDocumentInput = {
  listingId: string
  taskId: string
  documentId: string | null
}

export async function setListingTaskDocument(input: SetListingTaskDocumentInput, client: PrismaClient = prisma) {
  return client.$transaction(async (tx: TxClient) => {
    const task = await tx.listingTaskInstance.findUnique({ where: { id: input.taskId } })

    if (!task) {
      throw new Error('Task not found')
    }

    if (task.listingId !== input.listingId) {
      throw new Error('Task does not belong to the specified listing')
    }

    if (input.documentId) {
      const documentExists = await tx.document.findUnique({ where: { id: input.documentId } })
      if (!documentExists) {
        throw new Error('Document not found')
      }
    }

    await tx.listingTaskInstance.update({
      where: { id: input.taskId },
      data: { documentId: input.documentId }
    })

    return tx.listing.findUniqueOrThrow({
      where: { id: input.listingId },
      include: LISTING_INCLUDE
    })
  })
}

export async function advanceListingStage(listingId: string, client: PrismaClient = prisma) {
  const now = new Date()

  return client.$transaction(async (tx: TxClient) => {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      include: {
        stageInstances: {
          orderBy: { order: 'asc' },
          include: { tasks: true }
        }
      }
    })

    if (!listing) {
      throw new Error('Listing not found')
    }

    const activeStage = listing.stageInstances.find((stage) => stage.status === 'ACTIVE')

    if (!activeStage) {
      throw new Error('No active stage to advance')
    }

    await tx.listingTaskInstance.updateMany({
      where: { stageInstanceId: activeStage.id, completed: false },
      data: { completed: true, completedAt: now }
    })

    await tx.listingStageInstance.update({
      where: { id: activeStage.id },
      data: { status: 'COMPLETED', completedAt: now }
    })

    const nextStage = listing.stageInstances
      .filter((stage) => stage.order > activeStage.order)
      .sort((a, b) => a.order - b.order)
      .find((stage) => stage.status !== 'COMPLETED')

    if (nextStage) {
      await setStageActive(tx, nextStage.id, now)
      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentStageKey: nextStage.key ?? null,
          currentStageStartedAt: now,
          status: deriveStatusForStage(nextStage.key)
        }
      })
    } else {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentStageKey: null,
          currentStageStartedAt: null,
          status: 'CLOSED'
        }
      })
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: listingId },
      include: LISTING_INCLUDE
    })
  })
}

export async function moveListingToStage(
  listingId: string,
  targetStageKey: string | null,
  client: PrismaClient = prisma
) {
  const now = new Date()

  return client.$transaction(async (tx: TxClient) => {
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      include: {
        stageInstances: {
          orderBy: { order: 'asc' },
          include: { tasks: true }
        }
      }
    })

    if (!listing) {
      throw new Error('Listing not found')
    }

    if (targetStageKey === null) {
      for (const stage of listing.stageInstances) {
        await tx.listingStageInstance.update({
          where: { id: stage.id },
          data: {
            status: 'COMPLETED',
            startedAt: stage.startedAt ?? now,
            completedAt: stage.completedAt ?? now
          }
        })
      }

      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentStageKey: null,
          currentStageStartedAt: null,
          status: 'CLOSED'
        }
      })
    } else {
      const targetStage = listing.stageInstances.find((stage) => stage.key === targetStageKey)

      if (!targetStage) {
        throw new Error('Target stage not found for listing')
      }

      if (targetStage.status === 'ACTIVE' && listing.currentStageKey === targetStage.key) {
        return tx.listing.findUniqueOrThrow({
          where: { id: listingId },
          include: LISTING_INCLUDE
        })
      }

      for (const stage of listing.stageInstances) {
        if (stage.id === targetStage.id) {
          await setStageActive(tx, stage.id, now)
        } else if (stage.order < targetStage.order) {
          await tx.listingStageInstance.update({
            where: { id: stage.id },
            data: {
              status: 'COMPLETED',
              startedAt: stage.startedAt ?? now,
              completedAt: stage.completedAt ?? now
            }
          })
        } else {
          await tx.listingStageInstance.update({
            where: { id: stage.id },
            data: {
              status: 'PENDING',
              startedAt: null,
              completedAt: null
            }
          })
          await tx.listingTaskInstance.updateMany({
            where: { stageInstanceId: stage.id },
            data: { completed: false, completedAt: null }
          })
        }
      }

      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentStageKey: targetStage.key ?? null,
          currentStageStartedAt: now,
          status: deriveStatusForStage(targetStage.key)
        }
      })
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: listingId },
      include: LISTING_INCLUDE
    })
  })
}

const iso = (value: Date | string | null | undefined) => {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : value
}

const decimalToNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  return value.toNumber()
}

const buildContactSummary = (contact?: {
  id: string
  firstName: string | null
  lastName: string | null
  organizationName: string | null
  email1: string | null
  phoneNumber1: string | null
}): ContactSummary | null => {
  if (!contact) return null
  const nameParts = [contact.firstName, contact.lastName].filter(Boolean)
  const displayName =
    contact.organizationName ||
    (nameParts.length > 0 ? nameParts.join(' ') : null) ||
    'Contact'
  return {
    id: contact.id,
    displayName,
    email: contact.email1 ?? null,
    phone: contact.phoneNumber1 ?? null
  }
}

export function serializeListing(listing: ListingWithRelations): ListingClient {
  return {
    id: listing.id,
    title: listing.title ?? null,
    status: listing.status as ListingClient['status'],
    pipelineTemplateId: listing.pipelineTemplateId ?? null,
    pipelineName: listing.pipelineTemplate?.name ?? null,
    pipelineType: listing.pipelineTemplate?.type ?? null,
    currentStageKey: listing.currentStageKey ?? null,
    currentStageStartedAt: iso(listing.currentStageStartedAt),
    seller: buildContactSummary(listing.seller ?? undefined),
    buyerClient: buildContactSummary(listing.buyerClient ?? undefined),
    address: listing.address ?? null,
    city: listing.city ?? null,
    state: listing.state ?? null,
    zipCode: listing.zipCode ?? null,
    listPrice: decimalToNumber(listing.listPrice),
    targetListDate: iso(listing.targetListDate),
    projectedCloseDate: iso(listing.projectedCloseDate),
    notes: listing.notes ?? null,
    createdAt: iso(listing.createdAt) as string,
    updatedAt: iso(listing.updatedAt) as string,
    stageInstances: listing.stageInstances.map((stage) => ({
      id: stage.id,
      key: stage.key ?? null,
      name: stage.name ?? null,
      order: stage.order,
      status: stage.status as ListingStageClient['status'],
      startedAt: iso(stage.startedAt),
      completedAt: iso(stage.completedAt),
      tasks: stage.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        stageInstanceId: task.stageInstanceId,
        dueInDays: task.dueInDays ?? null,
        dueDate: iso(task.dueDate),
        completed: task.completed,
        completedAt: iso(task.completedAt),
        notes: task.notes ?? null,
        autoRepeat: task.autoRepeat,
        autoComplete: task.autoComplete,
        triggerOn: task.triggerOn ?? null,
        documentId: task.documentId ?? null,
        documentTitle: task.document?.title ?? null,
        documentUrl: task.document?.fileUrl ?? null
      }))
    }))
  }
}

export function serializePipelineTemplate(template: ListingPipelineTemplateWithStages): PipelineTemplateClient {
  const stageCount = template.stages.length
  const taskCount = template.stages.reduce((sum, stage) => sum + stage.tasks.length, 0)
  return {
    id: template.id,
    name: template.name,
    type: template.type,
    description: template.description ?? null,
    stageCount,
    taskCount,
    stages: template.stages.map((stage) => ({
      id: stage.id,
      key: stage.key,
      name: stage.name,
      sequence: stage.sequence,
      durationDays: stage.durationDays ?? null,
      trigger: stage.trigger ?? null,
      taskCount: stage.tasks.length
    }))
  }
}

