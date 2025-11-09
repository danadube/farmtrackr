'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { getThemeColors } from '@/lib/theme'
import {
  Users,
  FileText,
  TrendingUp,
  Upload,
  Settings,
  FileSpreadsheet,
  LayoutDashboard,
  Menu,
  X,
  Contact,
  DollarSign,
  Sparkles,
  Plus,
  Briefcase,
  Printer,
  CheckCircle2,
  Mail,
  Calendar as CalendarIcon,
  ChevronDown,
  Home
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSafePathname } from '@/hooks/useSafePathname'
import { FarmTrackrLogo } from './FarmTrackrLogo'
import { Footer } from './Footer'
import { useButtonPress } from '@/hooks/useButtonPress'

interface SidebarProps {
  children: React.ReactNode
}

type SidebarItem = {
  href: string
  label: string
  icon: LucideIcon
  iconColor?: string
  exactMatch?: boolean
  hash?: string
}

type QuickCreateOption = {
  id: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  accent?: string
}

type SidebarSection = {
  id: string
  title: string
  defaultOpen?: boolean
  items: SidebarItem[]
}

export function Sidebar({ children }: SidebarProps) {
  const { resolvedTheme } = useTheme()
  const pathname = useSafePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const router = useRouter()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  
  // Ensure we read theme from DOM on mount (set by inline script)
  useEffect(() => {
    setIsMounted(true)
    // Force sync with DOM immediately
    if (typeof window !== 'undefined') {
      const domHasDark = document.documentElement.classList.contains('dark')
      const domHasLight = document.documentElement.classList.contains('light')
      if (domHasDark && resolvedTheme !== 'dark') {
        // DOM says dark but React says different - trust DOM
        document.documentElement.classList.remove('light')
        document.documentElement.classList.add('dark')
      } else if (domHasLight && resolvedTheme !== 'light') {
        // DOM says light but React says different - trust DOM
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }
    }
  }, [])
  
  const colors = getThemeColors(resolvedTheme === 'dark')

  // Handle responsive behavior
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768)
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false) // Always close mobile menu when switching to desktop
      }
    }
    
    checkIsDesktop()
    window.addEventListener('resize', checkIsDesktop)
    return () => window.removeEventListener('resize', checkIsDesktop)
  }, [])

  const sections: SidebarSection[] = [
    {
      id: 'workspace',
      title: 'Workspace',
      defaultOpen: true,
      items: [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
        { href: '/listings', label: 'Listings', icon: Home },
        {
          href: '/commissions',
          label: 'Commissions',
          icon: Briefcase,
          iconColor: resolvedTheme === 'dark' ? '#f97316' : '#d97706'
        },
        { href: '/contacts', label: 'Contacts', icon: Users },
        { href: '/tasks', label: 'Tasks', icon: CheckCircle2 },
      ],
    },
    {
      id: 'communication',
      title: 'Communication',
      defaultOpen: true,
      items: [
        { href: '/emails', label: 'Emails', icon: Mail },
        { href: '/emails/templates', label: 'Email Templates', icon: FileText, iconColor: resolvedTheme === 'dark' ? '#facc15' : '#ca8a04' },
      ],
    },
    {
      id: 'docs-assets',
      title: 'Documents & Assets',
      defaultOpen: false,
      items: [
        { href: '/documents', label: 'Documents', icon: FileText },
        { href: '/print-labels', label: 'Print Labels', icon: Printer },
        { href: '/google-sheets', label: 'Google Sheets', icon: FileSpreadsheet },
        { href: '/drive', label: 'Drive', icon: Upload },
      ],
    },
    {
      id: 'tools',
      title: 'Tools & Settings',
      defaultOpen: false,
      items: [
        { href: '/import-export', label: 'Import & Export', icon: Upload },
        { href: '/data-quality', label: 'Data Quality', icon: TrendingUp },
        { href: '/integrations', label: 'Integrations', icon: Sparkles },
        { href: '/settings', label: 'Settings', icon: Settings },
      ],
    },
    {
      id: 'resources',
      title: 'Resources',
      defaultOpen: false,
      items: [
        { href: '/future-features', label: 'Roadmap', icon: Sparkles },
      ],
    },
  ]

  const quickCreateOptions: QuickCreateOption[] = [
    {
      id: 'contact',
      label: 'Add General Contact',
      description: 'Create a new CRM contact',
      href: '/contacts/new?type=general',
      icon: Users,
      accent: colors.primary,
    },
    {
      id: 'farm-contact',
      label: 'Add Farm Contact',
      description: 'Capture a farm lead quickly',
      href: '/contacts/new?type=farm',
      icon: Users,
      accent: resolvedTheme === 'dark' ? '#22c55e' : '#16a34a',
    },
    {
      id: 'transaction',
      label: 'New Transaction',
      description: 'Start a new deal record',
      href: '/commissions/new',
      icon: DollarSign,
      accent: resolvedTheme === 'dark' ? '#f97316' : '#ea580c',
    },
    {
      id: 'listing',
      label: 'New Listing',
      description: 'Start a listing pipeline',
      href: '/listings#new',
      icon: Home,
      accent: resolvedTheme === 'dark' ? '#facc15' : '#d97706',
    },
    {
      id: 'email',
      label: 'New Email',
      description: 'Compose from the email hub',
      href: '/emails?compose=new',
      icon: Mail,
      accent: resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb',
    },
  ]

  const handleQuickCreate = (href: string) => {
    setShowQuickCreate(false)
    if (!isDesktop) {
      setIsMobileOpen(false)
    }
    router.push(href)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('sidebar.sectionState')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed === 'object') {
          setOpenSections(parsed)
          return
        }
      }
    } catch (error) {
      console.error('Failed to load sidebar section state:', error)
    }
    const defaults: Record<string, boolean> = {}
    sections.forEach((section) => {
      defaults[section.id] = section.defaultOpen ?? true
    })
    setOpenSections(defaults)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (Object.keys(openSections).length === 0) return
    try {
      localStorage.setItem('sidebar.sectionState', JSON.stringify(openSections))
    } catch (error) {
      console.error('Failed to persist sidebar section state:', error)
    }
  }, [openSections])

  const isActive = (href: string, exactMatch?: boolean, hash?: string) => {
    if (href === '/') {
      return pathname === '/' && !hash
    }
    
    // Check for hash
    if (hash) {
      if (pathname === href) {
        if (typeof window !== 'undefined') {
          const currentHash = window.location.hash
          return currentHash === hash
        }
        return false
      }
      return false
    }
    
    // For exact match (View Commissions), only match if pathname matches exactly AND hash is not #new
    if (exactMatch) {
      if (pathname === href) {
        if (typeof window !== 'undefined') {
          const currentHash = window.location.hash
          // Don't highlight "View Commissions" if we're on the new transaction form
          return currentHash !== '#new'
        }
        return true
      }
      return false
    }
    
    return pathname?.startsWith(href)
  }

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // On first render, read theme from DOM (set by inline script) to prevent flash
  // This ensures we use the correct background even before React state initializes
  const getInitialBackground = () => {
    if (typeof window === 'undefined') return '#f5f5f7'
    const hasDark = document.documentElement.classList.contains('dark')
    return hasDark ? '#111827' : '#f5f5f7'
  }
  
  const [safeBackground, setSafeBackground] = useState(getInitialBackground)
  
  // Update background when theme resolves
  useEffect(() => {
    if (isMounted) {
      setSafeBackground(colors.background)
    }
  }, [isMounted, colors.background])
  
  return (
    <div style={{ minHeight: '100vh', background: safeBackground }}>
      {/* Mobile Header */}
      <div 
        style={{
          display: isDesktop ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surface,
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}
      >
        <Link 
          href="/" 
          style={{ 
            textDecoration: 'none', 
            color: colors.text.primary,
            cursor: 'pointer',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <FarmTrackrLogo size="md" variant="logo" showTitle={false} />
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          {...getButtonPressHandlers('mobile-menu-toggle')}
          style={getButtonPressStyle(
            'mobile-menu-toggle',
            {
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.text.primary
            },
            'transparent',
            colors.cardHover
          )}
        >
          {isMobileOpen ? (
            <X style={{ width: '24px', height: '24px' }} />
          ) : (
            <Menu style={{ width: '24px', height: '24px' }} />
          )}
        </button>
      </div>

      {/* Navigation Sidebar */}
      <div 
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '256px',
          background: colors.surface,
          borderRight: `1px solid ${colors.border}`,
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          // Always visible on desktop (768px+), slide in/out on mobile
          transform: isDesktop 
            ? 'translateX(0)' 
            : (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform 0.3s ease',
          pointerEvents: 'auto',
        }}
        id="sidebar"
      >
        {/* Logo - Aligned to top of sidebar */}
        <div style={{ marginBottom: '16px', marginTop: '-16px', width: '100%', padding: '0 8px', overflow: 'hidden' }}>
          <Link 
            href="/" 
            style={{ 
              textDecoration: 'none', 
              color: colors.text.primary, 
              display: 'block', 
              width: '100%', 
              lineHeight: 0, 
              paddingTop: '16px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <FarmTrackrLogo size="lg" variant="logo" showTitle={false} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <button
            type="button"
            {...getButtonPressHandlers('open-quick-create')}
            onClick={() => setShowQuickCreate(true)}
            style={getButtonPressStyle(
              'open-quick-create',
              {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: resolvedTheme === 'dark'
                  ? '0 8px 18px rgba(104, 159, 56, 0.25)'
                  : '0 10px 24px rgba(104, 159, 56, 0.22)',
                transition: 'transform 0.2s ease',
              },
              colors.primary,
              colors.primaryHover
            )}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            New
          </button>

          {sections.map((section) => {
            const open = openSections[section.id] ?? section.defaultOpen ?? true
            return (
              <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  type="button"
                  {...getButtonPressHandlers(`toggle-${section.id}`)}
                  onClick={() =>
                    setOpenSections((prev) => {
                      const current = prev[section.id]
                      const next = current === undefined ? !(section.defaultOpen ?? true) : !current
                      return { ...prev, [section.id]: next }
                    })
                  }
                  style={getButtonPressStyle(
                    `toggle-${section.id}`,
                    {
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      color: colors.text.secondary,
                      fontSize: '12px',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      cursor: 'pointer',
                    },
                    'transparent',
                    colors.cardHover
                  )}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    style={{
                      width: '16px',
                      height: '16px',
                      transition: 'transform 0.2s ease',
                      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                    }}
                  />
                </button>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    overflow: 'hidden',
                    maxHeight: open ? `${section.items.length * 48 + 16}px` : '0px',
                    transition: 'max-height 0.25s ease',
                  }}
                >
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href, item.exactMatch, item.hash)
                    const iconColor = item.iconColor || colors.primary
                    const iconBgColor = resolvedTheme === 'dark'
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(15, 23, 42, 0.04)'

                    const content = (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px 10px 20px',
                          marginLeft: '4px',
                          borderRadius: '10px',
                          backgroundColor: active
                            ? (resolvedTheme === 'dark'
                                ? 'rgba(104, 159, 56, 0.22)'
                                : 'rgba(104, 159, 56, 0.12)')
                            : 'transparent',
                          color: active ? colors.primary : colors.text.secondary,
                          fontWeight: active ? 600 : 500,
                          fontSize: '13px',
                          borderLeft: active ? `4px solid ${colors.primary}` : '4px solid transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease, border-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = resolvedTheme === 'dark'
                              ? 'rgba(255,255,255,0.06)'
                              : 'rgba(15,23,42,0.04)'
                            e.currentTarget.style.borderLeftColor = 'rgba(104, 159, 56, 0.4)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.borderLeftColor = 'transparent'
                          }
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            backgroundColor: iconBgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon
                            style={{
                              width: '16px',
                              height: '16px',
                              color: iconColor,
                            }}
                          />
                        </div>
                        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </span>
                      </div>
                    )

                    if (item.hash) {
                      return (
                        <a
                          key={`${section.id}-${item.href}${item.hash}`}
                          href={`${item.href}${item.hash}`}
                          style={{ textDecoration: 'none' }}
                        >
                          {content}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={`${section.id}-${item.href}`}
                        href={item.href}
                        prefetch={false}
                        style={{ textDecoration: 'none' }}
                        onClick={() => {
                          if (!isDesktop) {
                            setIsMobileOpen(false)
                          }
                        }}
                      >
                        {content}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer in Sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
          <Footer />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && !isDesktop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 30,
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {showQuickCreate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 24px',
          }}
          onClick={() => setShowQuickCreate(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              background: colors.surface,
              borderRadius: '18px',
              padding: '28px 32px 36px 32px',
              boxShadow: resolvedTheme === 'dark'
                ? '0 32px 60px rgba(15, 23, 42, 0.65)'
                : '0 34px 68px rgba(15, 23, 42, 0.18)',
              border: `1px solid ${colors.border}`,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: colors.text.primary }}>Start something new</h3>
                <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: colors.text.secondary }}>
                  Pick one of the quick actions to jump right into creating.
                </p>
              </div>
              <button
                type="button"
                {...getButtonPressHandlers('close-quick-create')}
                onClick={() => setShowQuickCreate(false)}
                style={getButtonPressStyle(
                  'close-quick-create',
                  {
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                    color: colors.text.secondary,
                    cursor: 'pointer',
                  },
                  'transparent',
                  colors.cardHover
                )}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginTop: '20px',
              }}
            >
              {quickCreateOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleQuickCreate(option.href)}
                    style={{
                      textAlign: 'left',
                      padding: '18px 20px',
                      borderRadius: '16px',
                      border: `1px solid ${colors.border}`,
                      background: resolvedTheme === 'dark'
                        ? 'rgba(255, 255, 255, 0.04)'
                        : '#f9fafb',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      cursor: 'pointer',
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = resolvedTheme === 'dark'
                        ? '0 14px 28px rgba(0,0,0,0.35)'
                        : '0 18px 34px rgba(15,23,42,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: option.accent || colors.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: resolvedTheme === 'dark'
                            ? `0 8px 18px ${option.accent ? `${option.accent}55` : 'rgba(104,159,56,0.35)'}`
                            : `0 10px 22px ${option.accent ? `${option.accent}33` : 'rgba(104,159,56,0.25)'}`,
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: colors.text.primary }}>
                          {option.label}
                        </span>
                        <span style={{ fontSize: '13px', color: colors.text.secondary }}>
                          {option.description}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ minHeight: '100vh', marginLeft: isDesktop ? '256px' : '0', paddingLeft: isDesktop ? '0' : '0' }}>
        {children}
      </div>
    </div>
  )
}