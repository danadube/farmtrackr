'use client'

import { useState } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { X, Send, Paperclip, Loader2 } from 'lucide-react'
import { EmailData } from '@/types'

interface EmailComposerProps {
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  initialTransactionId?: string
  onSend: (emailData: EmailData) => Promise<{ success: boolean; error?: string }>
  onClose: () => void
}

export function EmailComposer({
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  initialTransactionId,
  onSend,
  onClose
}: EmailComposerProps) {
  const { colors, isDark, card, background, text, spacing } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [to, setTo] = useState(initialTo)
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [subject, setSubject] = useState(initialSubject)
  const [body, setBody] = useState(initialBody)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCcBcc, setShowCcBcc] = useState(false)

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Recipient email is required')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const emailData: EmailData = {
        to: to.trim(),
        subject: subject.trim() || '(No subject)',
        body: body.trim() || '',
        options: {
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
          transactionId: initialTransactionId
        }
      }

      const result = await onSend(emailData)
      
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Failed to send email')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsSending(false)
    }
  }

  return (
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
        zIndex: 1001,
        padding: spacing(3)
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...card,
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: spacing(3), 
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
            Compose Email
          </h3>
          <button
            type="button"
            {...getButtonPressHandlers('close-composer')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            style={getButtonPressStyle(
              'close-composer',
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

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: spacing(3),
          display: 'flex',
          flexDirection: 'column',
          gap: spacing(2)
        }}>
          {/* To */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '12px',
              ...text.tertiary,
              marginBottom: spacing(1),
              textTransform: 'uppercase'
            }}>
              To <span style={{ color: colors.error }}>*</span>
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              style={{
                width: '100%',
                padding: spacing(2),
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

          {/* CC/BCC Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
            <button
              type="button"
              {...getButtonPressHandlers('toggle-cc-bcc')}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCcBcc(!showCcBcc)
              }}
              style={getButtonPressStyle(
                'toggle-cc-bcc',
                {
                  padding: `${spacing(1)} ${spacing(2)}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: spacing(1),
                  fontSize: '12px',
                  ...text.secondary,
                  cursor: 'pointer'
                },
                'transparent',
                colors.cardHover
              )}
            >
              {showCcBcc ? 'Hide' : 'Show'} CC/BCC
            </button>
          </div>

          {/* CC */}
          {showCcBcc && (
            <div>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                ...text.tertiary,
                marginBottom: spacing(1),
                textTransform: 'uppercase'
              }}>
                CC
              </label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                style={{
                  width: '100%',
                  padding: spacing(2),
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
          )}

          {/* BCC */}
          {showCcBcc && (
            <div>
              <label style={{ 
                display: 'block',
                fontSize: '12px',
                ...text.tertiary,
                marginBottom: spacing(1),
                textTransform: 'uppercase'
              }}>
                BCC
              </label>
              <input
                type="email"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                style={{
                  width: '100%',
                  padding: spacing(2),
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
          )}

          {/* Subject */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '12px',
              ...text.tertiary,
              marginBottom: spacing(1),
              textTransform: 'uppercase'
            }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              style={{
                width: '100%',
                padding: spacing(2),
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

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '12px',
              ...text.tertiary,
              marginBottom: spacing(1),
              textTransform: 'uppercase'
            }}>
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              style={{
                flex: 1,
                width: '100%',
                padding: spacing(2),
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: spacing(1),
                fontSize: '14px',
                fontFamily: 'inherit',
                lineHeight: '1.6',
                ...text.primary,
                outline: 'none',
                resize: 'none',
                minHeight: '300px'
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

          {/* Error Message */}
          {error && (
            <div style={{
              padding: spacing(2),
              backgroundColor: colors.errorLight,
              border: `1px solid ${colors.error}`,
              borderRadius: spacing(1),
              fontSize: '14px',
              color: colors.error
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: spacing(3), 
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
            <button
              {...getButtonPressHandlers('attach-file')}
              style={getButtonPressStyle(
                'attach-file',
                {
                  padding: `${spacing(1.5)} ${spacing(2)}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  ...text.secondary,
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(1)
                },
                'transparent',
                colors.cardHover
              )}
              disabled
              title="File attachments coming soon"
            >
              <Paperclip style={{ width: '16px', height: '16px' }} />
              Attach
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
            <button
              type="button"
              {...getButtonPressHandlers('cancel-email')}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClose()
              }}
              disabled={isSending}
              style={getButtonPressStyle(
                'cancel-email',
                {
                  padding: `${spacing(1.5)} ${spacing(3)}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  ...text.secondary,
                  cursor: isSending ? 'not-allowed' : 'pointer'
                },
                'transparent',
                colors.cardHover
              )}
            >
              Cancel
            </button>
            <button
              type="button"
              {...getButtonPressHandlers('send-email')}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleSend()
              }}
              disabled={isSending || !to.trim()}
              style={getButtonPressStyle(
                'send-email',
                {
                  padding: `${spacing(1.5)} ${spacing(3)}`,
                  backgroundColor: isSending || !to.trim() ? colors.border : colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSending || !to.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(1.5),
                  opacity: isSending || !to.trim() ? 0.6 : 1
                },
                colors.primary,
                colors.primaryHover
              )}
            >
              {isSending ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Sending...
                </>
              ) : (
                <>
                  <Send style={{ width: '16px', height: '16px' }} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

