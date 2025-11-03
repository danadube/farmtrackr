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
  DollarSign,
  Briefcase,
  Settings,
  Contact,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react'
import Link from 'next/link'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { normalizeFarmName } from '@/lib/farmNames'
import { getFarmColor } from '@/lib/farmColors'
import { validateAllContacts } from '@/lib/dataQuality'

interface DashboardClientProps {
  contacts: FarmContact[];
  stats: Stats;
}

export default function DashboardClient({ contacts, stats }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  const { colors, isDark, card, headerCard, headerDivider, background, text, spacing } = useThemeStyles()
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set())

  // Validation issue counts (subtract dismissed) – must be declared before any early returns
  const [issuesCount, setIssuesCount] = useState(0)
  const [errorsCount, setErrorsCount] = useState(0)
  const [warningsCount, setWarningsCount] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const computeCounts = () => {
    const allIssues = validateAllContacts(contacts)
    let dismissed = new Set<string>()
    try {
      const raw = localStorage.getItem('dq.dismissedIssues')
      if (raw) dismissed = new Set<string>(JSON.parse(raw))
    } catch {}
    const visible = allIssues.filter(i => !dismissed.has(i.id))
    setIssuesCount(visible.length)
    setErrorsCount(visible.filter(i => i.severity === 'error').length)
    setWarningsCount(visible.filter(i => i.severity === 'warning').length)
  }

  useEffect(() => {
    if (!mounted) return
    computeCounts()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dq.dismissedIssues') computeCounts()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') computeCounts()
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [mounted, contacts])

  if (!mounted) {
    return null
  }

  // Button press handlers for visual feedback
  const getButtonPressHandlers = (buttonId: string) => ({
    onMouseDown: () => setPressedButtons(prev => new Set(prev).add(buttonId)),
    onMouseUp: () => setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(buttonId)
      return next
    }),
    onMouseLeave: () => setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(buttonId)
      return next
    })
  })

  const getButtonPressStyle = (buttonId: string, baseStyle: React.CSSProperties, baseBg: string, hoverBg?: string) => ({
    ...baseStyle,
    backgroundColor: pressedButtons.has(buttonId) ? (hoverBg || baseBg) : baseBg,
    transform: pressedButtons.has(buttonId) ? 'scale(0.97)' : 'scale(1)',
    boxShadow: pressedButtons.has(buttonId) ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : baseStyle.boxShadow || 'none',
    transition: 'all 0.1s ease'
  })

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing(2) }}>
              {/* Quick Action Component Helper */}
              {([
                { id: 'addContact', href: '/contacts/new', icon: Plus, title: 'Add Contact', desc: 'Create a new farm contact', bgColor: colors.iconBg, iconColor: colors.primary },
                { id: 'newTransaction', href: '/commissions/new', icon: DollarSign, title: 'New Transaction', desc: 'Add a commission transaction', bgColor: isDark ? '#064e3b' : '#f0fdf4', iconColor: colors.success },
                { id: 'viewCommissions', href: '/commissions', icon: Briefcase, title: 'View Commissions', desc: 'Manage transactions', bgColor: isDark ? '#1e3a8a' : '#eff6ff', iconColor: colors.info || colors.primary },
                { id: 'importExport', href: '/import-export', icon: Upload, title: 'Import & Export', desc: 'Manage data files', bgColor: isDark ? '#064e3b' : '#f0fdf4', iconColor: colors.success },
                { id: 'printLabels', href: '/print-labels', icon: Printer, title: 'Print Labels', desc: 'Print address labels', bgColor: isDark ? '#4c1d95' : '#f3e8ff', iconColor: colors.accent },
                { id: 'documents', href: '/documents', icon: FileText, title: 'Documents', desc: 'Manage documents', bgColor: isDark ? '#7c2d12' : '#fff7ed', iconColor: colors.warning },
                { id: 'dataQuality', href: '/data-quality', icon: CheckCircle2, title: 'Data Quality', desc: 'Validation issues', bgColor: isDark ? '#7f1d1d' : '#fef2f2', iconColor: issuesCount > 0 ? colors.error : colors.success },
                { id: 'googleContacts', href: '/google-contacts', icon: Contact, title: 'Google Contacts', desc: 'Sync contacts', bgColor: isDark ? '#1e3a8a' : '#eff6ff', iconColor: colors.info || colors.primary },
                { id: 'googleSheets', href: '/google-sheets', icon: FileSpreadsheet, title: 'Google Sheets', desc: 'Sync spreadsheets', bgColor: isDark ? '#064e3b' : '#f0fdf4', iconColor: colors.success },
                { id: 'settings', href: '/settings', icon: Settings, title: 'Settings', desc: 'Preferences', bgColor: colors.iconBg, iconColor: colors.text.secondary }
              ] as const).map(({ id, href, icon: Icon, title, desc, bgColor, iconColor }) => (
                <Link
                  key={id}
                  href={href}
                  {...getButtonPressHandlers(id)}
                  style={getButtonPressStyle(id, {
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(2),
                    padding: spacing(2.5),
                    ...card,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }, card.backgroundColor || 'transparent', colors.cardHover)}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has(id)) {
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      e.currentTarget.style.borderColor = colors.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has(id)) {
                      e.currentTarget.style.boxShadow = card.boxShadow
                      e.currentTarget.style.borderColor = colors.border
                    }
                  }}
                >
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      minWidth: spacing(6),
                      backgroundColor: bgColor,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon style={{ width: spacing(3), height: spacing(3), color: iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontWeight: '600', 
                      ...text.primary, 
                      fontSize: '14px', 
                      margin: '0 0 4px 0',
                      textAlign: 'left'
                    }}>
                      {title}
                    </h3>
                    <p style={{ 
                      fontSize: '12px', 
                      ...text.secondary, 
                      margin: '0',
                      textAlign: 'left'
                    }}>
                      {desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Statistics */}
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
              Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'stretch' }}>
              <Link 
                href="/contacts"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '24px',
                  ...card,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  height: '100%'
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
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  height: '100%'
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

              {/* Validation Issues Card */}
              <Link 
                href="/data-quality"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '24px',
                  ...card,
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                height: '100%'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = issuesCount > 0 ? (isDark ? '#dc2626' : '#dc2626') : colors.border
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
                      backgroundColor: isDark ? '#7f1d1d' : '#fef2f2',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                  <TrendingUp style={{ width: '24px', height: '24px', color: issuesCount > 0 ? colors.error : colors.success }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Validation Issues
                    </p>
                    <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {issuesCount}
                      {issuesCount === 0 && (
                        <span style={{ fontSize: '12px', marginLeft: '8px', color: colors.success, fontWeight: 600 }}>
                          Fixed
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '4px 0 0 0' }}>
                      Errors {errorsCount} • Warnings {warningsCount}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Sidebar>
  )
}