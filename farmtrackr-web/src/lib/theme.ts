// Utility function to get theme-aware colors
export function getThemeColors(isDark: boolean) {
  if (isDark) {
    return {
      background: '#111827',
      surface: '#1f2937',
      card: '#1f2937',
      cardHover: '#374151',
      text: {
        primary: '#f9fafb',
        secondary: '#d1d5db',
        tertiary: '#9ca3af',
      },
      border: '#374151',
      borderHover: '#4b5563',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      accent: '#8b5cf6',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      iconBg: '#1e3a8a',
      gradient: {
        from: '#1f2937',
        to: '#111827',
      },
    }
  } else {
    return {
      background: '#f5f5f7',
      surface: '#ffffff',
      card: '#ffffff',
      cardHover: '#f9fafb',
      text: {
        primary: '#111827',
        secondary: '#374151',
        tertiary: '#6b7280',
      },
      border: '#e5e7eb',
      borderHover: '#d1d5db',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      accent: '#8b5cf6',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      iconBg: '#dbeafe',
      // darker, readable tints for light mode icon containers
      primaryTint: '#dbeafe',
      successTint: '#dcfce7',
      warningTint: '#fef3c7',
      gradient: {
        from: '#eff6ff',
        to: '#dbeafe',
      },
    }
  }
}
