'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestGmailPage() {
  const { colors, isDark, card, headerCard, headerTint, background, text } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    appsScriptResponse?: any
    config?: any
  } | null>(null)

  const testConnection = async () => {
    console.log('testConnection called')
    setTesting(true)
    setResult(null)

    try {
      console.log('Fetching /api/gmail/test...')
      const response = await fetch('/api/gmail/test')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Response data:', data)
      setResult(data)
    } catch (error) {
      console.error('Error in testConnection:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Sidebar>
      <div 
        style={{ 
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
                  <Mail style={{ width: '24px', height: '24px', color: colors.success }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>
                    Test Gmail Integration
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Verify that Gmail API integration is working correctly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Test Card */}
          <div style={{ padding: '24px', ...card, marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
              Connection Test
            </h2>
            <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '24px' }}>
              Click the button below to test the connection to your Google Apps Script Web App.
            </p>

            <button
              {...getButtonPressHandlers('test-gmail-connection')}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Button clicked, testing connection...')
                testConnection()
              }}
              disabled={testing}
              style={getButtonPressStyle(
                'test-gmail-connection',
                {
                  padding: '12px 24px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: testing ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: testing ? 0.7 : 1,
                  transition: 'opacity 0.2s ease'
                },
                colors.primary,
                colors.primaryHover
              )}
            >
              {testing ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Testing...
                </>
              ) : (
                <>
                  <Mail style={{ width: '16px', height: '16px' }} />
                  Test Connection
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div 
                style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: result.success 
                    ? (isDark ? 'rgba(104, 159, 56, 0.1)' : 'rgba(104, 159, 56, 0.05)')
                    : (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'),
                  border: `1px solid ${result.success ? colors.success : colors.error}`,
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {result.success ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                  ) : (
                    <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                  )}
                  <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    {result.success ? 'Success!' : 'Error'}
                  </h3>
                </div>

                {result.message && (
                  <p style={{ fontSize: '14px', ...text.primary, marginBottom: '12px' }}>
                    {result.message}
                  </p>
                )}

                {result.error && (
                  <p style={{ fontSize: '14px', color: colors.error, marginBottom: '12px' }}>
                    {result.error}
                  </p>
                )}

                {result.appsScriptResponse && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px' }}>
                      Apps Script Response:
                    </p>
                    <pre style={{
                      padding: '12px',
                      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
                      borderRadius: '6px',
                      fontSize: '12px',
                      overflow: 'auto',
                      ...text.secondary
                    }}>
                      {JSON.stringify(result.appsScriptResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {result.config && (
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px' }}>
                      Configuration:
                    </p>
                    <div style={{ fontSize: '12px', ...text.secondary }}>
                      <div style={{ marginBottom: '4px' }}>
                        Web App URL: <span style={{ fontWeight: '600', color: result.config.webAppUrl === 'Set' ? colors.success : colors.error }}>
                          {result.config.webAppUrl}
                        </span>
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        Script ID: <span style={{ fontWeight: '600', color: result.config.scriptId === 'Set' ? colors.success : colors.error }}>
                          {result.config.scriptId}
                        </span>
                      </div>
                      {result.config.scriptIdFromUrl && (
                        <div style={{ marginBottom: '4px' }}>
                          Script ID from URL: <span style={{ fontWeight: '600', ...text.tertiary }}>
                            {result.config.scriptIdFromUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div style={{ padding: '24px', ...card }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
              What This Tests
            </h2>
            <ul style={{ fontSize: '14px', ...text.secondary, lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
              <li>Verifies the Apps Script Web App URL is configured correctly</li>
              <li>Tests that the Apps Script is responding to requests</li>
              <li>Checks that environment variables are set properly</li>
              <li>Confirms the basic connection is working</li>
            </ul>
            <p style={{ fontSize: '14px', ...text.secondary, marginTop: '16px', marginBottom: '0' }}>
              <strong style={{ ...text.primary }}>Note:</strong> This test only verifies the connection. 
              To test actual email sending/receiving, you'll need to authorize Gmail access when you first use those features.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Sidebar>
  )
}

