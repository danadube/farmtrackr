import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/calendar/[id]/share
 * Get all shares for a calendar
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calendarId = params.id

    const shares = await prisma.calendarShare.findMany({
      where: {
        calendarId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      shares,
    })
  } catch (error) {
    console.error('Error fetching calendar shares:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching shares',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar/[id]/share
 * Share a calendar with a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const calendarId = params.id
    const body = await request.json()
    const { userId, role } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role must be owner, editor, or viewer' },
        { status: 400 }
      )
    }

    // Check if calendar exists
    const calendar = await prisma.calendar.findUnique({
      where: { id: calendarId },
    })

    if (!calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found' },
        { status: 404 }
      )
    }

    // Check if share already exists
    const existingShare = await prisma.calendarShare.findFirst({
      where: {
        calendarId,
        userId,
      },
    })

    if (existingShare) {
      // Update existing share
      const updatedShare = await prisma.calendarShare.update({
        where: { id: existingShare.id },
        data: { role },
      })

      return NextResponse.json({
        success: true,
        share: updatedShare,
        message: 'Share updated',
      })
    }

    // Create new share
    const share = await prisma.calendarShare.create({
      data: {
        calendarId,
        userId,
        role,
      },
    })

    return NextResponse.json({
      success: true,
      share,
      message: 'Calendar shared successfully',
    })
  } catch (error) {
    console.error('Error sharing calendar:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error sharing calendar',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/calendar/[id]/share
 * Remove a share (unshare calendar with a user)
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
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const share = await prisma.calendarShare.findFirst({
      where: {
        calendarId,
        userId,
      },
    })

    if (!share) {
      return NextResponse.json(
        { success: false, error: 'Share not found' },
        { status: 404 }
      )
    }

    await prisma.calendarShare.delete({
      where: { id: share.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Share removed successfully',
    })
  } catch (error) {
    console.error('Error removing share:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error removing share',
      },
      { status: 500 }
    )
  }
}

