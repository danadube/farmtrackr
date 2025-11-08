import { NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedCalendarClient } from '@/lib/googleAuth'

type CalendarListEntry = {
  id: string
  summary: string
  description?: string | null
  backgroundColor?: string | null
  foregroundColor?: string | null
  accessRole?: string | null
  primary?: boolean | null
}

export async function GET() {
  try {
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google account not connected',
          requiresAuth: true,
        },
        { status: 401 }
      )
    }

    const calendar = getAuthenticatedCalendarClient(accessToken)
    const response = await calendar.calendarList.list({
      minAccessRole: 'reader',
      showHidden: false,
      showDeleted: false,
    })

    const calendars: CalendarListEntry[] =
      response.data.items?.map((entry) => ({
        id: entry.id || '',
        summary: entry.summary || entry.id || 'Untitled Calendar',
        description: entry.description,
        backgroundColor: entry.backgroundColor,
        foregroundColor: entry.foregroundColor,
        accessRole: entry.accessRole,
        primary: entry.primary || false,
      })) ?? []

    return NextResponse.json({
      success: true,
      calendars,
    })
  } catch (error) {
    console.error('Error fetching calendar list:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching calendars',
      },
      { status: 500 }
    )
  }
}

