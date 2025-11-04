// Dark mode design system matching Commission Dashboard
export const DarkModeColors = {
  // Backgrounds (dark charcoal to indigo/purple gradients)
  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%)',
  backgroundSolid: '#1a1a2e',
  backgroundCard: '#1e293b', // Dark blue-gray
  backgroundCardSecondary: '#1f2937', // Dark gray
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  
  // Accent colors (matching Commission Dashboard)
  accentGreen: '#10b981', // For positive metrics, Net Commission
  accentBlue: '#3b82f6', // For Gross Commission, Total Sales
  accentPurple: '#8b5cf6', // For Average Per Deal
  accentOrange: '#f97316', // For Referral Fees Paid
  accentYellow: '#fbbf24', // For Stronger Side, Biggest Deal
  
  // Status colors
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  
  // Shadows
  shadowSm: '0 2px 4px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
  shadowLg: '0 8px 16px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3)',
}

export const DarkModeTypography = {
  heading1: {
    fontSize: '36px',
    fontWeight: '700',
    color: DarkModeColors.textPrimary,
    lineHeight: '1.2'
  },
  heading2: {
    fontSize: '24px',
    fontWeight: '600',
    color: DarkModeColors.textPrimary,
    lineHeight: '1.3'
  },
  heading3: {
    fontSize: '20px',
    fontWeight: '600',
    color: DarkModeColors.textPrimary,
    lineHeight: '1.4'
  },
  body: {
    fontSize: '16px',
    color: DarkModeColors.textSecondary,
    lineHeight: '1.5'
  },
  bodySmall: {
    fontSize: '14px',
    color: DarkModeColors.textSecondary,
    lineHeight: '1.5'
  },
  caption: {
    fontSize: '12px',
    color: DarkModeColors.textMuted,
    lineHeight: '1.4'
  }
}

export const DarkModeCard = {
  base: {
    backgroundColor: DarkModeColors.backgroundCard,
    borderRadius: '12px',
    border: `1px solid ${DarkModeColors.border}`,
    boxShadow: DarkModeColors.shadowMd,
    padding: '24px'
  },
  hover: {
    boxShadow: DarkModeColors.shadowLg,
    borderColor: DarkModeColors.border
  }
}
