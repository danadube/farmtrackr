import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // HSB-based color system with direct HSL values
        border: 'hsl(210, 20%, 90%)',
        input: 'hsl(210, 20%, 90%)',
        ring: 'hsl(142, 76%, 50%)',
        background: 'hsl(210, 20%, 98%)',
        foreground: 'hsl(210, 20%, 8%)',
        primary: {
          DEFAULT: 'hsl(142, 76%, 50%)',
          foreground: 'hsl(0, 0%, 100%)',
          50: 'hsl(142, 76%, 95%)',
          100: 'hsl(142, 76%, 90%)',
          200: 'hsl(142, 76%, 80%)',
          300: 'hsl(142, 76%, 70%)',
          400: 'hsl(142, 76%, 60%)',
          500: 'hsl(142, 76%, 50%)',
          600: 'hsl(142, 76%, 40%)',
          700: 'hsl(142, 76%, 30%)',
          800: 'hsl(142, 76%, 20%)',
          900: 'hsl(142, 76%, 10%)',
        },
        secondary: {
          DEFAULT: 'hsl(210, 20%, 95%)',
          foreground: 'hsl(210, 20%, 15%)',
        },
        accent: {
          DEFAULT: 'hsl(210, 20%, 90%)',
          foreground: 'hsl(210, 20%, 15%)',
        },
        muted: {
          DEFAULT: 'hsl(210, 20%, 95%)',
          foreground: 'hsl(210, 20%, 45%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 84%, 60%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        popover: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(210, 20%, 8%)',
        },
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(210, 20%, 8%)',
        },
        // Neutral grays with subtle saturation
        gray: {
          50: 'hsl(210, 20%, 98%)',
          100: 'hsl(210, 20%, 95%)',
          200: 'hsl(210, 20%, 90%)',
          300: 'hsl(210, 20%, 85%)',
          400: 'hsl(210, 20%, 70%)',
          500: 'hsl(210, 20%, 55%)',
          600: 'hsl(210, 20%, 40%)',
          700: 'hsl(210, 20%, 25%)',
          800: 'hsl(210, 20%, 15%)',
          900: 'hsl(210, 20%, 8%)',
        },
      },
      spacing: {
        // 8-point spacing system
        '0': '0px',
        '1': '4px',   // 0.5 * 8
        '2': '8px',   // 1 * 8
        '3': '12px',  // 1.5 * 8
        '4': '16px',  // 2 * 8
        '5': '20px',  // 2.5 * 8
        '6': '24px',  // 3 * 8
        '7': '28px',  // 3.5 * 8
        '8': '32px',  // 4 * 8
        '9': '36px',  // 4.5 * 8
        '10': '40px', // 5 * 8
        '11': '44px', // 5.5 * 8
        '12': '48px', // 6 * 8
        '14': '56px', // 7 * 8
        '16': '64px', // 8 * 8
        '20': '80px', // 10 * 8
        '24': '96px', // 12 * 8
        '28': '112px',// 14 * 8
        '32': '128px',// 16 * 8
        '36': '144px',// 18 * 8
        '40': '160px',// 20 * 8
        '44': '176px',// 22 * 8
        '48': '192px',// 24 * 8
        '52': '208px',// 26 * 8
        '56': '224px',// 28 * 8
        '60': '240px',// 30 * 8
        '64': '256px',// 32 * 8
        '72': '288px',// 36 * 8
        '80': '320px',// 40 * 8
        '96': '384px',// 48 * 8
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
        '5xl': ['48px', '1'],
        '6xl': ['60px', '1'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
