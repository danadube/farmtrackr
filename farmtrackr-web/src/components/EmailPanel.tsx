'use client'

import { useState, useEffect, useMemo, useCallback, CSSProperties, MouseEvent } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { Mail, Send, Inbox, Search, RefreshCw, Loader2, Paperclip, X, Reply, Forward, Link as LinkIcon, Unlink } from 'lucide-react'
import { GmailMessage, EmailData } from '@/types'
import { sendEmail, fetchEmails, fetchTransactionEmails } from '@/lib/gmailService'
import { EmailComposer } from './EmailComposer'
import { TransactionSelector } from './TransactionSelector'

interface EmailPanelProps {
  transactionId: string
  contactEmail?: string
}

export function EmailPanel({ transactionId, contactEmail }: EmailPanelProps) {
  const { colors, isDark, card, background, text, spacing } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'all'>('all')
  const [emails, setEmails] = useState<GmailMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null)
  const [replyMode, setReplyMode] = useState<'reply' | 'forward' | null>(null)
  const [isReplying, setIsReplying] = useState(false)
  const [isForwarding, setIsForwarding] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [showLinkSelector, setShowLinkSelector] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const emailThemeVars = useMemo(() => {
    const primaryText = text.primary?.color || '#e8eaed'
    const secondaryText = text.secondary?.color || '#9aa0a6'
    const tertiaryText = text.tertiary?.color || '#5f6368'
    return {
      '--email-bg-card': colors.card,
      '--email-bg-hover': colors.cardHover || '#2f3439',
      '--email-bg-dark': isDark ? '#1a1d21' : '#f5f5f5',
      '--email-border-subtle': colors.border,
      '--email-text-primary': primaryText,
      '--email-text-secondary': secondaryText,
      '--email-text-tertiary': tertiaryText,
      '--email-hover-overlay': `${colors.primary}26`,
      '--email-selected-border': colors.primary,
      '--email-primary': colors.primary,
      '--email-icon-muted': secondaryText,
      '--meadow-green': '#689f38',
      '--forest-green': '#558b2f',
      '--deep-forest': '#2d5016',
      '--light-sage': '#7da65d',
      '--tangerine': '#ff9800',
      '--plum': '#673ab7',
      '--cherry': '#f4516c',
      '--sky-blue': '#42a5f5',
      '--peach': '#ffb74d',
    } as CSSProperties
  }, [colors, isDark, text.primary, text.secondary, text.tertiary])

  const handleToggleStar = useCallback((event: MouseEvent<HTMLButtonElement>, email: GmailMessage) => {
    event.stopPropagation()
    setEmails((prev) =>
      prev.map((item) =>
        item.id === email.id ? { ...item, isStarred: !email.isStarred } : item
      )
    )
  }, [])

  const handleArchiveEmail = useCallback((event: MouseEvent<HTMLButtonElement>, email: GmailMessage) => {
    event.stopPropagation()
    setEmails((prev) => prev.filter((item) => item.id !== email.id))
    setSelectedEmail((current) => (current?.id === email.id ? null : current))
  }, [])

  const handleDeleteEmailQuick = useCallback((event: MouseEvent<HTMLButtonElement>, email: GmailMessage) => {
    event.stopPropagation()
    setEmails((prev) => prev.filter((item) => item.id !== email.id))
    setSelectedEmail((current) => (current?.id === email.id ? null : current))
  }, [])

  useEffect(() => {
    // Load emails when filters change, even without contactEmail
    loadEmails()
  }, [contactEmail, activeTab, selectedLabel, transactionId])

  useEffect(() => {
    if (transactionId && transactionId !== 'all') {
      setSelectedLabel('LOGGED')
      loadEmails(false, 'LOGGED')
    } else {
      setSelectedLabel('INBOX')
      loadEmails(false, 'INBOX')
    }
  }, [transactionId])

  const loadEmails = async (forceLoadAll: boolean = false, overrideLabel?: string | null) => {
    setLoading(true)
    try {
      // Use the emails/list API which supports filtering by transaction
      const params = new URLSearchParams({
        maxResults: '50'
      })
      
      // If we have a transactionId and not forcing load all, filter by it
      // Otherwise, load all emails so user can see and link them
      if (transactionId && transactionId !== 'all' && !forceLoadAll) {
        params.append('transactionId', transactionId)
      }
      
      // If we have a contactEmail, add it to search
      if (contactEmail) {
        params.append('search', contactEmail)
      }
      
      // If a label is selected, filter by label
      const effectiveLabel =
        overrideLabel ||
        selectedLabel ||
        (transactionId && transactionId !== 'all' ? 'LOGGED' : 'INBOX')

      params.append('label', effectiveLabel)
      
      // Add direction filter based on activeTab
      if (activeTab === 'sent') {
        params.append('status', 'sent')
      } else if (activeTab === 'received') {
        params.append('status', 'received')
      }

      const response = await fetch(`/api/emails/list?${params}`)
      if (response.ok) {
        const data = await response.json()
        let emailsData: GmailMessage[] = []
        if (Array.isArray(data)) {
          emailsData = data as GmailMessage[]
        } else if (Array.isArray(data?.emails)) {
          emailsData = data.emails as GmailMessage[]
        } else if (data?.success && Array.isArray(data?.data)) {
          emailsData = data.data as GmailMessage[]
        }

        let filteredEmails = emailsData
        
        // Additional client-side filtering by contactEmail if provided
        if (contactEmail && activeTab !== 'all') {
          if (activeTab === 'sent') {
            filteredEmails = filteredEmails.filter(email => 
              email.to && email.to.toLowerCase().includes(contactEmail.toLowerCase())
            )
          } else if (activeTab === 'received') {
            filteredEmails = filteredEmails.filter(email => 
              email.from && email.from.toLowerCase().includes(contactEmail.toLowerCase())
            )
          }
        }
        
        setEmails(filteredEmails)
        
        // If no emails found and we were filtering by transactionId, 
        // automatically try loading all emails
        if (filteredEmails.length === 0 && 
            transactionId && 
            transactionId !== 'all' && 
            effectiveLabel !== 'LOGGED' &&
            !forceLoadAll &&
            !contactEmail) {
          // Retry loading all emails
          setTimeout(() => loadEmails(true), 500)
        }
      } else {
        setEmails([])
      }
    } catch (error) {
      console.error('Error loading emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async (emailData: EmailData) => {
    try {
      const result = await sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        cc: emailData.cc,
        bcc: emailData.bcc,
        transactionId: transactionId,
        contactId: undefined // TODO: Add contactId if available
      })
      
      if (result.success) {
        setShowComposer(false)
        setReplyMode(null)
        loadEmails() // Refresh email list
      }
      return result
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const handleReply = async (replyBody: string) => {
    if (!selectedEmail) return

    setIsReplying(true)
    try {
      const response = await fetch('/api/emails/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedEmail.id,
          body: replyBody,
          transactionId: transactionId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setReplyMode(null)
        setSelectedEmail(null)
        loadEmails() // Refresh email list
      }
      return result
    } catch (error) {
      console.error('Error replying to email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsReplying(false)
    }
  }

  const handleForward = async (forwardTo: string, forwardBody: string) => {
    if (!selectedEmail) return

    setIsForwarding(true)
    try {
      const response = await fetch('/api/emails/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedEmail.id,
          forwardTo: forwardTo,
          body: forwardBody,
          transactionId: transactionId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setReplyMode(null)
        setSelectedEmail(null)
        loadEmails() // Refresh email list
      }
      return result
    } catch (error) {
      console.error('Error forwarding email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsForwarding(false)
    }
  }

  const handleLinkEmail = async (linkTransactionId: string | null) => {
    if (!selectedEmail) return

    setIsLinking(true)
    try {
      const response = await fetch('/api/emails/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: selectedEmail.id,
          transactionId: linkTransactionId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShowLinkSelector(false)
        // Update the selected email's transactionId
        setSelectedEmail({ ...selectedEmail, transactionId: linkTransactionId || undefined })
        loadEmails() // Refresh email list
      }
      return result
    } catch (error) {
      console.error('Error linking email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    } finally {
      setIsLinking(false)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.to.toLowerCase().includes(query) ||
      email.plainBody.toLowerCase().includes(query)
    )
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        ...emailThemeVars,
      }}
    >
      {/* Header */}
      <div style={{ 
        padding: spacing(3), 
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
          <Mail style={{ width: '20px', height: '20px', color: colors.primary }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
            Emails
          </h3>
        </div>
        <div style={{ display: 'flex', gap: spacing(1.5) }}>
          <button
            type="button"
            {...getButtonPressHandlers('refresh-emails')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              loadEmails()
            }}
            disabled={loading}
            style={getButtonPressStyle(
              'refresh-emails',
              {
                padding: spacing(1.5),
                backgroundColor: colors.cardHover,
                border: `1px solid ${colors.border}`,
                borderRadius: spacing(1),
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              },
              colors.cardHover,
              colors.borderHover
            )}
          >
            <RefreshCw 
              style={{ 
                width: '16px', 
                height: '16px', 
                color: colors.text.secondary,
                animation: loading ? 'spin 1s linear infinite' : 'none'
              }} 
            />
          </button>
          <button
            type="button"
            {...getButtonPressHandlers('compose-email')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowComposer(true)
            }}
            style={getButtonPressStyle(
              'compose-email',
              {
                padding: `${spacing(1.5)} ${spacing(3)}`,
                backgroundColor: colors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: spacing(1),
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing(1)
              },
              colors.primary,
              colors.primaryHover
            )}
          >
            <Send style={{ width: '16px', height: '16px' }} />
            Compose
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: `1px solid ${colors.border}`,
        padding: `0 ${spacing(3)}`
      }}>
              {(['all', 'sent', 'received'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  {...getButtonPressHandlers(`email-tab-${tab}`)}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveTab(tab)
                  }}
            style={getButtonPressStyle(
              `email-tab-${tab}`,
              {
                padding: `${spacing(2)} ${spacing(3)}`,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${colors.primary}` : '2px solid transparent',
                color: activeTab === tab ? colors.primary : text.secondary.color,
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '500',
                cursor: 'pointer',
                textTransform: 'capitalize'
              },
              'transparent',
              colors.cardHover
            )}
          >
            {tab === 'all' ? 'All' : tab === 'sent' ? 'Sent' : 'Received'}
          </button>
        ))}
      </div>

      {/* Search and Label Filter */}
      <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          marginBottom: spacing(2)
        }}>
          <Search style={{ 
            position: 'absolute', 
            left: spacing(2), 
            width: '16px', 
            height: '16px', 
            color: colors.text.tertiary 
          }} />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: `${spacing(1.5)} ${spacing(1.5)} ${spacing(1.5)} ${spacing(4.5)}`,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: spacing(1),
              fontSize: '14px',
              ...text.primary,
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.border
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>
        
        {/* Label Filter */}
        {selectedLabel && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: spacing(1.5),
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '12px', ...text.tertiary }}>Filtered by:</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing(1),
              padding: `${spacing(1)} ${spacing(2)}`,
              backgroundColor: colors.primaryLight || 'rgba(104, 159, 56, 0.1)',
              border: `1px solid ${colors.primary}`,
              borderRadius: spacing(1),
              fontSize: '12px',
              fontWeight: '500',
              ...text.primary
            }}>
              {selectedLabel}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedLabel(null)
                }}
                style={{
                  padding: 0,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: spacing(0.5)
                }}
              >
                <X style={{ width: '14px', height: '14px', color: colors.text.secondary }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: spacing(2)
      }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: spacing(6),
            flexDirection: 'column',
            gap: spacing(2)
          }}>
            <Loader2 style={{ width: '24px', height: '24px', color: colors.primary, animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '14px', ...text.secondary, margin: '0' }}>Loading emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="email-empty-state">
            <Inbox style={{ width: '48px', height: '48px', color: text.tertiary.color }} />
            <p className="empty-title">
              {searchQuery ? 'No emails match your search' : 'No emails found'}
            </p>
            {!contactEmail && (
              <>
                <p className="empty-subtext">
                  {transactionId ? 'No emails linked to this transaction yet' : 'Try adjusting your filters or load recent messages.'}
                </p>
                <button
                  type="button"
                  {...getButtonPressHandlers('load-recent-emails')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    loadEmails(true)
                  }}
                  style={getButtonPressStyle(
                    'load-recent-emails',
                    {
                      marginTop: spacing(2),
                      padding: `${spacing(1.5)} ${spacing(3)}`,
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: spacing(1),
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1)
                    },
                    colors.primary,
                    colors.primaryHover
                  )}
                >
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  Load Recent Emails
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="email-card-list">
            {filteredEmails.map((email) => {
              const { name: parsedName, email: parsedEmail } = parseEmailField(email.from)
              const avatarColor = getAvatarColor(parsedEmail)
              const avatarInitials = getAvatarInitials(parsedName, parsedEmail)
              const hasAttachments = !!(email.attachments && email.attachments.length)
              const firstLabel = email.labels && email.labels.length > 0 ? email.labels[0] : null

              return (
                <div
                  key={email.id}
                  className={`email-card${selectedEmail?.id === email.id ? ' selected' : ''}${email.isUnread ? ' unread' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedEmail(email)
                  }}
                >
                  {email.isUnread && <div className="unread-indicator" />}
                  <div className="email-card-inner">
                    <div
                      className="email-avatar"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {avatarInitials}
                    </div>
                    <div className="email-content">
                      <div className="email-header-row">
                        <span className="email-sender">{parsedName || parsedEmail}</span>
                        <span className="email-time">{formatEmailDate(email.date)}</span>
                      </div>
                      <div className="email-subject">
                        {email.subject || '(No subject)'}
                      </div>
                      {email.plainBody && (
                        <div className="email-preview">
                          {email.plainBody}
                        </div>
                      )}
                      <div className="email-badges">
                        {email.transactionId && (
                          <span className="badge badge-transaction">
                            <span className="badge-icon">🏡</span>
                            {email.transactionId}
                          </span>
                        )}
                        {hasAttachments && (
                          <span className="badge badge-attachment">
                            <span className="badge-icon">📎</span>
                            {email.attachments?.length}
                          </span>
                        )}
                        {firstLabel && (
                          <span className="badge badge-label">
                            {firstLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="email-quick-actions">
                      <button
                        type="button"
                        className="btn-icon-action"
                        title="Star email"
                        onClick={(event) => handleToggleStar(event, email)}
                      >
                        {email.isStarred ? '⭐' : '☆'}
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action"
                        title="Archive"
                        onClick={(event) => handleArchiveEmail(event, email)}
                      >
                        📁
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action"
                        title="Delete"
                        onClick={(event) => handleDeleteEmailQuick(event, email)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Email Composer Modal */}
      {showComposer && (
        <EmailComposer
          initialTo={contactEmail}
          initialTransactionId={transactionId}
          onSend={handleSendEmail}
          onClose={() => setShowComposer(false)}
        />
      )}

      {/* Email Detail Modal */}
      {selectedEmail && (
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
            padding: spacing(3)
          }}
          onClick={() => setSelectedEmail(null)}
        >
          <div
            style={{
              ...card,
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              padding: '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing(2) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
                <button
                  type="button"
                  {...getButtonPressHandlers('back-to-inbox')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedEmail(null)
                    setReplyMode(null)
                  }}
                  style={getButtonPressStyle(
                    'back-to-inbox',
                    {
                      padding: `${spacing(1)} ${spacing(1.5)}`,
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
                  ← Back
                </button>
                <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  {selectedEmail.subject || '(No subject)'}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5) }}>
                <button
                  type="button"
                  {...getButtonPressHandlers('reply-email')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setReplyMode('reply')
                  }}
                  disabled={isReplying || isForwarding}
                  style={getButtonPressStyle(
                    'reply-email',
                    {
                      padding: `${spacing(1.5)} ${spacing(2)}`,
                      backgroundColor: colors.cardHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      cursor: (isReplying || isForwarding) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: (isReplying || isForwarding) ? 0.5 : 1
                    },
                    colors.cardHover,
                    colors.borderHover
                  )}
                >
                  <Reply style={{ width: '16px', height: '16px', color: colors.text.primary }} />
                  Reply
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('forward-email')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setReplyMode('forward')
                  }}
                  disabled={isReplying || isForwarding}
                  style={getButtonPressStyle(
                    'forward-email',
                    {
                      padding: `${spacing(1.5)} ${spacing(2)}`,
                      backgroundColor: colors.cardHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      cursor: (isReplying || isForwarding) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: (isReplying || isForwarding) ? 0.5 : 1
                    },
                    colors.cardHover,
                    colors.borderHover
                  )}
                >
                  <Forward style={{ width: '16px', height: '16px', color: colors.text.primary }} />
                  Forward
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('star-email-detail')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleStar(e as unknown as React.MouseEvent<HTMLButtonElement>, selectedEmail)
                  }}
                  style={getButtonPressStyle(
                    'star-email-detail',
                    {
                      padding: `${spacing(1.5)} ${spacing(2)}`,
                      backgroundColor: colors.cardHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      fontSize: '14px',
                      fontWeight: '500'
                    },
                    colors.cardHover,
                    colors.borderHover
                  )}
                >
                  {selectedEmail.isStarred ? '⭐' : '☆'}
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('delete-email-detail')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteEmailQuick(e as unknown as React.MouseEvent<HTMLButtonElement>, selectedEmail)
                  }}
                  style={getButtonPressStyle(
                    'delete-email-detail',
                    {
                      padding: `${spacing(1.5)} ${spacing(2)}`,
                      backgroundColor: colors.cardHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1),
                      fontSize: '14px',
                      fontWeight: '500'
                    },
                    colors.cardHover,
                    colors.borderHover
                  )}
                >
                  🗑️
                </button>
                <button
                  type="button"
                  {...getButtonPressHandlers('close-email-detail')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedEmail(null)
                    setReplyMode(null)
                  }}
                  style={getButtonPressStyle(
                    'close-email-detail',
                    {
                      padding: spacing(1),
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    },
                    'transparent',
                    colors.cardHover
                  )}
                >
                  <X style={{ width: '20px', height: '20px', color: colors.text.secondary }} />
                </button>
              </div>
            </div>
            <div style={{ padding: spacing(3) }}>
              <div style={{ marginBottom: spacing(3) }}>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0' }}>From</p>
                <p style={{ fontSize: '14px', ...text.primary, margin: '0 0 12px 0' }}>{selectedEmail.from}</p>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0' }}>To</p>
                <p style={{ fontSize: '14px', ...text.primary, margin: '0 0 12px 0' }}>{selectedEmail.to}</p>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0' }}>Date</p>
                <p style={{ fontSize: '14px', ...text.primary, margin: '0 0 12px 0' }}>
                  {new Date(selectedEmail.date).toLocaleString('en-US', { 
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
                
                {/* Labels */}
                {selectedEmail.labels && selectedEmail.labels.length > 0 && (
                  <div style={{ marginBottom: spacing(3) }}>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 8px 0' }}>Labels</p>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: spacing(1)
                    }}>
                      {selectedEmail.labels.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setSelectedLabel(label)
                            setSelectedEmail(null) // Close detail view when filtering
                          }}
                          style={{
                            fontSize: '12px',
                            padding: `${spacing(1)} ${spacing(2)}`,
                            backgroundColor: selectedLabel === label 
                              ? colors.primary 
                              : colors.background,
                            color: selectedLabel === label 
                              ? '#ffffff' 
                              : colors.text.secondary,
                            border: `1px solid ${selectedLabel === label ? colors.primary : colors.border}`,
                            borderRadius: spacing(1),
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Transaction Linking */}
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
                        {...getButtonPressHandlers('toggle-link-selector')}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowLinkSelector(true)
                        }}
                        style={getButtonPressStyle(
                          'toggle-link-selector',
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
                        selectedTransactionId={selectedEmail.transactionId || transactionId}
                        onSelect={async (linkTransactionId) => {
                          await handleLinkEmail(linkTransactionId)
                        }}
                        placeholder="Select transaction to link..."
                      />
                      <div style={{ display: 'flex', gap: spacing(1.5) }}>
                        <button
                          type="button"
                          {...getButtonPressHandlers('cancel-link')}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setShowLinkSelector(false)
                          }}
                          disabled={isLinking}
                          style={getButtonPressStyle(
                            'cancel-link',
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
                            {...getButtonPressHandlers('unlink-email')}
                            onClick={async (e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              await handleLinkEmail(null)
                            }}
                            disabled={isLinking}
                            style={getButtonPressStyle(
                              'unlink-email',
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
              </div>
              <div 
                style={{ 
                  padding: spacing(3),
                  backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  lineHeight: '1.6',
                  ...text.primary,
                  whiteSpace: 'pre-wrap'
                }}
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
              
              {/* Reply/Forward Form */}
              {replyMode && (
                <div style={{ marginTop: spacing(3), paddingTop: spacing(3), borderTop: `1px solid ${colors.border}` }}>
                  {replyMode === 'reply' ? (
                    <EmailComposer
                      initialTo={selectedEmail.from}
                      initialSubject={`Re: ${selectedEmail.subject || ''}`}
                      initialBody={`\n\n--- Original Message ---\nFrom: ${selectedEmail.from}\nTo: ${selectedEmail.to}\nDate: ${new Date(selectedEmail.date).toLocaleString()}\nSubject: ${selectedEmail.subject || ''}\n\n${selectedEmail.plainBody || ''}`}
                      initialTransactionId={transactionId}
                      onSend={async (emailData) => {
                        const result = await handleReply(emailData.body)
                        if (result.success) {
                          return result
                        }
                        throw new Error(result.error || 'Failed to reply')
                      }}
                      onClose={() => setReplyMode(null)}
                      isReplying={isReplying}
                    />
                  ) : (
                    <EmailComposer
                      initialTo=""
                      initialSubject={`Fwd: ${selectedEmail.subject || ''}`}
                      initialBody={`\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.from}\nTo: ${selectedEmail.to}\nDate: ${new Date(selectedEmail.date).toLocaleString()}\nSubject: ${selectedEmail.subject || ''}\n\n${selectedEmail.plainBody || ''}`}
                      initialTransactionId={transactionId}
                      onSend={async (emailData) => {
                        const result = await handleForward(emailData.to, emailData.body)
                        if (result.success) {
                          return result
                        }
                        throw new Error(result.error || 'Failed to forward')
                      }}
                      onClose={() => setReplyMode(null)}
                      isForwarding={isForwarding}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .email-card-list {
          display: flex;
          flex-direction: column;
        }
        .email-card {
          position: relative;
          background: var(--email-bg-card);
          border-bottom: 1px solid var(--email-border-subtle);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .email-card:last-child {
          border-bottom: none;
        }
        .email-card:hover {
          background: var(--email-bg-hover);
        }
        .email-card.selected {
          background: rgba(104, 159, 56, 0.15);
          border-left: 3px solid var(--meadow-green);
        }
        .email-card.unread {
          background: rgba(104, 159, 56, 0.05);
        }
        .email-card-inner {
          display: flex;
          gap: 12px;
          padding: 16px;
          align-items: flex-start;
        }
        .email-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justifyContent: center;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
        }
        .email-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .email-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .email-sender {
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: var(--email-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .email-time {
          font-family: 'Work Sans', sans-serif;
          font-size: 12px;
          color: var(--email-text-secondary);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .email-subject {
          font-family: 'Work Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: var(--email-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .email-card.unread .email-subject {
          font-weight: 600;
        }
        .email-preview {
          font-family: 'Work Sans', sans-serif;
          font-size: 13px;
          color: var(--email-text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-top: 2px;
        }
        .email-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 6px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: 'Work Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 12px;
          white-space: nowrap;
        }
        .badge-transaction {
          background: rgba(104, 159, 56, 0.2);
          color: var(--light-sage);
          border: 1px solid rgba(104, 159, 56, 0.3);
        }
        .badge-attachment {
          background: rgba(66, 165, 245, 0.2);
          color: var(--sky-blue);
          border: 1px solid rgba(66, 165, 245, 0.3);
        }
        .badge-label {
          background: rgba(255, 152, 0, 0.2);
          color: var(--tangerine);
          border: 1px solid rgba(255, 152, 0, 0.3);
        }
        .email-quick-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s ease;
          flex-shrink: 0;
        }
        .email-card:hover .email-quick-actions {
          opacity: 1;
        }
        .btn-icon-action {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--email-icon-muted);
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-icon-action:hover {
          background: var(--email-bg-dark);
          color: var(--email-text-primary);
          transform: scale(1.1);
        }
        .unread-indicator {
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--sky-blue);
        }
        .email-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          text-align: center;
          gap: 8px;
        }
        .email-empty-state .empty-title {
          font-family: 'Work Sans', sans-serif;
          font-size: 16px;
          color: var(--email-text-secondary);
          margin: 0;
        }
        .email-empty-state .empty-subtext {
          font-family: 'Work Sans', sans-serif;
          font-size: 14px;
          color: var(--email-text-tertiary);
          margin: 0;
        }
      `}</style>
    </div>
  )
}

const AVATAR_COLORS = [
  '#ea4335',
  '#34a853',
  '#4285f4',
  '#fbbc04',
  '#ff6d00',
  '#9c27b0',
  '#00bcd4',
  '#ff9800',
]

function parseEmailField(value: string) {
  if (!value) {
    return { name: '', email: '' }
  }
  const match = value.match(/(.*)<(.+@.+)>/)
  if (match) {
    return {
      name: match[1]?.replace(/"/g, '').trim(),
      email: match[2]?.trim() || '',
    }
  }
  return { name: '', email: value.trim() }
}

function getAvatarInitials(name?: string | null, email?: string) {
  if (name && name.trim().length > 0) {
    const cleanName = name.replace(/<.*?>/, '').trim()
    const parts = cleanName.split(' ').filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return cleanName.substring(0, 2).toUpperCase()
  }
  const fallback = email ? email.split('@')[0] : 'FT'
  return fallback.substring(0, 2).toUpperCase()
}

function getAvatarColor(email: string) {
  if (!email) return AVATAR_COLORS[0]
  let hash = 0
  for (let i = 0; i < email.length; i += 1) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatEmailDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

