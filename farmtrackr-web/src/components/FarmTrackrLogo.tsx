'use client'

import Image from 'next/image'
import { useTheme } from '@/components/ThemeProvider'

interface FarmTrackrLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'icon' | 'logo'
  className?: string
  showTitle?: boolean
}

export function FarmTrackrLogo({ 
  size = 'md', 
  variant = 'logo', 
  className = '',
  showTitle = true
}: FarmTrackrLogoProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const logoSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 160, height: 40 },
    lg: { width: 200, height: 50 },
    xl: { width: 240, height: 60 }
  }

  const iconSizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 }
  }

  if (variant === 'icon') {
    const sizeConfig = iconSizes[size]
    return (
      <div style={{ width: sizeConfig.width, height: sizeConfig.height }} className={className}>
        <Image
          src={isDark ? "/images/title-logo-transparent.png" : "/images/title-logo-light.png"}
          alt="FarmTrackr"
          width={sizeConfig.width}
          height={sizeConfig.height}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          quality={100}
          priority
        />
      </div>
    )
  }

  // Logo variant - show full logo with title (if showTitle is true)
  const sizeConfig = logoSizes[size]
  // Use transparent version for dark mode, light version for light mode
  const logoSrc = isDark ? "/images/title-logo-transparent.png" : "/images/title-logo-light.png"
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showTitle ? '12px' : '0', width: '100%' }} className={className}>
      <Image
        src={logoSrc}
        alt="FarmTrackr"
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={{ 
          width: '100%',
          height: 'auto', 
          objectFit: 'contain',
          maxWidth: '100%'
        }}
        quality={100}
        priority
      />
      {showTitle && (
        <span style={{ 
          fontSize: size === 'lg' ? '24px' : size === 'xl' ? '28px' : '20px',
          fontWeight: '700',
          color: 'inherit'
        }}>
          FarmTrackr
        </span>
      )}
    </div>
  )
}