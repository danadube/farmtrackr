'use client'

import { useEffect, useState } from 'react'
import {
  Folder,
  FileText,
  Image,
  File,
  Upload,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Download,
  MoreVertical,
  Loader2,
  Search,
} from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number | null
  modifiedTime: string | null
  createdTime: string | null
  webViewLink: string | null
  webContentLink: string | null
  thumbnailLink: string | null
  parents: string[]
  isFolder: boolean
  isShared: boolean
  owners: Array<{ displayName?: string; emailAddress?: string }>
}

interface DriveBrowserProps {
  onFileSelect?: (file: DriveFile) => void
  onFileLink?: (file: DriveFile) => void
}

export function DriveBrowser({ onFileSelect, onFileLink }: DriveBrowserProps) {
  const { colors, text, card, spacing, isDark } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()

  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string>('root')
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)

  const loadFiles = async (folderId: string = currentFolderId, query: string = searchQuery) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('folderId', folderId)
      if (query) params.set('query', query)

      const response = await fetch(`/api/drive/files?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to load files')
      }

      setFiles(data.files || [])
      setNextPageToken(data.nextPageToken || null)
    } catch (err) {
      console.error('Error loading Drive files:', err)
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFiles()
  }, [])

  const handleFolderClick = (folder: DriveFile) => {
    setFolderStack([...folderStack, { id: currentFolderId, name: 'Current Folder' }])
    setCurrentFolderId(folder.id)
    loadFiles(folder.id, searchQuery)
  }

  const handleBack = () => {
    if (folderStack.length > 0) {
      const previousFolder = folderStack[folderStack.length - 1]
      setFolderStack(folderStack.slice(0, -1))
      setCurrentFolderId(previousFolder.id)
      loadFiles(previousFolder.id, searchQuery)
    } else {
      // Go to root
      setCurrentFolderId('root')
      setFolderStack([])
      loadFiles('root', searchQuery)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    loadFiles(currentFolderId, query)
  }

  const handleFileClick = (file: DriveFile) => {
    if (file.isFolder) {
      handleFolderClick(file)
    } else if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folderId', currentFolderId)

      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload file')
      }

      // Reload files
      loadFiles()
    } catch (err) {
      console.error('Error uploading file:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const getFileIcon = (file: DriveFile) => {
    if (file.isFolder) {
      return <Folder size={20} style={{ color: colors.primary }} />
    }

    const mimeType = file.mimeType || ''
    if (mimeType.startsWith('image/')) {
      return <Image size={20} style={{ color: text.secondary.color }} />
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText size={20} style={{ color: text.secondary.color }} />
    } else {
      return <File size={20} style={{ color: text.secondary.color }} />
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2), height: '100%' }}>
      {/* Header with navigation and search */}
      <div style={{ ...card, padding: spacing(2), display: 'flex', alignItems: 'center', gap: spacing(2) }}>
        {currentFolderId !== 'root' && (
          <button
            {...getButtonPressHandlers('drive-back')}
            onClick={handleBack}
            style={getButtonPressStyle(
              'drive-back',
              {
                padding: spacing(1),
                borderRadius: spacing(0.5),
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: text.primary.color,
              },
              'transparent',
              colors.cardHover
            )}
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing(1)} ${spacing(2)}`,
              paddingLeft: spacing(8),
              borderRadius: spacing(0.75),
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface,
              color: text.primary.color,
              fontSize: '14px',
            }}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: spacing(2),
              top: '50%',
              transform: 'translateY(-50%)',
              color: text.tertiary.color,
              pointerEvents: 'none',
            }}
          />
        </div>

        <button
          {...getButtonPressHandlers('drive-refresh')}
          onClick={() => loadFiles()}
          style={getButtonPressStyle(
            'drive-refresh',
            {
              padding: spacing(1),
              borderRadius: spacing(0.5),
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: text.primary.color,
            },
            'transparent',
            colors.cardHover
          )}
        >
          <RefreshCw size={18} />
        </button>

        <label
          style={{
            padding: `${spacing(1)} ${spacing(2)}`,
            borderRadius: spacing(0.75),
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.primary,
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: spacing(1),
          }}
        >
          <Upload size={16} />
          Upload
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: spacing(2),
            borderRadius: spacing(0.75),
            backgroundColor: colors.error || '#fee',
            color: colors.errorText || '#c00',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* File list */}
      <div
        style={{
          ...card,
          flex: 1,
          overflow: 'auto',
          padding: spacing(1),
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: spacing(4) }}>
            <Loader2 size={24} style={{ color: colors.primary, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: spacing(4), color: text.secondary.color }}>
            {searchQuery ? 'No files found' : 'No files in this folder'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(0.5) }}>
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                style={{
                  padding: spacing(1.5),
                  borderRadius: spacing(0.75),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(2),
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.cardHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {getFileIcon(file)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: text.primary.color }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '12px', color: text.secondary.color, marginTop: spacing(0.25) }}>
                    {file.isFolder
                      ? 'Folder'
                      : `${formatFileSize(file.size)} • ${formatDate(file.modifiedTime)}`}
                  </div>
                </div>
                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: spacing(0.5),
                      color: text.secondary.color,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

