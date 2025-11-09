import { NextResponse } from 'next/server'
import { getListingPipelineTemplates, serializePipelineTemplate } from '@/lib/listings'

export async function GET() {
  try {
    const templates = await getListingPipelineTemplates()

    return NextResponse.json(templates.map(serializePipelineTemplate))
  } catch (error) {
    console.error('Error loading listing pipelines:', error)
    return NextResponse.json({ error: 'Failed to load listing pipelines' }, { status: 500 })
  }
}

