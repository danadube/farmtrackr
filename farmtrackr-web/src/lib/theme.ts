// HSB-based color system for FarmTrackr
// Based on Commission Dashboard color documentation

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
      
      // Primary (Brand) - HSB(250°, 75%, 65%) - Purple-Blue
      primary: '#9273FF', // hsl(250, 75%, 65%)
      primaryHover: '#7949FF', // hsl(250, 75%, 55%)
      primaryLight: 'hsla(250, 75%, 85%, 0.15)', // hsl(250, 75%, 85%) with opacity
      
      // Success (Money) - HSB(150°, 70%, 60%) - Emerald Green  
      success: '#1DE47E', // hsl(150, 70%, 60%)
      successHover: '#0ABF5F', // hsl(150, 70%, 50%)
      successLight: 'hsla(150, 70%, 75%, 0.15)', // hsl(150, 70%, 75%) with opacity
      
      // Info (Neutral/Buyers) - HSB(210°, 65%, 65%) - Blue
      info: '#5BA3FF', // hsl(210, 65%, 65%)
      infoHover: '#2985FF', // hsl(210, 65%, 55%)
      infoLight: 'hsla(210, 65%, 75%, 0.15)', // hsl(210, 65%, 75%) with opacity
      
      // Warning (Attention/Sellers) - HSB(45°, 80%, 70%) - Amber
      warning: '#FFD461', // hsl(45, 80%, 70%)
      warningHover: '#FFC624', // hsl(45, 80%, 60%)
      warningLight: 'hsla(45, 80%, 75%, 0.15)', // hsl(45, 80%, 75%) with opacity
      
      // Danger (Error/Delete) - HSB(0°, 75%, 60%) - Red
      error: '#FF6161', // hsl(0, 75%, 60%)
      errorHover: '#FF2929', // hsl(0, 75%, 50%)
      errorLight: 'hsla(0, 75%, 75%, 0.15)', // hsl(0, 75%, 75%) with opacity
      
      // Referral (Special) - HSB(280°, 70%, 65%) - Purple
      referral: '#C273FF', // hsl(280, 70%, 65%)
      referralHover: '#AD49FF', // hsl(280, 70%, 55%)
      referralLight: 'hsla(280, 70%, 75%, 0.15)', // hsl(280, 70%, 75%) with opacity
      
      // Legacy/Accent for backwards compatibility
      accent: '#C273FF', // Same as referral
      
      // Dark mode specific
      iconBg: 'rgba(146, 115, 255, 0.15)', // primary with opacity
      
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
      
      // Primary (Brand) - HSB(250°, 75%, 65%) - Purple-Blue
      primary: '#9273FF', // hsl(250, 75%, 65%)
      primaryHover: '#7949FF', // hsl(250, 75%, 55%)
      primaryLight: '#F4F0FF', // hsl(250, 75%, 97%)
      
      // Success (Money) - HSB(150°, 70%, 60%) - Emerald Green
      success: '#1DE47E', // hsl(150, 70%, 60%)
      successHover: '#0ABF5F', // hsl(150, 70%, 50%)
      successLight: '#EDFDF5', // hsl(150, 70%, 97%)
      
      // Info (Neutral/Buyers) - HSB(210°, 65%, 65%) - Blue
      info: '#5BA3FF', // hsl(210, 65%, 65%)
      infoHover: '#2985FF', // hsl(210, 65%, 55%)
      infoLight: '#EFF5FF', // hsl(210, 65%, 97%)
      
      // Warning (Attention/Sellers) - HSB(45°, 80%, 70%) - Amber
      warning: '#FFD461', // hsl(45, 80%, 70%)
      warningHover: '#FFC624', // hsl(45, 80%, 60%)
      warningLight: '#FFFBF0', // hsl(45, 80%, 97%)
      
      // Danger (Error/Delete) - HSB(0°, 75%, 60%) - Red
      error: '#FF6161', // hsl(0, 75%, 60%)
      errorHover: '#FF2929', // hsl(0, 75%, 50%)
      errorLight: '#FFF0F0', // hsl(0, 75%, 97%)
      
      // Referral (Special) - HSB(280°, 70%, 65%) - Purple
      referral: '#C273FF', // hsl(280, 70%, 65%)
      referralHover: '#AD49FF', // hsl(280, 70%, 55%)
      referralLight: '#FAF0FF', // hsl(280, 70%, 97%)
      
      // Legacy/Accent for backwards compatibility
      accent: '#C273FF', // Same as referral
      
      // Light mode specific
      iconBg: '#F4F0FF', // primary-50 equivalent
      
      // Light mode tints
      primaryTint: '#F4F0FF',
      successTint: '#EDFDF5',
      warningTint: '#FFFBF0',
      infoTint: '#EFF5FF',
      
      gradient: {
        from: '#EFF5FF', // info-50
        to: '#F4F0FF', // primary-50
      },
    }
  }
}
