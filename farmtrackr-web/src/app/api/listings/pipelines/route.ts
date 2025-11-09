import { NextResponse } from 'next/server'
import { getListingPipelineTemplates } from '@/lib/listings'

export async function GET() {
  try {
    const templates = await getListingPipelineTemplates()

    const payload = templates.map((template) => ({
      id: template.id,
      name: template.name,
      type: template.type,
      description: template.description,
      stageCount: template.stages.length,
      taskCount: template.stages.reduce((sum, stage) => sum + stage.tasks.length, 0),
      stages: template.stages.map((stage) => ({
        id: stage.id,
        key: stage.key,
        name: stage.name,
        sequence: stage.sequence,
        durationDays: stage.durationDays,
        trigger: stage.trigger,
        taskCount: stage.tasks.length
      }))
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error loading listing pipelines:', error)
    return NextResponse.json({ error: 'Failed to load listing pipelines' }, { status: 500 })
  }
}

