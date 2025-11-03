// Hook to get theme-aware inline styles
import { useTheme } from '@/components/ThemeProvider'
import { getThemeColors } from '@/lib/theme'
import { spacing } from '@/lib/spacing'

export function useThemeStyles() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const colors = getThemeColors(isDark)
  const hexToRgba = (hex: string, alpha: number) => {
    const h = hex.replace('#', '')
    const bigint = parseInt(h, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  
  return {
    colors,
    isDark,
    spacing,
    // Common style objects
    card: {
      // Apple aesthetic: clean white cards with subtle styling
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      // Apple aesthetic: subtle, layered shadows (never harsh)
      boxShadow: isDark
        ? '0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)' 
        : '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
      borderRadius: '12px',
    },
    headerCard: {
      // Apple aesthetic: glassmorphism effect
      background: isDark
        ? `linear-gradient(180deg, ${hexToRgba(colors.primary, 0.15)}, ${hexToRgba(colors.primary, 0.08)}), rgba(31, 41, 55, 0.8)`
        : `linear-gradient(180deg, ${hexToRgba(colors.primary, 0.08)}, ${hexToRgba(colors.primary, 0.04)}), rgba(255, 255, 255, 0.8)`,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: isDark 
        ? `1px solid rgba(255, 255, 255, 0.1)`
        : `1px solid rgba(255, 255, 255, 0.3)`,
      borderTop: `3px solid ${colors.primary}`,
      // Apple aesthetic: layered shadows for depth
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.02)',
      borderRadius: '16px',
      position: 'relative' as const,
    },
    headerDivider: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      height: '1px',
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    },
    headerTint: (hexColor: string) => ({
      // Apple aesthetic: glassmorphism with color tint
      background: isDark
        ? `linear-gradient(180deg, ${hexToRgba(hexColor, 0.15)}, ${hexToRgba(hexColor, 0.08)}), rgba(31, 41, 55, 0.8)`
        : `linear-gradient(180deg, ${hexToRgba(hexColor, 0.08)}, ${hexToRgba(hexColor, 0.04)}), rgba(255, 255, 255, 0.8)`,
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: isDark 
        ? `1px solid rgba(255, 255, 255, 0.1)`
        : `1px solid rgba(255, 255, 255, 0.3)`,
      borderTop: `3px solid ${hexColor}`,
      boxShadow: isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.02)',
    } as const),
    background: {
      backgroundColor: colors.background,
    },
    text: {
      primary: { color: colors.text.primary },
      secondary: { color: colors.text.secondary },
      tertiary: { color: colors.text.tertiary },
    },
  }
}
