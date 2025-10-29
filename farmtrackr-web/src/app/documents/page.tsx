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

export default function DocumentsPage() {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'template' | 'contact' | 'report'>('all')

  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

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
                      Documents
                    </h1>
                    <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                      Manage your farm documents and templates
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    style={{
                      padding: '12px 16px',
                      backgroundColor: colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
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
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                  >
                    <Upload style={{ width: '16px', height: '16px' }} />
                    Upload
                  </button>
                  <button
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
                </div>
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </Sidebar>
  )
}