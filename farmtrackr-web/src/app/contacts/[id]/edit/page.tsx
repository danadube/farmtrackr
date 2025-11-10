'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import ContactForm from '@/components/ContactForm'
import { ContactFormData } from '@/types'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'

export default function EditContactPage() {
  const params = useParams()
  const contactId = params?.id as string
  const searchParams = useSearchParams()
  const variantParam = searchParams.get('variant') === 'general' ? 'general' : 'farm'
  const isGeneralVariant = variantParam === 'general'
  const { colors, background, text } = useThemeStyles()
  const [initialData, setInitialData] = useState<ContactFormData | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchContact() {
      try {
        const response = await fetch(
          `${isGeneralVariant ? '/api/google-contacts' : '/api/contacts'}/${contactId}`
        )
        if (response.ok) {
          const data = await response.json()
          // Convert to ContactFormData format
          setInitialData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            organizationName: data.organizationName || '',
            farm: data.farm || '',
            mailingAddress: data.mailingAddress || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode,
            email1: data.email1 || '',
            email2: data.email2 || '',
            phoneNumber1: data.phoneNumber1 || '',
            phoneNumber2: data.phoneNumber2 || '',
            phoneNumber3: data.phoneNumber3 || '',
            phoneNumber4: data.phoneNumber4 || '',
            phoneNumber5: data.phoneNumber5 || '',
            phoneNumber6: data.phoneNumber6 || '',
            siteMailingAddress: data.siteMailingAddress || '',
            siteCity: data.siteCity || '',
            siteState: data.siteState || '',
            siteZipCode: data.siteZipCode,
            notes: data.notes || '',
            website: data.website || '',
            tags: isGeneralVariant ? data.tags || [] : [],
          })
        }
      } catch (error) {
        console.error('Error fetching contact:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContact()
  }, [contactId, isGeneralVariant])

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
            <p style={{ ...text.secondary }}>Loading contact...</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  if (!initialData) {
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
            <h2 style={{ fontSize: '24px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
              Contact not found
            </h2>
            <p style={{ ...text.secondary }}>The contact you're looking for doesn't exist.</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <ContactForm
      initialData={initialData}
      contactId={contactId}
      isEditing={true}
      variant={variantParam as 'farm' | 'general'}
    />
  )
}