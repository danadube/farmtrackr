import { NextRequest, NextResponse } from 'next/server'

/**
 * API Route: Get Email Template with Variable Substitution
 * POST /api/emails/template
 * 
 * Gets a specific email template with variable substitution
 */
export async function POST(request: NextRequest) {
  try {
    const { templateId, variables } = await request.json()
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' },
        { status: 400 }
      )
    }
    
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
        action: 'getTemplate',
        templateId: templateId,
        variables: variables || {}
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Apps Script returned ${response.status}`)
    }
    
    const template = await response.json()
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error getting template:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

