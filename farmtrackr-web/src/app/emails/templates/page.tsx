'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplate } from '@/lib/emailTemplates'
import { FileText, RefreshCw, Copy, Search, ListFilter } from 'lucide-react'

const CATEGORY_ORDER = ['Buyer', 'Seller', 'Showing', 'Offers', 'Closing']

export default function EmailTemplatesManagerPage() {
  const { colors, text, background, card, spacing } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()

  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  useEffect(() => {
    refreshTemplates()
  }, [])

  const refreshTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/emails/templates')
      if (response.ok) {
        const data = await response.json()
        let templateList: EmailTemplate[] = []
        if (data.success && Array.isArray(data.templates)) {
          templateList = data.templates
        } else if (Array.isArray(data)) {
          templateList = data
        }

        if (templateList.length === 0) {
          setTemplates(DEFAULT_EMAIL_TEMPLATES)
        } else {
          const defaultMap = new Map(DEFAULT_EMAIL_TEMPLATES.map((t) => [t.id, t]))
          const combined = templateList.map((t: EmailTemplate) => ({
            ...defaultMap.get(t.id),
            ...t,
          }))
          DEFAULT_EMAIL_TEMPLATES.forEach((template) => {
            if (!combined.find((item) => item.id === template.id)) {
              combined.push(template)
            }
          })
          setTemplates(combined)
        }
      } else {
        setTemplates(DEFAULT_EMAIL_TEMPLATES)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates(DEFAULT_EMAIL_TEMPLATES)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((template) => {
        if (selectedCategory !== 'all') {
          return (template.category || 'Uncategorized') === selectedCategory
        }
        return true
      })
      .filter((template) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          template.name.toLowerCase().includes(query) ||
          template.subject.toLowerCase().includes(query) ||
          template.body.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => {
        const categoryA = a.category || 'Uncategorized'
        const categoryB = b.category || 'Uncategorized'
        if (categoryA === categoryB) {
          return a.name.localeCompare(b.name)
        }
        const indexA = CATEGORY_ORDER.indexOf(categoryA)
        const indexB = CATEGORY_ORDER.indexOf(categoryB)
        if (indexA === -1 && indexB === -1) {
          return categoryA.localeCompare(categoryB)
        }
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
      })
  }, [templates, selectedCategory, searchQuery])

  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      templates.map((template) => template.category || 'Uncategorized')
    )
    return ['all', ...CATEGORY_ORDER.filter((category) => uniqueCategories.has(category)), ...Array.from(uniqueCategories).filter((category) => !CATEGORY_ORDER.includes(category))]
  }, [templates])

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`${label} copied!`)
      setTimeout(() => setCopyMessage(null), 2500)
    } catch (error) {
      console.error('Failed to copy', error)
      setCopyMessage('Copy failed. Please try again.')
      setTimeout(() => setCopyMessage(null), 2500)
    }
  }

  return (
    <Sidebar>
      <div style={{ ...background }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '32px 48px 64px 48px',
          }}
        >
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                padding: '24px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                border: `1px solid ${colors.primary}`,
                borderRadius: '16px',
                color: '#fff',
                position: 'relative' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText style={{ width: '24px', height: '24px', color: colors.primary }} />
                  </div>
                  <div>
                    <h1
                      style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        margin: '0 0 4px 0',
                      }}
                    >
                      Email Templates
                    </h1>
                    <p style={{ margin: '0', fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>
                      Browse and copy pre-built email templates for buyers, sellers, and transactions.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  {...getButtonPressHandlers('refresh-templates')}
                  onClick={refreshTemplates}
                  disabled={loading}
                  style={getButtonPressStyle(
                    'refresh-templates',
                    {
                      padding: `${spacing(1.5)} ${spacing(3)}`,
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.35)',
                      borderRadius: spacing(1),
                      color: '#fff',
                      cursor: loading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                    },
                    'rgba(255,255,255,0.15)',
                    'rgba(255,255,255,0.25)'
                  )}
                >
                  <RefreshCw style={{ width: '16px', height: '16px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div
            style={{
              ...card,
              padding: '24px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: colors.text.tertiary,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    ...text.primary,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ position: 'relative', width: '220px' }}>
                <ListFilter
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: colors.text.tertiary,
                  }}
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    ...text.primary,
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All categories' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {copyMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: colors.successLight,
                  border: `1px solid ${colors.success}`,
                  fontSize: '13px',
                  ...text.primary,
                }}
              >
                {copyMessage}
              </div>
            )}
          </div>

          {/* Template cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                style={{
                  ...card,
                  padding: '20px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: colors.cardHover,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText style={{ width: '20px', height: '20px', color: colors.primary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, ...text.primary }}>
                      {template.name}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', ...text.tertiary }}>
                      {template.category || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Subject
                  </p>
                  <p style={{ ...text.primary, margin: 0, fontSize: '14px', fontWeight: 500 }}>
                    {template.subject}
                  </p>
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: colors.cardHover,
                    border: `1px solid ${colors.border}`,
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: colors.text.secondary,
                    maxHeight: '140px',
                    overflow: 'hidden',
                  }}
                  dangerouslySetInnerHTML={{ __html: template.body }}
                />
                {template.variables && template.variables.length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                      Available variables
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {template.variables.map((variable) => (
                        <span
                          key={variable}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '999px',
                            backgroundColor: colors.cardHover,
                            border: `1px solid ${colors.border}`,
                            fontSize: '11px',
                            ...text.tertiary,
                          }}
                        >
                          {'{{'}
                          {variable}
                          {'}}'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    {...getButtonPressHandlers(`copy-subject-${template.id}`)}
                    onClick={() => copyToClipboard(template.subject || '', 'Subject')}
                    style={getButtonPressStyle(
                      `copy-subject-${template.id}`,
                      {
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardHover,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        ...text.primary,
                      },
                      colors.cardHover,
                      colors.card
                    )}
                  >
                    <Copy style={{ width: '14px', height: '14px' }} />
                    Subject
                  </button>
                  <button
                    type="button"
                    {...getButtonPressHandlers(`copy-body-${template.id}`)}
                    onClick={() => copyToClipboard(template.body || '', 'Body')}
                    style={getButtonPressStyle(
                      `copy-body-${template.id}`,
                      {
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: colors.primary,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '13px',
                      },
                      colors.primary,
                      colors.primaryHover
                    )}
                  >
                    <Copy style={{ width: '14px', height: '14px' }} />
                    Body
                  </button>
                </div>
              </div>
            ))}
            {filteredTemplates.length === 0 && (
              <div
                style={{
                  ...card,
                  padding: '48px',
                  textAlign: 'center',
                  border: `1px dashed ${colors.border}`,
                  borderRadius: '16px',
                  gridColumn: '1 / -1',
                }}
              >
                <p style={{ fontSize: '16px', fontWeight: 600, ...text.primary, marginBottom: '8px' }}>
                  No templates found
                </p>
                <p style={{ fontSize: '14px', ...text.secondary, margin: 0 }}>
                  Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}


