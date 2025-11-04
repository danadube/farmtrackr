'use client'

import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { 
  Sparkles,
  Mail,
  Calendar,
  FileCheck,
  CheckSquare,
  Palette,
  Lock,
  FileSpreadsheet,
  Tag
} from 'lucide-react'

export default function FutureFeaturesPage() {
  const { colors, isDark, card, headerCard, headerTint, background, text } = useThemeStyles()

  const upcomingFeatures = [
    {
      icon: Mail,
      title: 'Email Integration',
      description: 'Full Gmail and Outlook integration with send/receive capabilities, email templates, and communication history tracking.',
      version: 'v0.8.0',
      status: 'planned'
    },
    {
      icon: Calendar,
      title: 'Task Management & Reminders',
      description: 'Task system with Apple Reminders sync, task linking to contacts and transactions, and pipeline integration.',
      version: 'v0.10.0',
      status: 'planned'
    },
    {
      icon: FileCheck,
      title: 'Transaction Pipeline',
      description: 'Visual pipeline for transaction stages with Asana-like task management, form tracking, and ZipForms/DocuSign integration.',
      version: 'v0.9.0',
      status: 'planned'
    },
    {
      icon: CheckSquare,
      title: 'Forms Integration',
      description: 'ZipForms, DocuSign, and CAR (California Association of Realtors) forms integration with electronic signature workflows.',
      version: 'v0.9.0',
      status: 'planned'
    },
    {
      icon: Palette,
      title: 'Personalization & Branding',
      description: 'Custom logo import, brand color customization, and app personalization options.',
      version: 'v0.11.0',
      status: 'planned'
    },
    {
      icon: Lock,
      title: 'Authentication & Security',
      description: 'User authentication system with password protection and secure session management.',
      version: 'v0.11.0',
      status: 'planned'
    },
    {
      icon: FileSpreadsheet,
      title: 'Enhanced Export Options',
      description: 'Transaction export column selection and advanced export filtering options.',
      version: 'v0.12.0',
      status: 'planned'
    },
    {
      icon: Tag,
      title: 'Google Contact Tag Colors',
      description: 'Different colored chips for Google contact tags with custom color assignment.',
      version: 'v0.12.0',
      status: 'planned'
    }
  ]

  return (
    <Sidebar>
      <div 
        style={{ 
          marginLeft: '256px', 
          paddingLeft: '0',
          minHeight: '100vh',
          ...background
        }}
      >
        <div 
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingTop: '32px',
            paddingBottom: '32px'
          }}
        >
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ padding: '24px', ...headerTint(colors.primary) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isDark ? '#064e3b' : '#dcfce7',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Sparkles style={{ width: '24px', height: '24px', color: colors.success }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>
                    Coming Soon
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Planned features and roadmap items
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {upcomingFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  style={{
                    padding: '24px',
                    ...card,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = isDark 
                      ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = card.boxShadow
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '16px', marginBottom: '12px' }}>
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: isDark ? '#064e3b' : '#dcfce7',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon style={{ width: '20px', height: '20px', color: colors.success }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0 0 4px 0' }}>
                        {feature.title}
                      </h3>
                      <span 
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                          color: colors.info || colors.primary,
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {feature.version}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', ...text.secondary, lineHeight: '1.6', margin: '0' }}>
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Info Card */}
          <div style={{ padding: '24px', ...card }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
              About the Roadmap
            </h2>
            <p style={{ fontSize: '14px', ...text.secondary, lineHeight: '1.6', marginBottom: '16px' }}>
              This roadmap reflects our planned features and priorities. Features are organized by version numbers, 
              with higher priority items appearing in earlier versions. We continuously refine our roadmap based on 
              user feedback and business needs.
            </p>
            <p style={{ fontSize: '14px', ...text.secondary, lineHeight: '1.6', margin: '0' }}>
              <strong style={{ ...text.primary }}>Note:</strong> Version numbers and feature priorities are subject to change. 
              Some features may be released earlier or later than indicated, depending on development resources and user needs.
            </p>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

