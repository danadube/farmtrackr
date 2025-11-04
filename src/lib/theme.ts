// Brand colors for FarmTrackr
// Based on FarmTrackr Brand Guidelines v1.0 (November 2025)
// 
// Primary Colors:
// - Meadow Green (#689f38) - Primary brand color, buttons, headers
// - Forest Green (#558b2f) - Text, accents, gradients
// - Deep Forest (#2d5016) - Dark text, emphasis
// - Light Sage (#7da65d) - Light accents, backgrounds
//
// Accent Colors (Functional):
// - Tangerine (#ff9800) - Financial, commissions, transactions
// - Plum (#673ab7) - Analytics, reports, data visualization
// - Cherry (#f4516c) - Alerts, urgent items, high-priority tasks
// - Sky Blue (#42a5f5) - Calendar, showings, appointments
// - Peach (#ffb74d) - Tasks, reminders, highlights
//
// Neutrals:
// - White (#ffffff) - Backgrounds, cards, primary surfaces
// - Light Gray (#f5f5f7) - Secondary backgrounds, sections
// - Medium Gray (#86868b) - Secondary text, captions
// - Near Black (#1d1d1f) - Primary text, headings

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
      
      // Primary (Brand) - Meadow Green #689f38 (HSB: 88°, 65%, 62%)
      primary: '#689f38', // Meadow Green - Primary brand color
      primaryHover: '#558b2f', // Forest Green - Hover state
      primaryLight: 'rgba(104, 159, 56, 0.15)', // Meadow Green with opacity
      // Additional brand green shades
      deepForest: '#2d5016', // Deep Forest - Dark text, emphasis
      lightSage: '#7da65d', // Light Sage - Light accents, backgrounds
      
      // Success (Money) - Using Meadow Green for success states
      success: '#689f38', // Meadow Green - Success, positive actions
      successHover: '#558b2f', // Forest Green - Hover
      successLight: 'rgba(104, 159, 56, 0.15)', // Success with opacity
      
      // Info (Neutral/Buyers) - Sky Blue #42a5f5 (Calendar, showings)
      info: '#42a5f5', // Sky Blue - Calendar items, showings
      infoHover: '#2196f3', // Darker blue for hover
      infoLight: 'rgba(66, 165, 245, 0.15)', // Sky Blue with opacity
      
      // Warning (Attention/Sellers) - Tangerine #ff9800 (Financial, commissions)
      warning: '#ff9800', // Tangerine - Financial cards, commissions
      warningHover: '#f57c00', // Darker orange for hover
      warningLight: 'rgba(255, 152, 0, 0.15)', // Tangerine with opacity
      
      // Danger (Error/Delete) - Cherry #f4516c (Alerts, urgent items)
      error: '#f4516c', // Cherry - Alerts, errors, delete actions
      errorHover: '#e91e63', // Darker red for hover
      errorLight: 'rgba(244, 81, 108, 0.15)', // Cherry with opacity
      
      // Analytics/Reports - Plum #673ab7 (Analytics cards, reports)
      analytics: '#673ab7', // Plum - Analytics cards, reports
      analyticsHover: '#5e35b1', // Darker purple for hover
      analyticsLight: 'rgba(103, 58, 183, 0.15)', // Plum with opacity
      
      // Tasks/Highlights - Peach #ffb74d (Tasks, highlights)
      peach: '#ffb74d', // Peach - Tasks, highlights
      peachHover: '#ffa726', // Darker peach for hover
      peachLight: 'rgba(255, 183, 77, 0.15)', // Peach with opacity
      
      // Referral (Special) - Using Plum for referrals
      referral: '#673ab7', // Plum - Referral transactions
      referralHover: '#5e35b1', // Darker purple
      referralLight: 'rgba(103, 58, 183, 0.15)', // Plum with opacity
      
      // Legacy/Accent for backwards compatibility
      accent: '#673ab7', // Plum
      
      // Dark mode specific
      iconBg: 'rgba(104, 159, 56, 0.15)', // Primary (Meadow Green) with opacity
      
      gradient: {
        from: '#689f38', // Meadow Green
        to: '#558b2f', // Forest Green
      },
    }
  } else {
    return {
      // Neutral colors from brand guidelines
      background: '#f5f5f7', // Light Gray
      surface: '#ffffff', // White
      card: '#ffffff', // White
      cardHover: '#f9fafb', // Slightly lighter gray
      text: {
        primary: '#1d1d1f', // Near Black - Primary text
        secondary: '#86868b', // Medium Gray - Secondary text
        tertiary: '#6b7280', // Lighter gray for tertiary
      },
      border: '#e5e7eb', // Light border
      borderHover: '#d1d5db', // Darker border on hover
      
      // Primary (Brand) - Meadow Green #689f38 (HSB: 88°, 65%, 62%)
      primary: '#689f38', // Meadow Green - Primary brand color
      primaryHover: '#558b2f', // Forest Green - Hover state
      primaryLight: '#f0fdf4', // Very light green tint
      // Additional brand green shades
      deepForest: '#2d5016', // Deep Forest - Dark text, emphasis
      lightSage: '#7da65d', // Light Sage - Light accents, backgrounds
      
      // Success (Money) - Using Meadow Green for success states
      success: '#689f38', // Meadow Green - Success, positive actions
      successHover: '#558b2f', // Forest Green - Hover
      successLight: '#f0fdf4', // Very light green tint
      
      // Info (Neutral/Buyers) - Sky Blue #42a5f5 (Calendar, showings)
      info: '#42a5f5', // Sky Blue - Calendar items, showings
      infoHover: '#2196f3', // Darker blue for hover
      infoLight: '#e3f2fd', // Very light blue tint
      
      // Warning (Attention/Sellers) - Tangerine #ff9800 (Financial, commissions)
      warning: '#ff9800', // Tangerine - Financial cards, commissions
      warningHover: '#f57c00', // Darker orange for hover
      warningLight: '#fff3e0', // Very light orange tint
      
      // Danger (Error/Delete) - Cherry #f4516c (Alerts, urgent items)
      error: '#f4516c', // Cherry - Alerts, errors, delete actions
      errorHover: '#e91e63', // Darker red for hover
      errorLight: '#fce4ec', // Very light red tint
      
      // Analytics/Reports - Plum #673ab7 (Analytics cards, reports)
      analytics: '#673ab7', // Plum - Analytics cards, reports
      analyticsHover: '#5e35b1', // Darker purple for hover
      analyticsLight: '#ede7f6', // Very light purple tint
      
      // Tasks/Highlights - Peach #ffb74d (Tasks, highlights)
      peach: '#ffb74d', // Peach - Tasks, highlights
      peachHover: '#ffa726', // Darker peach for hover
      peachLight: '#fff8e1', // Very light peach tint
      
      // Referral (Special) - Using Plum for referrals
      referral: '#673ab7', // Plum - Referral transactions
      referralHover: '#5e35b1', // Darker purple
      referralLight: '#ede7f6', // Very light purple tint
      
      // Legacy/Accent for backwards compatibility
      accent: '#673ab7', // Plum
      
      // Light mode specific
      iconBg: '#f0fdf4', // Primary light tint
      
      // Light mode tints
      primaryTint: '#f0fdf4', // Meadow Green tint
      successTint: '#f0fdf4', // Success tint (same as primary)
      warningTint: '#fff3e0', // Tangerine tint
      infoTint: '#e3f2fd', // Sky Blue tint
      
      gradient: {
        from: '#689f38', // Meadow Green
        to: '#558b2f', // Forest Green
      },
    }
  }
}
