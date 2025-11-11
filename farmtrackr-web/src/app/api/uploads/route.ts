import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API: Received upload request')
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      console.error('Upload API: No file in form data')
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    console.log('Upload API: File received', { name: file.name, size: file.size, type: file.type })

    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.error('Upload API: File too large', file.size)
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    if (file.size === 0) {
      console.error('Upload API: File is empty')
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    console.log('Upload API: Uploading to Vercel Blob...')
    // Upload to Vercel Blob; access is managed by Vercel automatically in production
    // In development, requires BLOB_READ_WRITE_TOKEN environment variable
    const blob = await put(file.name, file, {
      access: 'public',
    })

    console.log('Upload API: Upload successful', { url: blob.url, pathname: blob.pathname })

    if (!blob.url) {
      console.error('Upload API: No URL returned from blob upload')
      return NextResponse.json({ error: 'Upload succeeded but no URL returned' }, { status: 500 })
    }

    return NextResponse.json({ 
      url: blob.url, 
      pathname: blob.pathname, 
      size: file.size, 
      type: file.type 
    })
  } catch (error: any) {
    console.error('Upload API: Blob upload error:', error)
    const errorMessage = error?.message || 'Failed to upload file'
    const isAuthError = errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('authorization')
    
    return NextResponse.json({ 
      error: isAuthError 
        ? 'Upload service not configured. Please check BLOB_READ_WRITE_TOKEN environment variable.'
        : errorMessage,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}


