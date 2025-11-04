'use client'

import { getVersionInfo } from '@/lib/version'
import { getThemeColors } from '@/lib/theme'
import { useTheme } from '@/components/ThemeProvider'

export function Footer() {
  const { resolvedTheme } = useTheme()
  const colors = getThemeColors(resolvedTheme === 'dark')
  const versionInfo = getVersionInfo()

  return (
    <div
      style={{
        padding: '20px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        fontSize: '12px',
        color: colors.text.tertiary,
        letterSpacing: '0.01em'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', opacity: 0.8 }}>
        <span>© {new Date().getFullYear()} FarmTrackr</span>
        <span>All rights reserved.</span>
      </div>
      <span style={{ opacity: 0.8, fontWeight: '500' }}>
        Version {versionInfo.version}
      </span>
    </div>
  )
}

