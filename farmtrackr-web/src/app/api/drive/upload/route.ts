import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedDriveClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Upload File to Google Drive
 * POST /api/drive/upload
 *
 * Uploads a file to Google Drive
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null || 'root'
    const fileName = formData.get('fileName') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      )
    }

    // Get authenticated Drive client
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Google. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const drive = getAuthenticatedDriveClient(accessToken)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName || file.name,
        parents: folderId !== 'root' ? [folderId] : undefined,
      },
      media: {
        mimeType: file.type || 'application/octet-stream',
        body: buffer,
      },
      fields: 'id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, parents',
    })

    return NextResponse.json({
      success: true,
      file: {
        id: response.data.id,
        name: response.data.name,
        mimeType: response.data.mimeType,
        size: response.data.size ? parseInt(response.data.size, 10) : null,
        modifiedTime: response.data.modifiedTime,
        createdTime: response.data.createdTime,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        parents: response.data.parents || [],
      },
    })
  } catch (error) {
    console.error('Error uploading file to Drive:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

