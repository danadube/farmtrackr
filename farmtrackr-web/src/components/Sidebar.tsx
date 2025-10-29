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
  Menu,
  X
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
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/google-sheets', label: 'Google Sheets', icon: FileSpreadsheet },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/data-quality', label: 'Data Quality', icon: TrendingUp },
    { href: '/import-export', label: 'Import & Export', icon: Upload },
    { href: '/settings', label: 'Settings', icon: Settings },
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
          <FarmTrackrLogo size="md" variant="logo" showTitle={true} />
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
          padding: '24px',
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
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: colors.text.primary }}>
            <FarmTrackrLogo size="lg" variant="logo" showTitle={true} />
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
                  backgroundColor: active ? colors.iconBg : 'transparent',
                  color: active ? colors.primary : colors.text.secondary,
                  fontWeight: active ? '600' : '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} />
                {item.label}
              </Link>
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

      {/* Main Content */}
      <div style={{ minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}