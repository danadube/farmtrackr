'use client'

import { useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { Mail, Send, Inbox, Search, RefreshCw, Loader2, Paperclip, X } from 'lucide-react'
import { GmailMessage, EmailData } from '@/types'
import { sendEmail, fetchEmails, fetchTransactionEmails } from '@/lib/gmailService'
import { EmailComposer } from './EmailComposer'

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

  useEffect(() => {
    if (contactEmail) {
      loadEmails()
    }
  }, [contactEmail, activeTab])

  const loadEmails = async () => {
    if (!contactEmail) return

    setLoading(true)
    try {
      const query = activeTab === 'sent' 
        ? `to:${contactEmail}`
        : activeTab === 'received'
        ? `from:${contactEmail}`
        : `to:${contactEmail} OR from:${contactEmail}`
      
      const result = await fetchTransactionEmails(contactEmail, 50)
      if (result.success && result.emails) {
        setEmails(result.emails)
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
        loadEmails() // Refresh email list
      }
      return result
    } catch (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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

      {/* Search */}
      <div style={{ padding: spacing(3), borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ 
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
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
              <p style={{ fontSize: '12px', ...text.tertiary, margin: '0', textAlign: 'center' }}>
                Add a contact email to view emails for this transaction
              </p>
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
              <button
                type="button"
                {...getButtonPressHandlers('close-email-detail')}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSelectedEmail(null)
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
            <div style={{ padding: spacing(3) }}>
              <div style={{ marginBottom: spacing(3) }}>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0' }}>From</p>
                <p style={{ fontSize: '14px', ...text.primary, margin: '0 0 12px 0' }}>{selectedEmail.from}</p>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0' }}>To</p>
                <p style={{ fontSize: '14px', ...text.primary, margin: '0 0 12px 0' }}>{selectedEmail.to}</p>
                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0' }}>Date</p>
                <p style={{ fontSize: '14px', ...text.primary, margin: '0' }}>
                  {new Date(selectedEmail.date).toLocaleString('en-US', { 
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
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

