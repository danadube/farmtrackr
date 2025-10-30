'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FarmContact } from '@/types'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  User,
  Mail, 
  MapPin, 
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { formatPhoneNumber, formatCityStateZip } from '@/lib/formatters'
import { getFarmColor } from '@/lib/farmColors'
import { normalizeFarmName, getContactBadgeLetter } from '@/lib/farmNames'

export default function ContactDetailPage() {
  const { colors, isDark, card, headerCard, headerDivider, background, text } = useThemeStyles()
  const router = useRouter()
  const params = useParams()
  const contactId = params?.id as string
  
  const [contact, setContact] = useState<FarmContact | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)


  useEffect(() => {
    async function fetchContact() {
      try {
        const response = await fetch(`/api/contacts/${contactId}`)
        if (response.ok) {
          const data = await response.json()
          // Convert date strings back to Date objects
          const contactWithDates = {
            ...data,
            dateCreated: new Date(data.dateCreated),
            dateModified: new Date(data.dateModified),
          }
          setContact(contactWithDates)
        } else {
          setContact(null)
        }
      } catch (error) {
        console.error('Error fetching contact:', error)
        setContact(null)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContact()
  }, [contactId])

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/contacts/${contactId}`, { 
        method: 'DELETE' 
      })
      
      if (response.ok) {
        router.push('/contacts')
      } else {
        const errorData = await response.json()
        console.error('Error deleting contact:', errorData)
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <Sidebar>
        <div 
          style={{ 
            marginLeft: '256px', 
            paddingLeft: '0',
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
            marginLeft: '256px', 
            paddingLeft: '0',
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
              href="/contacts"
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
      <div 
        style={{ 
          marginLeft: '256px', 
          paddingLeft: '0',
          minHeight: '100vh',
          ...background
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
                  
                  {(() => {
                    const farmName = contact.farm ? normalizeFarmName(contact.farm) : null
                    const farmColor = farmName ? getFarmColor(farmName) : null
                    const badgeLetter = getContactBadgeLetter(contact)
                    
                    return (
                      <div 
                        style={{
                          width: '64px',
                          height: '64px',
                          backgroundColor: farmColor ? farmColor.bg : colors.iconBg,
                          border: farmColor ? `2px solid ${farmColor.border}` : `1px solid ${colors.border}`,
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
                          color: farmColor ? farmColor.text : colors.text.primary,
                          textShadow: farmColor ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}>
                          {badgeLetter}
                        </span>
                      </div>
                    )
                  })()}
                  
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0 0 8px 0' }}>
                      {contact.organizationName || `${contact.firstName} ${contact.lastName}`.trim() || 'Contact'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {contact.farm && (() => {
                        const normalizedFarm = normalizeFarmName(contact.farm)
                        const farmColor = getFarmColor(normalizedFarm)
                        return (
                          <span style={{ 
                            padding: '6px 12px', 
                            backgroundColor: farmColor.bg, 
                            border: `1px solid ${farmColor.border}`, 
                            borderRadius: '999px', 
                            fontSize: '12px', 
                            fontWeight: '500',
                            color: farmColor.text
                          }}>
                            {normalizedFarm}
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {contact.email1 && (
                    <a
                      href={`mailto:${contact.email1}`}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: colors.cardHover,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        fontSize: '13px',
                        ...text.secondary,
                        textDecoration: 'none'
                      }}
                    >
                      Email
                    </a>
                  )}
                  {contact.phoneNumber1 && (
                    <a
                      href={`tel:${contact.phoneNumber1}`}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: colors.cardHover,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        fontSize: '13px',
                        ...text.secondary,
                        textDecoration: 'none'
                      }}
                    >
                      Call
                    </a>
                  )}
                  <Link
                    href={`/contacts/${contact.id}/edit`}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: colors.success,
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
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
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: colors.error,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isDark ? '#dc2626' : '#dc2626'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.error
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                    Delete
                  </button>
                </div>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Contact Details - Card Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Contact Information Card */}
            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Mail style={{ width: '18px', height: '18px', color: colors.success }} />
                <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Contact Information
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {contact.email1 && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                      Primary Email
                    </label>
                    <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                      <a 
                        href={`mailto:${contact.email1}`}
                        style={{ color: colors.success, textDecoration: 'none' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
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
                      <a 
                        href={`mailto:${contact.email2}`}
                        style={{ color: colors.success, textDecoration: 'none' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
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
                      <a 
                        href={`tel:${contact.phoneNumber1}`}
                        style={{ color: colors.success, textDecoration: 'none' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        {formatPhoneNumber(contact.phoneNumber1)}
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
                      <a 
                        href={`tel:${contact.phoneNumber2}`}
                        style={{ color: colors.success, textDecoration: 'none' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        {formatPhoneNumber(contact.phoneNumber2)}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mailing Address Card */}
            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <MapPin style={{ width: '18px', height: '18px', color: colors.success }} />
                <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Mailing Address
                </h2>
              </div>
              
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
                      {formatCityStateZip(contact.city, contact.state, contact.zipCode)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Site Address Card (if different) */}
            {(contact.siteMailingAddress || contact.siteCity || contact.siteState || contact.siteZipCode) && (
              <div style={{ padding: '24px', ...card }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <MapPin style={{ width: '18px', height: '18px', color: colors.success }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Site Address
                  </h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {contact.siteMailingAddress && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                        Street Address
                      </label>
                      <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                        {contact.siteMailingAddress}
                      </p>
                    </div>
                  )}
                  
                  {(contact.siteCity || contact.siteState || contact.siteZipCode) && (
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                        City, State ZIP
                      </label>
                      <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                        {formatCityStateZip(contact.siteCity, contact.siteState, contact.siteZipCode)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes Card - Always visible, full width */}
            <div style={{ padding: '24px', ...card, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <FileText style={{ width: '18px', height: '18px', color: colors.success }} />
                <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Notes
                </h2>
              </div>
              
              {contact.notes ? (
                <div 
                  style={{
                    padding: '16px',
                    backgroundColor: colors.cardHover,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    color: colors.text.primary,
                    lineHeight: '1.6',
                    minHeight: '80px'
                  }}
                  dangerouslySetInnerHTML={{ __html: String(contact.notes) }}
                />
              ) : (
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
                    No notes added yet. Click Edit to add notes for this contact.
                  </span>
                </div>
              )}
            </div>

            {/* Record Information Card */}
            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Calendar style={{ width: '18px', height: '18px', color: colors.success }} />
                <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Record Information
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    Created
                  </label>
                  <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                    {contact.dateCreated.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                    Last Modified
                  </label>
                  <p style={{ fontSize: '16px', ...text.primary, margin: '0' }}>
                    {contact.dateModified.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            style={{
              backgroundColor: colors.card,
              padding: '32px',
              borderRadius: '12px',
              boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxWidth: '400px',
              width: '90%',
              border: `1px solid ${colors.border}`
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
              Delete Contact
            </h3>
            <p style={{ ...text.secondary, marginBottom: '24px', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{contact.firstName} {contact.lastName}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.cardHover,
                  ...text.secondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = colors.borderHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: isDeleting ? colors.text.tertiary : colors.error,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = isDark ? '#dc2626' : '#dc2626'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeleting) {
                    e.currentTarget.style.backgroundColor = colors.error
                  }
                }}
              >
                <Trash2 style={{ width: '16px', height: '16px' }} />
                {isDeleting ? 'Deleting...' : 'Delete Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}