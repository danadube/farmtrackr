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
      borderLeft: `4px solid ${colors.border}`, // Default left border (will be overridden by cardWithLeftBorder)
      // Apple aesthetic: subtle, layered shadows (never harsh)
      boxShadow: isDark
        ? '0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)' 
        : '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
      borderRadius: '12px',
    },
    cardWithLeftBorder: (color: string) => ({
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderLeft: `4px solid ${color}`, // Brand guidelines: colored left border
      boxShadow: isDark
        ? '0 1px 2px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)' 
        : '0 1px 2px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)',
      borderRadius: '12px',
    } as const),
    headerCard: {
      // Brand guidelines: Meadow Green (#689f38) gradient to Forest Green (#558b2f)
      // IMPORTANT: Use background (not backgroundColor) for gradients, and explicitly remove backgroundColor
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
      backgroundColor: 'transparent', // Remove solid color to allow gradient to show
      border: `1px solid ${colors.primary}`,
      borderRadius: '16px',
      position: 'relative' as const,
      // White text for contrast
      color: '#ffffff',
    },
    headerDivider: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
      height: '1px',
      background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.2)' // White divider on green background
    },
    headerTint: (hexColor: string) => {
      // For green headers, use gradient from Meadow Green to Forest Green
      // For other colors, use solid color with gradient to darker shade
      const isGreen = hexColor === colors.primary || hexColor === '#689f38'
      const gradientTo = isGreen ? colors.primaryHover : hexColor
      
      return {
        // Brand guidelines: gradient for green headers, solid gradient for others
        // IMPORTANT: Use background (not backgroundColor) for gradients, and explicitly remove backgroundColor
        background: `linear-gradient(135deg, ${hexColor} 0%, ${gradientTo} 100%)`,
        backgroundColor: 'transparent', // Remove solid color to allow gradient to show
        border: `1px solid ${hexColor}`,
        borderRadius: '16px',
        position: 'relative' as const,
        color: '#ffffff',
      } as const
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
