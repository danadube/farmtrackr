'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { 
  Download, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ContactRound
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

  useEffect(() => {
    // Check Google OAuth connection status
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/google/oauth/status')
        if (res.ok) {
          const data = await res.json()
          setGoogleConnectionStatus(data.status === 'connected' ? 'connected' : 'not-connected')
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
    loadStats()
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
        // Refresh stats
        try {
          const statsRes = await fetch('/api/google-contacts/stats')
          if (statsRes.ok) {
            const stats = await statsRes.json()
            setTotalContacts(stats.totalContacts || 0)
            setLastSyncedAt(stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : '')
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
                  <ContactRound style={{ width: '24px', height: '24px', color: colors.primary }} />
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

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Sidebar>
  )
}

