import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkCalendarPermission } from '@/lib/calendarHelpers'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/calendar/[id]
 * Update a calendar
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calendarId = params.id
    const body = await request.json()
    const { name, color, isVisible, userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required for permission check' },
        { status: 400 }
      )
    }

    // Check if user has editor or owner permission
    const hasPermission = await checkCalendarPermission(calendarId, userId, 'editor')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to edit this calendar' },
        { status: 403 }
      )
    }

    const calendar = await prisma.calendar.update({
      where: { id: calendarId },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(typeof isVisible === 'boolean' && { isVisible }),
      },
    })

    return NextResponse.json({
      success: true,
      calendar,
    })
  } catch (error) {
    console.error('Error updating calendar:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating calendar',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calendar/[id]
 * Delete a calendar (only owner can delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calendarId = params.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required for permission check' },
        { status: 400 }
      )
    }

    // Check if user is the owner
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    })

    if (!calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found' },
        { status: 404 }
      )
    }

    if (calendar.ownerId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the calendar owner can delete it' },
        { status: 403 }
      )
    }

    await prisma.calendar.delete({
      where: { id: calendarId },
    })

    return NextResponse.json({
      success: true,
      message: 'Calendar deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting calendar:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error deleting calendar',
      },
      { status: 500 }
    )
  }
}

