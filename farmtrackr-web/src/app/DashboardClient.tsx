'use client'

import { useState, useEffect } from 'react'
import { FarmContact, Stats } from '@/types'
import { 
  Users, 
  Building2, 
  FileText, 
  Upload, 
  Printer, 
  Plus,
  Calendar,
  TrendingUp,
  Home,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { ContactBadge } from '@/components/ContactBadge'
import { normalizeFarmName } from '@/lib/farmNames'
import { getFarmColor } from '@/lib/farmColors'

interface DashboardClientProps {
  contacts: FarmContact[];
  stats: Stats;
}

export default function DashboardClient({ contacts, stats }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  const { colors, isDark, card, headerCard, headerDivider, background, text, spacing } = useThemeStyles()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const recentContactsList = contacts
    .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
    .slice(0, 4)

  const activeFarms = Array.from(
    new Set(
      contacts
        .map(c => c.farm ? normalizeFarmName(c.farm) : '')
        .filter(Boolean)
    )
  ).sort()

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
            paddingLeft: spacing(6),
            paddingRight: spacing(6),
            paddingTop: spacing(4),
            paddingBottom: spacing(4)
          }}
        >
          {/* Hero Section */}
          <div style={{ marginBottom: spacing(6) }}>
            <div 
              style={{
                padding: spacing(3),
                ...headerCard
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing(3) }}>
                <div 
                  style={{
                    width: spacing(8),
                    height: spacing(8),
                    backgroundColor: colors.iconBg,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Home style={{ width: spacing(3.5), height: spacing(3.5), color: colors.primary }} />
                </div>
                <div>
                  <h1 
                    style={{
                      fontSize: '36px',
                      fontWeight: '700',
                      ...text.primary,
                      lineHeight: '40px',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}
                  >
                    Welcome back
                  </h1>
                  <p style={{ ...text.secondary, fontSize: '16px', lineHeight: '24px', margin: '0' }}>
                    Manage your farm contacts and operations efficiently
                  </p>
                </div>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: spacing(4) }}>
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: '600',
                ...text.primary,
                lineHeight: '32px',
                marginBottom: spacing(1.5),
                margin: `0 0 ${spacing(1.5)} 0`
              }}
            >
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: spacing(2) }}>
              {/* Add Contact */}
              <Link 
                href="/contacts/new" 
                style={{
                  display: 'block',
                  padding: spacing(2),
                  ...card,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = card.boxShadow
                  e.currentTarget.style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: spacing(1.5) }}>
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus style={{ width: spacing(3), height: spacing(3), color: colors.primary }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px', ...text.primary, fontSize: '14px', margin: '0 0 4px 0' }}>
                      Add Contact
                    </h3>
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                      Create a new farm contact
                    </p>
                  </div>
                </div>
              </Link>

              {/* Import & Export */}
              <Link 
                href="/import-export" 
                style={{
                  display: 'block',
                  padding: '16px',
                  ...card,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = card.boxShadow
                  e.currentTarget.style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Upload style={{ width: '24px', height: '24px', color: colors.success }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px', ...text.primary, fontSize: '14px', margin: '0 0 4px 0' }}>
                      Import & Export
                    </h3>
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                      Manage data files
                    </p>
                  </div>
                </div>
              </Link>

              {/* Print Labels */}
              <Link 
                href="/print-labels" 
                style={{
                  display: 'block',
                  padding: '16px',
                  ...card,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = card.boxShadow
                  e.currentTarget.style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#4c1d95' : '#f3e8ff',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Printer style={{ width: '24px', height: '24px', color: colors.accent }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px', ...text.primary, fontSize: '14px', margin: '0 0 4px 0' }}>
                      Print Labels
                    </h3>
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                      Print address labels
                    </p>
                  </div>
                </div>
              </Link>

              {/* Documents */}
              <Link 
                href="/documents" 
                style={{
                  display: 'block',
                  padding: '16px',
                  ...card,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  e.currentTarget.style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = card.boxShadow
                  e.currentTarget.style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#7c2d12' : '#fff7ed',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText style={{ width: '24px', height: '24px', color: colors.warning }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', marginBottom: '4px', ...text.primary, fontSize: '14px', margin: '0 0 4px 0' }}>
                      Documents
                    </h3>
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                      Manage documents
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div style={{ marginBottom: '32px' }}>
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: '600',
                ...text.primary,
                lineHeight: '32px',
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}
            >
              Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <Link 
                href="/contacts"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '24px',
                  ...card,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                }}
              >
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
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Total Contacts
                    </p>
                    <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {stats.totalContacts}
                    </p>
                  </div>
                </div>
              </Link>

              <Link 
                href="/google-sheets"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '24px',
                  ...card,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Building2 style={{ width: '24px', height: '24px', color: colors.success }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Active Farms
                    </p>
                    <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {activeFarms.length}
                    </p>
                    {activeFarms.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {activeFarms.map((farm) => {
                          const c = getFarmColor(farm)
                          return (
                          <span
                            key={farm}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: c.bg,
                              border: `1px solid ${c.border}`,
                              fontSize: '11px',
                              color: c.text,
                              fontWeight: 600,
                            }}
                          >
                            {farm}
                          </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Contacts */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  ...text.primary,
                  lineHeight: '32px',
                  margin: '0'
                }}
              >
                Recent Contacts
              </h2>
              <Link 
                href="/contacts" 
                style={{
                  padding: '8px 16px',
                  backgroundColor: isDark ? colors.cardHover : colors.cardHover,
                  ...text.secondary,
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.borderHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.cardHover
                }}
              >
                View All
              </Link>
            </div>
            
            <div 
              style={{
                padding: '24px',
                ...card
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentContactsList.map((contact) => (
                  <Link 
                    key={contact.id} 
                    href={`/contacts/${contact.id}`} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      borderRadius: '12px',
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
                    <ContactBadge contact={contact} size="md" shape="circle" />
                    <div style={{ flex: '1' }}>
                      <h3 style={{ fontWeight: '500', ...text.primary, fontSize: '14px', margin: '0 0 4px 0' }}>
                        {contact.organizationName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim()}
                      </h3>
                      <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                        {contact.farm ? normalizeFarmName(contact.farm) : ''}
                      </p>
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
                    <ArrowRight style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}