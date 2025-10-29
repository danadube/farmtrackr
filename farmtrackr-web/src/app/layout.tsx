import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FarmTrackr - Farm CRM',
  description: 'Comprehensive farm contact management system',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const theme = localStorage.getItem('theme') || 'system';
                    let resolvedTheme;
                    
                    if (theme === 'system') {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                      resolvedTheme = prefersDark ? 'dark' : 'light';
                    } else {
                      resolvedTheme = theme;
                    }
                    
                    // Remove any existing theme classes first
                    document.documentElement.classList.remove('light', 'dark', 'system');
                    // Add resolved theme immediately (blocking)
                    document.documentElement.classList.add(resolvedTheme);
                    // Also set data attribute for CSS
                    document.documentElement.setAttribute('data-theme', resolvedTheme);
                    // Prevent flash by setting style immediately
                    document.documentElement.style.colorScheme = resolvedTheme;
                  } catch (e) {
                    document.documentElement.classList.remove('light', 'dark', 'system');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                })();
              `,
            }}
          />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
