import { NextRequest, NextResponse } from 'next/server'
import { getGoogleAccessToken } from '@/lib/googleTokenHelper'
import { getAuthenticatedDriveClient } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

/**
 * API Route: List Google Drive Files
 * GET /api/drive/files?folderId=...&query=...&pageToken=...
 *
 * Lists files and folders in Google Drive
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId') || 'root'
    const query = searchParams.get('query') || ''
    const pageToken = searchParams.get('pageToken') || undefined
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    // Get authenticated Drive client
    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Google. Please connect your Google account.' },
        { status: 401 }
      )
    }

    const drive = getAuthenticatedDriveClient(accessToken)

    // Build query string
    let driveQuery = `'${folderId}' in parents and trashed = false`
    if (query) {
      // Add search query (searches in name)
      driveQuery += ` and name contains '${query.replace(/'/g, "\\'")}'`
    }

    // List files
    const response = await drive.files.list({
      q: driveQuery,
      pageSize,
      pageToken,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, webViewLink, webContentLink, thumbnailLink, parents, shared, owners)',
      orderBy: 'folder,modifiedTime desc',
    })

    const files = (response.data.files || []).map((file) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size, 10) : null,
      modifiedTime: file.modifiedTime,
      createdTime: file.createdTime,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
      thumbnailLink: file.thumbnailLink,
      parents: file.parents || [],
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      isShared: file.shared || false,
      owners: file.owners?.map((owner) => ({
        displayName: owner.displayName,
        emailAddress: owner.emailAddress,
      })) || [],
    }))

    return NextResponse.json({
      success: true,
      files,
      nextPageToken: response.data.nextPageToken || null,
    })
  } catch (error) {
    console.error('Error listing Drive files:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

