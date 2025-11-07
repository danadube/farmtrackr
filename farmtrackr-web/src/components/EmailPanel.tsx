'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    // Load emails when filters change, even without contactEmail
    loadEmails()
  }, [contactEmail, activeTab, selectedLabel, transactionId])

  useEffect(() => {
    if (transactionId && transactionId !== 'all') {
      setSelectedLabel((prev) => (prev === 'LOGGED' ? prev : 'LOGGED'))
    } else {
      setSelectedLabel((prev) => (prev === 'INBOX' ? prev : 'INBOX'))
    }
  }, [transactionId])

  const loadEmails = async (forceLoadAll: boolean = false) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: spacing(6),
            flexDirection: 'column',
            gap: spacing(2)
          }}>
            <Inbox style={{ width: '48px', height: '48px', color: colors.text.tertiary }} />
            <p style={{ fontSize: '14px', ...text.secondary, margin: '0', textAlign: 'center' }}>
              {searchQuery ? 'No emails match your search' : 'No emails found'}
            </p>
            {!contactEmail && (
              <>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0', textAlign: 'center' }}>
                  {transactionId ? 'No emails linked to this transaction yet' : 'No emails found'}
                </p>
                <button
                  type="button"
                  {...getButtonPressHandlers('load-recent-emails')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    loadEmails(true) // Force load all emails, not just linked ones
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(1) }}>
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedEmail(email)
                }}
                style={{
                  padding: spacing(3),
                  ...card,
                  cursor: 'pointer',
                  border: selectedEmail?.id === email.id ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedEmail?.id !== email.id) {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                    e.currentTarget.style.borderColor = colors.primary
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEmail?.id !== email.id) {
                    e.currentTarget.style.backgroundColor = colors.card
                    e.currentTarget.style.borderColor = colors.border
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing(2) }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1.5), marginBottom: spacing(1) }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                        {email.subject || '(No subject)'}
                      </p>
                      {email.isUnread && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: colors.primary
                        }} />
                      )}
                    </div>
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0 0 4px 0' }}>
                      {email.from} → {email.to}
                    </p>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                      {new Date(email.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                    {email.plainBody && (
                      <p style={{ 
                        fontSize: '12px', 
                        ...text.tertiary, 
                        margin: `${spacing(1)} 0 0 0`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {email.plainBody.substring(0, 150)}...
                      </p>
                    )}
                    {/* Labels */}
                    {email.labels && email.labels.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: spacing(0.5),
                        marginTop: spacing(1)
                      }}>
                        {email.labels.slice(0, 3).map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedLabel(label)
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              backgroundColor: selectedLabel === label 
                                ? colors.primary 
                                : colors.background,
                              color: selectedLabel === label 
                                ? '#ffffff' 
                                : colors.text.tertiary,
                              border: `1px solid ${selectedLabel === label ? colors.primary : colors.border}`,
                              borderRadius: spacing(0.5),
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            {label}
                          </button>
                        ))}
                        {email.labels.length > 3 && (
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            color: colors.text.tertiary
                          }}>
                            +{email.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {email.attachments && email.attachments.length > 0 && (
                    <Paperclip style={{ width: '16px', height: '16px', color: colors.text.tertiary, flexShrink: 0 }} />
                  )}
                </div>
              </div>
            ))}
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
            <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                {selectedEmail.subject || '(No subject)'}
              </h3>
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
      `}</style>
    </div>
  )
}

