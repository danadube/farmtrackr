import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

type PipelineFile = {
  name: string
  type?: string
  description?: string
  stages: Array<{
    key?: string
    name: string
    order?: number
    durationDays?: number
    trigger?: string
    tasks?: Array<{
      name: string
      dueInDays?: number
      autoRepeat?: boolean
      autoComplete?: boolean
      triggerOn?: string
    }>
  }>
}

async function loadJson<T>(filePath: string): Promise<T> {
  const absolutePath = path.resolve(filePath)
  const raw = await fs.readFile(absolutePath, 'utf-8')
  return JSON.parse(raw) as T
}

async function seedPipeline(filePath: string) {
  const pipeline = await loadJson<PipelineFile>(filePath)

  const record = await prisma.listingPipelineTemplate.upsert({
    where: { name: pipeline.name },
    update: {
      description: pipeline.description ?? null,
      type: pipeline.type ?? 'listing'
    },
    create: {
      name: pipeline.name,
      description: pipeline.description ?? null,
      type: pipeline.type ?? 'listing'
    }
  })

  await prisma.listingStageTemplate.deleteMany({
    where: { pipelineTemplateId: record.id }
  })

  const stages = pipeline.stages ?? []
  for (const [index, stage] of stages.entries()) {
    const stageRecord = await prisma.listingStageTemplate.create({
      data: {
        pipelineTemplateId: record.id,
        key: stage.key ?? stage.name.toLowerCase().replace(/\s+/g, '_'),
        name: stage.name,
        sequence: stage.order ?? index + 1,
        durationDays: stage.durationDays ?? null,
        trigger: stage.trigger ?? null
      }
    })

    const tasks = stage.tasks ?? []
    if (tasks.length > 0) {
      await prisma.listingTaskTemplate.createMany({
        data: tasks.map((task) => ({
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

  console.log(`Seeded pipeline template: ${pipeline.name}`)
}

async function seedDocument(filePath: string, options: { title: string; type: string; description?: string }) {
  const content = await fs.readFile(path.resolve(filePath), 'utf-8')

  await prisma.document.upsert({
    where: { title: options.title },
    update: {
      description: options.description ?? null,
      type: options.type,
      content
    },
    create: {
      title: options.title,
      description: options.description ?? null,
      type: options.type,
      content
    }
  })

  console.log(`Seeded document template: ${options.title}`)
}

async function main() {
  const root = path.resolve(__dirname, '..', '..')
  const pipelinesDir = path.join(root, 'docs', 'pipelines')

  await seedPipeline(path.join(pipelinesDir, 'listing-transaction-seller.json'))
  await seedPipeline(path.join(pipelinesDir, 'buyer-transaction.json'))

  await seedDocument(path.join(pipelinesDir, 'listing-paperwork-checklist.json'), {
    title: 'Listing Paperwork Checklist',
    type: 'checklist',
    description: 'Reference checklist for required California listing documents.'
  })

  await seedDocument(path.join(pipelinesDir, 'transaction-timeline.json'), {
    title: 'California Listing Transaction Timeline',
    type: 'timeline',
    description: 'Suggested milestone timeline for a standard 30-day escrow.'
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

