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
  description: 'End-to-end workflow for representing the seller from intake through close of escrow in California.',
  stages: [
    {
      key: 'pre_listing_intake',
      name: 'Pre-Listing / Intake',
      order: 1,
      durationDays: 5,
      tasks: [
        { name: 'Seller Interview & CMA', dueInDays: 1 },
        { name: 'Property Information Sheet', dueInDays: 1 },
        { name: 'Preliminary Title Report Request', dueInDays: 2 },
        { name: 'HOA Documents Request', dueInDays: 2 },
        { name: 'Disclosure Package Review', dueInDays: 3 }
      ]
    },
    {
      key: 'listing_agreement_execution',
      name: 'Listing Agreement Execution',
      order: 2,
      durationDays: 5,
      trigger: 'listingAgreementSigned',
      tasks: [
        { name: 'Residential Listing Agreement (RLA)', dueInDays: 1 },
        { name: 'Seller Advisory (SA)', dueInDays: 1 },
        { name: 'Agency Disclosure', dueInDays: 1 },
        { name: 'Estimated Seller Proceeds Worksheet', dueInDays: 2 },
        { name: 'MLS Input Sheet', dueInDays: 2 },
        { name: 'Listing Authorization & Hold Harmless', dueInDays: 2 },
        { name: 'Wire Fraud Advisory', dueInDays: 2 },
        { name: 'Coming Soon Agreement (if applicable)', dueInDays: 3 }
      ]
    },
    {
      key: 'disclosure_period',
      name: 'Disclosure Period',
      order: 3,
      durationDays: 10,
      tasks: [
        { name: 'Transfer Disclosure Statement (TDS)', dueInDays: 3 },
        { name: 'Natural Hazard Disclosure (NHD)', dueInDays: 3 },
        { name: 'Seller Property Questionnaire (SPQ)', dueInDays: 3 },
        { name: 'Exempt Seller Disclosure (if built pre-1960)', dueInDays: 4 },
        { name: 'Lead-Based Paint Disclosure (pre-1978)', dueInDays: 4 },
        { name: 'Megan\'s Law Database Notice', dueInDays: 4 },
        { name: 'Military Ordnance Disclosure (if applicable)', dueInDays: 4 },
        { name: 'Water-Conserving Plumbing Fixtures Disclosure', dueInDays: 5 },
        { name: 'Smoke/Carbon Monoxide Detector Compliance', dueInDays: 5 },
        { name: 'HOA Documents Package', dueInDays: 6 },
        { name: 'Preliminary Title Report', dueInDays: 6 },
        { name: 'Property Tax Information', dueInDays: 7 },
        { name: 'Home Warranty Information (optional)', dueInDays: 8 }
      ]
    },
    {
      key: 'active_marketing',
      name: 'Active Marketing',
      order: 4,
      durationDays: 21,
      trigger: 'listingPublished',
      tasks: [
        { name: 'Professional Photos', dueInDays: 2 },
        { name: 'MLS Listing Live', dueInDays: 2 },
        { name: 'Lockbox Installation & Authorization', dueInDays: 2 },
        { name: 'Showing Instructions', dueInDays: 3 },
        { name: 'Broker Tour / Open House', dueInDays: 7 },
        { name: 'Offer Presentation Protocol', dueInDays: 10 }
      ]
    },
    {
      key: 'offer_acceptance_escrow',
      name: 'Offer Acceptance & Opening Escrow',
      order: 5,
      durationDays: 7,
      trigger: 'offerAccepted',
      tasks: [
        { name: 'Residential Purchase Agreement (RPA)', dueInDays: 1 },
        { name: 'Counter Offer', dueInDays: 1 },
        { name: 'Seller Multiple Counter Offer (SMCO)', dueInDays: 1 },
        { name: 'Agency Confirmation', dueInDays: 1 },
        { name: 'Estimated Buyer Costs', dueInDays: 2 },
        { name: 'Escrow Instructions', dueInDays: 2 },
        { name: 'Opening Package to Escrow', dueInDays: 3 },
        { name: 'MLS Status Update (Pending)', dueInDays: 3 },
        { name: 'Sign Rider Update (In Escrow)', dueInDays: 3 }
      ]
    },
    {
      key: 'escrow_contingencies',
      name: 'Escrow Period - Contingencies',
      order: 6,
      durationDays: 21,
      trigger: 'escrowOpened',
      tasks: [
        { name: 'Buyer\'s Inspection Advisory', dueInDays: 2 },
        { name: 'Request for Repair', dueInDays: 7 },
        { name: 'Response to Request for Repair', dueInDays: 9 },
        { name: 'Verification of Property Condition (VP)', dueInDays: 12 },
        { name: 'Contingency Removal - Inspection', dueInDays: 14 },
        { name: 'Contingency Removal - Appraisal', dueInDays: 16 },
        { name: 'Contingency Removal - Loan', dueInDays: 18 },
        { name: 'Appraisal Report Review', dueInDays: 10 },
        { name: 'Loan Approval Verification', dueInDays: 19 }
      ]
    },
    {
      key: 'close_preparation',
      name: 'Final Walk-Through & Close Preparation',
      order: 7,
      durationDays: 7,
      tasks: [
        { name: 'Final Walk-Through Confirmation', dueInDays: 2 },
        { name: 'Smoke Detector Compliance Certificate', dueInDays: 2 },
        { name: 'Final Utility Readings', dueInDays: 3 },
        { name: 'HOA Move-Out Requirements', dueInDays: 3 },
        { name: 'Final Closing Statement Review', dueInDays: 4 },
        { name: 'Commission Instructions to Escrow', dueInDays: 5 }
      ]
    },
    {
      key: 'close_of_escrow',
      name: 'Close of Escrow',
      order: 8,
      durationDays: 5,
      trigger: 'closingConfirmed',
      tasks: [
        { name: 'Grant Deed Recording', dueInDays: 1 },
        { name: 'Final Closing Disclosure', dueInDays: 1 },
        { name: 'Wire Instructions / Check Pickup', dueInDays: 2 },
        { name: 'Keys, Garage Openers, Mailbox Key Transfer', dueInDays: 2 },
        { name: 'Final Commission Statement', dueInDays: 3 },
        { name: 'MLS Status Update (Sold)', dueInDays: 3 },
        { name: 'Post-Close Client Gift', dueInDays: 4 }
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
  targetStage:
    | 'pre_listing_intake'
    | 'listing_agreement_execution'
    | 'disclosure_period'
    | 'active_marketing'
    | 'offer_acceptance_escrow'
    | 'escrow_contingencies'
    | 'close_preparation'
    | 'close_of_escrow'
  notes?: string
}> = [
  {
    title: '46552 Arapahoe Circle',
    address: '46552 Arapahoe Circle',
    city: 'Indian Wells',
    state: 'CA',
    zipCode: '92210',
    listPrice: 569000,
    targetStage: 'pre_listing_intake',
    notes: 'Mountain Cove single-family retreat with vaulted ceilings, dual patios, and turnkey furnishings.'
  },
  {
    title: '479 Desert Holly Drive',
    address: '479 Desert Holly Drive',
    city: 'Palm Desert',
    state: 'CA',
    zipCode: '92211',
    listPrice: 930000,
    targetStage: 'pre_listing_intake',
    notes: 'Indian Ridge Country Club condo on the 7th fairway with retractable awnings and full-time amenities.'
  },
  {
    title: '55359 Winged Foot',
    address: '55359 Winged Foot',
    city: 'La Quinta',
    state: 'CA',
    zipCode: '92253',
    listPrice: 439000,
    targetStage: 'pre_listing_intake',
    notes: 'PGA West fifth-floor condominium with double fairway views and fully remodeled interiors.'
  }
]

async function ensureListingPipelineTemplate(client: PrismaClient = prisma) {
  const pipelineId = await client.$transaction(
    async (tx) => {
      const existing = await tx.listingPipelineTemplate.findFirst({
        where: { name: SELLER_PIPELINE_TEMPLATE.name },
        select: { id: true }
      })

      const template = existing
        ? await tx.listingPipelineTemplate.update({
            where: { id: existing.id },
            data: {
              description: SELLER_PIPELINE_TEMPLATE.description ?? null,
              type: SELLER_PIPELINE_TEMPLATE.type
            }
          })
        : await tx.listingPipelineTemplate.create({
            data: {
              name: SELLER_PIPELINE_TEMPLATE.name,
              description: SELLER_PIPELINE_TEMPLATE.description ?? null,
              type: SELLER_PIPELINE_TEMPLATE.type
            }
          })

      if (existing) {
        const existingStages = await tx.listingStageTemplate.findMany({
          where: { pipelineTemplateId: template.id },
          orderBy: { sequence: 'asc' }
        })

        const templateStages = SELLER_PIPELINE_TEMPLATE.stages
        
        // CRITICAL: Only rebuild if template has NO stages at all
        // If stages exist, preserve them - never delete/recreate to avoid breaking existing listings
        if (existingStages.length > 0) {
          // Template has stages - just ensure they have the right keys
          // Update names if needed, but don't delete/recreate
          const templateStageKeys = new Set(templateStages.map(s => s.key))
          const existingStageKeys = new Set(existingStages.map(s => s.key).filter(Boolean))
          
          // Check if we need to add any missing stages (but don't delete existing ones)
          for (const templateStage of templateStages) {
            if (!existingStageKeys.has(templateStage.key)) {
              // Add missing stage
              const stageRecord = await tx.listingStageTemplate.create({
                data: {
                  pipelineTemplateId: template.id,
                  key: templateStage.key,
                  name: templateStage.name,
                  sequence: templateStage.order ?? templateStages.indexOf(templateStage) + 1,
                  durationDays: templateStage.durationDays ?? null,
                  trigger: templateStage.trigger ?? null
                }
              })
              
              // Add tasks for the new stage
              if (templateStage.tasks.length > 0) {
                await tx.listingTaskTemplate.createMany({
                  data: templateStage.tasks.map((task) => ({
                    stageTemplateId: stageRecord.id,
                    name: task.name,
                    dueInDays: task.dueInDays ?? null,
                    autoRepeat: task.autoRepeat ?? false,
                    autoComplete: task.autoComplete ?? false,
                    triggerOn: task.triggerOn ?? null
                  }))
                })
              }
            } else {
              // Update existing stage metadata
              const existingStage = existingStages.find(s => s.key === templateStage.key)
              if (existingStage) {
                await tx.listingStageTemplate.update({
                  where: { id: existingStage.id },
                  data: {
                    name: templateStage.name,
                    sequence: templateStage.order ?? templateStages.indexOf(templateStage) + 1,
                    durationDays: templateStage.durationDays ?? null,
                    trigger: templateStage.trigger ?? null
                  }
                })
              }
            }
          }
          
          // Template exists and has stages - return without rebuilding
          return template.id
        }
      }
      
      // Only create stages if template is brand new (no stages exist)
      // This only happens on first setup
      const stages = SELLER_PIPELINE_TEMPLATE.stages
      
      for (let index = 0; index < stages.length; index++) {
        const stage = stages[index]
        const stageRecord = await tx.listingStageTemplate.create({
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
          await tx.listingTaskTemplate.createMany({
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
    },
    {
      maxWait: 10_000,
      timeout: 30_000
    }
  )

  return pipelineId
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
      // Only update pipeline template if it's different (doesn't affect stage position)
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

      // CRITICAL: If listing has ANY stage instances, never modify them
      // This preserves manually moved listings and prevents resetting on refresh
      if (existing.stageInstances.length > 0) {
        // Only fix orphaned stages (NULL stageTemplateId) by re-linking them
        // But NEVER move or reset the listing's current stage
        const hasOrphanedStages = existing.stageInstances.some((stage) => stage.stageTemplateId === null)
        if (hasOrphanedStages) {
          // Re-link orphaned stages to templates by matching stage keys
          const stageTemplates = await client.listingStageTemplate.findMany({
            where: { pipelineTemplateId },
            select: { id: true, key: true }
          })
          
          const keyToTemplateId = new Map(stageTemplates.map((st) => [st.key, st.id]))
          
          for (const stageInstance of existing.stageInstances) {
            if (stageInstance.stageTemplateId === null && stageInstance.key) {
              const templateId = keyToTemplateId.get(stageInstance.key)
              if (templateId) {
                await client.listingStageInstance.update({
                  where: { id: stageInstance.id },
                  data: { stageTemplateId: templateId }
                })
              }
            }
          }
        }
        // Preserve the listing's current stage - don't modify it at all
        continue
      }

      // Only initialize stages if listing has NO stage instances at all
      // This only happens for brand new listings that were just created
      if (existing.stageInstances.length === 0) {
        await rebuildListingStagesFromTemplate(existing.id, pipelineTemplateId, client, seed.targetStage)
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

    try {
      await moveListingToStage(created.id, seed.targetStage, client)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Target stage not found')) {
        await rebuildListingStagesFromTemplate(created.id, pipelineTemplateId, client)
        await moveListingToStage(created.id, seed.targetStage, client)
      } else {
        throw error
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

async function rebuildListingStagesFromTemplate(
  listingId: string,
  pipelineTemplateId: string,
  client: PrismaClient = prisma,
  preserveStageKey?: string | null
) {
  const template = await client.listingPipelineTemplate.findUnique({
    where: { id: pipelineTemplateId },
    include: PIPELINE_INCLUDE
  })

  if (!template) {
    return
  }

  // Get current listing state to preserve stage if requested
  const listing = await client.listing.findUnique({
    where: { id: listingId },
    select: { currentStageKey: true }
  })

  // Use preserved key if provided, otherwise try to preserve existing currentStageKey
  const stageKeyToPreserve = preserveStageKey ?? listing?.currentStageKey ?? null

  const now = new Date()
  const sortedStages = [...template.stages].sort((a, b) => a.sequence - b.sequence)

  await client.listingTaskInstance.deleteMany({ where: { listingId } })
  await client.listingStageInstance.deleteMany({ where: { listingId } })

  const stageKeyToInstance = new Map<string, { id: string; key: string | null; order: number }>()
  let firstStageInstance: { id: string; key: string | null; order: number } | null = null

  for (const stage of sortedStages) {
    const stageInstance = await client.listingStageInstance.create({
      data: {
        listingId,
        stageTemplateId: stage.id,
        key: stage.key,
        name: stage.name,
        order: stage.sequence,
        status: 'PENDING',
        startedAt: null
      }
    })

    const instanceData = { id: stageInstance.id, key: stage.key ?? null, order: stage.sequence }
    if (stage.key) {
      stageKeyToInstance.set(stage.key, instanceData)
    }

    if (!firstStageInstance) {
      firstStageInstance = instanceData
    }

    if (stage.tasks.length > 0) {
      for (const task of stage.tasks) {
        await client.listingTaskInstance.create({
          data: {
            listingId,
            stageInstanceId: stageInstance.id,
            taskTemplateId: task.id,
            name: task.name,
            dueInDays: task.dueInDays ?? null,
            dueDate: null,
            autoRepeat: task.autoRepeat ?? false,
            autoComplete: task.autoComplete ?? false,
            triggerOn: task.triggerOn ?? null
          }
        })
      }
    }
  }

  // Determine which stage should be active
  let targetStageInstance: { id: string; key: string | null; order: number } | null = null
  
  if (stageKeyToPreserve) {
    // Try to preserve the existing stage
    targetStageInstance = stageKeyToInstance.get(stageKeyToPreserve) ?? null
  }
  
  // Fall back to first stage if preserved stage doesn't exist
  if (!targetStageInstance) {
    targetStageInstance = firstStageInstance
  }

  if (targetStageInstance) {
    // Set target stage to ACTIVE and complete all earlier stages
    for (const stage of sortedStages) {
      const instance = stageKeyToInstance.get(stage.key ?? '')
      if (!instance) continue

      if (instance.id === targetStageInstance.id) {
        await client.listingStageInstance.update({
          where: { id: instance.id },
          data: {
            status: 'ACTIVE',
            startedAt: now,
            completedAt: null
          }
        })
      } else if (instance.order < targetStageInstance.order) {
        // Complete stages before the target
        await client.listingStageInstance.update({
          where: { id: instance.id },
          data: {
            status: 'COMPLETED',
            startedAt: instance.id === firstStageInstance?.id ? now : null,
            completedAt: now
          }
        })
      } else {
        // Keep later stages as PENDING
        await client.listingStageInstance.update({
          where: { id: instance.id },
          data: {
            status: 'PENDING',
            startedAt: null,
            completedAt: null
          }
        })
      }
    }

    // Set due dates for active stage tasks
    const tasks = await client.listingTaskInstance.findMany({
      where: { stageInstanceId: targetStageInstance.id }
    })

    for (const task of tasks) {
      if (task.dueDate === null && task.dueInDays !== null) {
        await client.listingTaskInstance.update({
          where: { id: task.id },
          data: { dueDate: addDays(now, task.dueInDays) ?? null }
        })
      }
    }

    await client.listing.update({
      where: { id: listingId },
      data: {
        currentStageKey: targetStageInstance.key,
        currentStageStartedAt: now,
        status: deriveStatusForStage(targetStageInstance.key ?? undefined)
      }
    })
  } else {
    await client.listing.update({
      where: { id: listingId },
      data: {
        currentStageKey: null,
        currentStageStartedAt: null,
        status: 'CLOSED'
      }
    })
  }
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

async function reconcileStageAfterTaskChange(tx: TxClient, listingId: string, stageInstanceId: string, now: Date) {
  const stageInstance = await tx.listingStageInstance.findUnique({
    where: { id: stageInstanceId },
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

  if (!stageInstance) {
    return
  }

  // Get current listing state to preserve stage if reconciliation fails
  const currentListing = await tx.listing.findUnique({
    where: { id: listingId },
    select: { currentStageKey: true }
  })
  const preserveStageKey = currentListing?.currentStageKey

  const allTasksSatisfied = stageInstance.tasks.every((task) => task.completed || task.skipped)

  if (allTasksSatisfied) {
    if (stageInstance.status !== 'COMPLETED') {
      await tx.listingStageInstance.update({
        where: { id: stageInstanceId },
        data: {
          status: 'COMPLETED',
          completedAt: now
        }
      })

      // Find the next stage that should be activated
      const sortedStages = stageInstance.listing.stageInstances.sort((a, b) => a.order - b.order)
      const nextStage = sortedStages
        .filter((stage) => stage.order > stageInstance.order && stage.status !== 'COMPLETED')
        .find((stage) => stage.key !== null)

      if (nextStage && nextStage.key) {
        // Activate the next stage
        await setStageActive(tx, nextStage.id, now)
        await tx.listing.update({
          where: { id: listingId },
          data: {
            currentStageKey: nextStage.key,
            currentStageStartedAt: now,
            status: deriveStatusForStage(nextStage.key)
          }
        })
      } else {
        // No next stage found - check if all stages are completed
        const allStagesCompleted = sortedStages.every((stage) => stage.status === 'COMPLETED')
        
        if (allStagesCompleted) {
          // All stages are completed - listing is closed, but keep the last stage key
          const lastStage = sortedStages[sortedStages.length - 1]
          await tx.listing.update({
            where: { id: listingId },
            data: {
              currentStageKey: lastStage?.key ?? preserveStageKey ?? sortedStages[0]?.key ?? null,
              currentStageStartedAt: null,
              status: 'CLOSED'
            }
          })
        } else {
          // CRITICAL: Stages exist but next stage isn't ready yet
          // We need to find the first PENDING stage after this completed one and activate it
          // OR keep the completed stage active if no next stage exists
          const nextPendingStage = sortedStages
            .filter((stage) => stage.order > stageInstance.order && stage.status === 'PENDING')
            .find((stage) => stage.key !== null)
          
          if (nextPendingStage && nextPendingStage.key) {
            // Activate the next pending stage
            await setStageActive(tx, nextPendingStage.id, now)
            await tx.listing.update({
              where: { id: listingId },
              data: {
                currentStageKey: nextPendingStage.key,
                currentStageStartedAt: now,
                status: deriveStatusForStage(nextPendingStage.key)
              }
            })
          } else {
            // No next stage exists or is ready - keep the completed stage as the current stage
            // This prevents the listing from jumping back to intake
            // The stage is completed, but it's still the current stage until manually moved
            await tx.listing.update({
              where: { id: listingId },
              data: {
                currentStageKey: stageInstance.key ?? preserveStageKey ?? sortedStages[0]?.key ?? null,
                status: deriveStatusForStage(stageInstance.key)
              }
            })
            
            // IMPORTANT: Don't change the stage instance status - it's already COMPLETED
            // The listing's currentStageKey will point to this completed stage
            // The UI will show it in the correct column based on currentStageKey
          }
        }
      }
    }
  } else if (stageInstance.status === 'COMPLETED') {
    // Tasks were uncompleted - reactivate this stage
    const activeStartedAt = stageInstance.startedAt ?? now
    await setStageActive(tx, stageInstanceId, activeStartedAt)

    const futureStages = stageInstance.listing.stageInstances
      .filter((stage) => stage.order > stageInstance.order && stage.status !== 'COMPLETED')

    for (const future of futureStages) {
      await tx.listingStageInstance.update({
        where: { id: future.id },
        data: {
          status: 'PENDING',
          startedAt: null
        }
      })
    }

    // Ensure the listing's currentStageKey matches this reactivated stage
    if (stageInstance.key) {
      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentStageKey: stageInstance.key,
          currentStageStartedAt: activeStartedAt,
          status: deriveStatusForStage(stageInstance.key)
        }
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
        skipped: false,
        skippedAt: null,
        notes: input.notes !== undefined ? input.notes : existingTask.notes
      }
    })

    if (updatedTask.stageInstanceId) {
      await reconcileStageAfterTaskChange(tx, input.listingId, updatedTask.stageInstanceId, now)
    }

    return tx.listing.findUniqueOrThrow({
      where: { id: input.listingId },
      include: LISTING_INCLUDE
    })
  })
}

export type SkipListingTaskInput = {
  listingId: string
  taskId: string
  skipped: boolean
}

export async function skipListingTask(input: SkipListingTaskInput, client: PrismaClient = prisma) {
  const now = new Date()

  return client.$transaction(async (tx: TxClient) => {
    const existingTask = await tx.listingTaskInstance.findUnique({ where: { id: input.taskId } })

    if (!existingTask) {
      throw new Error('Task not found')
    }

    if (existingTask.listingId !== input.listingId) {
      throw new Error('Task does not belong to the specified listing')
    }

    const updatedTask = await tx.listingTaskInstance.update({
      where: { id: input.taskId },
      data: {
        skipped: input.skipped,
        skippedAt: input.skipped ? now : null,
        completed: input.skipped ? false : existingTask.completed,
        completedAt: input.skipped ? null : existingTask.completedAt
      }
    })

    if (updatedTask.stageInstanceId) {
      await reconcileStageAfterTaskChange(tx, input.listingId, updatedTask.stageInstanceId, now)
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

  try {
    return await client.$transaction(async (tx: TxClient) => {
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
        throw new Error(`Listing not found: ${listingId}`)
      }

      if (!listing.stageInstances || listing.stageInstances.length === 0) {
        throw new Error(`Listing has no stage instances: ${listingId}`)
      }

      const activeStage = listing.stageInstances.find((stage) => stage.status === 'ACTIVE')

      if (!activeStage) {
        const stageStatuses = listing.stageInstances.map((s) => `${s.name} (${s.status})`).join(', ')
        throw new Error(`No active stage to advance. Listing stages: ${stageStatuses || 'none'}`)
      }

      // Complete all incomplete tasks in the active stage
      await tx.listingTaskInstance.updateMany({
        where: { stageInstanceId: activeStage.id, completed: false },
        data: { completed: true, completedAt: now }
      })

      // Mark the active stage as completed
      await tx.listingStageInstance.update({
        where: { id: activeStage.id },
        data: { status: 'COMPLETED', completedAt: now }
      })

      // Find the next stage that should be activated
      const nextStage = listing.stageInstances
        .filter((stage) => stage.order > activeStage.order && stage.status !== 'COMPLETED')
        .sort((a, b) => a.order - b.order)[0]

      if (nextStage) {
        // Activate the next stage
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
        // No next stage - mark listing as closed
        await tx.listing.update({
          where: { id: listingId },
          data: {
            currentStageKey: activeStage.key ?? null, // Keep the last stage key for reference
            currentStageStartedAt: null,
            status: 'CLOSED'
          }
        })
      }

      // Return the updated listing with all relations
      const result = await tx.listing.findUniqueOrThrow({
        where: { id: listingId },
        include: LISTING_INCLUDE
      })
      return result
    })
  } catch (error) {
    console.error('Error in advanceListingStage:', {
      listingId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export async function moveListingToStage(
  listingId: string,
  targetStageKey: string | null,
  client: PrismaClient = prisma
) {
  const now = new Date()

  try {
    return await client.$transaction(async (tx: TxClient) => {
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
        throw new Error(`Listing not found: ${listingId}`)
      }

      if (!listing.stageInstances || listing.stageInstances.length === 0) {
        throw new Error(`Listing has no stage instances: ${listingId}`)
      }

      if (targetStageKey === null) {
        // Close all stages and mark listing as closed
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
          const availableStageKeys = listing.stageInstances
            .map((s) => s.key)
            .filter((k): k is string => k !== null)
          throw new Error(
            `Target stage not found for listing. Target: ${targetStageKey}, Available: ${availableStageKeys.join(', ') || 'none'}`
          )
        }

        // If already at target stage, just return the listing
        if (targetStage.status === 'ACTIVE' && listing.currentStageKey === targetStage.key) {
          const result = await tx.listing.findUniqueOrThrow({
            where: { id: listingId },
            include: LISTING_INCLUDE
          })
          return result
        }

        // Update all stages based on target
        for (const stage of listing.stageInstances) {
          if (stage.id === targetStage.id) {
            await setStageActive(tx, stage.id, now)
          } else if (stage.order < targetStage.order) {
            // Mark previous stages as completed
            await tx.listingStageInstance.update({
              where: { id: stage.id },
              data: {
                status: 'COMPLETED',
                startedAt: stage.startedAt ?? now,
                completedAt: stage.completedAt ?? now
              }
            })
          } else {
            // Mark future stages as pending and reset their tasks
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

        // Update listing with new current stage
        await tx.listing.update({
          where: { id: listingId },
          data: {
            currentStageKey: targetStage.key ?? null,
            currentStageStartedAt: now,
            status: deriveStatusForStage(targetStage.key)
          }
        })
      }

      // Return the updated listing with all relations
      const result = await tx.listing.findUniqueOrThrow({
        where: { id: listingId },
        include: LISTING_INCLUDE
      })
      return result
    })
  } catch (error) {
    console.error('Error in moveListingToStage:', {
      listingId,
      targetStageKey,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
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
        skipped: task.skipped,
        skippedAt: iso(task.skippedAt),
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

