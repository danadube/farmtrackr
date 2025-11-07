'use client'

import { useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { X, Send, Paperclip, Loader2, FileText, ChevronDown } from 'lucide-react'
import { EmailData } from '@/types'
import { TransactionSelector } from './TransactionSelector'
import { RichTextEditor } from './RichTextEditor'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables?: string[]
  isLocal?: boolean
}

interface EmailComposerProps {
  initialTo?: string
  initialSubject?: string
  initialBody?: string
  initialTransactionId?: string
  onSend: (emailData: EmailData) => Promise<{ success: boolean; error?: string }>
  onClose: () => void
  isReplying?: boolean
  isForwarding?: boolean
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'welcome_buyer',
    name: 'Welcome - New Buyer',
    subject: 'Welcome to Your Home Search Journey!',
    body: `<p>Hi {{client_name}},</p>
      <p>Welcome! I'm thrilled to help you find your perfect home. This is an exciting journey, and I'm here to make it as smooth and enjoyable as possible.</p>
      <p><strong>What happens next?</strong></p>
      <ul>
        <li>I'll set up your property search based on your criteria.</li>
        <li>You'll receive new listings as soon as they hit the market.</li>
        <li>We'll schedule showings for properties that interest you.</li>
        <li>I'll guide you through every step of the buying process.</li>
      </ul>
      <p><strong>Your search criteria:</strong></p>
      <ul>
        <li>Location: {{location}}</li>
        <li>Price Range: {{price_range}}</li>
        <li>Bedrooms: {{bedrooms}}</li>
        <li>Property Type: {{property_type}}</li>
      </ul>
      <p>Feel free to reach out anytime with questions. I'm here to help!</p>
      <p>Best regards,<br/>{{agent_name}}<br/>{{agent_phone}}<br/>{{agent_email}}</p>`,
    variables: ['client_name', 'location', 'price_range', 'bedrooms', 'property_type', 'agent_name', 'agent_phone', 'agent_email'],
    isLocal: true,
  },
  {
    id: 'welcome_seller',
    name: 'Welcome - New Seller',
    subject: "Let's Get Your Property Sold!",
    body: `<p>Hi {{client_name}},</p>
      <p>Thank you for choosing me to sell your property at <strong>{{property_address}}</strong>. I'm committed to getting you the best possible price in the shortest time frame.</p>
      <p><strong>Our plan:</strong></p>
      <ul>
        <li>Prepare market analysis for optimal listing price.</li>
        <li>Walkthrough scheduled on {{walkthrough_date}}.</li>
        <li>Professional photos on {{photo_date}}.</li>
        <li>Target listing date: {{listing_date}}.</li>
      </ul>
      <p>I'll keep you updated every step of the way. Let's get your property sold!</p>
      <p>Best regards,<br/>{{agent_name}}<br/>{{agent_phone}}<br/>{{agent_email}}</p>`,
    variables: ['client_name', 'property_address', 'walkthrough_date', 'photo_date', 'listing_date', 'agent_name', 'agent_phone', 'agent_email'],
    isLocal: true,
  },
  {
    id: 'showing_confirmation',
    name: 'Showing Confirmation',
    subject: 'Property Showing Confirmed',
    body: `<p>Hi {{client_name}},</p>
      <p>Your property showing has been confirmed for:</p>
      <p><strong>{{property_address}}</strong><br/>{{showing_date}} at {{showing_time}} ({{duration}} minutes)</p>
      <p>Meeting instructions: {{meeting_instructions}}</p>
      <p>Looking forward to it!</p>
      <p>{{agent_name}}<br/>{{agent_phone}}</p>`,
    variables: ['client_name', 'property_address', 'showing_date', 'showing_time', 'duration', 'meeting_instructions', 'agent_name', 'agent_phone'],
    isLocal: true,
  },
  {
    id: 'offer_received',
    name: 'Offer Received',
    subject: 'Offer Received on Your Property',
    body: `<p>Hi {{client_name}},</p>
      <p>Great news! We've received an offer on <strong>{{property_address}}</strong>.</p>
      <p><strong>Offer details:</strong></p>
      <ul>
        <li>Offer Price: {{offer_price}}</li>
        <li>Earnest Money: {{earnest_money}}</li>
        <li>Financing: {{financing_type}}</li>
        <li>Closing Date: {{closing_date}}</li>
        <li>Contingencies: {{contingencies}}</li>
      </ul>
      <p>My recommendation: {{recommendation}}</p>
      <p>Let's review together.</p>
      <p>{{agent_name}}<br/>{{agent_phone}}</p>`,
    variables: ['client_name', 'property_address', 'offer_price', 'earnest_money', 'financing_type', 'closing_date', 'contingencies', 'recommendation', 'agent_name', 'agent_phone'],
    isLocal: true,
  },
  {
    id: 'offer_accepted',
    name: 'Offer Accepted',
    subject: 'Congratulations - Offer Accepted!',
    body: `<p>Hi {{client_name}},</p>
      <p>Fantastic news! Your offer on {{property_address}} has been accepted.</p>
      <p><strong>Key dates:</strong></p>
      <ul>
        <li>Purchase Price: {{purchase_price}}</li>
        <li>Closing Date: {{closing_date}}</li>
        <li>Inspection Period: {{inspection_period}}</li>
      </ul>
      <p>Next steps include inspection, appraisal, loan approval, and closing day.</p>
      <p>I'll keep everything on track. Congratulations!</p>
      <p>{{agent_name}}<br/>{{agent_phone}}<br/>{{agent_email}}</p>`,
    variables: ['client_name', 'property_address', 'purchase_price', 'closing_date', 'inspection_period', 'agent_name', 'agent_phone', 'agent_email'],
    isLocal: true,
  },
  {
    id: 'closing_reminder',
    name: 'Closing Reminder',
    subject: 'Your Closing is Coming Up!',
    body: `<p>Hi {{client_name}},</p>
      <p>Your closing for {{property_address}} is scheduled for <strong>{{closing_date}}</strong> at {{closing_time}}.</p>
      <p><strong>Location:</strong> {{closing_location}}</p>
      <p>Please bring:</p>
      <ul>
        <li>Government-issued photo ID</li>
        <li>Cashier's check or wiring confirmation ({{closing_costs}})</li>
        <li>Proof of homeowner's insurance</li>
        <li>Any lender-required documents</li>
      </ul>
      <p>See you at closing!</p>
      <p>{{agent_name}}<br/>{{agent_phone}}</p>`,
    variables: ['client_name', 'property_address', 'closing_date', 'closing_time', 'closing_location', 'closing_costs', 'agent_name', 'agent_phone'],
    isLocal: true,
  },
]

