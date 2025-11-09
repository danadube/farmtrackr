import { NextRequest, NextResponse } from 'next/server'
import { completeListingTask } from '@/lib/listings'

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

    if (typeof body?.completed !== 'boolean') {
      return NextResponse.json({ error: 'completed flag is required' }, { status: 400 })
    }

    const listing = await completeListingTask({
      listingId,
      taskId,
      completed: body.completed,
      notes: body.notes
    })

    return NextResponse.json(listing)
  } catch (error) {
    console.error('Error updating listing task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

