'use client'

import { useEffect, useState } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Upload,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'

interface Document {
  id: string
  title: string
  description?: string
  type?: 'template' | 'contact' | 'report'
  contactName?: string
  createdAt: Date
  updatedAt: Date
  fileSize?: string
  fileUrl?: string | null
}

interface Letterhead {
  id: string
  name: string
  description?: string
  headerHtml?: string
  headerText?: string
  footerHtml?: string
  footerText?: string
  isDefault?: boolean
  createdAt: Date
  updatedAt: Date
}

export default function DocumentsPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [activeTab, setActiveTab] = useState<'documents' | 'letterheads'>('documents')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'template' | 'contact' | 'report'>('all')

  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocDescription, setNewDocDescription] = useState('')
  const [newDocType, setNewDocType] = useState<'template' | 'contact' | 'report' | ''>('')
  const [newDocContent, setNewDocContent] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Letterheads state
  const [letterheads, setLetterheads] = useState<Letterhead[]>([])
  const [letterheadsLoading, setLetterheadsLoading] = useState(false)
  const [showLetterheadModal, setShowLetterheadModal] = useState(false)
  const [editingLetterhead, setEditingLetterhead] = useState<Letterhead | null>(null)
  const [letterheadName, setLetterheadName] = useState('')
  const [letterheadDescription, setLetterheadDescription] = useState('')
  const [letterheadHeaderHtml, setLetterheadHeaderHtml] = useState('')
  const [letterheadHeaderText, setLetterheadHeaderText] = useState('')
  const [letterheadFooterHtml, setLetterheadFooterHtml] = useState('')
  const [letterheadIsDefault, setLetterheadIsDefault] = useState(false)

  const refreshDocuments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      const res = await fetch(`/api/documents?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const mapped: Document[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          type: d.type || undefined,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          fileUrl: d.fileUrl || null,
        }))
        setDocs(mapped)
      }
    } catch (e) {
      console.error('Failed to load documents', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    const fetchLetterheads = async () => {
      if (activeTab !== 'letterheads') return
      try {
        setLetterheadsLoading(true)
        const res = await fetch('/api/letterheads')
        if (res.ok) {
          const data = await res.json()
          const mapped: Letterhead[] = data.map((l: any) => ({
            id: l.id,
            name: l.name,
            description: l.description || '',
            headerHtml: l.headerHtml || '',
            headerText: l.headerText || '',
            footerHtml: l.footerHtml || '',
            footerText: l.footerText || '',
            isDefault: l.isDefault || false,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          }))
          setLetterheads(mapped)
        }
      } catch (e) {
        console.error('Failed to load letterheads', e)
      } finally {
        setLetterheadsLoading(false)
      }
    }
    fetchLetterheads()
  }, [activeTab])

  const filteredDocuments = docs.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || doc.type === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template':
        return <FileText style={{ width: '16px', height: '16px', color: colors.success }} />
      case 'contact':
        return <User style={{ width: '16px', height: '16px', color: colors.primary }} />
      case 'report':
        return <FileText style={{ width: '16px', height: '16px', color: colors.warning }} />
      default:
        return <FileText style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'template':
        return isDark ? '#064e3b' : (colors as any).successTint || '#dcfce7'
      case 'contact':
        return isDark ? '#1e3a8a' : (colors as any).primaryTint || '#dbeafe'
      case 'report':
        return isDark ? '#78350f' : (colors as any).warningTint || '#fef3c7'
      default:
        return colors.cardHover
    }
  }

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'template':
        return colors.success
      case 'contact':
        return colors.primary
      case 'report':
        return colors.warning
      default:
        return colors.text.tertiary
    }
  }

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorMessage(message)
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    } else {
      setSuccessMessage(message)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    }
  }

  const handleSaveDocument = async () => {
    if (!newDocTitle.trim()) {
      showToast('Please enter a document title', true)
      return
    }

    try {
      const isEdit = Boolean(editingDoc?.id)
      const url = isEdit ? `/api/documents/${editingDoc!.id}` : '/api/documents'
      const method = isEdit ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitle,
          description: newDocDescription || null,
          type: newDocType || null,
          content: newDocContent || null,
        }),
      })

      if (response.ok) {
        await refreshDocuments()
        showToast(isEdit ? 'Document updated successfully' : 'Document created successfully')
        // Close modal and reset form
        setShowCreateModal(false)
        setEditingDoc(null)
        setNewDocTitle('')
        setNewDocDescription('')
        setNewDocType('')
        setNewDocContent('')
      } else {
        const error = await response.json()
        showToast(error.error || (isEdit ? 'Failed to save document' : 'Failed to create document'), true)
      }
    } catch (error) {
      console.error('Failed to save document:', error)
      showToast('Failed to save document', true)
    }
  }

  const handleOpenDocModal = async (doc?: Document) => {
    if (doc) {
      setEditingDoc(doc)
      // fetch full content
      try {
        const res = await fetch(`/api/documents/${doc.id}`)
      if (res.ok) {
        const full = await res.json()
        setNewDocTitle(full.title || '')
        setNewDocDescription(full.description || '')
        setNewDocType((full.type as any) || '')
        setNewDocContent(full.content || '')
      } else {
        setNewDocTitle(doc.title || '')
        setNewDocDescription(doc.description || '')
        setNewDocType((doc.type as any) || '')
      }
    } catch {
      setNewDocTitle(doc.title || '')
      setNewDocDescription(doc.description || '')
      setNewDocType((doc.type as any) || '')
    }
    } else {
      setEditingDoc(null)
      setNewDocTitle('')
      setNewDocDescription('')
      setNewDocType('')
      setNewDocContent('')
    }
    setShowCreateModal(true)
  }

  const handleDeleteClick = (doc: Document) => {
    setDocToDelete(doc)
    setShowDeleteConfirm(true)
  }

  const handleDeleteDocument = async () => {
    if (!docToDelete) return
    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        await refreshDocuments()
        showToast('Document deleted successfully')
        setShowDeleteConfirm(false)
        setDocToDelete(null)
      } else {
        const error = await res.json().catch(() => ({}))
        showToast(error.error ? `Failed to delete: ${error.error}` : 'Failed to delete document', true)
      }
    } catch (e) {
      console.error('Failed to delete document', e)
      showToast('Failed to delete document', true)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      // 1) Upload raw file to blob storage
      const fd = new FormData()
      fd.append('file', file)
      const uploadRes = await fetch('/api/uploads', { method: 'POST', body: fd })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to upload file')
      }
      const { url: fileUrl } = await uploadRes.json()

      // 2) Optionally read inline content for preview (text-like types)
      const isTextLike = /^text\//.test(file.type) || /\.(txt|html|md|csv)$/i.test(file.name)
      const fileContent = isTextLike ? await file.text().catch(() => null) : null

      // 3) Create document record referencing blob URL
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name,
          description: `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          content: fileContent,
          fileUrl,
        }),
      })

      if (response.ok) {
        await refreshDocuments()
        showToast('Document uploaded successfully!')
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to upload document', true)
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      showToast('Failed to upload file', true)
    } finally {
      setUploadingFile(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleViewDocument = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      if (res.ok) {
        const full = await res.json()
        setPreviewDoc(doc)
        // PDF: prefer embedded preview via iframe
        if (full.fileUrl && /\.pdf(?:$|\?)/i.test(full.fileUrl)) {
          setPreviewPdfUrl(full.fileUrl)
          setPreviewContent('')
          setShowPreviewModal(true)
          return
        }
        let content = full.content || ''
        if (!content && full.fileUrl && /\.(html?)$/i.test(full.fileUrl)) {
          try {
            const htmlRes = await fetch(full.fileUrl)
            if (htmlRes.ok) content = await htmlRes.text()
          } catch (_) {
            window.open(full.fileUrl, '_blank')
            return
          }
        }
        setPreviewContent(content)
        setPreviewPdfUrl('')
        setShowPreviewModal(true)
      } else {
        showToast('Failed to load document for preview', true)
      }
    } catch (e) {
      console.error('Preview error', e)
      showToast('Failed to load document for preview', true)
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`)
      if (!res.ok) {
        showToast('Failed to load document for download', true)
        return
      }
      const full = await res.json()
      if (full.fileUrl) {
        window.open(full.fileUrl, '_blank')
        return
      }
      const content: string = full.content || ''
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeTitle = (doc.title || 'document').replace(/[^a-z0-9-_]+/gi, '_')
      a.download = `${safeTitle}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download error', e)
      showToast('Failed to download document', true)
    }
  }

  const handlePrintPreview = () => {
    // PDF: open in new tab and let the browser handle printing
    if (previewPdfUrl) {
      const w = window.open(previewPdfUrl, '_blank')
      if (w) {
        // Attempt to trigger print; may be blocked by cross-origin
        setTimeout(() => {
          try {
            w.focus()
            w.print()
          } catch (_) {
            // ignore
          }
        }, 500)
      }
      return
    }
    // HTML/text content: render into a print-friendly window
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${(previewDoc?.title || 'Document').replace(/</g, '&lt;')}</title>
    <style>
      @page { size: auto; margin: 1in; }
      html, body { background: #ffffff; color: #000000; }
      body { margin: 1in; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
      .content pre { white-space: pre-wrap; word-break: break-word; }
      img { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <div class="content">
      ${/<([a-z][^\s>]+)/i.test(previewContent) ? previewContent : `<pre>${previewContent.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`}
    </div>
    <script>window.onload = function(){ window.focus(); window.print(); }<\/script>
  </body>
</html>`
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const handleOpenLetterheadModal = (letterhead?: Letterhead) => {
    if (letterhead) {
      setEditingLetterhead(letterhead)
      setLetterheadName(letterhead.name)
      setLetterheadDescription(letterhead.description || '')
      setLetterheadHeaderHtml(letterhead.headerHtml || '')
      setLetterheadHeaderText(letterhead.headerText || '')
      setLetterheadFooterHtml(letterhead.footerHtml || '')
      setLetterheadIsDefault(letterhead.isDefault || false)
    } else {
      setEditingLetterhead(null)
      setLetterheadName('')
      setLetterheadDescription('')
      setLetterheadHeaderHtml('')
      setLetterheadHeaderText('')
      setLetterheadFooterHtml('')
      setLetterheadIsDefault(false)
    }
    setShowLetterheadModal(true)
  }

  const handleSaveLetterhead = async () => {
    if (!letterheadName.trim() || (!letterheadHeaderHtml.trim() && !letterheadHeaderText.trim())) {
      showToast('Name and at least header HTML or text is required', true)
      return
    }

    try {
      const url = editingLetterhead 
        ? `/api/letterheads/${editingLetterhead.id}`
        : '/api/letterheads'
      const method = editingLetterhead ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: letterheadName,
          description: letterheadDescription || null,
          headerHtml: letterheadHeaderHtml || null,
          headerText: letterheadHeaderText || null,
          footerHtml: letterheadFooterHtml || null,
          footerText: null,
          isDefault: letterheadIsDefault,
        }),
      })

      if (response.ok) {
        // Refresh letterheads list
        const res = await fetch('/api/letterheads')
        if (res.ok) {
          const data = await res.json()
          const mapped: Letterhead[] = data.map((l: any) => ({
            id: l.id,
            name: l.name,
            description: l.description || '',
            headerHtml: l.headerHtml || '',
            headerText: l.headerText || '',
            footerHtml: l.footerHtml || '',
            footerText: l.footerText || '',
            isDefault: l.isDefault || false,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          }))
          setLetterheads(mapped)
        }
        showToast(editingLetterhead ? 'Letterhead updated successfully' : 'Letterhead created successfully')
        // Close modal and reset form
        setShowLetterheadModal(false)
        setEditingLetterhead(null)
        setLetterheadName('')
        setLetterheadDescription('')
        setLetterheadHeaderHtml('')
        setLetterheadHeaderText('')
        setLetterheadFooterHtml('')
        setLetterheadIsDefault(false)
      } else {
        const error = await response.json()
        showToast(error.error || 'Failed to save letterhead', true)
      }
    } catch (error) {
      console.error('Failed to save letterhead:', error)
      showToast('Failed to save letterhead', true)
    }
  }

  const handleDeleteLetterhead = async (id: string) => {
    const letterhead = letterheads.find(l => l.id === id)
    if (!letterhead) return
    
    if (!confirm('Are you sure you want to delete this letterhead?')) return

    try {
      const response = await fetch(`/api/letterheads/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast('Letterhead deleted successfully')
        // Refresh letterheads list
        const res = await fetch('/api/letterheads')
        if (res.ok) {
          const data = await res.json()
          const mapped: Letterhead[] = data.map((l: any) => ({
            id: l.id,
            name: l.name,
            description: l.description || '',
            headerHtml: l.headerHtml || '',
            headerText: l.headerText || '',
            footerHtml: l.footerHtml || '',
            footerText: l.footerText || '',
            isDefault: l.isDefault || false,
            createdAt: new Date(l.createdAt),
            updatedAt: new Date(l.updatedAt),
          }))
          setLetterheads(mapped)
        }
      } else {
        showToast('Failed to delete letterhead', true)
      }
    } catch (error) {
      console.error('Failed to delete letterhead:', error)
      showToast('Failed to delete letterhead', true)
    }
  }

  return (
    <Sidebar>
      <div 
        style={{ 
          marginLeft: '256px', 
          paddingLeft: '0',
          minHeight: '100vh',
          ...background
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingTop: '32px',
            paddingBottom: '32px'
          }}
        >
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div 
              style={{
                padding: '24px',
                ...headerTint(colors.success)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#064e3b' : (colors as any).successTint || '#dcfce7',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText style={{ width: '24px', height: '24px', color: colors.success }} />
                  </div>
                  <div>
                    <h1 
                      style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#ffffff', // White text on colored background
                        margin: '0 0 4px 0'
                      }}
                    >
                      {activeTab === 'documents' ? 'Documents' : 'Letterheads'}
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                      {activeTab === 'documents' 
                        ? 'Manage your farm documents and templates'
                        : 'Manage letterheads for mail merge letters'
                      }
                    </p>
                  </div>
                </div>
                <div />
              </div>
              <div style={headerDivider} />
            </div>
          </div>

        {/* Actions & Tabs Card */}
        <div style={{ marginBottom: '24px' }}>
          <div 
            style={{
              padding: '16px',
              ...card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: colors.cardHover, borderRadius: '8px' }}>
              <button
                {...getButtonPressHandlers('tab-documents')}
                onClick={() => setActiveTab('documents')}
                style={getButtonPressStyle('tab-documents', {
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'documents' ? colors.primary : 'transparent',
                  color: activeTab === 'documents' ? '#ffffff' : colors.text.secondary,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }, activeTab === 'documents' ? colors.primary : 'transparent', colors.cardHover)}
              >
                Documents
              </button>
              <button
                {...getButtonPressHandlers('tab-letterheads')}
                onClick={() => setActiveTab('letterheads')}
                style={getButtonPressStyle('tab-letterheads', {
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'letterheads' ? colors.primary : 'transparent',
                  color: activeTab === 'letterheads' ? '#ffffff' : colors.text.secondary,
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }, activeTab === 'letterheads' ? colors.primary : 'transparent', colors.cardHover)}
              >
                Letterheads
              </button>
              <Link href="/google-sheets" style={{ textDecoration: 'none' }}>
                <button
                  {...getButtonPressHandlers('googleSheets')}
                  style={getButtonPressStyle('googleSheets', {
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: colors.text.secondary,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }, 'transparent', colors.borderHover)}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has('googleSheets')) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has('googleSheets')) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  Google Sheets
                </button>
              </Link>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {activeTab === 'letterheads' && (
                <button
                  {...getButtonPressHandlers('createLetterhead')}
                  onClick={() => handleOpenLetterheadModal()}
                  style={getButtonPressStyle('createLetterhead', {
                    padding: '12px 16px',
                    backgroundColor: colors.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }, colors.success, '#558b2f')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.success
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  New Letterhead
                </button>
              )}
              {activeTab === 'documents' && (
                <>
                <label
                  style={{
                    padding: '12px 16px',
                    backgroundColor: colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: uploadingFile ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease',
                    opacity: uploadingFile ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadingFile) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }}
                >
                  <Upload style={{ width: '16px', height: '16px' }} />
                  {uploadingFile ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.html"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    disabled={uploadingFile}
                  />
                </label>
                <Link href="/documents/create-letter" style={{ textDecoration: 'none' }}>
                  <button
                    {...getButtonPressHandlers('createLetter')}
                    style={getButtonPressStyle('createLetter', {
                      padding: '12px 16px',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginRight: '12px'
                    }, colors.primary, '#558b2f')}
                    onMouseEnter={(e) => {
                      if (!pressedButtons.has('createLetter')) {
                        e.currentTarget.style.backgroundColor = '#558b2f'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!pressedButtons.has('createLetter')) {
                        e.currentTarget.style.backgroundColor = colors.primary
                      }
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Mail Merge
                  </button>
                </Link>
                <button
                  onClick={() => handleOpenDocModal()}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: colors.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.success
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  New Document
                </button>
                </>
              )}
            </div>
          </div>
        </div>
          {/* Letterheads Tab Content */}
          {activeTab === 'letterheads' && (
            <div style={{ marginBottom: '24px' }}>
              <div 
                style={{
                  ...card,
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                  <h2 
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      ...text.primary,
                      margin: '0'
                    }}
                  >
                    All Letterheads ({letterheads.length})
                  </h2>
                </div>
                
                {letterheadsLoading ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ ...text.secondary }}>Loading letterheads...</p>
                  </div>
                ) : letterheads.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center' }}>
                    <FileText style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                      No letterheads found
                    </h3>
                    <p style={{ ...text.secondary, marginBottom: '24px' }}>
                      Create your first letterhead to use in mail merge letters.
                    </p>
                    <button
                      onClick={() => handleOpenLetterheadModal()}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: colors.success,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: '0 auto',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} />
                      Create First Letterhead
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {letterheads.map((letterhead, index) => (
                      <div 
                        key={letterhead.id}
                        style={{
                          padding: '20px 24px',
                          borderBottom: index < letterheads.length - 1 ? `1px solid ${colors.border}` : 'none',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.cardHover
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: '1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                                {letterhead.name}
                              </h3>
                              {letterhead.isDefault && (
                                <span style={{
                                  padding: '2px 8px',
                                  backgroundColor: colors.success,
                                  color: '#ffffff',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}>
                                  Default
                                </span>
                              )}
                            </div>
                            {letterhead.description && (
                              <p style={{ fontSize: '14px', ...text.secondary, margin: '0 0 12px 0' }}>
                                {letterhead.description}
                              </p>
                            )}
                            {letterhead.headerHtml && (
                              <div style={{ 
                                padding: '12px', 
                                backgroundColor: colors.cardHover, 
                                borderRadius: '8px', 
                                marginTop: '12px',
                                fontSize: '12px',
                                borderLeft: `3px solid ${colors.primary}`,
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', ...text.secondary }}>
                                  Header Preview:
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: letterhead.headerHtml }} />
                              </div>
                            )}
                            {letterhead.footerHtml && (
                              <div style={{ 
                                padding: '12px', 
                                backgroundColor: colors.cardHover, 
                                borderRadius: '8px', 
                                marginTop: '8px',
                                fontSize: '12px',
                                borderLeft: `3px solid ${colors.primary}`,
                              }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', ...text.secondary }}>
                                  Footer Preview:
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: letterhead.footerHtml }} />
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
                            <button
                              onClick={() => handleOpenLetterheadModal(letterhead)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: colors.cardHover,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                ...text.secondary
                              }}
                            >
                              <Edit style={{ width: '14px', height: '14px', marginRight: '4px', display: 'inline' }} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLetterhead(letterhead.id)}
                              style={{
                                padding: '8px 12px',
                                backgroundColor: 'transparent',
                                border: `1px solid ${colors.error || '#ef4444'}`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                color: colors.error || '#ef4444'
                              }}
                            >
                              <Trash2 style={{ width: '14px', height: '14px', marginRight: '4px', display: 'inline' }} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab Content */}
          {activeTab === 'documents' && (
            <>
          {/* Search and Filters */}
          <div style={{ marginBottom: '24px' }}>
            <div 
              style={{
                padding: '16px',
                ...card,
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ flex: '1', position: 'relative' }}>
                <Search style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: colors.text.tertiary
                }} />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    backgroundColor: colors.card,
                    color: colors.text.primary,
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.success
                    e.target.style.outline = 'none'
                    e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                style={{
                  padding: '12px 16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  cursor: 'pointer',
                  minWidth: '120px'
                }}
              >
                <option value="all">All Types</option>
                <option value="template">Templates</option>
                <option value="contact">Contact Lists</option>
                <option value="report">Reports</option>
              </select>
            </div>
          </div>

          {/* Documents List */}
          <div 
            style={{
              ...card,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <h2 
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  ...text.primary,
                  margin: '0'
                }}
              >
                All Documents ({filteredDocuments.length})
              </h2>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <FileText style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                  No documents found
                </h3>
                <p style={{ ...text.secondary, marginBottom: '24px' }}>
                  {searchQuery || selectedFilter !== 'all' 
                    ? 'Try adjusting your search criteria.' 
                    : 'Get started by creating your first document.'
                  }
                </p>
                {!searchQuery && selectedFilter === 'all' && (
                  <button
                    onClick={() => handleOpenDocModal()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: colors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.success
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Create First Document
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredDocuments.map((doc, index) => (
                  <div 
                    key={doc.id}
                    style={{
                      padding: '20px 24px',
                      borderBottom: index < filteredDocuments.length - 1 ? `1px solid ${colors.border}` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'background-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: getTypeColor(doc.type),
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: '0'
                      }}
                    >
                      {getTypeIcon(doc.type)}
                    </div>
                    
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <h3 
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          ...text.primary,
                          margin: '0 0 4px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {doc.title}
                      </h3>
                      <p 
                        style={{
                          fontSize: '14px',
                          ...text.secondary,
                          margin: '0 0 4px 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {doc.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span 
                          style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: getTypeTextColor(doc.type),
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {doc.type}
                        </span>
                        {/* File type badge */}
                        {(() => {
                          const source = (doc.fileUrl || doc.title || '').toLowerCase()
                          const m = source.match(/\.([a-z0-9]+)(?:$|\?)/)
                          const ext = m ? m[1] : ''
                          return ext ? (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 6px',
                                borderRadius: '6px',
                                backgroundColor: colors.cardHover,
                                border: `1px solid ${colors.border}`,
                                color: colors.text.secondary,
                                textTransform: 'uppercase',
                              }}
                            >
                              {ext}
                            </span>
                          ) : null
                        })()}
                        {doc.contactName && (
                          <span style={{ fontSize: '12px', ...text.secondary }}>
                            {doc.contactName}
                          </span>
                        )}
                        {doc.description && /\(([^)]+\s(?:KB|MB|B))\)/i.test(doc.description) && (
                          <span style={{ fontSize: '12px', ...text.secondary }}>
                            {doc.description.match(/\(([^)]+\s(?:KB|MB|B))\)/i)?.[1]}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', ...text.secondary, textAlign: 'right' }}>
                        {doc.updatedAt.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onClick={() => handleViewDocument(doc)}
                        >
                          <Eye style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                        </button>
                        
                        <button
                          style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <Download style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                        </button>
                        
                        <button
                          style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onClick={() => handleOpenDocModal(doc)}
                        >
                          <Edit style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                        </button>
                        <button
                          style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onClick={() => handleDeleteClick(doc)}
                        >
                          <Trash2 style={{ width: '16px', height: '16px', color: colors.error || '#ef4444' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false)
          }}
        >
          <div
            style={{
              ...card,
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
              {editingDoc ? 'Edit Document' : 'Create New Document'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Document Title *
              </label>
              <input
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSaveDocument()
                  }
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={newDocDescription}
                onChange={(e) => setNewDocDescription(e.target.value)}
                placeholder="Brief description of the document..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Document Type (optional)
              </label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  cursor: 'pointer',
                }}
              >
                <option value="">None</option>
                <option value="template">Template</option>
                <option value="contact">Contact Document</option>
                <option value="report">Report</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Content (optional)
              </label>
              <textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                placeholder="Enter document content..."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingDoc(null)
                  setNewDocTitle('')
                  setNewDocDescription('')
                  setNewDocType('')
                  setNewDocContent('')
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.cardHover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  ...text.secondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocument}
                disabled={!newDocTitle.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.success,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: newDocTitle.trim() ? 'pointer' : 'not-allowed',
                  opacity: newDocTitle.trim() ? 1 : 0.6,
                }}
              >
                {editingDoc ? 'Save Changes' : 'Create Document'}
              </button>
            </div>
            </div>
          </div>
        )}

    {/* Preview Document Modal */}
    {showPreviewModal && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowPreviewModal(false)
            setPreviewDoc(null)
            setPreviewContent('')
          }
        }}
      >
        <div
          style={{
            ...card,
            padding: '24px',
            maxWidth: '800px',
            width: '95%',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
            Preview: {previewDoc?.title}
          </h2>
          {previewPdfUrl ? (
            <div style={{ height: '70vh' }}>
              <iframe
                src={previewPdfUrl}
                style={{ width: '100%', height: '100%', border: '1px solid ' + colors.border, borderRadius: '8px' }}
              />
            </div>
          ) : previewContent ? (
            /<([a-z][^\s>]+)/i.test(previewContent) ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '850px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    borderRadius: '8px',
                    padding: '24px',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
            ) : (
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  fontFamily: 'monospace',
                  fontSize: '13px',
                }}
              >{previewContent}</pre>
            )
          ) : (
            <p style={{ ...text.secondary }}>
              No inline content to preview. Try downloading this document instead.
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
            <button
              onClick={handlePrintPreview}
              style={{
                padding: '10px 16px',
                backgroundColor: colors.success,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Print
            </button>
            <button
              onClick={() => {
                if (previewDoc) handleDownloadDocument(previewDoc)
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Download
            </button>
            <button
              onClick={() => {
                setShowPreviewModal(false)
                setPreviewDoc(null)
                setPreviewContent('')
              }}
              style={{
                padding: '10px 16px',
                backgroundColor: colors.cardHover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                ...text.secondary,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Letterhead Modal */}
      {showLetterheadModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLetterheadModal(false)
              setEditingLetterhead(null)
              setLetterheadName('')
              setLetterheadDescription('')
              setLetterheadHeaderHtml('')
              setLetterheadHeaderText('')
              setLetterheadFooterHtml('')
              setLetterheadIsDefault(false)
            }
          }}
        >
          <div
            style={{
              ...card,
              padding: '32px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
              {editingLetterhead ? 'Edit Letterhead' : 'Create Letterhead'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Letterhead Name *
              </label>
              <input
                type="text"
                value={letterheadName}
                onChange={(e) => setLetterheadName(e.target.value)}
                placeholder="e.g., Standard FarmTrackr Letterhead"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Description (optional)
              </label>
              <input
                type="text"
                value={letterheadDescription}
                onChange={(e) => setLetterheadDescription(e.target.value)}
                placeholder="Brief description of this letterhead"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Header HTML * 
                <span style={{ fontSize: '12px', marginLeft: '8px', fontWeight: 'normal' }}>
                  (Use HTML for rich formatting, logos, etc.)
                </span>
              </label>
              <div style={{ 
                padding: '12px', 
                backgroundColor: colors.cardHover, 
                borderRadius: '8px', 
                marginBottom: '12px',
                fontSize: '12px',
                ...text.secondary,
                borderLeft: `3px solid ${colors.primary}20`
              }}>
                <strong style={{ ...text.primary }}>💡 Tip:</strong> If you have a Word letterhead, you can:
                <ul style={{ marginTop: '8px', marginBottom: '8px', paddingLeft: '20px' }}>
                  <li>Save Word doc as "Web Page, Filtered" HTML, then copy the relevant HTML</li>
                  <li>Or copy from Word → paste into Gmail/Docs → copy as HTML</li>
                  <li>Or manually convert: use &lt;div&gt;, &lt;strong&gt;, &lt;br/&gt; tags with inline styles</li>
                </ul>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch('/letterhead-template-janice-glaab-simple.html')
                      const html = await response.text()
                      // Remove HTML comments
                      const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '').trim()
                      
                      // Extract header section (everything before FOOTER SECTION comment)
                      const headerMatch = cleanHtml.match(/<!-- HEADER SECTION -->([\s\S]*?)(?:<!-- FOOTER SECTION -->|$)/)
                      const footerMatch = cleanHtml.match(/<!-- FOOTER SECTION -->([\s\S]*?)$/)
                      
                      if (headerMatch && headerMatch[1]) {
                        setLetterheadHeaderHtml(headerMatch[1].trim())
                      } else {
                        // Fallback: if no markers, use first div as header
                        const firstDivMatch = cleanHtml.match(/<div[^>]*>[\s\S]*?<\/div>/)
                        if (firstDivMatch) {
                          setLetterheadHeaderHtml(cleanHtml.split(/<!-- FOOTER SECTION -->/)[0].trim())
                        }
                      }
                      
                      if (footerMatch && footerMatch[1]) {
                        setLetterheadFooterHtml(footerMatch[1].trim())
                      }
                    } catch (error) {
                      console.error('Failed to load template:', error)
                      showToast('Template not found. Make sure the file exists in /public/ folder.', true)
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  📋 Load Janice Glaab Template (Simple)
                </button>
              </div>
              <textarea
                value={letterheadHeaderHtml}
                onChange={(e) => setLetterheadHeaderHtml(e.target.value)}
                placeholder='<div style="text-align: center;"><strong>FarmTrackr</strong><br/>123 Farm Road<br/>City, State ZIP</div>'
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Header Plain Text (alternative)
                <span style={{ fontSize: '12px', marginLeft: '8px', fontWeight: 'normal' }}>
                  (Fallback if HTML not available)
                </span>
              </label>
              <textarea
                value={letterheadHeaderText}
                onChange={(e) => setLetterheadHeaderText(e.target.value)}
                placeholder="FarmTrackr\n123 Farm Road\nCity, State ZIP"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                Footer HTML (optional)
              </label>
              <textarea
                value={letterheadFooterHtml}
                onChange={(e) => setLetterheadFooterHtml(e.target.value)}
                placeholder='<div style="text-align: center; font-size: 10px;">© 2025 FarmTrackr. All rights reserved.</div>'
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  backgroundColor: colors.card,
                  color: colors.text.primary,
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', ...text.secondary, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={letterheadIsDefault}
                  onChange={(e) => setLetterheadIsDefault(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Set as default letterhead
              </label>
            </div>

            {letterheadHeaderHtml && (
              <div style={{ 
                padding: '16px', 
                backgroundColor: colors.cardHover, 
                borderRadius: '8px', 
                marginBottom: '16px',
                borderLeft: `3px solid ${colors.primary}`,
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px' }}>
                  Header Preview:
                </div>
                <div dangerouslySetInnerHTML={{ __html: letterheadHeaderHtml }} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowLetterheadModal(false)
                  setEditingLetterhead(null)
                  setLetterheadName('')
                  setLetterheadDescription('')
                  setLetterheadHeaderHtml('')
                  setLetterheadHeaderText('')
                  setLetterheadFooterHtml('')
                  setLetterheadIsDefault(false)
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.cardHover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  ...text.secondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLetterhead}
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.success,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                {editingLetterhead ? 'Save Changes' : 'Create Letterhead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && docToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false)
              setDocToDelete(null)
            }
          }}
        >
          <div
            style={{
              ...card,
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
              Delete Document
            </h2>
            <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '24px' }}>
              Are you sure you want to delete "{docToDelete.title}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDocToDelete(null)
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.cardHover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  ...text.secondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocument}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.error || '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '16px 20px',
            backgroundColor: colors.success,
            color: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease',
          }}
        >
          <div style={{ fontSize: '16px' }}>✓</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{successMessage}</div>
        </div>
      )}

      {/* Error Toast */}
      {showErrorToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '16px 20px',
            backgroundColor: colors.error || '#ef4444',
            color: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '400px',
            animation: 'slideIn 0.3s ease',
          }}
        >
          <div style={{ fontSize: '16px' }}>✕</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>{errorMessage}</div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </Sidebar>
  )
}