export function EmailComposer({
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  initialTransactionId,
  onSend,
  onClose,
  isReplying = false,
  isForwarding = false
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
  const isSubmitting = isSending || isReplying || isForwarding
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(initialTransactionId || null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
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
          setTemplates(DEFAULT_TEMPLATES)
        } else {
          // Merge with defaults (ensure unique IDs, keep remote versions)
          const defaultTemplateMap = new Map(DEFAULT_TEMPLATES.map((t) => [t.id, t]))
          const combined = templateList.map((t: EmailTemplate) => ({
            ...defaultTemplateMap.get(t.id),
            ...t,
          }))
          // Append defaults that were not returned by API
          DEFAULT_TEMPLATES.forEach((t) => {
            if (!combined.find((item) => item.id === t.id)) {
              combined.push(t)
            }
          })
          setTemplates(combined)
        }
      } else {
        const errorText = await response.text()
        console.error('Error loading templates:', response.status, errorText)
        setTemplates(DEFAULT_TEMPLATES)
      }
    } catch (err) {
      console.error('Error loading templates:', err)
      setTemplates(DEFAULT_TEMPLATES)
    }
  }

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const response = await fetch('/api/emails/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          variables: {
            // Add variables here based on selected transaction
            clientName: 'Client Name',
            propertyAddress: 'Property Address',
          }
        })
      })
      if (template?.isLocal) {
        setSubject(template.subject || '')
        setBody(template.body || '')
        setSelectedTemplate(templateId)
        setShowTemplates(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSubject(data.subject || '')
          setBody(data.body || '')
          setSelectedTemplate(templateId)
          setShowTemplates(false)
        }
      } else if (template) {
        // Fallback to local template if API call fails
        setSubject(template.subject || '')
        setBody(template.body || '')
        setSelectedTemplate(templateId)
        setShowTemplates(false)
      }
    } catch (err) {
      console.error('Error loading template:', err)
      const template = templates.find((t) => t.id === templateId)
      if (template) {
        setSubject(template.subject || '')
        setBody(template.body || '')
        setSelectedTemplate(templateId)
        setShowTemplates(false)
      }
    }
  }

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
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        transactionId: selectedTransactionId || undefined
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

          {/* Transaction Selector */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '12px',
              ...text.tertiary,
              marginBottom: spacing(1),
              textTransform: 'uppercase'
            }}>
              Link to Transaction (Optional)
            </label>
            <TransactionSelector
              selectedTransactionId={selectedTransactionId || undefined}
              onSelect={setSelectedTransactionId}
              placeholder="Select a transaction to link this email..."
            />
          </div>

          {/* Templates & CC/BCC Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2), flexWrap: 'wrap' }}>
            {templates.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  {...getButtonPressHandlers('select-template')}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowTemplates(!showTemplates)
                  }}
                  style={getButtonPressStyle(
                    'select-template',
                    {
                      padding: `${spacing(1)} ${spacing(2)}`,
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: spacing(1),
                      fontSize: '12px',
                      ...text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing(1)
                    },
                    'transparent',
                    colors.cardHover
                  )}
                >
                  <FileText style={{ width: '14px', height: '14px' }} />
                  Templates
                  <ChevronDown style={{ width: '12px', height: '12px' }} />
                </button>
                {showTemplates && (
                  <>
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1000,
                      }}
                      onClick={() => setShowTemplates(false)}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: spacing(1),
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                        borderRadius: spacing(1),
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 1001,
                        minWidth: '200px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                      }}
                    >
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          {...getButtonPressHandlers(`template-${template.id}`)}
                          onClick={() => handleTemplateSelect(template.id)}
                          style={getButtonPressStyle(
                            `template-${template.id}`,
                            {
                              padding: spacing(2),
                              borderBottom: `1px solid ${colors.border}`,
                              cursor: 'pointer',
                              ...text.primary,
                              fontSize: '14px',
                            },
                            colors.card,
                            colors.cardHover
                          )}
                        >
                          <div style={{ fontWeight: '500' }}>{template.name}</div>
                          <div style={{ fontSize: '12px', ...text.tertiary, marginTop: '2px' }}>
                            {template.subject}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
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
            <RichTextEditor
              content={body}
              onChange={setBody}
              placeholder="Type your message here..."
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
              disabled={isSubmitting}
              style={getButtonPressStyle(
                'cancel-email',
                {
                  padding: `${spacing(1.5)} ${spacing(3)}`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  ...text.secondary,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
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
              disabled={isSubmitting || !to.trim()}
              style={getButtonPressStyle(
                'send-email',
                {
                  padding: `${spacing(1.5)} ${spacing(3)}`,
                  backgroundColor: isSubmitting || !to.trim() ? colors.border : colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: spacing(1),
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isSubmitting || !to.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing(1.5),
                  opacity: isSubmitting || !to.trim() ? 0.6 : 1
                },
                colors.primary,
                colors.primaryHover
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  {isReplying ? 'Replying...' : isForwarding ? 'Forwarding...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send style={{ width: '16px', height: '16px' }} />
                  {isReplying ? 'Reply' : isForwarding ? 'Forward' : 'Send'}
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

