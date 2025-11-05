'use client'

import { useState, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { getThemeColors } from '@/lib/theme'
import { 
  Home, 
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
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FarmTrackrLogo } from './FarmTrackrLogo'
import { Footer } from './Footer'

interface SidebarProps {
  children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  
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

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  ]

  // Quick Actions grouped with separators
  const quickActionsGroups = [
    [
      { href: '/contacts/new', label: 'Add Contact', icon: Plus, iconColor: colors.primary },
      { href: '/commissions#new', label: 'New Transaction', icon: DollarSign, iconColor: resolvedTheme === 'dark' ? '#f97316' : '#ea580c' },
      { href: '/commissions', label: 'View Commissions', icon: Briefcase, iconColor: resolvedTheme === 'dark' ? '#f97316' : '#ea580c', exactMatch: true },
    ],
    [
      { href: '/import-export', label: 'Import & Export', icon: Upload, iconColor: colors.primary },
      { href: '/documents', label: 'Documents', icon: FileText, iconColor: resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb' },
      { href: '/print-labels', label: 'Print Labels', icon: Printer, iconColor: resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb' },
    ],
    [
      { href: '/google-contacts', label: 'Google Contacts', icon: Contact, iconColor: colors.primary },
      { href: '/google-sheets', label: 'Google Sheets', icon: FileSpreadsheet, iconColor: resolvedTheme === 'dark' ? '#60a5fa' : '#2563eb' },
    ],
    [
      { href: '/data-quality', label: 'Data Quality', icon: CheckCircle2, iconColor: resolvedTheme === 'dark' ? '#a855f7' : '#9333ea' },
      { href: '/settings', label: 'Settings', icon: Settings, iconColor: resolvedTheme === 'dark' ? '#a855f7' : '#9333ea' },
    ],
  ]

  const futureFeaturesItems = [
    { href: '/future-features', label: 'Coming Soon', icon: Sparkles },
  ]

  const isActive = (href: string, exactMatch?: boolean) => {
    if (href === '/') {
      return pathname === '/'
    }
    
    // Check for hash in href (e.g., /commissions#new)
    if (href.includes('#')) {
      const [path, hash] = href.split('#')
      if (pathname === path) {
        if (typeof window !== 'undefined') {
          const currentHash = window.location.hash
          return currentHash === `#${hash}`
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
        <Link href="/" style={{ textDecoration: 'none', color: colors.text.primary }}>
          <FarmTrackrLogo size="md" variant="logo" showTitle={false} />
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{
            padding: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: colors.text.primary
          }}
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
          zIndex: 40,
          // Always visible on desktop (768px+), slide in/out on mobile
          transform: isDesktop 
            ? 'translateX(0)' 
            : (isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'),
          transition: 'transform 0.3s ease',
        }}
        id="sidebar"
      >
        {/* Logo - Aligned to top of sidebar */}
        <div style={{ marginBottom: '16px', marginTop: '-16px', width: '100%', padding: '0 8px', overflow: 'hidden' }}>
          <Link href="/" style={{ textDecoration: 'none', color: colors.text.primary, display: 'block', width: '100%', lineHeight: 0, paddingTop: '16px' }}>
            <FarmTrackrLogo size="lg" variant="logo" showTitle={false} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  // Active state: more visible background with higher opacity/contrast
                  backgroundColor: active 
                    ? (resolvedTheme === 'dark' 
                        ? 'rgba(104, 159, 56, 0.25)' // 25% opacity for dark mode
                        : 'rgba(104, 159, 56, 0.12)') // 12% opacity for light mode
                    : 'transparent',
                  color: active ? colors.primary : colors.text.secondary,
                  fontWeight: active ? '600' : '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  // Force green left border for active items - brand guidelines (thicker for visibility)
                  borderLeft: active ? `4px solid ${colors.primary}` : '4px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    // More visible hover state
                    e.currentTarget.style.backgroundColor = resolvedTheme === 'dark'
                      ? 'rgba(104, 159, 56, 0.15)' // Subtle green tint on hover in dark mode
                      : 'rgba(104, 159, 56, 0.08)' // Subtle green tint on hover in light mode
                    e.currentTarget.style.borderLeftColor = 'rgba(104, 159, 56, 0.5)' // Visible green border on hover
                    e.currentTarget.style.color = colors.primary // Change text to green on hover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderLeftColor = 'transparent'
                    e.currentTarget.style.color = colors.text.secondary // Restore original text color
                  }
                }}
              >
                <Icon 
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    color: active ? colors.primary : 'inherit' // Match text color
                  }} 
                />
                {item.label}
              </Link>
            )
          })}

          {/* Quick Actions Groups */}
          {quickActionsGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {groupIndex > 0 && (
                <div style={{ 
                  height: '1px', 
                  backgroundColor: colors.border, 
                  margin: '8px 0' 
                }} />
              )}
              {group.map((action) => {
                const Icon = action.icon
                const active = isActive(action.href, action.exactMatch)
                const iconBgColor = resolvedTheme === 'dark'
                  ? (action.iconColor === colors.primary ? 'rgba(104, 159, 56, 0.15)' :
                     action.iconColor === '#f97316' || action.iconColor === '#ea580c' ? 'rgba(249, 115, 22, 0.15)' :
                     action.iconColor === '#60a5fa' || action.iconColor === '#2563eb' ? 'rgba(96, 165, 250, 0.15)' :
                     'rgba(168, 85, 247, 0.15)')
                  : (action.iconColor === colors.primary ? 'rgba(104, 159, 56, 0.1)' :
                     action.iconColor === '#ea580c' ? 'rgba(234, 88, 12, 0.1)' :
                     action.iconColor === '#2563eb' ? 'rgba(37, 99, 235, 0.1)' :
                     'rgba(147, 51, 234, 0.1)')
                
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      backgroundColor: active 
                        ? (resolvedTheme === 'dark' 
                            ? 'rgba(104, 159, 56, 0.25)'
                            : 'rgba(104, 159, 56, 0.12)')
                        : 'transparent',
                      color: active ? colors.primary : colors.text.secondary,
                      fontWeight: active ? '600' : '500',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      borderLeft: active ? `4px solid ${colors.primary}` : '4px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = resolvedTheme === 'dark'
                          ? 'rgba(104, 159, 56, 0.15)'
                          : 'rgba(104, 159, 56, 0.08)'
                        e.currentTarget.style.borderLeftColor = 'rgba(104, 159, 56, 0.5)'
                        e.currentTarget.style.color = colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderLeftColor = 'transparent'
                        e.currentTarget.style.color = colors.text.secondary
                      }
                    }}
                  >
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: iconBgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon 
                        style={{ 
                          width: '18px', 
                          height: '18px',
                          color: action.iconColor
                        }} 
                      />
                    </div>
                    {action.label}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Future Features Section */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
            <div style={{ padding: '0 16px 8px 16px', marginBottom: '4px' }}>
              <p style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                color: colors.text.tertiary,
                margin: '0'
              }}>
                Coming Soon
              </p>
            </div>
            {futureFeaturesItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    backgroundColor: active 
                      ? (resolvedTheme === 'dark' 
                          ? 'rgba(104, 159, 56, 0.25)'
                          : 'rgba(104, 159, 56, 0.12)')
                      : 'transparent',
                    color: active ? colors.primary : colors.text.tertiary,
                    fontWeight: active ? '600' : '500',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    borderLeft: active ? `4px solid ${colors.primary}` : '4px solid transparent',
                    opacity: 0.8
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = resolvedTheme === 'dark'
                        ? 'rgba(104, 159, 56, 0.15)'
                        : 'rgba(104, 159, 56, 0.08)'
                      e.currentTarget.style.borderLeftColor = 'rgba(104, 159, 56, 0.5)'
                      e.currentTarget.style.color = colors.primary
                      e.currentTarget.style.opacity = '1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderLeftColor = 'transparent'
                      e.currentTarget.style.color = colors.text.tertiary
                      e.currentTarget.style.opacity = '0.8'
                    }
                  }}
                >
                  <Icon 
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      color: active ? colors.primary : 'inherit'
                    }} 
                  />
                  {item.label}
                </Link>
              )
            })}
          </div>
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

      {/* Main Content */}
      <div style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}