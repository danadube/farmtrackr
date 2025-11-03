'use client'

import { useState, useEffect } from 'react'
import { FarmContact } from '@/types'
import { 
  Users, 
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Building2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { ContactBadge } from '@/components/ContactBadge'
import { normalizeFarmName } from '@/lib/farmNames'
import { useButtonPress } from '@/hooks/useButtonPress'

export default function ContactsPage() {
  const { colors, isDark, card, headerCard, headerDivider, background, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [contacts, setContacts] = useState<FarmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFarm, setSelectedFarm] = useState<string>('all')
  const [selectedState, setSelectedState] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'firstName' | 'lastName' | 'city' | 'farm' | 'state' | 'dateCreated'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch('/api/contacts')
        if (response.ok) {
          const data = await response.json()
          // Convert date strings back to Date objects
          const contactsWithDates = data.map((contact: any) => ({
            ...contact,
            dateCreated: new Date(contact.dateCreated),
            dateModified: new Date(contact.dateModified),
          }))
          setContacts(contactsWithDates)
        }
      } catch (error) {
        console.error('Error fetching contacts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContacts()
  }, [])

  // Get unique farms and states for filters
  const uniqueFarms = Array.from(new Set(contacts.map(c => c.farm ? normalizeFarmName(c.farm) : c.farm).filter(Boolean))).sort()
  const uniqueStates = Array.from(new Set(contacts.map(c => c.state).filter(Boolean))).sort()

  const filteredContacts = contacts.filter(contact => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const displayName = (contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim()).toLowerCase()
      const matchesSearch = (
        displayName.includes(query) ||
        contact.farm?.toLowerCase().includes(query) ||
        contact.email1?.toLowerCase().includes(query) ||
        contact.city?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }
    
    // Farm filter
    if (selectedFarm !== 'all' && contact.farm !== selectedFarm) {
      return false
    }
    
    // State filter
    if (selectedState !== 'all' && contact.state !== selectedState) {
      return false
    }
    
    return true
  }).sort((a, b) => {
    let aValue: string | number | Date | undefined
    let bValue: string | number | Date | undefined

    switch (sortBy) {
      case 'name': {
        const aName = (a.organizationName || `${a.lastName || ''}, ${a.firstName || ''}`.trim()).toLowerCase()
        const bName = (b.organizationName || `${b.lastName || ''}, ${b.firstName || ''}`.trim()).toLowerCase()
        aValue = aName
        bValue = bName
        break
      }
      case 'firstName':
        aValue = a.firstName || ''
        bValue = b.firstName || ''
        break
      case 'lastName':
        aValue = a.lastName || ''
        bValue = b.lastName || ''
        break
      case 'city':
        aValue = a.city || ''
        bValue = b.city || ''
        break
      case 'farm':
        aValue = a.farm || ''
        bValue = b.farm || ''
        break
      case 'state':
        aValue = a.state || ''
        bValue = b.state || ''
        break
      case 'dateCreated':
        aValue = a.dateCreated instanceof Date ? a.dateCreated.getTime() : new Date(a.dateCreated).getTime()
        bValue = b.dateCreated instanceof Date ? b.dateCreated.getTime() : new Date(b.dateCreated).getTime()
        break
      default:
        return 0
    }

    // Handle string comparisons
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sortOrder === 'asc' ? comparison : -comparison
    }

    // Handle number/date comparisons
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })

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
            <p style={{ ...text.secondary }}>Loading contacts...</p>
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
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ padding: '24px', ...headerCard }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Users style={{ width: '24px', height: '24px', color: colors.primary }} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0 0 4px 0' }}>
                      Farm Contacts
                    </h1>
                    <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                      Manage your farm contacts
                    </p>
                  </div>
                </div>
                <Link 
                  href="/contacts/new" 
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    textDecoration: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Add Contact
                </Link>
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
                <Users style={{ width: '32px', height: '32px', color: colors.primary, opacity: 0.6 }} />
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
                    Unique Farms
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    {uniqueFarms.length}
                  </p>
                </div>
                <Building2 style={{ width: '32px', height: '32px', color: colors.warning, opacity: 0.6 }} />
              </div>
            </div>
          </div>

          {/* Combined Search, Filters, and Sort */}
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
                  {uniqueFarms.length > 0 && (
                    <select
                      value={selectedFarm}
                      onChange={(e) => setSelectedFarm(e.target.value)}
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
                      <option value="all">All Farms</option>
                      {uniqueFarms.map(farm => (
                        <option key={farm} value={farm}>{farm}</option>
                      ))}
                    </select>
                  )}
                  {uniqueStates.length > 0 && (
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      style={{
                        padding: '12px 16px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '10px',
                        fontSize: '14px',
                        backgroundColor: colors.card,
                        color: colors.text.primary,
                        cursor: 'pointer',
                        minWidth: '120px'
                      }}
                    >
                      <option value="all">All States</option>
                      {uniqueStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  )}
                  {(selectedFarm !== 'all' || selectedState !== 'all') && (
                    <button
                      {...getButtonPressHandlers('clearFilters')}
                      onClick={() => {
                        setSelectedFarm('all')
                        setSelectedState('all')
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
                  <option value="lastName">Last Name</option>
                  <option value="firstName">First Name</option>
                  <option value="city">City</option>
                  <option value="farm">Farm</option>
                  <option value="state">State</option>
                  <option value="dateCreated">Date Created</option>
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

          {/* Contacts List */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                All Contacts ({filteredContacts.length})
              </h2>
            </div>
            
            {filteredContacts.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <Users style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                  No contacts found
                </h3>
                <p style={{ ...text.secondary, marginBottom: '24px' }}>
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first farm contact.'}
                </p>
                {!searchQuery && (
                  <Link 
                    href="/contacts/new" 
                    style={{
                      padding: '12px 24px',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primaryHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary
                    }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    Add First Contact
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredContacts.map((contact, index) => (
                  <Link 
                    key={contact.id} 
                    href={`/contacts/${contact.id}`} 
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <ContactBadge contact={contact} size="md" shape="circle" />
                      <div style={{ flex: '1' }}>
                        <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '14px', margin: '0 0 4px 0' }}>
                          {contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim()}
                        </h3>
                        <p style={{ fontSize: '13px', ...text.secondary, margin: '0 0 2px 0' }}>
                          {contact.farm ? normalizeFarmName(contact.farm) : ''}
                        </p>
                        {contact.email1 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            {contact.email1}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                          {contact.dateCreated.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <button 
                        style={{
                          padding: '8px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
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
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <MoreHorizontal style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}