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
    console.log('Upload API: Environment check', { 
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    })
    
    // Generate a unique pathname to prevent collisions
    // Format: uploads/YYYY-MM-DD/filename-timestamp.extension
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'bin'
    const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-').substring(0, 50) // Limit length
    const dateStr = new Date().toISOString().split('T')[0]
    const pathname = `uploads/${dateStr}/${baseName}-${timestamp}.${fileExtension}`
    
    console.log('Upload API: Generated pathname', pathname)
    console.log('Upload API: File object type', file.constructor.name, 'size:', file.size, 'type:', file.type)
    
    // Upload to Vercel Blob using the put function
    // The File object from FormData is passed directly to put()
    // On Vercel, BLOB_READ_WRITE_TOKEN is automatically available when Blob storage is enabled
    // Example: const { url } = await put('filename.txt', file, { access: 'public' })
    const blob = await put(pathname, file, {
      access: 'public',
      addRandomSuffix: false, // We're already using timestamps for uniqueness
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
    console.error('Upload API: Error details', {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack
    })
    
    const errorMessage = error?.message || 'Failed to upload file'
    const errorCode = error?.code || ''
    const errorStatus = error?.status || 0
    
    // Check for various authentication/configuration errors
    const isAuthError = 
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.toLowerCase().includes('authentication') ||
      errorMessage.toLowerCase().includes('authorization') ||
      errorMessage.toLowerCase().includes('unauthorized') ||
      errorMessage.toLowerCase().includes('forbidden') ||
      errorCode === 'UNAUTHORIZED' ||
      errorStatus === 401 ||
      errorStatus === 403
    
    if (isAuthError) {
      return NextResponse.json({ 
        error: 'File upload service is not configured. Please enable Vercel Blob Storage in your Vercel project settings. Go to your project → Settings → Storage → Blob, and enable it.',
        code: 'BLOB_NOT_CONFIGURED',
        hint: 'On Vercel, Blob storage should work automatically. If you see this error, check that Vercel Blob is enabled in your project settings.'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode || 'UPLOAD_FAILED',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}


