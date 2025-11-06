'use client'

import { useState, useEffect } from 'react'
import { usePathname as useNextPathname } from 'next/navigation'

/**
 * Safely get the current pathname, with fallback for when Next.js navigation context isn't available
 * This hook must call usePathname unconditionally (React rules), but handles errors gracefully
 */
export function useSafePathname(): string {
  // Must call hook unconditionally at top level
  const nextPathname = useNextPathname()
  const [pathname, setPathname] = useState<string>(nextPathname || '')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use Next.js pathname if available, otherwise fall back to window.location
      const currentPath = nextPathname || window.location.pathname
      setPathname(currentPath)
      
      // Listen for route changes
      const handleRouteChange = () => {
        setPathname(window.location.pathname)
      }
      
      // Listen for Next.js route changes via popstate
      window.addEventListener('popstate', handleRouteChange)
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange)
      }
    } else {
      // SSR: use Next.js pathname if available
      if (nextPathname) {
        setPathname(nextPathname)
      }
    }
  }, [nextPathname])
  
  return pathname
}

