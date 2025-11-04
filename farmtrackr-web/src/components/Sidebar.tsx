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
  Sparkles
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
    { href: '/contacts', label: 'Farm Contacts', icon: Users },
    { href: '/google-contacts', label: 'Google Contacts', icon: Contact },
    { href: '/commissions', label: 'Commissions', icon: DollarSign },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/google-sheets', label: 'Google Sheets', icon: FileSpreadsheet },
    { href: '/import-export', label: 'Import & Export', icon: Upload },
    { href: '/data-quality', label: 'Data Quality', icon: TrendingUp },
    { href: '/settings', label: 'Settings', icon: Settings },
    ...(process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true' ? [
      { href: '/admin-tools', label: 'Admin Tools (Dev)', icon: Settings },
    ] : []),
  ]

  const futureFeaturesItems = [
    { href: '/future-features', label: 'Coming Soon', icon: Sparkles },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
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