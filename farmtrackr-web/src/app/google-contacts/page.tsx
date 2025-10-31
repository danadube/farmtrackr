'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { 
  Download, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Contact,
  X
} from 'lucide-react'

interface GeneralContact {
  id: string
  firstName: string | null
  lastName: string | null
  organizationName: string | null
  tags: string[]
  email1: string | null
  phoneNumber1: string | null
  mailingAddress: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  googleContactsId: string | null
}

export default function GoogleContactsPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [showImportModal, setShowImportModal] = useState(false)
  const [totalContacts, setTotalContacts] = useState<number>(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('')
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<'connected' | 'not-connected' | 'checking'>('checking')
  const [contacts, setContacts] = useState<GeneralContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [selectedContact, setSelectedContact] = useState<GeneralContact | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    // Check Google OAuth connection status
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/google/oauth/status')
        if (res.ok) {
          const data = await res.json()
          setGoogleConnectionStatus(data.connected ? 'connected' : 'not-connected')
        } else {
          setGoogleConnectionStatus('not-connected')
        }
      } catch (_) {
        setGoogleConnectionStatus('not-connected')
      }
    }
    
    checkConnection()

    // Load contact stats
    const loadStats = async () => {
      try {
        const res = await fetch('/api/google-contacts/stats')
        if (res.ok) {
          const stats = await res.json()
          setTotalContacts(stats.totalContacts || 0)
          setLastSyncedAt(stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : '')
        }
      } catch (_) {}
    }
    
    // Load contacts list
    const loadContacts = async () => {
      setIsLoadingContacts(true)
      try {
        const res = await fetch('/api/google-contacts')
        if (res.ok) {
          const contactsData = await res.json()
          setContacts(contactsData || [])
        }
      } catch (_) {
        setContacts([])
      } finally {
        setIsLoadingContacts(false)
      }
    }
    
    loadStats()
    loadContacts()
  }, [])

  const handleImport = async () => {
    if (googleConnectionStatus !== 'connected') {
      setImportStatus({ 
        type: 'error', 
        message: 'Please connect your Google account in Settings > Google Integration first' 
      })
      setShowImportModal(true)
      return
    }
    
    setIsImporting(true)
    setImportStatus({ type: null, message: '' })
    setShowImportModal(true)
    
    try {
      const response = await fetch('/api/google-contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setImportStatus({ 
          type: 'success', 
          message: `Successfully imported ${result.imported || 0} contacts, updated ${result.updated || 0}, skipped ${result.skipped || 0}` 
        })
        // Refresh stats and reload contacts
        try {
          const [statsRes, contactsRes] = await Promise.all([
            fetch('/api/google-contacts/stats'),
            fetch('/api/google-contacts')
          ])
          if (statsRes.ok) {
            const stats = await statsRes.json()
            setTotalContacts(stats.totalContacts || 0)
            setLastSyncedAt(stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : '')
          }
          if (contactsRes.ok) {
            const contactsData = await contactsRes.json()
            setContacts(contactsData || [])
          }
        } catch (_) {}
      } else {
        setImportStatus({ 
          type: 'error', 
          message: result.message || result.error || 'Import failed' 
        })
      }
    } catch (error) {
      setImportStatus({ 
        type: 'error', 
        message: 'Failed to connect to Google Contacts' 
      })
    } finally {
      setIsImporting(false)
    }
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
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div 
              style={{
                padding: '24px',
                ...headerCard,
                ...headerTint(colors.primary)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Contact style={{ width: '24px', height: '24px', color: colors.primary }} />
                </div>
                <div>
                  <h1 
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      ...text.primary,
                      margin: '0 0 4px 0'
                    }}
                  >
                    Google Contacts Integration
                  </h1>
                  <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                    Sync contacts from your Google account
                  </p>
                </div>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Connection Status & Stats */}
          <div style={{ marginBottom: '24px' }}>
            <div 
              style={{
                padding: '16px',
                ...card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '16px', margin: '0 0 4px 0' }}>
                  Google Contacts
                </h3>
                <p style={{ fontSize: '12px', ...text.secondary, margin: 0 }}>
                  Status: {googleConnectionStatus === 'connected' ? (
                    <span style={{ color: colors.success }}>Connected</span>
                  ) : googleConnectionStatus === 'checking' ? (
                    <span style={{ color: colors.text.tertiary }}>Checking...</span>
                  ) : (
                    <span style={{ color: colors.error }}>Not Connected</span>
                  )}
                  {lastSyncedAt && ` • Last synced: ${lastSyncedAt}`}
                </p>
              </div>
              <div 
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
                  border: `1px solid ${colors.primary}`,
                  color: colors.primary,
                  fontWeight: 700,
                  fontSize: '16px'
                }}
              >
                {totalContacts.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Import Action */}
          <div 
            style={{
              padding: '24px',
              ...card,
              marginBottom: '24px'
            }}
          >
            <h2 
              style={{
                fontSize: '18px',
                fontWeight: '600',
                ...text.primary,
                marginBottom: '24px'
              }}
            >
              Sync Contacts
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ ...text.secondary, fontSize: '14px', marginBottom: '16px' }}>
                  Import contacts from your Google Contacts account. This will sync all contacts and preserve tags/labels from Google.
                </p>
                
                {googleConnectionStatus === 'not-connected' && (
                  <div 
                    style={{
                      padding: '16px',
                      backgroundColor: isDark ? '#991b1b' : '#fee2e2',
                      border: `1px solid ${colors.error}`,
                      borderRadius: '10px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <AlertCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                      <h4 style={{ fontWeight: '600', color: colors.error, fontSize: '14px', margin: 0 }}>
                        Google Account Not Connected
                      </h4>
                    </div>
                    <p style={{ fontSize: '13px', color: colors.error, margin: 0 }}>
                      Please connect your Google account in Settings &gt; Google Integration before syncing contacts.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleImport}
                  disabled={isImporting || googleConnectionStatus !== 'connected'}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: (isImporting || googleConnectionStatus !== 'connected') ? colors.text.tertiary : colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (isImporting || googleConnectionStatus !== 'connected') ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease',
                    maxWidth: '200px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isImporting && googleConnectionStatus === 'connected') {
                      e.currentTarget.style.backgroundColor = colors.primaryHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isImporting && googleConnectionStatus === 'connected') {
                      e.currentTarget.style.backgroundColor = colors.primary
                    }
                  }}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw style={{ width: '16px', height: '16px' }} />
                      Sync from Google
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Contacts List */}
          {contacts.length > 0 && (
            <div 
              style={{
                padding: '24px',
                ...card,
                marginBottom: '24px'
              }}
            >
              <h2 
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  ...text.primary,
                  marginBottom: '16px'
                }}
              >
                Your Google Contacts ({contacts.length})
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => {
                      setSelectedContact(contact)
                      setShowContactModal(true)
                    }}
                    style={{
                      padding: '16px',
                      backgroundColor: colors.cardHover,
                      borderRadius: '10px',
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary
                      e.currentTarget.style.boxShadow = card.boxShadow
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', ...text.primary, margin: '0 0 8px 0' }}>
                          {contact.firstName || contact.lastName || contact.organizationName 
                            ? `${contact.firstName || ''} ${contact.lastName || ''}${contact.organizationName ? ` - ${contact.organizationName}` : ''}`.trim()
                            : 'Unnamed Contact'}
                        </h3>
                        {contact.tags && contact.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            {contact.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  backgroundColor: isDark ? '#065f46' : '#dcfce7',
                                  color: colors.success,
                                  borderRadius: '9999px',
                                  fontWeight: '600',
                                  border: `1px solid ${colors.success}`
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', ...text.secondary }}>
                      {contact.email1 && (
                        <div>📧 {contact.email1}</div>
                      )}
                      {contact.phoneNumber1 && (
                        <div>📞 {contact.phoneNumber1}</div>
                      )}
                      {contact.city && contact.state && (
                        <div>📍 {contact.city}, {contact.state} {contact.zipCode || ''}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div 
            style={{
              padding: '24px',
              backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
              border: `1px solid ${colors.primary}`,
              borderRadius: '12px'
            }}
          >
            <h3 style={{ fontWeight: '600', color: isDark ? '#93c5fd' : '#1e40af', fontSize: '16px', marginBottom: '12px' }}>
              About Google Contacts Integration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: isDark ? '#bfdbfe' : '#1e3a8a' }}>
              <p style={{ margin: '0' }}>
                <strong>Sync:</strong> Click "Sync from Google" to import all contacts from your Google Contacts account.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Tags:</strong> Labels and tags from Google Contacts will be preserved and imported automatically.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Updates:</strong> Re-syncing will update existing contacts and add new ones. Contacts are matched by Google Contacts ID or email.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Privacy:</strong> Contacts are stored securely in your FarmTrackr database and are not shared.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowImportModal(false) }}
        >
          <div style={{ ...card, padding: '24px', maxWidth: '520px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              {importStatus.type === 'error' ? (
                <AlertCircle style={{ width: '20px', height: '20px', color: colors.error }} />
              ) : (
                <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
              )}
              <h3 style={{ fontSize: '16px', fontWeight: 600, ...text.primary, margin: 0 }}>Sync Status</h3>
            </div>
            <p style={{ fontSize: '14px', ...text.secondary, margin: 0 }}>
              {isImporting ? 'Syncing contacts from Google... This may take a moment.' : (importStatus.message || 'Done.')}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
              <button
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                style={{
                  padding: '10px 16px',
                  backgroundColor: colors.cardHover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  ...text.secondary,
                  cursor: isImporting ? 'not-allowed' : 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Detail Modal */}
      {showContactModal && selectedContact && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowContactModal(false) }}
        >
          <div style={{ ...card, padding: '24px', maxWidth: '600px', width: '92%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, ...text.primary, margin: 0 }}>Contact Details</h2>
              <button
                onClick={() => setShowContactModal(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text.tertiary
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, ...text.primary, margin: '0 0 8px 0' }}>
                {selectedContact.firstName || selectedContact.lastName || selectedContact.organizationName 
                  ? `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}${selectedContact.organizationName ? ` - ${selectedContact.organizationName}` : ''}`.trim()
                  : 'Unnamed Contact'}
              </h3>
              {selectedContact.organizationName && (selectedContact.firstName || selectedContact.lastName) && (
                <p style={{ fontSize: '14px', ...text.secondary, margin: '0 0 8px 0' }}>{selectedContact.organizationName}</p>
              )}
            </div>

            {/* Tags */}
            {selectedContact.tags && selectedContact.tags.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 8px 0' }}>Tags</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedContact.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: isDark ? '#065f46' : '#dcfce7',
                        color: colors.success,
                        borderRadius: '9999px',
                        fontWeight: '600',
                        border: `1px solid ${colors.success}`
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0' }}>Contact Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedContact.email1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📧</span>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Email</div>
                      <a href={`mailto:${selectedContact.email1}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.email1}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.email2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📧</span>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Email 2</div>
                      <a href={`mailto:${selectedContact.email2}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.email2}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.phoneNumber1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Phone</div>
                      <a href={`tel:${selectedContact.phoneNumber1}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.phoneNumber1}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.phoneNumber2 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Phone 2</div>
                      <a href={`tel:${selectedContact.phoneNumber2}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.phoneNumber2}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.phoneNumber3 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '18px' }}>📞</span>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Phone 3</div>
                      <a href={`tel:${selectedContact.phoneNumber3}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.phoneNumber3}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {(selectedContact.mailingAddress || selectedContact.city || selectedContact.state) && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0' }}>Mailing Address</h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <div style={{ fontSize: '14px', ...text.primary }}>
                    {selectedContact.mailingAddress && <div>{selectedContact.mailingAddress}</div>}
                    {selectedContact.city && selectedContact.state && (
                      <div>{selectedContact.city}, {selectedContact.state} {selectedContact.zipCode || ''}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Site Address */}
            {(selectedContact.siteMailingAddress || selectedContact.siteCity || selectedContact.siteState) && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0' }}>Site Address</h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <div style={{ fontSize: '14px', ...text.primary }}>
                    {selectedContact.siteMailingAddress && <div>{selectedContact.siteMailingAddress}</div>}
                    {selectedContact.siteCity && selectedContact.siteState && (
                      <div>{selectedContact.siteCity}, {selectedContact.siteState} {selectedContact.siteZipCode || ''}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedContact.notes && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0' }}>Notes</h4>
                <div style={{ fontSize: '14px', ...text.primary, whiteSpace: 'pre-wrap' }}>{selectedContact.notes}</div>
              </div>
            )}

            {/* Additional Phone Numbers */}
            {(selectedContact.phoneNumber4 || selectedContact.phoneNumber5 || selectedContact.phoneNumber6) && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0' }}>Additional Phones</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedContact.phoneNumber4 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📞</span>
                      <a href={`tel:${selectedContact.phoneNumber4}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.phoneNumber4}
                      </a>
                    </div>
                  )}
                  {selectedContact.phoneNumber5 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📞</span>
                      <a href={`tel:${selectedContact.phoneNumber5}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.phoneNumber5}
                      </a>
                    </div>
                  )}
                  {selectedContact.phoneNumber6 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📞</span>
                      <a href={`tel:${selectedContact.phoneNumber6}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.phoneNumber6}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Sidebar>
  )
}

