'use client'

import { useEffect, useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import Link from 'next/link'
import { 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Contact,
  X,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Mail,
  MapPin,
  Printer
} from 'lucide-react'

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
}

// Format phone number to standard US format: (XXX) XXX-XXXX
function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Handle US numbers with +1 prefix (+1XXXXXXXXXX)
  if (phone.startsWith('+1') && cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  // Handle US numbers with country code (11 digits starting with 1, no +)
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  // Handle US numbers (10 digits)
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Handle other international numbers (start with + and not +1, or have more than 11 digits)
  if (phone.startsWith('+') && (cleaned.length > 11 || !phone.startsWith('+1'))) {
    // For international, just clean up spacing but keep structure
    return phone.trim()
  }
  
  // If format doesn't match, return original
  return phone
}

export default function GoogleContactsPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'city' | 'state'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

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

  // Get unique tags for filter
  const uniqueTags = Array.from(new Set(contacts.flatMap(c => c.tags || []))).sort()

  // Filter and sort contacts
  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const displayName = `${contact.firstName || ''} ${contact.lastName || ''}${contact.organizationName ? ` ${contact.organizationName}` : ''}`.trim().toLowerCase()
      const matchesSearch = (
        displayName.includes(query) ||
        contact.email1?.toLowerCase().includes(query) ||
        contact.city?.toLowerCase().includes(query) ||
        contact.tags?.some(tag => tag.toLowerCase().includes(query))
      )
      if (!matchesSearch) return false
    }
    
    // Tag filter
    if (selectedTag !== 'all' && !contact.tags?.includes(selectedTag)) {
      return false
    }
    
    return true
  }).sort((a, b) => {
    let aValue: string = ''
    let bValue: string = ''

    switch (sortBy) {
      case 'name':
        aValue = `${a.firstName || ''} ${a.lastName || ''}${a.organizationName ? ` ${a.organizationName}` : ''}`.trim().toLowerCase()
        bValue = `${b.firstName || ''} ${b.lastName || ''}${b.organizationName ? ` ${b.organizationName}` : ''}`.trim().toLowerCase()
        break
      case 'email':
        aValue = a.email1 || ''
        bValue = b.email1 || ''
        break
      case 'city':
        aValue = a.city || ''
        bValue = b.city || ''
        break
      case 'state':
        aValue = a.state || ''
        bValue = b.state || ''
        break
    }

    const comparison = aValue.localeCompare(bValue)
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Calculate longest contact name for uniform column alignment
  const longestNameWidth = useMemo(() => {
    if (filteredContacts.length === 0) return 200 // Default width if no contacts
    const longestName = filteredContacts.reduce((longest, contact) => {
      const name = contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'
      return name.length > longest.length ? name : longest
    }, '')
    // Estimate: ~8px per character for 14px font + font-weight makes it wider
    // Avatar (48px) + gap (12px) + text width + padding (16px)
    const estimatedTextWidth = longestName.length * 8.5
    return Math.max(200, 48 + 12 + estimatedTextWidth + 16) // Minimum 200px, or calculated width
  }, [filteredContacts])

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
                ...headerTint(colors.primary)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isDark ? '#064e3b' : '#dcfce7',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Contact style={{ width: '24px', height: '24px', color: isDark ? '#ffffff' : colors.primary }} />
                </div>
                <div>
                  <h1 
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#ffffff', // White text on colored background
                      margin: '0 0 4px 0'
                    }}
                  >
                    Google Contacts
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Manage contacts from your Google account
                  </p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <Link 
                    href="/print-labels"
                    {...getButtonPressHandlers('print-labels-google')}
                    style={getButtonPressStyle(
                      'print-labels-google',
                      {
                        padding: '12px 24px',
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      },
                      'rgba(255, 255, 255, 0.15)',
                      'rgba(255, 255, 255, 0.25)'
                    )}
                  >
                    <Printer style={{ width: '16px', height: '16px' }} />
                    Print Labels
                  </Link>
                </div>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Stats Summary */}
          <div style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Total Contacts
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    {contacts.length}
                  </p>
                </div>
                <Contact style={{ width: '32px', height: '32px', color: colors.primary, opacity: 0.6 }} />
              </div>
            </div>
            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Filtered Results
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    {filteredContacts.length}
                  </p>
                </div>
                <Filter style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6 }} />
              </div>
            </div>
            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Connection Status
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: googleConnectionStatus === 'connected' ? colors.success : colors.error, margin: '0' }}>
                    {googleConnectionStatus === 'connected' ? 'Connected' : googleConnectionStatus === 'checking' ? 'Checking...' : 'Not Connected'}
                  </p>
                </div>
                {googleConnectionStatus === 'connected' ? (
                  <CheckCircle style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6 }} />
                ) : (
                  <AlertCircle style={{ width: '32px', height: '32px', color: colors.error, opacity: 0.6 }} />
                )}
              </div>
            </div>
          </div>

          {/* Search, Filters, and Sort */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ padding: '20px', ...card }}>
              {/* Search and Filters Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div style={{ position: 'relative', minWidth: '200px', maxWidth: '400px', width: '100%' }}>
                  <Search style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: colors.text.tertiary
                  }} />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary,
                      transition: 'border-color 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary
                      e.target.style.outline = 'none'
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.border
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: '0', marginLeft: 'auto' }}>
                  {uniqueTags.length > 0 && (
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      style={{
                        padding: '12px 16px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        backgroundColor: colors.card,
                        color: colors.text.primary,
                        cursor: 'pointer',
                        minWidth: '140px'
                      }}
                    >
                      <option value="all">All Tags</option>
                      {uniqueTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  )}
                  {(searchQuery || selectedTag !== 'all') && (
                    <button
                      {...getButtonPressHandlers('clearFilters')}
                      onClick={() => {
                        setSearchQuery('')
                        setSelectedTag('all')
                      }}
                      style={getButtonPressStyle('clearFilters', {
                        padding: '12px 16px',
                        backgroundColor: colors.cardHover,
                        ...text.secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }, colors.cardHover, colors.borderHover)}
                      onMouseEnter={(e) => {
                        if (!pressedButtons.has('clearFilters')) {
                          e.currentTarget.style.backgroundColor = colors.borderHover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!pressedButtons.has('clearFilters')) {
                          e.currentTarget.style.backgroundColor = colors.cardHover
                        }
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Sort Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowUpDown style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                  <label style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, whiteSpace: 'nowrap' }}>
                    Sort by:
                  </label>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: colors.card,
                    color: colors.text.primary,
                    cursor: 'pointer',
                    minWidth: '140px'
                  }}
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="city">City</option>
                  <option value="state">State</option>
                </select>
                <button
                  {...getButtonPressHandlers('sortOrder')}
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  style={getButtonPressStyle('sortOrder', {
                    padding: '8px 12px',
                    backgroundColor: colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }, colors.cardHover, colors.borderHover)}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has('sortOrder')) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has('sortOrder')) {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }
                  }}
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <ArrowUp style={{ width: '14px', height: '14px' }} />
                      Ascending
                    </>
                  ) : (
                    <>
                      <ArrowDown style={{ width: '14px', height: '14px' }} />
                      Descending
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sync Action */}
          <div 
            style={{
              padding: '24px',
              ...card,
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  ...text.primary,
                  margin: '0'
                }}
              >
                Sync from Google
              </h2>
              {lastSyncedAt && (
                <p style={{ fontSize: '12px', ...text.secondary, margin: 0 }}>
                  Last synced: {lastSyncedAt}
                </p>
              )}
            </div>
            
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
                  {...getButtonPressHandlers('import')}
                  onClick={handleImport}
                  disabled={isImporting || googleConnectionStatus !== 'connected'}
                  style={getButtonPressStyle('import', {
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
                    maxWidth: '200px'
                  }, (isImporting || googleConnectionStatus !== 'connected') ? colors.text.tertiary : colors.primary, '#558b2f')}
                  onMouseEnter={(e) => {
                    if (!isImporting && googleConnectionStatus === 'connected' && !pressedButtons.has('import')) {
                      e.currentTarget.style.backgroundColor = '#558b2f'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isImporting && googleConnectionStatus === 'connected' && !pressedButtons.has('import')) {
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
          {isLoadingContacts ? (
            <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
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
              <p style={{ ...text.secondary }}>Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
              <Contact style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                {contacts.length === 0 ? 'No contacts yet' : 'No contacts match your filters'}
              </h3>
              <p style={{ ...text.secondary, marginBottom: '24px' }}>
                {contacts.length === 0 
                  ? (googleConnectionStatus === 'connected' 
                      ? 'Click "Sync from Google" to import your contacts.'
                      : 'Connect your Google account and sync your contacts.')
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {googleConnectionStatus === 'connected' && contacts.length === 0 && (
                <button
                  {...getButtonPressHandlers('import-empty')}
                  onClick={handleImport}
                  style={getButtonPressStyle('import-empty', {
                    padding: '12px 24px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }, colors.primary, '#558b2f')}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has('import-empty')) {
                      e.currentTarget.style.backgroundColor = '#558b2f'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has('import-empty')) {
                      e.currentTarget.style.backgroundColor = colors.primary
                    }
                  }}
                >
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  Sync from Google
                </button>
              )}
            </div>
          ) : (
            <div style={{ ...card, overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  All Contacts ({filteredContacts.length})
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredContacts.map((contact, index) => (
                  <Link
                    key={contact.id}
                    href={`/google-contacts/${contact.id}`}
                    style={{
                      display: 'block',
                      padding: '20px 24px',
                      borderBottom: index < filteredContacts.length - 1 ? `1px solid ${colors.border}` : 'none',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: `${longestNameWidth}px 1fr auto`, gap: '24px', alignItems: 'center', width: '100%' }}>
                      {/* Column 1: Avatar and Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', minWidth: 0 }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: isDark ? '#065f46' : '#dcfce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <span style={{ fontSize: '20px', fontWeight: '700', color: colors.success }}>
                            {(() => {
                              if (contact.firstName) return contact.firstName[0].toUpperCase()
                              if (contact.lastName) return contact.lastName[0].toUpperCase()
                              if (contact.organizationName) return contact.organizationName[0].toUpperCase()
                              return '?'
                            })()}
                          </span>
                        </div>
                        <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '14px', margin: '0' }}>
                          {contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'}
                        </h3>
                      </div>
                      
                      {/* Column 2: Contact Info (Phone 1, Phone 2, Email) - Left justified */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', minWidth: '150px' }}>
                        {contact.phoneNumber1 && (
                          <span style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                            {formatPhoneNumber(contact.phoneNumber1)}
                          </span>
                        )}
                        {contact.phoneNumber2 && (
                          <span style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                            {formatPhoneNumber(contact.phoneNumber2)}
                          </span>
                        )}
                        {contact.email1 && (
                          <span style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            {contact.email1}
                          </span>
                        )}
                      </div>
                      
                      {/* Column 3: Tags/Chips - Right justified */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'flex-end', flexShrink: 0 }}>
                          {contact.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
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
                          {contact.tags.length > 3 && (
                            <span
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                backgroundColor: colors.cardHover,
                                ...text.secondary,
                                borderRadius: '9999px',
                                fontWeight: '600'
                              }}
                            >
                              +{contact.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
                {...getButtonPressHandlers('closeImport')}
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
                style={getButtonPressStyle('closeImport', {
                  padding: '10px 16px',
                  backgroundColor: colors.cardHover,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  ...text.secondary,
                  cursor: isImporting ? 'not-allowed' : 'pointer'
                }, colors.cardHover, colors.borderHover)}
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
          <div style={{ ...card, padding: '24px', maxWidth: '700px', width: '92%', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, ...text.primary, margin: 0 }}>Contact Details</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    setShowContactModal(false)
                    // TODO: Navigate to edit page or open edit modal
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                  }}
                >
                  <Edit style={{ width: '16px', height: '16px' }} />
                  Edit
                </button>
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
            </div>

            {/* Name */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#065f46' : '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: '28px', fontWeight: '700', color: colors.success }}>
                    {(() => {
                      if (selectedContact.firstName) return selectedContact.firstName[0].toUpperCase()
                      if (selectedContact.lastName) return selectedContact.lastName[0].toUpperCase()
                      if (selectedContact.organizationName) return selectedContact.organizationName[0].toUpperCase()
                      return '?'
                    })()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, ...text.primary, margin: '0 0 8px 0' }}>
                    {selectedContact.organizationName || `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim() || 'Unnamed Contact'}
                  </h3>
                  {selectedContact.organizationName && (selectedContact.firstName || selectedContact.lastName) && (
                    <p style={{ fontSize: '14px', ...text.secondary, margin: '0' }}>{selectedContact.organizationName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {selectedContact.tags && selectedContact.tags.length > 0 && (
              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tags</h4>
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
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Information</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedContact.email1 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Mail style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Email</div>
                      <a href={`mailto:${selectedContact.email1}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.email1}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.email2 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Mail style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Email 2</div>
                      <a href={`mailto:${selectedContact.email2}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {selectedContact.email2}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.phoneNumber1 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }}>📞</div>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Phone</div>
                      <a href={`tel:${selectedContact.phoneNumber1}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {formatPhoneNumber(selectedContact.phoneNumber1)}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.phoneNumber2 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }}>📞</div>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Phone 2</div>
                      <a href={`tel:${selectedContact.phoneNumber2}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {formatPhoneNumber(selectedContact.phoneNumber2)}
                      </a>
                    </div>
                  </div>
                )}
                {selectedContact.phoneNumber3 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }}>📞</div>
                    <div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginBottom: '2px' }}>Phone 3</div>
                      <a href={`tel:${selectedContact.phoneNumber3}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {formatPhoneNumber(selectedContact.phoneNumber3)}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            {(selectedContact.mailingAddress || selectedContact.city || selectedContact.state) && (
              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mailing Address</h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <MapPin style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }} />
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
              <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site Address</h4>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <MapPin style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }} />
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
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</h4>
              {(() => {
                if (selectedContact.notes && selectedContact.notes.trim()) {
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
                        minHeight: '60px'
                      }}
                      dangerouslySetInnerHTML={{ __html: String(selectedContact.notes) }}
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
                      minHeight: '60px'
                    }}
                  >
                    <span style={{ fontStyle: 'italic', color: colors.text.tertiary }}>
                      No notes added yet. Click Edit to add notes for this contact.
                    </span>
                  </div>
                )
              })()}
            </div>

            {/* Additional Phone Numbers */}
            {(selectedContact.phoneNumber4 || selectedContact.phoneNumber5 || selectedContact.phoneNumber6) && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, ...text.secondary, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Phones</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedContact.phoneNumber4 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }}>📞</div>
                      <a href={`tel:${selectedContact.phoneNumber4}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {formatPhoneNumber(selectedContact.phoneNumber4)}
                      </a>
                    </div>
                  )}
                  {selectedContact.phoneNumber5 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }}>📞</div>
                      <a href={`tel:${selectedContact.phoneNumber5}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {formatPhoneNumber(selectedContact.phoneNumber5)}
                      </a>
                    </div>
                  )}
                  {selectedContact.phoneNumber6 && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ width: '18px', height: '18px', color: colors.text.tertiary, marginTop: '2px', flexShrink: 0 }}>📞</div>
                      <a href={`tel:${selectedContact.phoneNumber6}`} style={{ fontSize: '14px', color: colors.primary, textDecoration: 'none' }}>
                        {formatPhoneNumber(selectedContact.phoneNumber6)}
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
