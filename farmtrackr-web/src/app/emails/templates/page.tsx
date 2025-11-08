'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplate } from '@/lib/emailTemplates'
import { EmailComposer } from '@/components/EmailComposer'
import {
  FileText,
  RefreshCw,
  Search,
  ListFilter,
  Plus,
  Pencil,
  Trash2,
  Mail,
} from 'lucide-react'
import type { EmailData } from '@/types'

type TemplateFormState = {
  id?: string
  name: string
  subject: string
  body: string
  category: string
  variables: string
}

const CATEGORY_ORDER = ['General', 'Buyer', 'Seller', 'Showing', 'Offers', 'Closing']
const DEFAULT_TEMPLATE_BODY = `<p>Hi {{client_name}},</p>
<p>Thank you for choosing FarmTrackr. Update this template with your own message and merge variables.</p>
<p>Best,<br />{{agent_name}}</p>`

export default function EmailTemplatesManagerPage() {
  const { colors, text, background, card, spacing } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()

  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const [composerOpen, setComposerOpen] = useState(false)
  const [composerKey, setComposerKey] = useState<number>(0)
  const [composerState, setComposerState] = useState<{ subject: string; body: string; to?: string; transactionId?: string | null }>({
    subject: '',
    body: '',
  })

  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    id: undefined,
    name: '',
    subject: '',
    body: DEFAULT_TEMPLATE_BODY,
    category: 'General',
    variables: '',
  })

  useEffect(() => {
    refreshTemplates()
  }, [])

  const refreshTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/emails/templates')
      if (!response.ok) {
        setTemplates(DEFAULT_EMAIL_TEMPLATES)
        return
      }

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
    } catch (error) {
      console.error('Error loading templates:', error)
      setTemplates(DEFAULT_EMAIL_TEMPLATES)
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map((template) => template.category || 'General'))
    const ordered = CATEGORY_ORDER.filter((category) => uniqueCategories.has(category))
    const remaining = Array.from(uniqueCategories).filter((category) => !CATEGORY_ORDER.includes(category))
    return ['all', ...ordered, ...remaining]
  }, [templates])

  const filteredTemplates = useMemo(() => {
    return templates
      .filter((template) => {
        if (selectedCategory === 'all') return true
        return (template.category || 'General') === selectedCategory
      })
      .filter((template) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          template.name.toLowerCase().includes(query) ||
          (template.subject || '').toLowerCase().includes(query) ||
          (template.body || '').toLowerCase().includes(query) ||
          (template.variables || []).some((variable) => variable.toLowerCase().includes(query))
        )
      })
      .sort((a, b) => {
        const categoryA = a.category || 'General'
        const categoryB = b.category || 'General'
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

  const openComposerWithTemplate = (template: EmailTemplate) => {
    setComposerState({
      subject: template.subject || '',
      body: template.body || '',
    })
    setComposerKey(Date.now())
    setComposerOpen(true)
  }

  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setTemplateForm({
        id: template.id,
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || DEFAULT_TEMPLATE_BODY,
        category: template.category || 'General',
        variables: (template.variables || []).join(', '),
      })
    } else {
      setTemplateForm({
        id: undefined,
        name: '',
        subject: '',
        body: DEFAULT_TEMPLATE_BODY,
        category: 'General',
        variables: '',
      })
    }
    setTemplateError(null)
    setTemplateModalOpen(true)
  }

  const handleTemplateFieldChange = (field: keyof TemplateFormState, value: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      setTemplateError('Template name is required.')
      return
    }
    if (!templateForm.subject.trim()) {
      setTemplateError('Template subject is required.')
      return
    }
    if (!templateForm.body.trim()) {
      setTemplateError('Template body cannot be empty.')
      return
    }

    setIsSavingTemplate(true)
    setTemplateError(null)
    try {
      const variablesArray = templateForm.variables
        ? templateForm.variables
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : []

      const response = await fetch('/api/emails/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: {
            id: templateForm.id,
            name: templateForm.name,
            subject: templateForm.subject,
            body: templateForm.body,
            category: templateForm.category,
            variables: variablesArray,
          },
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save template')
      }

      setTemplateModalOpen(false)
      await refreshTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      setTemplateError(error instanceof Error ? error.message : 'Failed to save template')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (templateId?: string) => {
    if (!templateId) return
    if (!confirm('Delete this template? This cannot be undone.')) return
    try {
      const response = await fetch('/api/emails/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete template')
      }

      setTemplateModalOpen(false)
      await refreshTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      setTemplateError(error instanceof Error ? error.message : 'Failed to delete template')
    }
  }

  const handleSendEmail = async (emailData: EmailData) => {
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData),
      })

      const result = await response.json()

      if (result.success) {
        setComposerOpen(false)
        return { success: true }
      }

      return { success: false, error: result.error || 'Failed to send email' }
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
          {/* Header */}
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
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 4px 0' }}>Email Templates</h1>
                    <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>
                      Create, edit, and launch message templates without leaving FarmTrackr.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: spacing(1.5) }}>
                  <button
                    type="button"
                    {...getButtonPressHandlers('new-template')}
                    onClick={() => openTemplateModal()}
                    style={getButtonPressStyle(
                      'new-template',
                      {
                        padding: `${spacing(1.5)} ${spacing(3)}`,
                        backgroundColor: '#ffffff',
                        border: 'none',
                        borderRadius: spacing(1),
                        color: colors.primary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing(1),
                        fontWeight: 600,
                      },
                      '#ffffff',
                      'rgba(255,255,255,0.85)'
                    )}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    New Template
                  </button>
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
                    <RefreshCw
                      style={{
                        width: '16px',
                        height: '16px',
                        animation: loading ? 'spin 1s linear infinite' : 'none',
                      }}
                    />
                    Refresh
                  </button>
                </div>
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
              <div style={{ position: 'relative', width: '220px', minWidth: '200px' }}>
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
            <p style={{ margin: 0, fontSize: '13px', ...text.tertiary }}>
              Use merge variables like <code>{'{{client_name}}'}</code> to auto-fill contact details. Update templates here and they’ll be available anywhere you compose email.
            </p>
          </div>

          {/* Template list */}
          {loading ? (
            <div style={{ ...card, padding: '32px', textAlign: 'center', ...text.secondary }}>Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div
              style={{
                ...card,
                padding: '48px',
                textAlign: 'center',
                border: `1px dashed ${colors.border}`,
              }}
            >
              <FileText style={{ width: '32px', height: '32px', color: colors.text.tertiary, marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, ...text.primary }}>No templates found</h3>
              <p style={{ margin: 0, fontSize: '14px', ...text.secondary }}>
                Adjust your filters or create a new template to get started.
              </p>
            </div>
          ) : (
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
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, ...text.primary }}>{template.name}</h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', ...text.tertiary }}>
                        {template.category || 'Uncategorized'}
                        {template.isLocal && (
                          <span
                            style={{
                              marginLeft: '8px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: colors.infoLight,
                              color: colors.info,
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            Local
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Subject</p>
                    <p style={{ ...text.primary, margin: 0, fontSize: '14px', fontWeight: 500 }}>{template.subject}</p>
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
                      {...getButtonPressHandlers(`use-template-${template.id}`)}
                      onClick={() => openComposerWithTemplate(template)}
                      style={getButtonPressStyle(
                        `use-template-${template.id}`,
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
                          fontWeight: 600,
                        },
                        colors.primary,
                        colors.primaryHover
                      )}
                    >
                      <Mail style={{ width: '14px', height: '14px' }} />
                      Use Template
                    </button>
                    <button
                      type="button"
                      {...getButtonPressHandlers(`edit-template-${template.id}`)}
                      onClick={() => openTemplateModal(template)}
                      style={getButtonPressStyle(
                        `edit-template-${template.id}`,
                        {
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardHover,
                          color: colors.text.primary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          fontSize: '13px',
                        },
                        colors.cardHover,
                        colors.card
                      )}
                    >
                      <Pencil style={{ width: '14px', height: '14px' }} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Draft Composer */}
      {composerOpen && (
        <EmailComposer
          key={composerKey}
          initialSubject={composerState.subject}
          initialBody={composerState.body}
          initialTemplates={templates}
          onSend={handleSendEmail}
          onClose={() => setComposerOpen(false)}
        />
      )}

      {/* Template Modal */}
      {templateModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            zIndex: 1200,
          }}
          onClick={() => {
            if (!isSavingTemplate) {
              setTemplateModalOpen(false)
            }
          }}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, ...text.primary }}>
                {templateForm.id ? 'Edit template' : 'Create template'}
              </h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', ...text.tertiary }}>
                Templates save to your Google Sheet and update immediately across FarmTrackr.
              </p>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, ...text.tertiary }}>
                    Template name
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => handleTemplateFieldChange('name', e.target.value)}
                    placeholder="e.g. New Buyer Welcome"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      backgroundColor: colors.background,
                      ...text.primary,
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, ...text.tertiary }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={templateForm.category}
                    onChange={(e) => handleTemplateFieldChange('category', e.target.value)}
                    placeholder="General, Buyer, Seller..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      backgroundColor: colors.background,
                      ...text.primary,
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, ...text.tertiary }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => handleTemplateFieldChange('subject', e.target.value)}
                  placeholder="Friendly subject line..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    ...text.primary,
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, ...text.tertiary }}>
                  Template body (HTML supported)
                </label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => handleTemplateFieldChange('body', e.target.value)}
                  rows={12}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    ...text.primary,
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    lineHeight: 1.5,
                  }}
                />
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', ...text.tertiary }}>
                  Include merge fields like <code>{'{{client_name}}'}</code>, <code>{'{{property_address}}'}</code>, etc.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, ...text.tertiary }}>
                  Variables (comma separated)
                </label>
                <input
                  type="text"
                  value={templateForm.variables}
                  onChange={(e) => handleTemplateFieldChange('variables', e.target.value)}
                  placeholder="client_name, property_address, agent_name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    ...text.primary,
                    fontSize: '14px',
                  }}
                />
              </div>

              {templateError && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: colors.errorLight,
                    border: `1px solid ${colors.error}`,
                    fontSize: '13px',
                    color: colors.error,
                  }}
                >
                  {templateError}
                </div>
              )}
            </div>

            <div
              style={{
                padding: '24px',
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              {templateForm.id ? (
                <button
                  type="button"
                  {...getButtonPressHandlers('delete-template')}
                  onClick={() => handleDeleteTemplate(templateForm.id)}
                  disabled={isSavingTemplate}
                  style={getButtonPressStyle(
                    'delete-template',
                    {
                      padding: `${spacing(1.2)} ${spacing(2)}`,
                      backgroundColor: colors.errorLight,
                      border: `1px solid ${colors.error}`,
                      borderRadius: spacing(1),
                      color: colors.error,
                      cursor: isSavingTemplate ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                    },
                    colors.errorLight,
                    colors.error
                  )}
                >
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                  Delete template
                </button>
              ) : (
                <div />
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  {...getButtonPressHandlers('cancel-template')}
                  onClick={() => {
                    if (!isSavingTemplate) {
                      setTemplateModalOpen(false)
                    }
                  }}
                  disabled={isSavingTemplate}
                  style={getButtonPressStyle(
                    'cancel-template',
                    {
                      padding: `${spacing(1.2)} ${spacing(2)}`,
                      backgroundColor: colors.cardHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      color: colors.text.primary,
                      cursor: isSavingTemplate ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                    },
                    colors.cardHover,
                    colors.card
                  )}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('save-template')}
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate}
                  style={getButtonPressStyle(
                    'save-template',
                    {
                      padding: `${spacing(1.2)} ${spacing(2.4)}`,
                      backgroundColor: colors.primary,
                      border: 'none',
                      borderRadius: spacing(1),
                      color: '#fff',
                      cursor: isSavingTemplate ? 'wait' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                    },
                    colors.primary,
                    colors.primaryHover
                  )}
                >
                  <Pencil style={{ width: '14px', height: '14px' }} />
                  {isSavingTemplate ? 'Saving...' : templateForm.id ? 'Save changes' : 'Create template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}

