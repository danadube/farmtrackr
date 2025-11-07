'use client'

import { useState, useEffect, useRef } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { EmailPanel } from '@/components/EmailPanel'
import { EmailComposer } from '@/components/EmailComposer'
import { TransactionSelector } from '@/components/TransactionSelector'
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Search, 
  Inbox, 
  Star, 
  Users, 
  Home, 
  User, 
  FileText,
  Paperclip,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  MoreVertical,
  Filter,
  FileEdit
} from 'lucide-react'
import { EmailData } from '@/types'

interface GmailLabel {
  name: string
  count: number
  icon?: string
  color?: string
  type?: string
  value?: string
}

interface Email {
  id: string
  threadId: string
  from: string
  to: string
  cc?: string
  subject: string
  body: string
  plainBody: string
  date: string
  isUnread: boolean
  isStarred: boolean
  hasAttachments: boolean
  labels: string[]
  direction: 'sent' | 'received'
  transactionId?: string
}

export default function EmailsPage() {
  const { colors, isDark, card, headerCard, text, spacing } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string>('INBOX')
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [emails, setEmails] = useState<Email[]>([])
  const [labels, setLabels] = useState<GmailLabel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showLabelsMenu, setShowLabelsMenu] = useState(false)
  const labelsSectionRef = useRef<HTMLDivElement | null>(null)

  // Load Gmail labels
  useEffect(() => {
    loadLabels()
  }, [])

  // Load emails when filters change
  useEffect(() => {
    loadEmails()
  }, [selectedTransactionId, selectedLabel, searchQuery, statusFilter])

  const loadLabels = async () => {
    try {
      const response = await fetch('/api/emails/labels')
      if (!response.ok) {
        throw new Error(`Labels request failed: ${response.status}`)
      }

      const data = await response.json()
      let formattedLabels: GmailLabel[] = []

      if (Array.isArray(data)) {
        formattedLabels = data.map((label: any) => ({
          name: label.name,
          count: label.count || 0,
          icon: label.icon,
          color: label.color,
          type: label.type,
          value: label.value || label.id || label.name
        }))
      } else if (Array.isArray(data?.labels)) {
        formattedLabels = data.labels.map((label: any) => ({
          name: label.name,
          count: label.count || 0,
          icon: label.icon,
          color: label.color,
          type: label.type,
          value: label.value || label.id || label.name
        }))
      } else if (data?.system || data?.custom || data?.virtual) {
        formattedLabels = [
          ...(Array.isArray(data.system)
            ? data.system.map((label: any) => ({
                name: label.name,
                count: label.count || 0,
                icon: label.icon,
                color: label.color,
                type: label.type || 'system',
                value: label.value || label.id || label.name
              }))
            : []),
          ...(Array.isArray(data.custom)
            ? data.custom.map((label: any) => ({
                name: label.name,
                count: label.count || 0,
                icon: label.icon,
                color: label.color,
                type: label.type || 'custom',
                value: label.value || label.id || label.name
              }))
            : []),
          ...(Array.isArray(data.virtual)
            ? data.virtual.map((label: any) => ({
                name: label.name,
                count: label.count || 0,
                icon: label.icon,
                color: label.color,
                type: label.type || 'virtual',
                value: label.value || label.id || label.name
              }))
            : [])
        ]
      }

      const getLabelValue = (label: GmailLabel) => label.value || label.name

      if (formattedLabels.length > 0) {
        setLabels(formattedLabels)

        const inboxLabel = formattedLabels.find(l => getLabelValue(l) === 'INBOX')
        setUnreadCount(inboxLabel?.count || 0)

        if (!formattedLabels.some(l => getLabelValue(l) === selectedLabel)) {
          const defaultLabel = inboxLabel || formattedLabels[0]
          if (defaultLabel) {
            setSelectedLabel(getLabelValue(defaultLabel))
          }
        }
        setShowLabelsMenu(false)
      } else {
        setLabels([])
        setUnreadCount(0)
        setShowLabelsMenu(false)
      }
    } catch (err) {
      console.error('Error loading labels:', err)
      setLabels([])
      setUnreadCount(0)
      setShowLabelsMenu(false)
    }
  }

  useEffect(() => {
    if (!showLabelsMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      if (labelsSectionRef.current && !labelsSectionRef.current.contains(event.target as Node)) {
        setShowLabelsMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLabelsMenu])

  const loadEmails = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        label: selectedLabel,
        maxResults: '50'
      })
      
      if (selectedTransactionId && selectedTransactionId !== 'all') {
        params.append('transactionId', selectedTransactionId)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/emails/list?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.emails) {
          setEmails(data.emails)
        }
      }
    } catch (err) {
      console.error('Error loading emails:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (emailData: EmailData) => {
    try {
      const response = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setShowComposer(false)
        loadEmails() // Refresh email list
        loadLabels() // Refresh label counts
        return { success: true }
      }
      
      return { success: false, error: result.error || 'Failed to send email' }
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getLabelIcon = (labelName: string) => {
    switch (labelName) {
      case 'INBOX':
        return <Inbox style={{ width: '16px', height: '16px' }} />
      case 'SENT':
      case 'Sent':
        return <Send style={{ width: '16px', height: '16px' }} />
      case 'IMPORTANT':
      case 'Important':
        return <Star style={{ width: '16px', height: '16px' }} />
      case 'Clients':
        return <Users style={{ width: '16px', height: '16px' }} />
      case 'Transactions':
        return <Home style={{ width: '16px', height: '16px' }} />
      case 'Personal':
        return <User style={{ width: '16px', height: '16px' }} />
      case 'DRAFTS':
      case 'Drafts':
        return <FileEdit style={{ width: '16px', height: '16px' }} />
      case 'LOGGED':
        return <Mail style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
      default:
        return <Mail style={{ width: '16px', height: '16px' }} />
    }
  }

  const getLinkedEmailCount = () => {
    return emails.filter(e => e.transactionId).length
  }

  const handleSelectLabel = (labelName: string) => {
    setSelectedLabel(labelName)
    setShowLabelsMenu(false)
  }

  return (
    <Sidebar>
      <div 
        style={{ 
          minHeight: '100vh',
          backgroundColor: colors.background
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
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.primary}`,
                borderRadius: '16px',
                position: 'relative' as const,
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Mail style={{ width: '24px', height: '24px', color: colors.primary }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h1 
                        style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: '#ffffff',
                          margin: '0 0 4px 0'
                        }}
                      >
                        Emails
                      </h1>
                      {unreadCount > 0 && (
                        <div style={{
                          backgroundColor: colors.error,
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {unreadCount}
                        </div>
                      )}
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                      Manage your email communications and stay connected
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    {...getButtonPressHandlers('compose-email')}
                    onClick={() => setShowComposer(true)}
                    style={getButtonPressStyle(
                      'compose-email',
                      {
                        padding: '12px 24px',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)'
                      },
                      'rgba(255, 255, 255, 0.2)',
                      'rgba(255, 255, 255, 0.3)'
                    )}
                  >
                    <Send style={{ width: '18px', height: '18px' }} />
                    Compose
                  </button>
                  <button
                    {...getButtonPressHandlers('refresh-emails')}
                    onClick={loadEmails}
                    disabled={loading}
                    style={getButtonPressStyle(
                      'refresh-emails',
                      {
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading ? 0.6 : 1
                      },
                      'rgba(255, 255, 255, 0.2)',
                      'rgba(255, 255, 255, 0.3)'
                    )}
                  >
                    <RefreshCw style={{ 
                      width: '18px', 
                      height: '18px', 
                      color: '#ffffff',
                      animation: loading ? 'spin 1s linear infinite' : 'none'
                    }} />
                  </button>
                  <button
                    {...getButtonPressHandlers('create-test-emails')}
                    onClick={async () => {
                      try {
                        setLoading(true)
                        const response = await fetch('/api/emails/test', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ count: 5 })
                        })
                        const result = await response.json()
                        if (result.success) {
                          alert(`Successfully created ${result.count || 5} test emails!`)
                          loadEmails()
                          loadLabels()
                        } else {
                          alert(`Error: ${result.error || 'Failed to create test emails'}`)
                        }
                      } catch (err) {
                        console.error('Error creating test emails:', err)
                        alert(`Error: ${err instanceof Error ? err.message : 'Failed to create test emails'}`)
                      } finally {
                        setLoading(false)
                      }
                    }}
                    style={getButtonPressStyle(
                      'create-test-emails',
                      {
                        padding: '12px 24px',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)'
                      },
                      'rgba(255, 255, 255, 0.2)',
                      'rgba(255, 255, 255, 0.3)'
                    )}
                  >
                    <Mail style={{ width: '18px', height: '18px' }} />
                    Create Test Emails
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Context Bar */}
          <div style={{
            ...card,
            padding: spacing(3),
            marginBottom: spacing(3),
            display: 'flex',
            alignItems: 'center',
            gap: spacing(3),
            flexWrap: 'wrap'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
            <span style={{ fontSize: '14px', ...text.secondary }}>View Emails For:</span>
            <div style={{ width: '300px' }}>
              <TransactionSelector
                selectedTransactionId={selectedTransactionId || undefined}
                onSelect={(id) => setSelectedTransactionId(id)}
                placeholder="All Transactions"
              />
            </div>
          </div>
          
          {selectedTransactionId && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                <Calendar style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                <span style={{ fontSize: '14px', ...text.secondary }}>Status: Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                <DollarSign style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                <span style={{ fontSize: '14px', ...text.secondary }}>Price: $525,000</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                <LinkIcon style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                <span style={{ fontSize: '14px', ...text.secondary }}>Linked: {getLinkedEmailCount()} emails</span>
              </div>
            </>
          )}
        </div>

          <div style={{ display: 'flex', gap: spacing(3), minHeight: '600px' }}>
          {/* Left Pane - Navigation & Email List */}
          <div style={{
            width: '400px',
            ...card,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: 'calc(100vh - 300px)'
          }}>
            {/* Gmail Labels Section */}
            <div
              ref={labelsSectionRef}
              style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}`, position: 'relative' as const }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(2) }}>
                <h3 style={{ fontSize: '12px', fontWeight: '600', ...text.tertiary, textTransform: 'uppercase', margin: 0 }}>
                  Gmail Folders/Labels
                </h3>
                <button
                  onClick={() => setShowLabelsMenu((prev) => !prev)}
                  style={{
                    fontSize: '12px',
                    color: colors.primary,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Manage Labels
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing(1) }}>
                {labels.length === 0 ? (
                  <span style={{ fontSize: '12px', ...text.tertiary }}>
                    No labels found. Click refresh to try again.
                  </span>
                ) : (
                  (() => {
                    const quickLabels = labels.filter(
                      (label) => (label.value || label.name) !== 'LOGGED'
                    )
                    if (labels.some((label) => (label.value || label.name) === 'LOGGED')) {
                      quickLabels.unshift({
                        name: 'Logged Emails',
                        count: labels.find((label) => (label.value || label.name) === 'LOGGED')?.count || 0,
                        icon: '🗂️',
                        color: '#6b7280',
                        type: 'virtual',
                        value: 'LOGGED'
                      })
                    }

                    return quickLabels.slice(0, 6).map((label) => {
                      const labelValue = label.value || label.name
                      return (
                        <button
                          key={labelValue}
                          {...getButtonPressHandlers(`label-${labelValue}`)}
                          onClick={() => handleSelectLabel(labelValue)}
                          style={getButtonPressStyle(
                            `label-${labelValue}`,
                            {
                              padding: `${spacing(1)} ${spacing(2)}`,
                              backgroundColor: selectedLabel === labelValue ? colors.primary : 'transparent',
                              color: selectedLabel === labelValue ? '#ffffff' : colors.text.primary,
                              border: `1px solid ${selectedLabel === labelValue ? colors.primary : colors.border}`,
                              borderRadius: spacing(1),
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1)
                            },
                            selectedLabel === labelValue ? colors.primary : colors.card,
                            selectedLabel === labelValue ? colors.primaryHover : colors.cardHover
                          )}
                        >
                          {labelValue === 'LOGGED' ? (
                            <Mail style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
                          ) : (
                            getLabelIcon(labelValue)
                          )}
                          <span>{label.name}</span>
                          <span style={{ opacity: 0.7 }}>({label.count})</span>
                        </button>
                      )
                    })
                  })()
                )}
              </div>

              {showLabelsMenu && labels.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: spacing(3),
                    zIndex: 30,
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: spacing(1),
                    boxShadow: isDark
                      ? '0 12px 30px rgba(0, 0, 0, 0.6)'
                      : '0 16px 40px rgba(15, 23, 42, 0.12)',
                    minWidth: '240px',
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ padding: spacing(2), display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
                    {labels.map((label) => {
                      const labelValue = label.value || label.name
                      return (
                      <button
                        key={`menu-${labelValue}`}
                        onClick={() => handleSelectLabel(labelValue)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: spacing(1.5),
                          borderRadius: spacing(1),
                          border: 'none',
                          backgroundColor: selectedLabel === labelValue ? colors.primaryLight : 'transparent',
                          color: selectedLabel === labelValue ? colors.primary : colors.text.primary,
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: selectedLabel === labelValue ? 600 : 500,
                          textAlign: 'left'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                          {getLabelIcon(labelValue)}
                          {label.name}
                        </span>
                        <span style={{ fontSize: '12px', ...text.tertiary }}>({label.count})</span>
                      </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Search and Filter */}
            <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', gap: spacing(2), marginBottom: spacing(2) }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search style={{
                    position: 'absolute',
                    left: spacing(2),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: colors.text.tertiary
                  }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search emails..."
                    style={{
                      width: '100%',
                      padding: `${spacing(1.5)} ${spacing(1.5)} ${spacing(1.5)} ${spacing(5)}`,
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      fontSize: '14px',
                      ...text.primary,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing(2) }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    flex: 1,
                    padding: spacing(1.5),
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: spacing(1),
                    fontSize: '14px',
                    ...text.primary,
                    outline: 'none'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="starred">Starred</option>
                </select>
                <select
                  style={{
                    flex: 1,
                    padding: spacing(1.5),
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: spacing(1),
                    fontSize: '14px',
                    ...text.primary,
                    outline: 'none'
                  }}
                >
                  <option>Load Template...</option>
                </select>
              </div>
            </div>

            {/* Email List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: spacing(4), textAlign: 'center', ...text.secondary }}>
                  Loading emails...
                </div>
              ) : emails.length === 0 ? (
                <div style={{ padding: spacing(4), textAlign: 'center', ...text.tertiary }}>
                  No emails found
                </div>
              ) : (
                emails.map((email) => {
                  const attachments = (email as any)?.attachments as any[] | undefined
                  const showAttachmentIcon = Boolean(email.hasAttachments || (attachments && attachments.length > 0))

                  return (
                    <div
                      key={email.id}
                      {...getButtonPressHandlers(`email-${email.id}`)}
                      onClick={() => setSelectedEmail(email)}
                      style={getButtonPressStyle(
                        `email-${email.id}`,
                        {
                          padding: spacing(3),
                          borderBottom: `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          backgroundColor: selectedEmail?.id === email.id ? colors.primaryLight : 'transparent',
                          borderLeft: selectedEmail?.id === email.id ? `4px solid ${colors.primary}` : '4px solid transparent'
                        },
                        selectedEmail?.id === email.id ? colors.primaryLight : colors.card,
                        colors.cardHover
                      )}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: spacing(1) }}>
                        <div style={{ display: 'flex', gap: spacing(1), flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: email.direction === 'received' ? '#e9d5ff' : '#dbeafe',
                            color: email.direction === 'received' ? '#7c3aed' : '#1e40af',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {email.direction === 'received' ? 'Received' : 'Sent'}
                          </span>
                          {email.transactionId && (
                            <span style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontWeight: '600',
                              backgroundColor: colors.successLight,
                              color: colors.success,
                              borderRadius: '4px'
                            }}>
                              TXN-{email.transactionId.slice(-6)}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                          {email.isStarred && <Star style={{ width: '14px', height: '14px', color: colors.warning, fill: colors.warning }} />}
                          {showAttachmentIcon && (
                            <Paperclip style={{ width: '14px', height: '14px', color: colors.text.tertiary }} />
                          )}
                          <span style={{ fontSize: '12px', ...text.tertiary }}>
                            {formatDate(email.date)}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '14px', fontWeight: email.isUnread ? '600' : '400', ...text.primary, marginBottom: spacing(0.5) }}>
                        From: {email.from}
                      </div>
                      
                      <div style={{ fontSize: '14px', fontWeight: email.isUnread ? '600' : '400', ...text.primary, marginBottom: spacing(1) }}>
                        {email.subject || '(No subject)'}
                      </div>
                      
                      <div style={{ fontSize: '13px', ...text.secondary, marginBottom: spacing(1), lineHeight: '1.4' }}>
                        {email.plainBody.substring(0, 100)}...
                      </div>
                      
                      <div style={{ display: 'flex', gap: spacing(1), flexWrap: 'wrap' }}>
                        {email.labels.slice(0, 3).map((label) => (
                          <span key={label} style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            backgroundColor: colors.background,
                            color: colors.text.tertiary,
                            borderRadius: '4px'
                          }}>
                            {label.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Pane - Email Detail */}
          <div style={{ flex: 1, ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 'calc(100vh - 300px)' }}>
            {selectedEmail ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: spacing(4) }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '600', ...text.primary, marginBottom: spacing(4) }}>
                    {selectedEmail.subject || '(No subject)'}
                  </h2>

                  {selectedEmail.transactionId && (
                    <div style={{
                      padding: spacing(2),
                      backgroundColor: colors.successLight,
                      border: `1px solid ${colors.success}`,
                      borderRadius: spacing(1),
                      marginBottom: spacing(3),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                        <Home style={{ width: '18px', height: '18px', color: colors.success }} />
                        <span style={{ fontSize: '14px', fontWeight: '500', color: colors.success }}>
                          Linked to Transaction: TXN-{selectedEmail.transactionId.slice(-6)}
                        </span>
                      </div>
                      <button
                        style={{
                          fontSize: '12px',
                          color: colors.success,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        Change Transaction
                      </button>
                    </div>
                  )}

                  <div style={{ marginBottom: spacing(4) }}>
                    <div style={{ fontSize: '14px', ...text.secondary, marginBottom: spacing(1) }}>
                      <strong>From:</strong> {selectedEmail.from}
                    </div>
                    <div style={{ fontSize: '14px', ...text.secondary, marginBottom: spacing(1) }}>
                      <strong>To:</strong> {selectedEmail.to}
                    </div>
                    {selectedEmail.cc && (
                      <div style={{ fontSize: '14px', ...text.secondary, marginBottom: spacing(1) }}>
                        <strong>CC:</strong> {selectedEmail.cc}
                      </div>
                    )}
                    <div style={{ fontSize: '14px', ...text.secondary, marginBottom: spacing(1) }}>
                      <strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    <div style={{ fontSize: '14px', ...text.secondary }}>
                      <strong>Labels:</strong> {selectedEmail.labels.join(', ')}
                    </div>
                  </div>

                  <div style={{
                    padding: spacing(4),
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: spacing(1),
                    ...text.primary,
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }} dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.plainBody }} />
                </div>
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...text.tertiary
              }}>
                Select an email to view
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Email Composer Modal */}
      {showComposer && (
        <EmailComposer
          initialTransactionId={selectedTransactionId || undefined}
          onSend={handleSendEmail}
          onClose={() => setShowComposer(false)}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Sidebar>
  )
}

