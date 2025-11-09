import { NextRequest, NextResponse } from 'next/server'
import { createListingTask, serializeListing } from '@/lib/listings'

interface RouteContext {
  params: { listingId: string }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { listingId } = params
    const body = await request.json()
    const { stageInstanceId, name, dueDate, notes } = body ?? {}

    if (!stageInstanceId || typeof stageInstanceId !== 'string') {
      return NextResponse.json({ error: 'stageInstanceId is required' }, { status: 400 })
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 })
    }

    const listing = await createListingTask({
      listingId,
      stageInstanceId,
      name,
      dueDate: dueDate ?? null,
      notes: typeof notes === 'string' ? notes : undefined
    })

    return NextResponse.json(serializeListing(listing))
  } catch (error) {
    console.error('Error creating listing task:', error)
    return NextResponse.json({ error: 'Failed to create listing task' }, { status: 500 })
  }
}
