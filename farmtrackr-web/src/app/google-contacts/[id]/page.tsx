'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface GeneralContact {
  id: string
  firstName: string | null
  lastName: string | null
  organizationName: string | null
  tags: string[]
  email1: string | null
  email2: string | null
  phoneNumber1: string | null
  phoneNumber2: string | null
  phoneNumber3: string | null
  phoneNumber4: string | null
  phoneNumber5: string | null
  phoneNumber6: string | null
  mailingAddress: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  siteMailingAddress: string | null
  siteCity: string | null
  siteState: string | null
  siteZipCode: string | null
  notes: string | null
  googleContactsId: string | null
  dateCreated: string
  dateModified: string
}

export default function GoogleContactDetailPage() {
  const { colors, isDark, card, headerCard, headerDivider, background, text } = useThemeStyles()
  const router = useRouter()
  const params = useParams()
  const contactId = params?.id as string
  
  const [contact, setContact] = useState<GeneralContact | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContact() {
      try {
        const response = await fetch(`/api/google-contacts/${contactId}`)
        if (response.ok) {
          const data = await response.json()
          setContact(data)
        } else {
          setContact(null)
        }
      } catch (error) {
        console.error('Error fetching Google Contact:', error)
        setContact(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContact()
  }, [contactId])

  if (loading) {
    return (
      <Sidebar>
        <div 
          style={{ 
            minHeight: '100vh',
            ...background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                border: `4px solid ${colors.border}`,
                borderTop: `4px solid ${colors.success}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}
            />
            <p style={{ ...text.secondary, fontSize: '16px' }}>Loading contact...</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  if (!contact) {
    return (
      <Sidebar>
        <div 
          style={{ 
            minHeight: '100vh',
            ...background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <User style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
              Contact Not Found
            </h2>
            <p style={{ ...text.secondary, marginBottom: '24px' }}>
              The contact you're looking for doesn't exist.
            </p>
            <Link 
              href="/contacts?view=google"
              style={{
                padding: '12px 24px',
                backgroundColor: colors.success,
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.success
              }}
            >
              Back to Contacts
            </Link>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <style>{`
        .rendered-note ul, .rendered-note ol { 
          padding-left: 24px; 
          margin: 8px 0; 
        }
        .rendered-note ul { 
          list-style-type: disc; 
        }
        .rendered-note ol { 
          list-style-type: decimal; 
        }
        .rendered-note li { 
          margin: 4px 0; 
        }
      `}</style>
      <div 
        style={{ 
          minHeight: '100vh',
          ...background
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
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ padding: '24px', ...headerCard }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => router.back()}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <ArrowLeft style={{ width: '20px', height: '20px', color: colors.text.secondary }} />
                  </button>
                  
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <span style={{ 
                      fontSize: '28px', 
                      fontWeight: '700', 
                      ...text.primary
                    }}>
                      {(() => {
                        if (contact.firstName) return contact.firstName[0].toUpperCase()
                        if (contact.lastName) return contact.lastName[0].toUpperCase()
                        if (contact.organizationName) return contact.organizationName[0].toUpperCase()
                        return '?'
                      })()}
                    </span>
                  </div>
                  
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0 0 8px 0' }}>
                      {contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Contact'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {contact.tags && contact.tags.length > 0 && contact.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          style={{ 
                            padding: '6px 12px', 
                            backgroundColor: isDark ? '#065f46' : '#dcfce7',
                            border: `1px solid ${colors.success}`, 
                            borderRadius: '999px', 
                            fontSize: '12px', 
                            fontWeight: '500',
                            color: colors.success
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/contacts/${contact.id}/edit?variant=general&view=google`}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: colors.success,
                    color: '#ffffff',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.success
                  }}
                >
                  <Edit style={{ width: '16px', height: '16px' }} />
                  Edit Contact
                </Link>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Contact Information Card */}
            <div style={{ padding: '24px', ...card }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '20px' }}>
                Contact Information
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {contact.email1 && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Primary Email
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      <a href={`mailto:${contact.email1}`} style={{ color: colors.success, textDecoration: 'none' }}>
                        {contact.email1}
                      </a>
                    </p>
                  </div>
                )}
                
                {contact.email2 && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Secondary Email
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      <a href={`mailto:${contact.email2}`} style={{ color: colors.success, textDecoration: 'none' }}>
                        {contact.email2}
                      </a>
                    </p>
                  </div>
                )}
                
                {contact.phoneNumber1 && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Primary Phone
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      <a href={`tel:${contact.phoneNumber1}`} style={{ color: colors.success, textDecoration: 'none' }}>
                        {contact.phoneNumber1}
                      </a>
                    </p>
                  </div>
                )}
                
                {contact.phoneNumber2 && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Secondary Phone
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      <a href={`tel:${contact.phoneNumber2}`} style={{ color: colors.success, textDecoration: 'none' }}>
                        {contact.phoneNumber2}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mailing Address Card */}
            <div style={{ padding: '24px', ...card }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '20px' }}>
                Mailing Address
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {contact.mailingAddress ? (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Street Address
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      {contact.mailingAddress}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', ...text.tertiary, fontStyle: 'italic', margin: '0' }}>
                    No mailing address on file
                  </p>
                )}
                
                {(contact.city || contact.state || contact.zipCode) && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      City, State ZIP
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      {contact.city}, {contact.state} {contact.zipCode || ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Card */}
            <div style={{ padding: '24px', ...card, gridColumn: '1 / -1' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '20px' }}>
                Notes
              </h2>
              
              {(() => {
                if (contact.notes && contact.notes.trim()) {
                  return (
                    <div
                      className="rendered-note"
                      style={{
                        padding: '16px',
                        backgroundColor: colors.cardHover,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        fontSize: '14px',
                        ...text.primary,
                        lineHeight: '1.6',
                        minHeight: '80px'
                      }}
                      dangerouslySetInnerHTML={{ __html: String(contact.notes) }}
                    />
                  )
                }
                return (
                  <div 
                    style={{
                      padding: '16px',
                      backgroundColor: colors.cardHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      ...text.secondary,
                      lineHeight: '1.6',
                      minHeight: '80px'
                    }}
                  >
                    <span style={{ fontStyle: 'italic', color: colors.text.tertiary }}>
                      No notes added yet.
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

