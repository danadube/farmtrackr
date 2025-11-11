import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Upload to Vercel Blob; access is managed by Vercel automatically in production
    const blob = await put(file.name, file, {
      access: 'public',
    })

    return NextResponse.json({ 
      url: blob.url, 
      pathname: blob.pathname, 
      size: file.size, 
      type: file.type 
    })
  } catch (error: any) {
    console.error('Blob upload error:', error)
    const errorMessage = error?.message || 'Failed to upload file'
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}


