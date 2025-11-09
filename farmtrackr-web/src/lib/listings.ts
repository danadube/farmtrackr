'use server'

import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

const LISTING_INCLUDE = {
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
    orderBy: { order: 'asc' as const },
    include: {
      tasks: {
        orderBy: { createdAt: 'asc' }
      }
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

  const result = await client.$transaction(async (tx) => {
    const listing = await tx.listing.create({
      data: {
        title: input.title ?? template.name,
        status: 'ACTIVE',
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
        currentStageKey: sortedStages[0]?.key ?? null,
        currentStageStartedAt: sortedStages.length > 0 ? now : null
      }
    })

    for (const stage of sortedStages) {
      const isFirst = stage.id === sortedStages[0]?.id
      const stageInstance = await tx.listingStageInstance.create({
        data: {
          listingId: listing.id,
          stageTemplateId: stage.id,
          key: stage.key,
          name: stage.name,
          order: stage.sequence,
          status: isFirst ? 'ACTIVE' : 'PENDING',
          startedAt: isFirst ? now : null
        }
      })

      if (stage.tasks.length > 0) {
        for (const task of stage.tasks) {
          await tx.listingTaskInstance.create({
            data: {
              listingId: listing.id,
              stageInstanceId: stageInstance.id,
              taskTemplateId: task.id,
              name: task.name,
              dueInDays: task.dueInDays ?? null,
              dueDate: isFirst ? addDays(now, task.dueInDays ?? undefined) : undefined,
              autoRepeat: task.autoRepeat,
              autoComplete: task.autoComplete,
              triggerOn: task.triggerOn ?? null
            }
          })
        }
      }
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: listing.id },
      include: LISTING_INCLUDE
    })
  })

  return result
}

