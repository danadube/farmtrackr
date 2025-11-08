import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Get Email Templates
 * GET /api/emails/templates
 * 
 * Gets all email templates from Google Apps Script
 */
export async function GET(request: NextRequest) {
  try {
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }
    
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getAllTemplates'
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Apps Script error:', errorText)
      throw new Error(`Apps Script returned ${response.status}: ${errorText}`)
    }
    
    const templates = await response.json()
    // Wrap in success response format if it's an array
    if (Array.isArray(templates)) {
      return NextResponse.json({
        success: true,
        templates: templates
      })
    }
    // If already wrapped, return as-is
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error getting templates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const template = body?.template
    if (!template || typeof template !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing template payload' },
        { status: 400 }
      )
    }

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveTemplate',
        template,
      }),
    })

    const result = await response.json()
    if (!response.ok || result?.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result?.error || `Apps Script returned ${response.status}`,
        },
        { status: response.ok ? 500 : response.status }
      )
    }

    return NextResponse.json({
      success: true,
      templateId: result?.templateId || template.id,
      template: result?.template || template,
    })
  } catch (error) {
    console.error('Error saving template:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const webAppUrl = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL
    if (!webAppUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script Web App URL not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const templateId = body?.templateId
    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      )
    }

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteTemplate',
        templateId,
      }),
    })

    const result = await response.json()
    if (!response.ok || result?.success === false) {
      return NextResponse.json(
        {
          success: false,
          error: result?.error || `Apps Script returned ${response.status}`,
        },
        { status: response.ok ? 500 : response.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

