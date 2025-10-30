// Hook to get theme-aware inline styles
import { useTheme } from '@/components/ThemeProvider'
import { getThemeColors } from '@/lib/theme'

export function useThemeStyles() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const colors = getThemeColors(isDark)
  
  return {
    colors,
    isDark,
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
        ? 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))'
        : 'linear-gradient(180deg, #ffffff, #fafafa)',
      border: `1px solid ${colors.border}`,
      boxShadow: isDark
        ? '0 4px 12px rgba(0,0,0,0.35)'
        : '0 8px 24px rgba(0,0,0,0.06)',
      borderRadius: '16px',
      position: 'relative',
    },
    headerDivider: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      height: '1px',
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    },
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
