'use server'

import { Prisma, PrismaClient, ListingStatus } from '@prisma/client'
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
        orderBy: { createdAt: 'asc' as Prisma.SortOrder }
      }
    }
  }
})

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
    include: {
      stages: {
        orderBy: { sequence: 'asc' },
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  })
}

export async function getListings(client: PrismaClient = prisma) {
  return client.listing.findMany({
    orderBy: { createdAt: 'desc' },
    include: LISTING_INCLUDE
  })
}

export async function createListingFromTemplate(input: CreateListingInput, client: PrismaClient = prisma) {
  const template = await client.listingPipelineTemplate.findUnique({
    where: { id: input.pipelineTemplateId },
    include: {
      stages: {
        orderBy: { sequence: 'asc' },
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
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

export async function getListingById(listingId: string, client: PrismaClient = prisma) {
  return client.listing.findUnique({
    where: { id: listingId },
    include: LISTING_INCLUDE
  })
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

