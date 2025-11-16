'use client'

import { useState, useEffect, useMemo, CSSProperties } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { EmailPanel } from '@/components/EmailPanel'
import { EmailComposer } from '@/components/EmailComposer'
import { TransactionSelector } from '@/components/TransactionSelector'
import { DEFAULT_EMAIL_TEMPLATES, EmailTemplate } from '@/lib/emailTemplates'
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
  Unlink,
  MoreVertical,
  Filter,
  FileEdit,
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  Download
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
  const [collapsedSections, setCollapsedSections] = useState({
    siu: false,
    transactions: false,
    custom: false,
  })
  const [showLinkSelector, setShowLinkSelector] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_EMAIL_TEMPLATES)
  const [showQuickReply, setShowQuickReply] = useState(false)
  const [quickReplyText, setQuickReplyText] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [hoveredEmailId, setHoveredEmailId] = useState<string | null>(null)

  const labelThemeVars = useMemo(() => ({
    '--label-bg-card': colors.card,
    '--label-bg-hover': colors.cardHover || '#2f3439',
    '--label-border-subtle': colors.border,
    '--label-text-primary': text.primary.color,
    '--label-text-secondary': text.secondary.color,
    '--label-text-tertiary': text.tertiary.color,
    '--label-accent': colors.primary,
    '--label-hover-bg': colors.cardHover || '#2f3439',
  }) as CSSProperties, [colors.card, colors.cardHover, colors.border, colors.primary, text.primary.color, text.secondary.color, text.tertiary.color])

  const categorizedLabels = useMemo(() => {
    const systemOrder = ['INBOX', 'STARRED', 'SENT', 'DRAFTS', 'IMPORTANT']
    const system: GmailLabel[] = []
    const siu: GmailLabel[] = []
    const transactions: GmailLabel[] = []
    const custom: GmailLabel[] = []
    let hasLoggedLabel = false

    labels.forEach((label) => {
      const rawValue = label.value || label.name
      if (!rawValue) return
      const upperValue = rawValue.toUpperCase()
      const upperName = (label.name || '').toUpperCase()

      if (upperValue === 'LOGGED') {
        hasLoggedLabel = true
        transactions.push(label)
        return
      }

      if (systemOrder.includes(upperValue)) {
        system.push(label)
        return
      }

      if (upperName.startsWith('SIU')) {
        siu.push(label)
        return
      }

      if (upperName.includes('TRANSACTION') || upperName.includes('TXN')) {
        transactions.push(label)
        return
      }

      custom.push(label)
    })

    if (!hasLoggedLabel) {
      transactions.unshift({
        name: 'Logged Emails',
        value: 'LOGGED',
        count: 0,
        type: 'virtual',
      } as GmailLabel)
    }

    const orderedSystem: GmailLabel[] = []
    systemOrder.forEach((value) => {
      const match = system.find((label) => (label.value || label.name || '').toUpperCase() === value)
      if (match) {
        orderedSystem.push(match)
      }
    })
    system.forEach((label) => {
      if (!orderedSystem.includes(label)) {
        orderedSystem.push(label)
      }
    })

    return {
      system: orderedSystem,
      siu,
      transactions,
      custom,
    }
  }, [labels])

  // Load Gmail labels
  useEffect(() => {
    loadLabels()
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [])

  // Load emails when filters change
  useEffect(() => {
    loadEmails()
  }, [selectedTransactionId, selectedLabel, searchQuery, statusFilter])

  useEffect(() => {
    setShowLinkSelector(false)
  }, [selectedEmail?.id])

  // Close move menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showMoveMenu && !target.closest('[data-move-menu]')) {
        setShowMoveMenu(false)
      }
    }
    if (showMoveMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoveMenu])

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
      } else {
        setLabels([])
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error loading labels:', err)
      setLabels([])
      setUnreadCount(0)
    }
  }

  const loadTemplates = async () => {
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
    }
  }

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
        if (Array.isArray(data)) {
          setEmails(data)
        } else if (Array.isArray(data?.emails)) {
          setEmails(data.emails)
        } else if (data?.success && Array.isArray(data?.data)) {
          setEmails(data.data)
        } else {
          setEmails([])
        }
      } else {
        setEmails([])
      }
    } catch (err) {
      console.error('Error loading emails:', err)
      setEmails([])
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

  const handleLinkEmail = async (transactionId: string | null) => {
    if (!selectedEmail) return

    setIsLinking(true)
    try {
      const response = await fetch('/api/emails/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedEmail.id,
          transactionId
        })
      })

      const result = await response.json()

      if (result.success) {
        setShowLinkSelector(false)
        setSelectedEmail({
          ...selectedEmail,
          transactionId: transactionId || undefined
        })
        loadEmails()
      }
    } catch (error) {
      console.error('Error linking email:', error)
    } finally {
      setIsLinking(false)
    }
  }

  const handleReply = () => {
    if (!selectedEmail) return
    setShowQuickReply(true)
  }

  const handleForward = async () => {
    if (!selectedEmail) return
    // Open composer in forward mode
    setShowComposer(true)
    // TODO: Pre-populate forward data
  }

  const handleToggleStar = async () => {
    if (!selectedEmail) return
    
    try {
      // TODO: Implement API call to toggle star
      setSelectedEmail({
        ...selectedEmail,
        isStarred: !selectedEmail.isStarred
      })
      loadEmails()
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  const handleDelete = async (emailId?: string) => {
    const emailToDelete = emailId ? emails.find(e => e.id === emailId) : selectedEmail
    if (!emailToDelete) return
    
    if (!confirm('Are you sure you want to delete this email?')) return
    
    try {
      const response = await fetch('/api/emails/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: emailToDelete.id })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // If we deleted the selected email, clear selection
        if (selectedEmail?.id === emailToDelete.id) {
          setSelectedEmail(null)
        }
        loadEmails()
        loadLabels()
      } else {
        alert(`Error: ${result.error || 'Failed to delete email'}`)
      }
    } catch (error) {
      console.error('Error deleting email:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete email'}`)
    }
  }

  const handleArchive = async (emailId: string) => {
    try {
      // Archive = remove INBOX label
      const response = await fetch('/api/emails/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: emailId,
          labelId: 'INBOX',
          labelName: 'INBOX',
          action: 'remove'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        loadEmails()
        loadLabels()
      } else {
        alert(`Error: ${result.error || 'Failed to archive email'}`)
      }
    } catch (error) {
      console.error('Error archiving email:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to archive email'}`)
    }
  }

  const handleSendQuickReply = async () => {
    if (!selectedEmail || !quickReplyText.trim()) return
    
    setIsReplying(true)
    try {
      const response = await fetch('/api/emails/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedEmail.id,
          body: quickReplyText
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setQuickReplyText('')
        setShowQuickReply(false)
        loadEmails()
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setIsReplying(false)
    }
  }

  const handleMoveToFolder = async (labelId: string, labelName: string) => {
    if (!selectedEmail) return
    
    setIsMoving(true)
    setShowMoveMenu(false)
    
    try {
      const response = await fetch('/api/emails/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedEmail.id,
          labelId,
          labelName,
          action: 'add'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update the email's labels
        const labelValue = getLabelValue({ 
          id: labelId, 
          name: labelName, 
          value: labelName,
          count: 0,
          type: 'user'
        } as GmailLabel)
        if (!selectedEmail.labels.includes(labelValue)) {
          setSelectedEmail({
            ...selectedEmail,
            labels: [...selectedEmail.labels, labelValue]
          })
        }
        loadEmails()
        loadLabels()
      } else {
        alert(`Error: ${result.error || 'Failed to move email'}`)
      }
    } catch (error) {
      console.error('Error moving email:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to move email'}`)
    } finally {
      setIsMoving(false)
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

  const toggleLabelSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleManageLabels = () => {
    if (typeof window !== 'undefined') {
      window.open('https://mail.google.com/mail/u/0/#settings/labels', '_blank')
    }
  }

  const getLabelValue = (label: GmailLabel) => label.value || label.name || ''

  const getLabelDisplayName = (label: GmailLabel) => {
    const value = getLabelValue(label).toUpperCase()
    switch (value) {
      case 'INBOX':
        return 'Inbox'
      case 'SENT':
        return 'Sent'
      case 'STARRED':
        return 'Starred'
      case 'DRAFT':
      case 'DRAFTS':
        return 'Drafts'
      case 'IMPORTANT':
        return 'Important'
      case 'LOGGED':
        return 'Logged Emails'
      default:
        return label.name || getLabelValue(label)
    }
  }

  const getLabelGlyph = (label: GmailLabel) => {
    const value = getLabelValue(label).toUpperCase()
    if (value === 'INBOX') return '📬'
    if (value === 'SENT') return '📤'
    if (value === 'STARRED' || value === 'IMPORTANT') return '⭐'
    if (value === 'DRAFT' || value === 'DRAFTS') return '📝'
    if (value === 'LOGGED') return '🗂️'

    const upperName = (label.name || '').toUpperCase()
    if (upperName.startsWith('SIU')) return '🏷️'
    if (upperName.includes('TRANSACTION') || upperName.includes('TXN')) return '🏡'
    if (upperName.includes('CLIENT')) return '👥'
    if (upperName.includes('PAID')) return '💳'
    if (upperName.includes('ACTIVE')) return '✅'

    return '🏷️'
  }

  const getLabelCount = (label: GmailLabel) => label.count ?? 0

  const renderLabelButton = (label: GmailLabel, index: number, prefix: string) => {
    const rawValue = getLabelValue(label)
    if (!rawValue) return null
    const isActive = selectedLabel === rawValue

    return (
      <button
        type="button"
        key={`${prefix}-${rawValue}-${index}`}
        className={`label-item${isActive ? ' active' : ''}`}
        onClick={() => handleSelectLabel(rawValue)}
      >
        <span
          className="label-icon"
          style={label.color ? { color: label.color } : undefined}
        >
          {getLabelGlyph(label)}
        </span>
        <span className="label-name">{getLabelDisplayName(label)}</span>
        <span className="label-count">{getLabelCount(label)}</span>
      </button>
    )
  }

  const getLinkedEmailCount = () => {
    return emails.filter(e => e.transactionId).length
  }

  const handleSelectLabel = (labelName: string) => {
    setSelectedLabel(labelName)
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
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingTop: '32px',
            boxSizing: 'border-box',
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
          {/* Middle Pane - Email List (hidden preview block above columns) */}
          <div style={{
            width: '420px',
            ...card,
            display: 'none',
            flexDirection: 'column',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            minHeight: 0
          }}>
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
                      {...getButtonPressHandlers(`mid-email-${email.id}`)}
                      onClick={() => setSelectedEmail(email)}
                      style={getButtonPressStyle(
                        `mid-email-${email.id}`,
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
          {/* (Removed duplicate middle pane above columns) */}

          {/* Email Filter Bar */}
          <div style={{ marginBottom: spacing(3) }}>
            <div className="email-filters-bar">
              <div className="filter-group">
                <label className="filter-label">
                  <span className="filter-icon">🏡</span>
                  <span className="filter-label-text">Transaction:</span>
                </label>
                <div className="filter-select-wrapper">
                  <TransactionSelector
                    selectedTransactionId={selectedTransactionId || undefined}
                    onSelect={(id) => setSelectedTransactionId(id)}
                    placeholder="All Transactions"
                  />
                </div>
              </div>

              <div className="filter-group filter-search">
                <span className="filter-search-icon">🔍</span>
                <input
                  type="text"
                  id="emailSearch"
                  name="emailSearch"
                  className="filter-search-input"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <select
                  id="emailStatusFilter"
                  className="filter-select-compact"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All status</option>
                  <option value="unread">📭 Unread</option>
                  <option value="starred">⭐ Starred</option>
                  <option value="hasAttachments">📎 Has attachments</option>
                </select>
              </div>
            </div>

            {selectedTransactionId && (
              <div className="transaction-context">
                <div className="context-info">
                  <div className="context-icon">🏡</div>
                  <div className="context-details">
                    <div className="context-title">Transaction {selectedTransactionId.slice(0, 6)}</div>
                    <div className="context-meta">
                      <span>Linked emails: {getLinkedEmailCount()}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-clear-filter"
                  onClick={() => setSelectedTransactionId(null)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="email-module-layout" style={{ display: 'flex', gap: spacing(3), minHeight: '600px', borderTop: 'none' }}>
          {/* Left Pane - Navigation & Email List */}
          <div className="email-module-left" style={{
            width: '400px',
            ...card,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            minHeight: 0
          }}>
          {/* Gmail Labels Section */}
          <div style={{ padding: spacing(3), flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div
              className="labels-sidebar"
              style={{ ...labelThemeVars, width: '100%', maxWidth: '100%', marginBottom: 0 }}
            >
              {labels.length === 0 ? (
                <div className="label-empty">
                  <span className="empty-icon">📭</span>
                  <p>No labels found.</p>
                  <p className="label-empty-subtext">Connect Gmail or refresh to load folders.</p>
                </div>
              ) : (
                <>
                  <div className="label-section">
                    <div className="label-section-header">
                      <span className="section-title">SYSTEM</span>
                    </div>
                    <div className="label-items">
                      {categorizedLabels.system.length === 0 ? (
                        <span className="label-empty-subtext">No system labels available.</span>
                      ) : (
                        categorizedLabels.system.map((label, index) =>
                          renderLabelButton(label, index, 'system')
                        )
                      )}
                    </div>
                  </div>

                  {categorizedLabels.siu.length > 0 && (
                    <div className="label-section">
                      <button
                        type="button"
                        className={`label-section-header collapsible${collapsedSections.siu ? ' collapsed' : ''}`}
                        onClick={() => toggleLabelSection('siu')}
                      >
                        <span className="section-title">SIU LABELS</span>
                        <span className="section-toggle">▼</span>
                      </button>
                      <div className={`label-items${collapsedSections.siu ? ' collapsed' : ''}`}>
                        {categorizedLabels.siu.map((label, index) =>
                          renderLabelButton(label, index, 'siu')
                        )}
                      </div>
                    </div>
                  )}

                  {categorizedLabels.transactions.length > 0 && (
                    <div className="label-section">
                      <button
                        type="button"
                        className={`label-section-header collapsible${collapsedSections.transactions ? ' collapsed' : ''}`}
                        onClick={() => toggleLabelSection('transactions')}
                      >
                        <span className="section-title">TRANSACTIONS</span>
                        <span className="section-toggle">▼</span>
                      </button>
                      <div className={`label-items${collapsedSections.transactions ? ' collapsed' : ''}`}>
                        {categorizedLabels.transactions.map((label, index) =>
                          renderLabelButton(label, index, 'transactions')
                        )}
                      </div>
                    </div>
                  )}

                  {categorizedLabels.custom.length > 0 && (
                    <div className="label-section">
                      <button
                        type="button"
                        className={`label-section-header collapsible${collapsedSections.custom ? ' collapsed' : ''}`}
                        onClick={() => toggleLabelSection('custom')}
                      >
                        <span className="section-title">CUSTOM</span>
                        <span className="section-toggle">▼</span>
                      </button>
                      <div className={`label-items${collapsedSections.custom ? ' collapsed' : ''}`}>
                        {categorizedLabels.custom.map((label, index) =>
                          renderLabelButton(label, index, 'custom')
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="label-footer">
                <button className="btn-manage-labels" type="button" onClick={handleManageLabels}>
                  <span className="btn-icon">➕</span>
                  <span className="btn-text">Manage Labels</span>
                </button>
              </div>
            </div>
          </div>

            {/* Search and Filter */}
            <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}`, display: 'none' }}>
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
                    name="emailSearch"
                    id="emailSearch"
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
                  name="statusFilter"
                  id="statusFilter"
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
              </div>
            </div>

            {/* Email List (legacy in left pane - keep hidden) */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'none' }}>
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

          {/* Middle Pane - Email List */}
          <div className="email-module-middle" style={{
            width: '420px',
            ...card,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            minHeight: 0
          }}>
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
                  const isHovered = hoveredEmailId === email.id
                  return (
                    <div
                      key={`mid-email-${email.id}`}
                      className="email-list-item"
                      onMouseEnter={() => setHoveredEmailId(email.id)}
                      onMouseLeave={() => setHoveredEmailId(null)}
                      style={getButtonPressStyle(
                        `mid-email-${email.id}`,
                        {
                          padding: spacing(3),
                          borderBottom: `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          backgroundColor: selectedEmail?.id === email.id ? colors.primaryLight : 'transparent',
                          borderLeft: selectedEmail?.id === email.id ? `4px solid ${colors.primary}` : '4px solid transparent',
                          position: 'relative'
                        },
                        selectedEmail?.id === email.id ? colors.primaryLight : colors.card,
                        colors.cardHover
                      )}
                    >
                      {/* Inline Actions - Show on Hover */}
                      {isHovered && (
                        <div
                          style={{
                            position: 'absolute',
                            top: spacing(2),
                            right: spacing(2),
                            display: 'flex',
                            gap: spacing(1),
                            zIndex: 10,
                            backgroundColor: colors.card,
                            padding: spacing(0.5),
                            borderRadius: spacing(1),
                            border: `1px solid ${colors.border}`,
                            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15)`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            {...getButtonPressHandlers(`archive-email-${email.id}`)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleArchive(email.id)
                            }}
                            style={getButtonPressStyle(
                              `archive-email-${email.id}`,
                              {
                                padding: spacing(1),
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: spacing(0.5),
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              },
                              'transparent',
                              colors.cardHover
                            )}
                            title="Archive"
                          >
                            <FileText style={{ width: '16px', height: '16px', color: text.secondary.color }} />
                          </button>
                          <button
                            {...getButtonPressHandlers(`move-email-${email.id}`)}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEmail(email)
                              setShowMoveMenu(true)
                            }}
                            style={getButtonPressStyle(
                              `move-email-${email.id}`,
                              {
                                padding: spacing(1),
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: spacing(0.5),
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              },
                              'transparent',
                              colors.cardHover
                            )}
                            title="Move to Folder"
                          >
                            <MoreVertical style={{ width: '16px', height: '16px', color: text.secondary.color }} />
                          </button>
                          <button
                            {...getButtonPressHandlers(`delete-email-${email.id}`)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(email.id)
                            }}
                            style={getButtonPressStyle(
                              `delete-email-${email.id}`,
                              {
                                padding: spacing(1),
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: spacing(0.5),
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              },
                              'transparent',
                              colors.cardHover
                            )}
                            title="Delete"
                          >
                            <Trash2 style={{ width: '16px', height: '16px', color: colors.error }} />
                          </button>
                        </div>
                      )}
                      <div
                        onClick={() => setSelectedEmail(email)}
                        style={{ cursor: 'pointer' }}
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
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Pane - Email Detail */}
          <div className={`email-module-right${selectedEmail ? ' has-content' : ''}`} style={{ flex: 1, ...card, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: 'calc(100vh - 300px)' }}>
            {selectedEmail ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Detail Header */}
                <div style={{
                  padding: spacing(3),
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: spacing(2),
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2), flex: 1 }}>
                    <button
                      {...getButtonPressHandlers('back-to-list')}
                      onClick={() => setSelectedEmail(null)}
                      style={getButtonPressStyle(
                        'back-to-list',
                        {
                          padding: spacing(1),
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: spacing(1),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <ArrowLeft style={{ width: '20px', height: '20px', color: text.primary.color }} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        ...text.primary,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {selectedEmail.subject || '(No subject)'}
                      </h2>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                    <button
                      {...getButtonPressHandlers('detail-reply')}
                      onClick={handleReply}
                      style={getButtonPressStyle(
                        'detail-reply',
                        {
                          padding: `${spacing(1.5)} ${spacing(2)}`,
                          backgroundColor: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: spacing(1),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing(1),
                          fontSize: '13px',
                          fontWeight: '500',
                          ...text.secondary
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <Reply style={{ width: '16px', height: '16px' }} />
                      Reply
                    </button>
                    <button
                      {...getButtonPressHandlers('detail-forward')}
                      onClick={handleForward}
                      style={getButtonPressStyle(
                        'detail-forward',
                        {
                          padding: `${spacing(1.5)} ${spacing(2)}`,
                          backgroundColor: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: spacing(1),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing(1),
                          fontSize: '13px',
                          fontWeight: '500',
                          ...text.secondary
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <Forward style={{ width: '16px', height: '16px' }} />
                      Forward
                    </button>
                    <button
                      {...getButtonPressHandlers('detail-star')}
                      onClick={handleToggleStar}
                      style={getButtonPressStyle(
                        'detail-star',
                        {
                          padding: spacing(1.5),
                          backgroundColor: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: spacing(1),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <Star style={{
                        width: '18px',
                        height: '18px',
                        color: selectedEmail.isStarred ? colors.warning : text.tertiary.color,
                        fill: selectedEmail.isStarred ? colors.warning : 'none'
                      }} />
                    </button>
                    <div style={{ position: 'relative' }} data-move-menu>
                      <button
                        {...getButtonPressHandlers('detail-move')}
                        onClick={() => setShowMoveMenu(!showMoveMenu)}
                        disabled={isMoving}
                        style={getButtonPressStyle(
                          'detail-move',
                          {
                            padding: spacing(1.5),
                            backgroundColor: 'transparent',
                            border: `1px solid ${colors.border}`,
                            borderRadius: spacing(1),
                            cursor: isMoving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: isMoving ? 0.5 : 1
                          },
                          'transparent',
                          colors.cardHover
                        )}
                      >
                        <MoreVertical style={{ width: '18px', height: '18px', color: text.secondary.color }} />
                      </button>
                      {showMoveMenu && (
                        <div data-move-menu style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: spacing(1),
                          backgroundColor: colors.card,
                          border: `1px solid ${colors.border}`,
                          borderRadius: spacing(1),
                          boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
                          zIndex: 1000,
                          minWidth: '200px',
                          maxHeight: '300px',
                          overflowY: 'auto',
                          padding: spacing(1)
                        }}>
                          <div style={{
                            padding: spacing(1.5),
                            fontSize: '12px',
                            fontWeight: '600',
                            ...text.tertiary,
                            textTransform: 'uppercase',
                            borderBottom: `1px solid ${colors.border}`,
                            marginBottom: spacing(1)
                          }}>
                            Move to Folder
                          </div>
                          {labels.filter(label => {
                            const labelValue = getLabelValue(label)
                            // Don't show system labels that can't be moved to
                            return !['INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM'].includes(labelValue.toUpperCase())
                          }).map((label) => {
                            const labelValue = getLabelValue(label)
                            const labelId = (label as any).id || labelValue
                            const isAlreadyInFolder = selectedEmail?.labels.includes(labelValue)
                            return (
                              <button
                                key={labelId || label.name}
                                {...getButtonPressHandlers(`move-to-${labelId || label.name}`)}
                                onClick={() => handleMoveToFolder(labelId, label.name)}
                                disabled={isAlreadyInFolder || isMoving}
                                style={getButtonPressStyle(
                                  `move-to-${labelId || label.name}`,
                                  {
                                    width: '100%',
                                    padding: spacing(1.5),
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: spacing(0.5),
                                    cursor: (isAlreadyInFolder || isMoving) ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                    fontSize: '13px',
                                    ...text.primary,
                                    opacity: (isAlreadyInFolder || isMoving) ? 0.5 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: spacing(1)
                                  },
                                  'transparent',
                                  colors.cardHover
                                )}
                              >
                                <span>{getLabelGlyph(label)}</span>
                                <span>{getLabelDisplayName(label)}</span>
                                {isAlreadyInFolder && (
                                  <span style={{ marginLeft: 'auto', fontSize: '11px', ...text.tertiary }}>✓</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    <button
                      {...getButtonPressHandlers('detail-delete')}
                      onClick={() => handleDelete()}
                      style={getButtonPressStyle(
                        'detail-delete',
                        {
                          padding: spacing(1.5),
                          backgroundColor: 'transparent',
                          border: `1px solid ${colors.border}`,
                          borderRadius: spacing(1),
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        },
                        'transparent',
                        colors.cardHover
                      )}
                    >
                      <Trash2 style={{ width: '18px', height: '18px', color: colors.error }} />
                    </button>
                  </div>
                </div>

                {/* Detail Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: spacing(4) }}>
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Metadata */}
                    <div style={{
                      marginBottom: spacing(4),
                      padding: spacing(3),
                      backgroundColor: colors.cardHover,
                      borderRadius: spacing(1.5),
                      border: `1px solid ${colors.border}`
                    }}>
                      <div style={{ display: 'grid', gap: spacing(2) }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: spacing(2) }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', ...text.tertiary, minWidth: '60px' }}>From:</span>
                          <span style={{ fontSize: '14px', ...text.primary, flex: 1 }}>{selectedEmail.from}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: spacing(2) }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', ...text.tertiary, minWidth: '60px' }}>To:</span>
                          <span style={{ fontSize: '14px', ...text.primary, flex: 1 }}>{selectedEmail.to}</span>
                        </div>
                        {selectedEmail.cc && (
                          <div style={{ display: 'flex', alignItems: 'start', gap: spacing(2) }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', ...text.tertiary, minWidth: '60px' }}>CC:</span>
                            <span style={{ fontSize: '14px', ...text.primary, flex: 1 }}>{selectedEmail.cc}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'start', gap: spacing(2) }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', ...text.tertiary, minWidth: '60px' }}>Date:</span>
                          <span style={{ fontSize: '14px', ...text.primary, flex: 1 }}>
                            {new Date(selectedEmail.date).toLocaleString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {selectedEmail.labels.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'start', gap: spacing(2) }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', ...text.tertiary, minWidth: '60px' }}>Labels:</span>
                            <div style={{ display: 'flex', gap: spacing(1), flexWrap: 'wrap', flex: 1 }}>
                              {selectedEmail.labels.map((label) => (
                                <span key={label} style={{
                                  fontSize: '12px',
                                  padding: `${spacing(0.5)} ${spacing(1.5)}`,
                                  backgroundColor: colors.background,
                                  color: text.secondary.color,
                                  borderRadius: spacing(0.5),
                                  border: `1px solid ${colors.border}`
                                }}>
                                  {label.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    {(selectedEmail.hasAttachments || (selectedEmail as any)?.attachments) && (
                      <div style={{ marginBottom: spacing(4) }}>
                        <div style={{
                          padding: spacing(3),
                          backgroundColor: colors.cardHover,
                          borderRadius: spacing(1.5),
                          border: `1px solid ${colors.border}`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2), marginBottom: spacing(2) }}>
                            <Paperclip style={{ width: '18px', height: '18px', color: text.secondary.color }} />
                            <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: 0 }}>
                              Attachments
                            </h3>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1.5) }}>
                            {((selectedEmail as any)?.attachments || []).length > 0 ? (
                              ((selectedEmail as any).attachments as any[]).map((attachment: any, idx: number) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: spacing(2),
                                    backgroundColor: colors.background,
                                    borderRadius: spacing(1),
                                    border: `1px solid ${colors.border}`
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2), flex: 1, minWidth: 0 }}>
                                    <FileText style={{ width: '18px', height: '18px', color: text.secondary.color, flexShrink: 0 }} />
                                    <span style={{
                                      fontSize: '13px',
                                      ...text.primary,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {attachment.filename || attachment.name || `Attachment ${idx + 1}`}
                                    </span>
                                    {attachment.size && (
                                      <span style={{ fontSize: '12px', ...text.tertiary, flexShrink: 0 }}>
                                        ({(attachment.size / 1024).toFixed(1)} KB)
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    {...getButtonPressHandlers(`download-attachment-${idx}`)}
                                    onClick={() => {
                                      // TODO: Implement download
                                      console.log('Download attachment:', attachment)
                                    }}
                                    style={getButtonPressStyle(
                                      `download-attachment-${idx}`,
                                      {
                                        padding: spacing(1),
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: spacing(0.5),
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      },
                                      'transparent',
                                      colors.cardHover
                                    )}
                                  >
                                    <Download style={{ width: '16px', height: '16px', color: text.secondary.color }} />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div style={{ padding: spacing(2), ...text.secondary, fontSize: '13px', fontStyle: 'italic' }}>
                                No attachment details available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  <div style={{ marginTop: spacing(3), paddingTop: spacing(3), borderTop: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(2) }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
                        <LinkIcon style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
                        <p style={{ fontSize: '12px', fontWeight: '600', ...text.tertiary, margin: '0', textTransform: 'uppercase' }}>
                          Linked Transaction
                        </p>
                      </div>
                      {!showLinkSelector && (
                        <button
                          type="button"
                          {...getButtonPressHandlers('toggle-detail-link-selector')}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowLinkSelector(true)
                          }}
                          style={getButtonPressStyle(
                            'toggle-detail-link-selector',
                            {
                              padding: `${spacing(1)} ${spacing(2)}`,
                              backgroundColor: 'transparent',
                              border: `1px solid ${colors.border}`,
                              borderRadius: spacing(1),
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1)
                            },
                            'transparent',
                            colors.cardHover
                          )}
                        >
                          {selectedEmail.transactionId ? (
                            <>
                              <Unlink style={{ width: '14px', height: '14px', color: colors.text.secondary }} />
                              Change
                            </>
                          ) : (
                            <>
                              <LinkIcon style={{ width: '14px', height: '14px', color: colors.text.secondary }} />
                              Link
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {showLinkSelector ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2) }}>
                        <TransactionSelector
                          selectedTransactionId={selectedEmail.transactionId || selectedTransactionId || undefined}
                          onSelect={async (linkTransactionId) => {
                            await handleLinkEmail(linkTransactionId)
                          }}
                          placeholder="Select transaction to link..."
                        />
                        <div style={{ display: 'flex', gap: spacing(1.5) }}>
                          <button
                            type="button"
                            {...getButtonPressHandlers('cancel-detail-link')}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowLinkSelector(false)
                            }}
                            disabled={isLinking}
                            style={getButtonPressStyle(
                              'cancel-detail-link',
                              {
                                padding: `${spacing(1.5)} ${spacing(2)}`,
                                backgroundColor: colors.cardHover,
                                border: `1px solid ${colors.border}`,
                                borderRadius: spacing(1),
                                cursor: isLinking ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                opacity: isLinking ? 0.5 : 1
                              },
                              colors.cardHover,
                              colors.borderHover
                            )}
                          >
                            Cancel
                          </button>
                          {selectedEmail.transactionId && (
                            <button
                              type="button"
                              {...getButtonPressHandlers('detail-unlink-email')}
                              onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                await handleLinkEmail(null)
                              }}
                              disabled={isLinking}
                              style={getButtonPressStyle(
                                'detail-unlink-email',
                                {
                                  padding: `${spacing(1.5)} ${spacing(2)}`,
                                  backgroundColor: colors.errorLight || '#fee2e2',
                                  border: `1px solid ${colors.error}`,
                                  borderRadius: spacing(1),
                                  cursor: isLinking ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: colors.error,
                                  opacity: isLinking ? 0.5 : 1
                                },
                                colors.errorLight || '#fee2e2',
                                colors.error
                              )}
                            >
                              <Unlink style={{ width: '14px', height: '14px', marginRight: spacing(1) }} />
                              Unlink
                            </button>
                          )}
                        </div>
                      </div>
                    ) : selectedEmail.transactionId ? (
                      <div style={{
                        padding: spacing(2),
                        backgroundColor: colors.primaryLight || 'rgba(104, 159, 56, 0.1)',
                        borderRadius: spacing(1),
                        border: `1px solid ${colors.primary}`
                      }}>
                        <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                          Linked to Transaction
                        </p>
                        <p style={{ fontSize: '12px', ...text.secondary, margin: '4px 0 0 0' }}>
                          Transaction ID: {selectedEmail.transactionId}
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        padding: spacing(2),
                        backgroundColor: colors.cardHover,
                        borderRadius: spacing(1),
                        border: `1px dashed ${colors.border}`
                      }}>
                        <p style={{ fontSize: '14px', ...text.secondary, margin: '0', fontStyle: 'italic' }}>
                          Not linked to any transaction
                        </p>
                      </div>
                    )}
                  </div>

                    {/* Email Body */}
                    <div style={{
                      marginBottom: spacing(4),
                      padding: spacing(4),
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1.5),
                      ...text.primary,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      fontSize: '14px'
                    }} dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.plainBody }} />

                    {/* Quick Reply */}
                    {showQuickReply ? (
                      <div style={{
                        marginTop: spacing(4),
                        padding: spacing(3),
                        backgroundColor: colors.cardHover,
                        borderRadius: spacing(1.5),
                        border: `1px solid ${colors.border}`
                      }}>
                        <div style={{ marginBottom: spacing(2) }}>
                          <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: 0, marginBottom: spacing(1) }}>
                            Quick Reply
                          </h3>
                          <p style={{ fontSize: '12px', ...text.secondary, margin: 0 }}>
                            Replying to {selectedEmail.from}
                          </p>
                        </div>
                        <textarea
                          value={quickReplyText}
                          onChange={(e) => setQuickReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: spacing(2),
                            backgroundColor: colors.background,
                            border: `1px solid ${colors.border}`,
                            borderRadius: spacing(1),
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            ...text.primary,
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              e.preventDefault()
                              handleSendQuickReply()
                            }
                          }}
                        />
                        <div style={{ display: 'flex', gap: spacing(2), marginTop: spacing(2), justifyContent: 'flex-end' }}>
                          <button
                            {...getButtonPressHandlers('cancel-quick-reply')}
                            onClick={() => {
                              setShowQuickReply(false)
                              setQuickReplyText('')
                            }}
                            style={getButtonPressStyle(
                              'cancel-quick-reply',
                              {
                                padding: `${spacing(1.5)} ${spacing(3)}`,
                                backgroundColor: colors.cardHover,
                                border: `1px solid ${colors.border}`,
                                borderRadius: spacing(1),
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                ...text.secondary
                              },
                              colors.cardHover,
                              colors.borderHover
                            )}
                          >
                            Cancel
                          </button>
                          <button
                            {...getButtonPressHandlers('send-quick-reply')}
                            onClick={handleSendQuickReply}
                            disabled={!quickReplyText.trim() || isReplying}
                            style={getButtonPressStyle(
                              'send-quick-reply',
                              {
                                padding: `${spacing(1.5)} ${spacing(3)}`,
                                backgroundColor: colors.primary,
                                border: `1px solid ${colors.primary}`,
                                borderRadius: spacing(1),
                                cursor: (!quickReplyText.trim() || isReplying) ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: spacing(1),
                                opacity: (!quickReplyText.trim() || isReplying) ? 0.5 : 1
                              },
                              colors.primary,
                              colors.primaryHover
                            )}
                          >
                            <Send style={{ width: '16px', height: '16px' }} />
                            {isReplying ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: spacing(4), display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          {...getButtonPressHandlers('show-quick-reply')}
                          onClick={handleReply}
                          style={getButtonPressStyle(
                            'show-quick-reply',
                            {
                              padding: `${spacing(1.5)} ${spacing(3)}`,
                              backgroundColor: colors.primary,
                              border: `1px solid ${colors.primary}`,
                              borderRadius: spacing(1),
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing(1)
                            },
                            colors.primary,
                            colors.primaryHover
                          )}
                        >
                          <Reply style={{ width: '16px', height: '16px' }} />
                          Quick Reply
                        </button>
                      </div>
                    )}
                  </div>
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

        .labels-sidebar {
          width: 100%;
          background: var(--label-bg-card);
          border-radius: 12px;
          padding: 12px 0;
          margin-bottom: 0;
          border: 1px solid var(--label-border-subtle);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .label-section {
          margin-bottom: 16px;
        }

        .label-section:last-of-type {
          margin-bottom: 8px;
        }

        .label-section-header {
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-section-header .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: var(--label-text-tertiary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .label-section-header.collapsible {
          width: 100%;
          border: none;
          background: transparent;
          cursor: pointer;
          user-select: none;
          border-radius: 6px;
          margin: 0 8px;
          padding: 8px 12px;
          transition: background-color 0.2s ease;
        }

        .label-section-header.collapsible:hover {
          background: var(--label-bg-hover);
        }

        .label-section-header.collapsible .section-toggle {
          font-size: 10px;
          color: var(--label-text-tertiary);
          transition: transform 0.2s ease;
        }

        .label-section-header.collapsible.collapsed .section-toggle {
          transform: rotate(-90deg);
        }

        .label-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 8px;
        }

        .label-items.collapsed {
          display: none;
        }

        .label-item {
          width: 100%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 6px;
          margin: 0;
          color: var(--label-text-primary);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .label-item:hover {
          background: var(--label-bg-hover);
        }

        .label-item.active {
          background: rgba(104, 159, 56, 0.1);
          position: relative;
        }

        .label-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 40%;
          max-height: 20px;
          background: var(--label-accent);
          border-radius: 0 2px 2px 0;
        }

        .label-icon {
          font-size: 16px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .label-name {
          font-family: 'Work Sans', sans-serif;
          font-size: 14px;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .label-item.active .label-name {
          color: var(--label-accent);
          font-weight: 600;
        }

        .label-count {
          font-family: 'Work Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--label-text-secondary);
          background: var(--label-bg-hover);
          padding: 2px 8px;
          border-radius: 10px;
          min-width: 28px;
          text-align: center;
          flex-shrink: 0;
          margin-left: auto;
        }

        .label-item.active .label-count {
          background: rgba(104, 159, 56, 0.3);
          color: var(--label-accent);
        }

        .label-footer {
          padding: 8px 16px;
          border-top: 1px solid var(--label-border-subtle);
          margin-top: auto;
          padding-top: 16px;
        }

        .btn-manage-labels {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid var(--label-border-subtle);
          border-radius: 8px;
          color: var(--label-text-secondary);
          font-family: 'Work Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-manage-labels:hover {
          background: var(--label-bg-hover);
          color: var(--label-text-primary);
          border-color: var(--label-accent);
        }

        .label-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
          gap: 6px;
          color: var(--label-text-secondary);
        }

        .label-empty .empty-icon {
          font-size: 32px;
        }

        .label-empty-subtext {
          font-size: 12px;
          color: var(--label-text-tertiary);
        }

        .email-filters-bar {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: ${colors.card};
          border-radius: 12px;
          margin-bottom: 0;
          flex-wrap: wrap;
          border: 1px solid ${colors.border};
          width: 100%;
          box-sizing: border-box;
        }

        .email-filters-bar .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Work Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: ${text.secondary.color};
        }

        .filter-icon {
          font-size: 16px;
        }

        .filter-select-wrapper {
          min-width: 220px;
        }

        .filter-group.filter-search {
          flex: 1;
          position: relative;
          min-width: 200px;
        }

        .filter-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          color: ${text.tertiary.color};
          pointer-events: none;
        }

        .filter-search-input {
          width: 100%;
          font-family: 'Work Sans', sans-serif;
          font-size: 14px;
          color: ${text.primary.color};
          background: ${colors.cardHover};
          border: 1px solid ${colors.border};
          border-radius: 8px;
          padding: 8px 12px 8px 36px;
          transition: all 0.2s ease;
        }

        .filter-search-input::placeholder {
          color: ${text.tertiary.color};
        }

        .filter-search-input:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}24;
        }

        .filter-select-compact {
          font-family: 'Work Sans', sans-serif;
          font-size: 14px;
          color: ${text.primary.color};
          background: ${colors.cardHover};
          border: 1px solid ${colors.border};
          border-radius: 8px;
          padding: 8px 32px 8px 12px;
          min-width: 160px;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%239aa0a6' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }

        .filter-select-compact:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}24;
        }

        .transaction-context {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          background: rgba(104, 159, 56, 0.1);
          border: 1px solid rgba(104, 159, 56, 0.3);
          border-radius: 12px;
          margin-top: 16px;
        }

        .context-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .context-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .context-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .context-title {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: ${colors.primary};
        }

        .context-meta {
          font-family: 'Work Sans', sans-serif;
          font-size: 12px;
          color: ${text.secondary.color};
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-clear-filter {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(104, 159, 56, 0.2);
          color: ${colors.primary};
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .btn-clear-filter:hover {
          background: rgba(104, 159, 56, 0.3);
          transform: scale(1.05);
        }

        /* Responsive Layout */
        .email-module-layout {
          flex-wrap: nowrap;
        }

        .email-module-left,
        .email-module-middle,
        .email-module-right {
          transition: all 0.3s ease;
        }

        /* Tablet: Stack detail view below, keep folders and list side by side */
        @media (max-width: 1200px) {
          .email-module-layout {
            flex-wrap: wrap;
          }

          .email-module-left {
            width: 100%;
            max-width: 350px;
            min-width: 280px;
          }

          .email-module-middle {
            width: 100%;
            flex: 1;
            min-width: 300px;
          }

          .email-module-right {
            width: 100%;
            order: 3;
          }
        }

        /* Mobile: Stack all columns vertically */
        @media (max-width: 900px) {
          .email-filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .email-filters-bar .filter-group {
            width: 100%;
          }

          .filter-select-wrapper {
            width: 100%;
          }

          .email-module-layout {
            flex-direction: column;
            gap: 16px;
          }

          .email-module-left {
            width: 100%;
            max-width: 100%;
            min-width: 100%;
            max-height: 300px;
            order: 1;
          }

          .email-module-middle {
            width: 100%;
            max-width: 100%;
            min-width: 100%;
            max-height: 400px;
            order: 2;
          }

          .email-module-right {
            width: 100%;
            max-width: 100%;
            order: 3;
            max-height: none;
          }

          /* On mobile, when detail view is shown, make it full screen */
          .email-module-right.has-content {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            max-height: 100vh;
            border-radius: 0;
          }
        }

        /* Small mobile: Further optimizations */
        @media (max-width: 600px) {
          .email-module-left {
            max-height: 250px;
          }

          .email-module-middle {
            max-height: 300px;
          }

          .labels-sidebar {
            padding: 8px 0;
          }

          .label-item {
            padding: 6px 10px;
            font-size: 13px;
          }

          /* Compact detail header actions on small screens */
          .email-module-right.has-content [class*="detail-"] {
            padding: 8px 12px;
            font-size: 12px;
          }

          .email-module-right.has-content [class*="detail-"] svg {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>
    </Sidebar>
  )
}

