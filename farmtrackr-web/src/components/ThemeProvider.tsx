'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme | null
      return stored || 'system'
    }
    return 'system'
  })
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      // 1) If the inline script already set a theme class, trust it
      const hasDark = document.documentElement.classList.contains('dark')
      const hasLight = document.documentElement.classList.contains('light')
      if (hasDark || hasLight) {
        return hasDark ? 'dark' : 'light'
      }

      // 2) No DOM class yet: if user preference is system, use matchMedia directly
      const stored = (localStorage.getItem('theme') as Theme | null) || 'system'
      const resolved = stored === 'system' ? getSystemTheme() : stored

      // Ensure DOM is synced as early as possible
      document.documentElement.classList.remove('light', 'dark', 'system')
      document.documentElement.classList.add(resolved)
      document.documentElement.setAttribute('data-theme', resolved)

      return resolved
    }
    return 'light'
  })
  
  const [mounted, setMounted] = useState(false)

  // Apply theme to DOM and update state
  const applyTheme = useCallback((newTheme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    root.classList.remove('light', 'dark', 'system')
    root.classList.add(newTheme)
    root.setAttribute('data-theme', newTheme)
    root.style.colorScheme = newTheme
    setResolvedTheme(newTheme)
  }, [])

  // Main effect: listen for theme changes and system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    setMounted(true)
    
    // Resolve current theme
    const currentResolved = resolveTheme(theme)
    applyTheme(currentResolved)

    // Set up system theme listener if in system mode
    let mediaQuery: MediaQueryList | null = null
    let handleChange: ((e: MediaQueryListEvent) => void) | null = null

    if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      handleChange = (e: MediaQueryListEvent) => {
        const systemTheme = e.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
      
      // Use addEventListener if available (modern browsers)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange)
      }
    }

    return () => {
      if (mediaQuery && handleChange) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange)
        } else {
          mediaQuery.removeListener(handleChange)
        }
      }
    }
  }, [theme, applyTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    // Theme change will trigger the useEffect above to apply the new theme
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}