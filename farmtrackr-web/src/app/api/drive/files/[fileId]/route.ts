import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedDriveClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: Get Google Drive File Details
 * GET /api/drive/files/[fileId]
 *
 * Gets detailed information about a specific Drive file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'fileId is required' },
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

    // Get file metadata
    const file = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, thumbnailLink, parents, shared, owners, permissions, description',
    })

    return NextResponse.json({
      success: true,
      file: {
        id: file.data.id,
        name: file.data.name,
        mimeType: file.data.mimeType,
        size: file.data.size ? parseInt(file.data.size, 10) : null,
        modifiedTime: file.data.modifiedTime,
        createdTime: file.data.createdTime,
        webViewLink: file.data.webViewLink,
        webContentLink: file.data.webContentLink,
        thumbnailLink: file.data.thumbnailLink,
        parents: file.data.parents || [],
        isFolder: file.data.mimeType === 'application/vnd.google-apps.folder',
        isShared: file.data.shared || false,
        description: file.data.description || null,
        owners: file.data.owners?.map((owner) => ({
          displayName: owner.displayName,
          emailAddress: owner.emailAddress,
        })) || [],
      },
    })
  } catch (error) {
    console.error('Error getting Drive file:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * API Route: Download Google Drive File
 * GET /api/drive/files/[fileId]?download=true
 *
 * Downloads a file from Google Drive
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params
    const { download } = await request.json().catch(() => ({ download: false }))

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'fileId is required' },
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

    if (download) {
      // Download file content
      const fileContent = await drive.files.get(
        {
          fileId,
          alt: 'media',
        },
        { responseType: 'stream' }
      )

      // For now, return the download URL
      // In a full implementation, you'd stream the file content
      const file = await drive.files.get({
        fileId,
        fields: 'name, mimeType, webContentLink',
      })

      return NextResponse.json({
        success: true,
        downloadUrl: file.data.webContentLink,
        fileName: file.data.name,
        mimeType: file.data.mimeType,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error downloading Drive file:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

