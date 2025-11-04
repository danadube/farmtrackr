// Apple-style design system constants
export const AppleColors = {
  // Primary colors
  primary: '#16a34a', // Green
  primaryHover: '#15803d',
  primaryLight: '#f0fdf4',
  
  // Grays (Apple System Gray)
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Semantic colors
  success: '#16a34a',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  // Backgrounds
  white: '#ffffff',
  background: '#f9fafb',
  card: '#ffffff',
  
  // Shadows (Apple-style subtle)
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

export const AppleTypography = {
  // Font sizes
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '36px',
  
  // Font weights
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  
  // Line heights
  tight: '1.25',
  regular: '1.5',
  relaxed: '1.75',
}

export const AppleSpacing = {
  // 8-point spacing system
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
}

export const AppleBorders = {
  radius: {
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },
  width: {
    thin: '0.5px',
    base: '1px',
    thick: '2px',
  },
}

export const AppleStyles = {
  // Card style (Apple's card design)
  card: {
    backgroundColor: AppleColors.white,
    borderRadius: AppleBorders.radius.xl,
    border: `${AppleBorders.width.base} solid ${AppleColors.gray200}`,
    boxShadow: AppleColors.shadowSm,
    padding: AppleSpacing.xl,
  },
  
  // Button primary
  buttonPrimary: {
    backgroundColor: AppleColors.primary,
    color: AppleColors.white,
    borderRadius: AppleBorders.radius.md,
    padding: `${AppleSpacing.md} ${AppleSpacing.xl}`,
    fontSize: AppleTypography.sm,
    fontWeight: AppleTypography.medium,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: AppleColors.shadowSm,
  },
  
  // Button secondary
  buttonSecondary: {
    backgroundColor: AppleColors.gray100,
    color: AppleColors.gray700,
    borderRadius: AppleBorders.radius.md,
    padding: `${AppleSpacing.md} ${AppleSpacing.xl}`,
    fontSize: AppleTypography.sm,
    fontWeight: AppleTypography.medium,
    border: `${AppleBorders.width.base} solid ${AppleColors.gray300}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  
  // Input
  input: {
    backgroundColor: AppleColors.white,
    border: `${AppleBorders.width.base} solid ${AppleColors.gray300}`,
    borderRadius: AppleBorders.radius.md,
    padding: AppleSpacing.md,
    fontSize: AppleTypography.sm,
    transition: 'all 0.2s ease',
  },
  
  // Glass morphism (for overlays)
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `${AppleBorders.width.base} solid rgba(255, 255, 255, 0.3)`,
  },
}
