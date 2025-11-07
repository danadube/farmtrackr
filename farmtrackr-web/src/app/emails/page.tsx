'use client'

import { useState, useEffect } from 'react'
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
  const { colors, isDark, card, text, spacing } = useThemeStyles()
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
      if (response.ok) {
        const data = await response.json()
        if (data.system && data.custom) {
          const allLabels: GmailLabel[] = [
            ...data.system.map((l: any) => ({
              name: l.name,
              count: l.count || 0,
              icon: l.icon
            })),
            ...data.custom.map((l: any) => ({
              name: l.name,
              count: l.count || 0,
              icon: l.icon,
              color: l.color
            }))
          ]
          setLabels(allLabels)
          
          // Calculate unread count
          const inboxLabel = allLabels.find(l => l.name === 'INBOX')
          setUnreadCount(inboxLabel?.count || 0)
        }
      }
    } catch (err) {
      console.error('Error loading labels:', err)
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
    const label = labels.find(l => l.name === labelName)
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
      default:
        return <Mail style={{ width: '16px', height: '16px' }} />
    }
  }

  const getLinkedEmailCount = () => {
    return emails.filter(e => e.transactionId).length
  }

  return (
    <Sidebar>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: colors.background }}>
        {/* Top Header */}
        <div style={{
          backgroundColor: colors.primary,
          padding: spacing(3),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
            <Mail style={{ width: '24px', height: '24px', color: '#ffffff' }} />
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
              Emails
            </h1>
            {unreadCount > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                color: colors.primary,
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {unreadCount}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
            <button
              {...getButtonPressHandlers('compose-email')}
              onClick={() => setShowComposer(true)}
              style={getButtonPressStyle(
                'compose-email',
                {
                  padding: `${spacing(1.5)} ${spacing(3)}`,
                  backgroundColor: '#ffffff',
                  color: colors.primary,
                  border: 'none',
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(1.5)
                },
                '#ffffff',
                '#f0f0f0'
              )}
            >
              <Send style={{ width: '16px', height: '16px' }} />
              Compose
            </button>
            <button
              {...getButtonPressHandlers('refresh-emails')}
              onClick={loadEmails}
              style={getButtonPressStyle(
                'refresh-emails',
                {
                  padding: spacing(1.5),
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: spacing(1),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                },
                'transparent',
                'rgba(255, 255, 255, 0.2)'
              )}
            >
              <RefreshCw style={{ width: '18px', height: '18px', color: '#ffffff' }} />
            </button>
          </div>
        </div>

        {/* Transaction Context Bar */}
        <div style={{
          padding: spacing(3),
          backgroundColor: colors.card,
          borderBottom: `1px solid ${colors.border}`,
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

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Pane - Navigation & Email List */}
          <div style={{
            width: '400px',
            borderRight: `1px solid ${colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.card
          }}>
            {/* Gmail Labels Section */}
            <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(2) }}>
                <h3 style={{ fontSize: '12px', fontWeight: '600', ...text.tertiary, textTransform: 'uppercase', margin: 0 }}>
                  Gmail Folders/Labels
                </h3>
                <button
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
                {labels.slice(0, 7).map((label) => (
                  <button
                    key={label.name}
                    {...getButtonPressHandlers(`label-${label.name}`)}
                    onClick={() => setSelectedLabel(label.name)}
                    style={getButtonPressStyle(
                      `label-${label.name}`,
                      {
                        padding: `${spacing(1)} ${spacing(2)}`,
                        backgroundColor: selectedLabel === label.name ? colors.primary : 'transparent',
                        color: selectedLabel === label.name ? '#ffffff' : colors.text.primary,
                        border: `1px solid ${selectedLabel === label.name ? colors.primary : colors.border}`,
                        borderRadius: spacing(1),
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing(1)
                      },
                      selectedLabel === label.name ? colors.primary : colors.card,
                      selectedLabel === label.name ? colors.primaryHover : colors.cardHover
                    )}
                  >
                    {getLabelIcon(label.name)}
                    <span>{label.name}</span>
                    <span style={{ opacity: 0.7 }}>({label.count})</span>
                  </button>
                ))}
              </div>
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
                emails.map((email) => (
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
                        {email.hasAttachments && <Paperclip style={{ width: '14px', height: '14px', color: colors.text.tertiary }} />}
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
                ))
              )}
            </div>
          </div>

          {/* Right Pane - Email Detail */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: colors.background }}>
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
                    backgroundColor: colors.card,
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

      {/* Email Composer Modal */}
      {showComposer && (
        <EmailComposer
          initialTransactionId={selectedTransactionId || undefined}
          onSend={handleSendEmail}
          onClose={() => setShowComposer(false)}
        />
      )}
    </Sidebar>
  )
}

