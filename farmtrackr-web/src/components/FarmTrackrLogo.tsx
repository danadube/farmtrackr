'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface FarmTrackrLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'icon' | 'logo'
  className?: string
}

export function FarmTrackrLogo({ size = 'md', variant = 'logo', className = '' }: FarmTrackrLogoProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)
    
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }

  const logoSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48
  }

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses[size]} ${className}`}>
        <Image
          src="/images/farmtrackr-icon.png"
          alt="FarmTrackr"
          width={logoSizes[size]}
          height={logoSizes[size]}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <Image
        src={isDark ? "/images/farmtrackr-logo-dark.png" : "/images/farmtrackr-logo-light.png"}
        alt="FarmTrackr"
        width={logoSizes[size]}
        height={logoSizes[size]}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
