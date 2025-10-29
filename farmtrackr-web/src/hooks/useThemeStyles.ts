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
