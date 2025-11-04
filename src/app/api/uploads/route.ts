import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    // Upload to Vercel Blob; access is managed by Vercel automatically in production
    const { url, pathname } = await put(file.name, file, {
      access: 'public',
    })

    return NextResponse.json({ url, pathname, size: file.size, type: file.type })
  } catch (error: any) {
    console.error('Blob upload error:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}


