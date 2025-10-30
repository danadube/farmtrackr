'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContactFormData } from '@/types'
import { X, Save, User, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'

interface ContactFormProps {
  initialData?: ContactFormData
  contactId?: string
  isEditing?: boolean
}

export default function ContactForm({ initialData, contactId, isEditing = false }: ContactFormProps) {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const router = useRouter()
  const [formData, setFormData] = useState<ContactFormData>(
    initialData || {
      firstName: '',
      lastName: '',
      organizationName: '',
      farm: '',
      mailingAddress: '',
      city: '',
      state: '',
      zipCode: '',
      email1: '',
      email2: '',
      phoneNumber1: '',
      phoneNumber2: '',
      phoneNumber3: '',
      phoneNumber4: '',
      phoneNumber5: '',
      phoneNumber6: '',
      siteMailingAddress: '',
      siteCity: '',
      siteState: '',
      siteZipCode: '',
      notes: ''
    }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const notesRef = useRef<HTMLDivElement | null>(null)

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Names are optional (trusts/businesses may use a single field elsewhere)
    if (formData.email1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email1)) {
      newErrors.email1 = 'Please enter a valid email address'
    }
    if (formData.email2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email2)) {
      newErrors.email2 = 'Please enter a valid email address'
    }
    const zipRegex = /^\d{5}(?:-\d{4})?$/
    if (formData.zipCode && !zipRegex.test(String(formData.zipCode).trim())) {
      newErrors.zipCode = 'Enter 5-digit ZIP or ZIP+4 (12345 or 12345-6789)'
    }
    if (formData.siteZipCode && !zipRegex.test(String(formData.siteZipCode).trim())) {
      newErrors.siteZipCode = 'Enter 5-digit ZIP or ZIP+4 (12345 or 12345-6789)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const url = isEditing ? `/api/contacts/${contactId}` : '/api/contacts'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/contacts')
      } else {
        const errorData = await response.json()
        console.error('Error saving contact:', errorData)
      }
    } catch (error) {
      console.error('Error saving contact:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Helper function to get input styles
  const getInputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '12px',
    border: `1px solid ${hasError ? colors.error : colors.border}`,
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: colors.card,
    color: colors.text.primary,
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box' as const,
    margin: 0
  })

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
            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: colors.iconBg,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <User style={{ width: '24px', height: '24px', color: colors.success }} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0 0 4px 0' }}>
                      {isEditing ? 'Edit Contact' : 'Add New Contact'}
                    </h1>
                    <p style={{ ...text.secondary, fontSize: '14px', margin: '0' }}>
                      {isEditing ? 'Update contact information' : 'Create a new farm contact'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
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
                  <X style={{ width: '20px', height: '20px', color: colors.text.secondary }} />
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '32px', ...card }}>
              {/* Basic Information */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <User style={{ width: '16px', height: '16px', color: colors.success }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Basic Information
                  </h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', boxSizing: 'border-box' }}>
                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      style={getInputStyle(!!errors.firstName)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.firstName ? colors.error : colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.firstName && (
                      <p style={{ fontSize: '12px', color: colors.error, marginTop: '4px', margin: '4px 0 0 0' }}>
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      style={getInputStyle(!!errors.lastName)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.lastName ? colors.error : colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.lastName && (
                      <p style={{ fontSize: '12px', color: colors.error, marginTop: '4px', margin: '4px 0 0 0' }}>
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Organization/Trust Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter organization, trust, or business name"
                      value={formData.organizationName || ''}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Farm
                    </label>
                    <input
                      type="text"
                      placeholder="Enter farm name"
                      value={formData.farm || ''}
                      onChange={(e) => handleInputChange('farm', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Mail style={{ width: '16px', height: '16px', color: colors.success }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Contact Information
                  </h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', boxSizing: 'border-box' }}>
                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Primary Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email1 || ''}
                      onChange={(e) => handleInputChange('email1', e.target.value)}
                      style={getInputStyle(!!errors.email1)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email1 ? colors.error : colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.email1 && (
                      <p style={{ fontSize: '12px', color: colors.error, marginTop: '4px', margin: '4px 0 0 0' }}>
                        {errors.email1}
                      </p>
                    )}
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Secondary Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email2 || ''}
                      onChange={(e) => handleInputChange('email2', e.target.value)}
                      style={getInputStyle(!!errors.email2)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email2 ? colors.error : colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.email2 && (
                      <p style={{ fontSize: '12px', color: colors.error, marginTop: '4px', margin: '4px 0 0 0' }}>
                        {errors.email2}
                      </p>
                    )}
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Primary Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber1 || ''}
                      onChange={(e) => handleInputChange('phoneNumber1', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Secondary Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber2 || ''}
                      onChange={(e) => handleInputChange('phoneNumber2', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Mailing Address */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: colors.success }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Mailing Address
                  </h2>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', boxSizing: 'border-box' }}>
                  <div style={{ gridColumn: 'span 2', boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main Street"
                      value={formData.mailingAddress || ''}
                      onChange={(e) => handleInputChange('mailingAddress', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      placeholder="12345 or 12345-6789"
                      value={formData.zipCode || ''}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      style={getInputStyle(!!errors.zipCode)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.zipCode ? colors.error : colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.zipCode && (
                      <p style={{ fontSize: '12px', color: colors.error, marginTop: '4px', margin: '4px 0 0 0' }}>
                        {errors.zipCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Site Address */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: colors.success }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Site Address
                  </h2>
                  <span style={{ fontSize: '12px', ...text.tertiary, fontStyle: 'italic' }}>
                    (if different from mailing address)
                  </span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', boxSizing: 'border-box' }}>
                  <div style={{ gridColumn: 'span 2', boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Main Street (if different from mailing)"
                      value={formData.siteMailingAddress || ''}
                      onChange={(e) => handleInputChange('siteMailingAddress', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.siteCity || ''}
                      onChange={(e) => handleInputChange('siteCity', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.siteState || ''}
                      onChange={(e) => handleInputChange('siteState', e.target.value)}
                      style={getInputStyle(false)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                  </div>

                  <div style={{ boxSizing: 'border-box' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      placeholder="12345 or 12345-6789"
                      value={formData.siteZipCode || ''}
                      onChange={(e) => handleInputChange('siteZipCode', e.target.value)}
                      style={getInputStyle(!!errors.siteZipCode)}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.success
                        e.target.style.outline = 'none'
                        e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.siteZipCode ? colors.error : colors.border
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.siteZipCode && (
                      <p style={{ fontSize: '12px', color: colors.error, marginTop: '4px', margin: '4px 0 0 0' }}>
                        {errors.siteZipCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <FileText style={{ width: '16px', height: '16px', color: colors.success }} />
                  <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Notes
                  </h2>
                </div>
                
                {/* Rich text toolbar */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {[
                    { label: 'B', title: 'Bold', cmd: 'bold', style: { fontWeight: 700 } },
                    { label: 'I', title: 'Italic', cmd: 'italic', style: { fontStyle: 'italic' } },
                    { label: 'U', title: 'Underline', cmd: 'underline', style: { textDecoration: 'underline' } },
                    { label: '• List', title: 'Bulleted List', cmd: 'insertUnorderedList' },
                    { label: '1. List', title: 'Numbered List', cmd: 'insertOrderedList' },
                  ].map((btn) => (
                    <button
                      key={btn.title}
                      type="button"
                      title={btn.title}
                      onClick={(e) => {
                        e.preventDefault()
                        // Focus editor before command
                        if (notesRef.current) {
                          notesRef.current.focus()
                        }
                        try {
                          document.execCommand(btn.cmd as any, false)
                          // Update state after command
                          if (notesRef.current) {
                            handleInputChange('notes', notesRef.current.innerHTML)
                          }
                        } catch {}
                      }}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: colors.cardHover,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: colors.text.secondary,
                        ...(btn.style || {})
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.borderHover }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.cardHover }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div
                  ref={notesRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleInputChange('notes', (e.currentTarget as HTMLDivElement).innerHTML)}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    backgroundColor: colors.card,
                    color: colors.text.primary,
                    transition: 'border-color 0.2s ease',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = colors.success
                    ;(e.currentTarget as HTMLDivElement).style.outline = 'none'
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 3px ${colors.success}20`
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = colors.border
                    ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
                  }}
                  dangerouslySetInnerHTML={{ __html: formData.notes || '' }}
                />
                <div style={{ fontSize: '12px', ...text.tertiary, marginTop: '6px' }}>
                  You can format text (bold, italic, lists) with your keyboard shortcuts.
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.borderHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isSubmitting ? colors.text.tertiary : colors.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = colors.success
                    }
                  }}
                >
                  <Save style={{ width: '16px', height: '16px' }} />
                  {isSubmitting ? 'Saving...' : (isEditing ? 'Update Contact' : 'Create Contact')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Sidebar>
  )
}