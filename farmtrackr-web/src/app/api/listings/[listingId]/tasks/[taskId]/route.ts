import { NextRequest, NextResponse } from 'next/server'
import {
  completeListingTask,
  serializeListing,
  updateListingTaskDetails,
  setListingTaskDocument,
  skipListingTask
} from '@/lib/listings'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    listingId: string
    taskId: string
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { listingId, taskId } = params
    const body = await request.json()
    console.log('Task update request:', { listingId, taskId, body: Object.keys(body) })

    if (body && typeof body.completed === 'boolean') {
      const listing = await completeListingTask({
        listingId,
        taskId,
        completed: body.completed,
        notes: body.notes
      })
      return NextResponse.json(serializeListing(listing))
    }

    if (body && typeof body.skipped === 'boolean') {
      const listing = await skipListingTask({
        listingId,
        taskId,
        skipped: body.skipped
      })
      return NextResponse.json(serializeListing(listing))
    }

    if (
      body &&
      ('name' in body || 'dueDate' in body || 'notes' in body)
    ) {
      const listing = await updateListingTaskDetails({
        listingId,
        taskId,
        name: typeof body.name === 'string' ? body.name : undefined,
        dueDate: body.dueDate === undefined ? undefined : body.dueDate,
        notes: body.notes === undefined ? undefined : body.notes
      })
      return NextResponse.json(serializeListing(listing))
    }

    if (body && 'documentId' in body) {
      console.log('Setting document on task:', { listingId, taskId, documentId: body.documentId })
      const listing = await setListingTaskDocument({
        listingId,
        taskId,
        documentId: body.documentId ?? null
      })
      console.log('Document set successfully on task')
      return NextResponse.json(serializeListing(listing))
    }

    return NextResponse.json({ error: 'Unsupported task update payload' }, { status: 400 })
  } catch (error) {
    console.error('Error updating listing task:', error)
    return NextResponse.json({ 
      error: 'Failed to update task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

