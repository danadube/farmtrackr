'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  Plus,
} from 'lucide-react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'

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

function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return ''

  const cleaned = phone.replace(/\D/g, '')

  if (phone.startsWith('+1') && cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  if (phone.startsWith('+') && (cleaned.length > 11 || !phone.startsWith('+1'))) {
    return phone.trim()
  }

  return phone
}

export function GoogleContactsView({ viewSwitcher }: { viewSwitcher?: ReactNode }) {
  const { colors, isDark, card, headerTint, headerDivider, background, text } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle, pressedButtons } = useButtonPress()
  const secondaryColor = (text.secondary as { color?: string }).color ?? colors.text.secondary

  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })
  const [showImportModal, setShowImportModal] = useState(false)
  const [totalContacts, setTotalContacts] = useState<number>(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('')
  const [googleConnectionStatus, setGoogleConnectionStatus] = useState<'connected' | 'not-connected' | 'checking'>(
    'checking'
  )
  const [contacts, setContacts] = useState<GeneralContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [selectedContact, setSelectedContact] = useState<GeneralContact | null>(null)
  const [showContactModal, setShowContactModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'city' | 'state'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
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

    checkConnection()
    loadStats()
    loadContacts()
  }, [])

  const uniqueTags = useMemo(() => Array.from(new Set(contacts.flatMap((c) => c.tags || []))).sort(), [contacts])

  const filteredContacts = contacts
    .filter((contact) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const displayName = `${contact.firstName || ''} ${contact.lastName || ''}${contact.organizationName ? ` ${contact.organizationName}` : ''}`
          .trim()
          .toLowerCase()
        const matchesSearch =
          displayName.includes(query) ||
          contact.email1?.toLowerCase().includes(query) ||
          contact.city?.toLowerCase().includes(query) ||
          contact.tags?.some((tag) => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      if (selectedTag !== 'all' && !contact.tags?.includes(selectedTag)) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      let aValue = ''
      let bValue = ''

      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}${a.organizationName ? ` ${a.organizationName}` : ''}`
            .trim()
            .toLowerCase()
          bValue = `${b.firstName || ''} ${b.lastName || ''}${b.organizationName ? ` ${b.organizationName}` : ''}`
            .trim()
            .toLowerCase()
          break
        case 'email':
          aValue = (a.email1 || '').toLowerCase()
          bValue = (b.email1 || '').toLowerCase()
          break
        case 'city':
          aValue = (a.city || '').toLowerCase()
          bValue = (b.city || '').toLowerCase()
          break
        case 'state':
          aValue = (a.state || '').toLowerCase()
          bValue = (b.state || '').toLowerCase()
          break
      }

      const comparison = aValue.localeCompare(bValue)
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleImport = async () => {
    if (googleConnectionStatus !== 'connected') {
      setImportStatus({
        type: 'error',
        message: 'Please connect your Google account in Settings > Google Integration first',
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
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (response.ok) {
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${result.imported || 0} contacts, updated ${result.updated || 0}, skipped ${result.skipped || 0}`,
        })
        try {
          const [statsRes, contactsRes] = await Promise.all([
            fetch('/api/google-contacts/stats'),
            fetch('/api/google-contacts'),
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
          message: result.message || result.error || 'Import failed',
        })
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Failed to connect to Google Contacts' })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        ...background,
      }}
    >
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
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '48px',
          paddingRight: '48px',
          paddingTop: '32px',
          paddingBottom: '32px',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <div style={{ padding: '24px', ...headerTint(colors.primary) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: isDark ? '#064e3b' : '#dcfce7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Contact style={{ width: '24px', height: '24px', color: isDark ? '#ffffff' : colors.primary }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <h1
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#ffffff',
                      margin: '0 0 4px 0',
                    }}
                  >
                    Google Contacts
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Manage contacts synced from your Google account
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Link
                    href="/contacts/new?type=general"
                    {...getButtonPressHandlers('add-google-contact')}
                    style={getButtonPressStyle(
                      'add-google-contact',
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
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      },
                      'rgba(255, 255, 255, 0.15)',
                      'rgba(255, 255, 255, 0.25)'
                    )}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Add Contact
                  </Link>
                  <button
                    type="button"
                    {...getButtonPressHandlers('import-google-contacts')}
                    onClick={handleImport}
                    style={getButtonPressStyle(
                      'import-google-contacts',
                      {
                        padding: '12px 24px',
                        backgroundColor: colors.primary,
                        color: '#ffffff',
                        borderRadius: '10px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      },
                      colors.primary,
                      colors.primaryHover
                    )}
                  >
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    Sync Now
                  </button>
                </div>
              </div>
            </div>
            <div style={headerDivider} />
          </div>
        </div>

        {viewSwitcher && (
          <div style={{ marginBottom: '24px' }}>{viewSwitcher}</div>
        )}

        <div
          style={{
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div style={{ padding: '20px', ...card }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                  Total Contacts
                </p>
                <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>{contacts.length}</p>
              </div>
              <Contact style={{ width: '32px', height: '32px', color: colors.primary, opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ padding: '20px', ...card }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                  Last Synced
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  {lastSyncedAt || 'Not synced yet'}
                </p>
              </div>
              <RefreshCw style={{ width: '24px', height: '24px', color: colors.info, opacity: 0.6 }} />
            </div>
          </div>
          <div style={{ padding: '20px', ...card }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                  Connection
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  {googleConnectionStatus === 'connected'
                    ? 'Connected'
                    : googleConnectionStatus === 'checking'
                    ? 'Checking...'
                    : 'Not connected'}
                </p>
              </div>
              {googleConnectionStatus === 'connected' ? (
                <CheckCircle style={{ width: '24px', height: '24px', color: colors.success }} />
              ) : (
                <AlertCircle style={{ width: '24px', height: '24px', color: colors.error }} />
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ padding: '20px', ...card }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '16px',
              }}
            >
              <div style={{ position: 'relative', minWidth: '200px', maxWidth: '400px', width: '100%' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: colors.text.tertiary,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search Google contacts..."
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
                    transition: 'border-color 0.2s ease',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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
                    minWidth: '140px',
                  }}
                >
                  <option value="all">All Tags</option>
                  {uniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                {(searchQuery || selectedTag !== 'all') && (
                  <button
                    type="button"
                    {...getButtonPressHandlers('clear-google-filters')}
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedTag('all')
                    }}
                    style={getButtonPressStyle(
                      'clear-google-filters',
                      {
                        padding: '12px 16px',
                        backgroundColor: colors.cardHover,
                        ...text.secondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      },
                      colors.cardHover,
                      colors.borderHover
                    )}
                    onMouseEnter={(e) => {
                      if (!pressedButtons.has('clear-google-filters')) {
                        e.currentTarget.style.backgroundColor = colors.borderHover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!pressedButtons.has('clear-google-filters')) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
                      }
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                paddingTop: '16px',
                borderTop: `1px solid ${colors.border}`,
              }}
            >
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
                  minWidth: '140px',
                }}
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="city">City</option>
                <option value="state">State</option>
              </select>
              <button
                type="button"
                {...getButtonPressHandlers('google-sort-order')}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={getButtonPressStyle(
                  'google-sort-order',
                  {
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
                    whiteSpace: 'nowrap',
                  },
                  colors.cardHover,
                  colors.borderHover
                )}
                onMouseEnter={(e) => {
                  if (!pressedButtons.has('google-sort-order')) {
                    e.currentTarget.style.backgroundColor = colors.borderHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pressedButtons.has('google-sort-order')) {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }
                }}
              >
                {sortOrder === 'asc' ? (
                  <>
                    <ArrowUp style={{ width: '14px', height: '14px' }} /> Ascending
                  </>
                ) : (
                  <>
                    <ArrowDown style={{ width: '14px', height: '14px' }} /> Descending
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
              Google Contacts ({filteredContacts.length})
            </h2>
          </div>

          {isLoadingContacts ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <RefreshCw style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
              <p style={{ ...text.secondary }}>Loading Google contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <Contact style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                No contacts found
              </h3>
              <p style={{ ...text.secondary, marginBottom: '24px' }}>
                {searchQuery || selectedTag !== 'all'
                  ? 'Try adjusting your filters or search query.'
                  : 'Import contacts from Google to manage them here.'}
              </p>
              <button
                type="button"
                {...getButtonPressHandlers('import-google-contacts-empty')}
                onClick={handleImport}
                style={getButtonPressStyle(
                  'import-google-contacts-empty',
                  {
                    padding: '12px 24px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  },
                  colors.primary,
                  colors.primaryHover
                )}
              >
                <RefreshCw style={{ width: '16px', height: '16px' }} />
                Sync Google Contacts
              </button>
            </div>
          ) : (
            <div>
              {filteredContacts.map((contact) => {
                const displayName =
                  contact.organizationName ||
                  `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
                  'Unnamed Contact'

                return (
                  <div
                    key={contact.id}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      padding: '20px 24px',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.2fr) minmax(0, 0.9fr)',
                        gap: '24px',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: colors.iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '16px',
                            color: colors.primary,
                            flexShrink: 0,
                          }}
                        >
                          {displayName.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, ...text.primary, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {displayName}
                          </h3>
                          {(contact.organizationName && contact.organizationName !== displayName) && (
                            <p style={{ fontSize: '12px', ...text.tertiary, margin: 0 }}>{contact.organizationName}</p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', ...text.secondary }}>
                        {contact.email1 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Mail style={{ width: '14px', height: '14px', color: colors.primary }} />
                            {contact.email1}
                          </span>
                        )}
                        {contact.phoneNumber1 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <PhoneIcon style={{ width: '14px', height: '14px', color: colors.success }} />
                            {formatPhoneNumber(contact.phoneNumber1)}
                          </span>
                        )}
                        {(contact.city || contact.state) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin style={{ width: '14px', height: '14px', color: colors.info }} />
                            {contact.city}
                            {contact.state ? `, ${contact.state}` : ''}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {contact.tags && contact.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end' }}>
                            {contact.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : colors.primaryLight,
                                  color: isDark ? '#ffffff' : colors.primary,
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.03em',
                                  border: isDark ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${colors.primary}`,
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
                                  borderRadius: '999px',
                                  fontWeight: '600',
                                }}
                              >
                                +{contact.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          {...getButtonPressHandlers(`view-google-${contact.id}`)}
                          onClick={() => {
                            setSelectedContact(contact)
                            setShowContactModal(true)
                          }}
                          style={getButtonPressStyle(
                            `view-google-${contact.id}`,
                            {
                              padding: '10px 16px',
                              backgroundColor: colors.cardHover,
                              color: secondaryColor,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                            },
                            colors.cardHover,
                            colors.borderHover
                          )}
                        >
                          <Edit style={{ width: '14px', height: '14px' }} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1200,
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: colors.card,
              borderRadius: '18px',
              padding: '24px',
              position: 'relative',
              border: `1px solid ${colors.border}`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              {...getButtonPressHandlers('close-import-modal')}
              onClick={() => setShowImportModal(false)}
              style={getButtonPressStyle(
                'close-import-modal',
                {
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                },
                'transparent',
                colors.cardHover
              )}
            >
              <X style={{ width: '18px', height: '18px', color: colors.text.tertiary }} />
            </button>
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              {isImporting ? (
                <>
                  <RefreshCw style={{ width: '40px', height: '40px', color: colors.primary, marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, ...text.primary, marginBottom: '8px' }}>
                    Syncing Google Contacts
                  </h3>
                  <p style={{ ...text.secondary }}>
                    Please wait while we import and update your Google contacts.
                  </p>
                </>
              ) : importStatus.type === 'success' ? (
                <>
                  <CheckCircle style={{ width: '40px', height: '40px', color: colors.success, marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, ...text.primary, marginBottom: '8px' }}>
                    Sync Complete
                  </h3>
                  <p style={{ ...text.secondary }}>{importStatus.message}</p>
                </>
              ) : importStatus.type === 'error' ? (
                <>
                  <AlertCircle style={{ width: '40px', height: '40px', color: colors.error, marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 600, ...text.primary, marginBottom: '8px' }}>
                    Sync Failed
                  </h3>
                  <p style={{ ...text.secondary }}>{importStatus.message}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showContactModal && selectedContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 1200,
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: colors.card,
              borderRadius: '18px',
              padding: '24px',
              border: `1px solid ${colors.border}`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, ...text.primary, margin: 0 }}>Contact Details</h3>
              <button
                type="button"
                {...getButtonPressHandlers('close-contact-modal')}
                onClick={() => setShowContactModal(false)}
                style={getButtonPressStyle(
                  'close-contact-modal',
                  {
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                  },
                  'transparent',
                  colors.cardHover
                )}
              >
                <X style={{ width: '18px', height: '18px', color: colors.text.tertiary }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, ...text.tertiary, marginBottom: '4px' }}>
                  Name
                </p>
                <p style={{ fontSize: '14px', ...text.primary }}>
                  {selectedContact.organizationName ||
                    `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim() ||
                    'Unnamed Contact'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, ...text.tertiary, marginBottom: '4px' }}>
                  Email
                </p>
                <p style={{ fontSize: '14px', ...text.primary }}>{selectedContact.email1 || '—'}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, ...text.tertiary, marginBottom: '4px' }}>
                  Phone
                </p>
                <p style={{ fontSize: '14px', ...text.primary }}>
                  {formatPhoneNumber(selectedContact.phoneNumber1) || '—'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, ...text.tertiary, marginBottom: '4px' }}>
                  Location
                </p>
                <p style={{ fontSize: '14px', ...text.primary }}>
                  {selectedContact.city || selectedContact.state
                    ? `${selectedContact.city || ''}${selectedContact.state ? `, ${selectedContact.state}` : ''}`
                    : '—'}
                </p>
              </div>
            </div>
            {selectedContact.tags && selectedContact.tags.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, ...text.tertiary, marginBottom: '8px' }}>
                  Tags
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedContact.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        backgroundColor: colors.primaryLight,
                        color: colors.primary,
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedContact.notes && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, ...text.tertiary, marginBottom: '8px' }}>
                  Notes
                </p>
                <div
                  className="rendered-note"
                  style={{
                    backgroundColor: colors.cardHover,
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    ...text.primary,
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedContact.notes || '' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .65 2.57 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.51-1.12a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.57.65A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
