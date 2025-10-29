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

interface Document {
  id: string
  title: string
  description?: string
  type?: 'template' | 'contact' | 'report'
  contactName?: string
  createdAt: Date
  updatedAt: Date
  fileSize?: string
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
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [activeTab, setActiveTab] = useState<'documents' | 'letterheads'>('documents')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'template' | 'contact' | 'report'>('all')

  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [newDocDescription, setNewDocDescription] = useState('')
  const [newDocContent, setNewDocContent] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)

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

  useEffect(() => {
    const fetchDocs = async () => {
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
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
          }))
          setDocs(mapped)
        }
      } catch (e) {
        console.error('Failed to load documents', e)
      } finally {
        setLoading(false)
      }
    }
    fetchDocs()
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
        return isDark ? '#064e3b' : '#f0fdf4'
      case 'contact':
        return isDark ? '#1e3a8a' : '#eff6ff'
      case 'report':
        return isDark ? '#78350f' : '#fffbeb'
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

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      alert('Please enter a document title')
      return
    }

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitle,
          description: newDocDescription || null,
          content: newDocContent || null,
        }),
      })

      if (response.ok) {
        const created = await response.json()
        // Refresh the documents list
        const res = await fetch(`/api/documents?${new URLSearchParams().toString()}`)
        if (res.ok) {
          const data = await res.json()
          const mapped: Document[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description || '',
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
          }))
          setDocs(mapped)
        }
        // Close modal and reset form
        setShowCreateModal(false)
        setNewDocTitle('')
        setNewDocDescription('')
        setNewDocContent('')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create document'}`)
      }
    } catch (error) {
      console.error('Failed to create document:', error)
      alert('Failed to create document')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      // For now, we'll create a document with the file name
      // In the future, you can upload to cloud storage and store the URL
      const fileContent = await file.text().catch(() => null)
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name,
          description: `Uploaded file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
          content: fileContent,
          fileUrl: null, // Can be updated when file storage is implemented
        }),
      })

      if (response.ok) {
        const created = await response.json()
        // Refresh the documents list
        const res = await fetch(`/api/documents?${new URLSearchParams().toString()}`)
        if (res.ok) {
          const data = await res.json()
          const mapped: Document[] = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            description: d.description || '',
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt),
          }))
          setDocs(mapped)
        }
        alert('Document uploaded successfully!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to upload document'}`)
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file')
    } finally {
      setUploadingFile(false)
      // Reset file input
      event.target.value = ''
    }
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
      alert('Name and at least header HTML or text is required')
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
        setShowLetterheadModal(false)
        handleOpenLetterheadModal() // Reset form
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to save letterhead'}`)
      }
    } catch (error) {
      console.error('Failed to save letterhead:', error)
      alert('Failed to save letterhead')
    }
  }

  const handleDeleteLetterhead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this letterhead?')) return

    try {
      const response = await fetch(`/api/letterheads/${id}`, {
        method: 'DELETE',
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
      } else {
        alert('Failed to delete letterhead')
      }
    } catch (error) {
      console.error('Failed to delete letterhead:', error)
      alert('Failed to delete letterhead')
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
                ...card
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
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
                        ...text.primary,
                        margin: '0 0 4px 0'
                      }}
                    >
                      {activeTab === 'documents' ? 'Documents' : 'Letterheads'}
                    </h1>
                    <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                      {activeTab === 'documents' 
                        ? 'Manage your farm documents and templates'
                        : 'Manage letterheads for mail merge letters'
                      }
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Tab Switcher */}
                  <div style={{ display: 'flex', gap: '8px', marginRight: '12px', padding: '4px', backgroundColor: colors.cardHover, borderRadius: '8px' }}>
                    <button
                      onClick={() => setActiveTab('documents')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === 'documents' ? colors.primary : 'transparent',
                        color: activeTab === 'documents' ? '#ffffff' : colors.text.secondary,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Documents
                    </button>
                    <button
                      onClick={() => setActiveTab('letterheads')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: activeTab === 'letterheads' ? colors.primary : 'transparent',
                        color: activeTab === 'letterheads' ? '#ffffff' : colors.text.secondary,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Letterheads
                    </button>
                  </div>
                  {activeTab === 'letterheads' && (
                    <button
                      onClick={() => handleOpenLetterheadModal()}
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
                      style={{
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
                        transition: 'background-color 0.2s ease',
                        marginRight: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#2563eb' : '#1d4ed8'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.primary
                      }}
                    >
                      <Plus style={{ width: '16px', height: '16px' }} />
                      Mail Merge
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowCreateModal(true)}
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
                    onClick={() => setShowCreateModal(true)}
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
                        {doc.contactName && (
                          <span style={{ fontSize: '12px', ...text.secondary }}>
                            {doc.contactName}
                          </span>
                        )}
                        <span style={{ fontSize: '12px', ...text.secondary }}>
                          {doc.fileSize}
                        </span>
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
                        >
                          <MoreHorizontal style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
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
              Create New Document
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
                    handleCreateDocument()
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
                  setNewDocTitle('')
                  setNewDocDescription('')
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
                onClick={handleCreateDocument}
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
                Create Document
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
              handleOpenLetterheadModal() // Reset form
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
                <strong style={{ ...text.primary }}>💡 Tip:</strong> Click <strong>"Load Janice Glaab Template"</strong> to auto-fill a template, or paste your own HTML.
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
                  handleOpenLetterheadModal() // Reset form
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
    </Sidebar>
  )
}