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
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      boxShadow: isDark
        ? '0 1px 2px rgba(0, 0, 0, 0.3)' 
        : '0 1px 2px rgba(0, 0, 0, 0.05)',
      borderRadius: '12px',
    },
    headerCard: {
      background: isDark
        ? 'linear-gradient(180deg, rgba(59,130,246,0.12), rgba(59,130,246,0.06)), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
        : 'linear-gradient(180deg, rgba(59,130,246,0.06), rgba(59,130,246,0.03)), linear-gradient(180deg, #ffffff, #fafafa)',
      border: `1px solid ${colors.border}`,
      borderTop: `3px solid ${colors.primary}`,
      boxShadow: isDark
        ? '0 4px 12px rgba(0,0,0,0.35)'
        : '0 8px 24px rgba(0,0,0,0.06)',
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
      background: isDark
        ? `linear-gradient(180deg, ${hexToRgba(hexColor, 0.12)}, ${hexToRgba(hexColor, 0.06)}), linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))`
        : `linear-gradient(180deg, ${hexToRgba(hexColor, 0.06)}, ${hexToRgba(hexColor, 0.03)}), linear-gradient(180deg, #ffffff, #fafafa)`,
      borderTop: `3px solid ${hexColor}`,
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
