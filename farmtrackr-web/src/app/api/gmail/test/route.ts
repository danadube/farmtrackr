import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Test Gmail Integration Connection
 * GET /api/gmail/test
 * 
 * Tests the connection to the Google Apps Script Web App
 */
export async function GET(request: NextRequest) {
  try {
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    const scriptId = process.env.GOOGLE_APPS_SCRIPT_ID

    if (!webAppUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GOOGLE_APPS_SCRIPT_WEB_APP_URL not configured',
          config: {
            webAppUrl: webAppUrl ? 'Set' : 'Missing',
            scriptId: scriptId ? 'Set' : 'Missing'
          }
        },
        { status: 500 }
      )
    }

    // Test the connection by calling the Apps Script doGet function
    const response = await fetch(webAppUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Gmail integration is connected and working!',
      appsScriptResponse: result,
      config: {
        webAppUrl: webAppUrl ? 'Set' : 'Missing',
        scriptId: scriptId ? 'Set' : 'Missing',
        scriptIdFromUrl: webAppUrl.match(/\/s\/([^\/]+)\//)?.[1] || 'Not found'
      }
    })
  } catch (error) {
    console.error('Error testing Gmail integration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        config: {
          webAppUrl: process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL ? 'Set' : 'Missing',
          scriptId: process.env.GOOGLE_APPS_SCRIPT_ID ? 'Set' : 'Missing'
        }
      },
      { status: 500 }
    )
  }
}

