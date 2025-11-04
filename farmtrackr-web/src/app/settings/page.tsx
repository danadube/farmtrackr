'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  User, 
  Bell, 
  Database, 
  Palette, 
  Globe, 
  Shield,
  Save,
  CheckCircle,
  Link as LinkIcon,
  X,
  ExternalLink
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useTheme } from '@/components/ThemeProvider'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { getVersionInfo } from '@/lib/version'

export default function SettingsPage() {
  const { theme, setTheme: setThemeState } = useTheme()
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data' | 'appearance' | 'google' | 'about'>('general')
  const [googleStatus, setGoogleStatus] = useState<{
    connected: boolean
    hasAccessToken: boolean
    hasRefreshToken: boolean
    expired: boolean
    loading: boolean
  }>({
    connected: false,
    hasAccessToken: false,
    hasRefreshToken: false,
    expired: false,
    loading: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<{
    farmName: string
    defaultFarm: string
    language: string
    timezone: string
    dateFormat: string
    emailNotifications: boolean
    duplicateAlerts: boolean
    weeklyReports: boolean
    dataRetention: string
    autoBackup: boolean
    theme: 'light' | 'dark' | 'system'
    compactMode: boolean
  }>({
    farmName: '',
    defaultFarm: '',
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    duplicateAlerts: true,
    weeklyReports: false,
    dataRetention: '365',
    autoBackup: true,
    theme: theme,
    compactMode: false
  })

  // Sync theme when it changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme }))
  }, [theme])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 3000)
  }

  const handleChange = (key: string, value: any) => {
    if (key === 'theme') {
      // Apply theme immediately when changed
      setThemeState(value as 'light' | 'dark' | 'system')
      setSettings(prev => ({ ...prev, [key]: value }))
    } else {
      setSettings(prev => ({ ...prev, [key]: value }))
    }
  }

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'google', label: 'Google Integration', icon: Globe },
    { id: 'about', label: 'About', icon: Shield }
  ]

  // Check URL parameters for OAuth callback messages
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const connected = urlParams.get('connected')
    const error = urlParams.get('error')
    
    if (connected === 'google' || error) {
      // Clean URL
      window.history.replaceState({}, '', '/settings')
      // Switch to Google tab if not already there
      if (connected === 'google') {
        setActiveTab('google')
      }
    }
  }, [])

  // Check Google OAuth status
  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const response = await fetch('/api/google/oauth/status')
        if (response.ok) {
          const status = await response.json()
          setGoogleStatus({
            ...status,
            loading: false
          })
        }
      } catch (error) {
        console.error('Failed to check Google status:', error)
        setGoogleStatus(prev => ({ ...prev, loading: false }))
      }
    }
    
    checkGoogleStatus()
    
    let intervalId: NodeJS.Timeout | undefined = undefined
    if (activeTab === 'google') {
      intervalId = setInterval(checkGoogleStatus, 2000)
    }
    
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId)
      }
    }
  }, [activeTab])

  const handleConnectGoogle = () => {
    window.location.href = '/api/google/oauth/authorize'
  }

  const handleDisconnectGoogle = async () => {
    try {
      const response = await fetch('/api/google/oauth/disconnect', {
        method: 'POST'
      })
      if (response.ok) {
        setGoogleStatus({
          connected: false,
          hasAccessToken: false,
          hasRefreshToken: false,
          expired: false,
          loading: false
        })
      }
    } catch (error) {
      console.error('Failed to disconnect Google:', error)
    }
  }

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#1e3a8a' : (colors as any).primaryTint || '#dbeafe',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Settings style={{ width: '24px', height: '24px', color: colors.primary }} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>
                      Settings
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                      Manage your application preferences
                    </p>
                  </div>
                </div>
                <button
                  {...getButtonPressHandlers('save')}
                  onClick={handleSave}
                  disabled={isSaving}
                  style={getButtonPressStyle('save', {
                    padding: '12px 24px',
                    backgroundColor: isSaving ? colors.text.tertiary : colors.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'relative'
                  }, isSaving ? colors.text.tertiary : colors.success, isDark ? '#059669' : '#15803d')}
                  onMouseEnter={(e) => {
                    if (!isSaving && !pressedButtons.has('save')) {
                      e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving && !pressedButtons.has('save')) {
                      e.currentTarget.style.backgroundColor = colors.success
                    }
                  }}
                >
                  {showSaved ? (
                    <>
                      <CheckCircle style={{ width: '16px', height: '16px' }} />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save style={{ width: '16px', height: '16px' }} />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
            {/* Settings Sidebar */}
            <div style={{ ...card, padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      {...getButtonPressHandlers(`tab-${tab.id}`)}
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={getButtonPressStyle(`tab-${tab.id}`, {
                        padding: '12px 16px',
                        backgroundColor: isActive 
                          ? (isDark ? '#064e3b' : '#f0fdf4') 
                          : 'transparent',
                        color: isActive ? colors.success : colors.text.secondary,
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: isActive ? '600' : '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textAlign: 'left'
                      }, isActive ? (isDark ? '#064e3b' : '#f0fdf4') : 'transparent', colors.cardHover)}
                      onMouseEnter={(e) => {
                        if (!isActive && !pressedButtons.has(`tab-${tab.id}`)) {
                          e.currentTarget.style.backgroundColor = colors.cardHover
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive && !pressedButtons.has(`tab-${tab.id}`)) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <Icon style={{ width: '16px', height: '16px' }} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Settings Content */}
            <div style={{ padding: '32px', ...card }}>
              {/* General Settings */}
              {activeTab === 'general' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                    General Settings
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                        Agent Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={settings.farmName}
                        onChange={(e) => handleChange('farmName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          backgroundColor: colors.card,
                          color: colors.text.primary,
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.success
                          e.target.style.outline = 'none'
                          e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.border
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                      <p style={{ fontSize: '12px', ...text.tertiary, marginTop: '4px', marginBottom: '0' }}>
                        Will be displayed in the welcome screen (e.g., "Welcome Back, Agent Name")
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                        Brokerage Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter brokerage name"
                        value={settings.defaultFarm}
                        onChange={(e) => handleChange('defaultFarm', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          backgroundColor: colors.card,
                          color: colors.text.primary,
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = colors.success
                          e.target.style.outline = 'none'
                          e.target.style.boxShadow = `0 0 0 3px ${colors.success}20`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = colors.border
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                      <p style={{ fontSize: '12px', ...text.tertiary, marginTop: '4px', marginBottom: '0' }}>
                        Will be displayed below your name in the welcome screen
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                          Language
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleChange('language', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '10px',
                            fontSize: '14px',
                            backgroundColor: colors.card,
                            color: colors.text.primary,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                          Timezone
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleChange('timezone', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '10px',
                            fontSize: '14px',
                            backgroundColor: colors.card,
                            color: colors.text.primary,
                            cursor: 'pointer'
                          }}
                        >
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="America/Denver">Mountain Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/New_York">Eastern Time</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                        Date Format
                      </label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          backgroundColor: colors.card,
                          color: colors.text.primary,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                    Notification Preferences
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {[
                      { key: 'emailNotifications', title: 'Email Notifications', desc: 'Receive email notifications for important updates' },
                      { key: 'duplicateAlerts', title: 'Duplicate Alerts', desc: 'Get notified when potential duplicate contacts are detected' },
                      { key: 'weeklyReports', title: 'Weekly Reports', desc: 'Receive weekly summary reports via email' }
                    ].map(({ key, title, desc }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                            {title}
                          </h3>
                          <p style={{ fontSize: '13px', ...text.secondary, margin: '0' }}>
                            {desc}
                          </p>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                          <input
                            type="checkbox"
                            checked={settings[key as keyof typeof settings] as boolean}
                            onChange={(e) => handleChange(key, e.target.checked)}
                            style={{ opacity: '0', width: '0', height: '0' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              cursor: 'pointer',
                              top: '0',
                              left: '0',
                              right: '0',
                              bottom: '0',
                              backgroundColor: (settings[key as keyof typeof settings] as boolean) ? colors.success : colors.border,
                              borderRadius: '24px',
                              transition: 'background-color 0.3s ease'
                            }}
                          >
                            <span
                              style={{
                                position: 'absolute',
                                height: '18px',
                                width: '18px',
                                left: '3px',
                                bottom: '3px',
                                backgroundColor: '#ffffff',
                                borderRadius: '50%',
                                transition: 'transform 0.3s ease',
                                transform: (settings[key as keyof typeof settings] as boolean) ? 'translateX(24px)' : 'translateX(0)'
                              }}
                            />
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Management Settings */}
              {activeTab === 'data' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                    Data Management
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                        Data Retention Period (days)
                      </label>
                      <input
                        type="number"
                        value={settings.dataRetention}
                        onChange={(e) => handleChange('dataRetention', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          backgroundColor: colors.card,
                          color: colors.text.primary
                        }}
                      />
                      <p style={{ fontSize: '12px', ...text.tertiary, marginTop: '4px' }}>
                        Contacts older than this will be archived
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                          Automatic Backups
                        </h3>
                        <p style={{ fontSize: '13px', ...text.secondary, margin: '0' }}>
                          Automatically backup your data on a regular schedule
                        </p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => handleChange('autoBackup', e.target.checked)}
                          style={{ opacity: '0', width: '0', height: '0' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: '0',
                            left: '0',
                            right: '0',
                            bottom: '0',
                            backgroundColor: settings.autoBackup ? colors.success : colors.border,
                            borderRadius: '24px',
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: '3px',
                              bottom: '3px',
                              backgroundColor: '#ffffff',
                              borderRadius: '50%',
                              transition: 'transform 0.3s ease',
                              transform: settings.autoBackup ? 'translateX(24px)' : 'translateX(0)'
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                    Appearance Settings
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', ...text.secondary, marginBottom: '12px' }}>
                        Theme Preference
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {[
                          { value: 'light', label: 'Light', icon: '☀️' },
                          { value: 'dark', label: 'Dark', icon: '🌙' },
                          { value: 'system', label: 'System', icon: '🖥️' }
                        ].map((themeOption) => (
                          <button
                            {...getButtonPressHandlers(`theme-${themeOption.value}`)}
                            key={themeOption.value}
                            onClick={() => handleChange('theme', themeOption.value)}
                            style={{
                              flex: '1',
                              padding: '16px',
                              borderRadius: '10px',
                              border: settings.theme === themeOption.value 
                                ? `2px solid ${colors.primary}` 
                                : `1px solid ${colors.border}`,
                              backgroundColor: settings.theme === themeOption.value 
                                ? (isDark ? '#1e3a8a' : '#eff6ff') 
                                : colors.card,
                              color: settings.theme === themeOption.value 
                                ? (isDark ? '#93c5fd' : '#1e40af') 
                                : colors.text.secondary,
                              fontSize: '14px',
                              fontWeight: settings.theme === themeOption.value ? '600' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              ...getButtonPressStyle(
                                `theme-${themeOption.value}`,
                                {},
                                settings.theme === themeOption.value 
                                  ? (isDark ? '#1e3a8a' : '#eff6ff') 
                                  : colors.card,
                                colors.cardHover
                              )
                            }}
                            onMouseEnter={(e) => {
                              if (settings.theme !== themeOption.value && !pressedButtons.has(`theme-${themeOption.value}`)) {
                                e.currentTarget.style.backgroundColor = colors.cardHover
                                e.currentTarget.style.borderColor = colors.borderHover
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (settings.theme !== themeOption.value && !pressedButtons.has(`theme-${themeOption.value}`)) {
                                e.currentTarget.style.backgroundColor = colors.card
                                e.currentTarget.style.borderColor = colors.border
                              }
                            }}
                          >
                            <span style={{ fontSize: '24px' }}>{themeOption.icon}</span>
                            <span>{themeOption.label}</span>
                          </button>
                        ))}
                      </div>
                      <p style={{ fontSize: '12px', ...text.tertiary, marginTop: '8px', marginBottom: '0' }}>
                        Choose your preferred color scheme
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                          Compact Mode
                        </h3>
                        <p style={{ fontSize: '13px', ...text.secondary, margin: '0' }}>
                          Use more compact spacing for better screen utilization
                        </p>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                        <input
                          type="checkbox"
                          checked={settings.compactMode}
                          onChange={(e) => handleChange('compactMode', e.target.checked)}
                          style={{ opacity: '0', width: '0', height: '0' }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: '0',
                            left: '0',
                            right: '0',
                            bottom: '0',
                            backgroundColor: settings.compactMode ? colors.success : colors.border,
                            borderRadius: '24px',
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              height: '18px',
                              width: '18px',
                              left: '3px',
                              bottom: '3px',
                              backgroundColor: '#ffffff',
                              borderRadius: '50%',
                              transition: 'transform 0.3s ease',
                              transform: settings.compactMode ? 'translateX(24px)' : 'translateX(0)'
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* About Settings */}
              {/* Google Integration Settings */}
              {activeTab === 'google' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                    Google Integration
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Connection Status */}
                    <div style={{ padding: '24px', backgroundColor: colors.cardHover, borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Globe style={{ width: '24px', height: '24px', color: colors.primary }} />
                          <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                            Google Account Connection
                          </h3>
                        </div>
                        {googleStatus.loading ? (
                          <span style={{ fontSize: '13px', ...text.tertiary }}>Checking...</span>
                        ) : googleStatus.connected ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle style={{ width: '18px', height: '18px', color: colors.success }} />
                            <span style={{ fontSize: '13px', color: colors.success, fontWeight: '500' }}>Connected</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', ...text.secondary }}>Not Connected</span>
                        )}
                      </div>
                      
                      {googleStatus.connected && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', ...text.secondary }}>Access Token:</span>
                              <span style={{ fontSize: '13px', color: googleStatus.hasAccessToken ? colors.success : colors.error }}>
                                {googleStatus.hasAccessToken ? 'Active' : 'Missing'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', ...text.secondary }}>Refresh Token:</span>
                              <span style={{ fontSize: '13px', color: googleStatus.hasRefreshToken ? colors.success : colors.error }}>
                                {googleStatus.hasRefreshToken ? 'Available' : 'Missing'}
                              </span>
                            </div>
                            {googleStatus.expired && (
                              <div style={{ padding: '8px', backgroundColor: isDark ? '#7f1d1d' : '#fef2f2', borderRadius: '8px', marginTop: '8px' }}>
                                <span style={{ fontSize: '12px', color: colors.error }}>
                                  Token expired. Reconnect to refresh access.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connection Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {googleStatus.connected ? (
                        <button
                          {...getButtonPressHandlers('disconnectGoogle')}
                          onClick={handleDisconnectGoogle}
                          style={getButtonPressStyle('disconnectGoogle', {
                            padding: '12px 24px',
                            backgroundColor: colors.error,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }, colors.error, isDark ? '#991b1b' : '#dc2626')}
                          onMouseEnter={(e) => {
                            if (!pressedButtons.has('disconnectGoogle')) {
                              e.currentTarget.style.backgroundColor = isDark ? '#991b1b' : '#dc2626'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!pressedButtons.has('disconnectGoogle')) {
                              e.currentTarget.style.backgroundColor = colors.error
                            }
                          }}
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                          Disconnect Google Account
                        </button>
                      ) : (
                        <button
                          {...getButtonPressHandlers('connectGoogle')}
                          onClick={handleConnectGoogle}
                          style={getButtonPressStyle('connectGoogle', {
                            padding: '12px 24px',
                            backgroundColor: colors.primary,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }, colors.primary, colors.primaryHover || (isDark ? '#5F1FFF' : '#6B3AE8'))}
                          onMouseEnter={(e) => {
                            if (!pressedButtons.has('connectGoogle')) {
                              e.currentTarget.style.backgroundColor = colors.primaryHover || (isDark ? '#5F1FFF' : '#6B3AE8')
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!pressedButtons.has('connectGoogle')) {
                              e.currentTarget.style.backgroundColor = colors.primary
                            }
                          }}
                        >
                          <LinkIcon style={{ width: '16px', height: '16px' }} />
                          Connect Google Account
                        </button>
                      )}
                    </div>

                    {/* Information */}
                    <div style={{ padding: '16px', backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderRadius: '12px', border: `1px solid ${colors.primary}` }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#93c5fd' : '#1e40af', marginBottom: '8px' }}>
                        What does Google Integration enable?
                      </h3>
                      <ul style={{ fontSize: '13px', color: isDark ? '#bfdbfe' : '#1e3a8a', lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
                        <li>Import contacts from Google Sheets (authenticated access)</li>
                        <li>Export contacts to Google Sheets</li>
                        <li>Sync with Google Contacts</li>
                        <li>Access private Google Sheets (not just public)</li>
                      </ul>
                      <p style={{ fontSize: '12px', color: isDark ? '#93c5fd' : '#3b82f6', marginTop: '12px', marginBottom: '0' }}>
                        Your Google credentials are stored securely and only used to access Google Sheets and Contacts.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                    About FarmTrackr
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ padding: '24px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
                        Application Information
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', ...text.secondary }}>App Name:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', ...text.primary }}>
                            {getVersionInfo().name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', ...text.secondary }}>Version:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', ...text.primary }}>
                            {getVersionInfo().version}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', ...text.secondary }}>Build Number:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', ...text.primary }}>
                            {getVersionInfo().build}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', ...text.secondary }}>Last Updated:</span>
                          <span style={{ fontSize: '14px', fontWeight: '500', ...text.primary }}>
                            {getVersionInfo().lastUpdated}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '24px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
                        System Information
                      </h3>
                      <p style={{ fontSize: '14px', ...text.secondary, lineHeight: '1.6' }}>
                        FarmTrackr is a comprehensive farm contact management system designed to help you manage 
                        contacts across multiple farms efficiently. Built with Next.js, React, and PostgreSQL.
                      </p>
                    </div>

                    <div style={{ padding: '24px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
                        Version Update Instructions
                      </h3>
                      <div style={{ fontSize: '12px', ...text.tertiary, lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '8px' }}><strong>To update version number:</strong></p>
                        <ol style={{ paddingLeft: '20px', margin: '0' }}>
                          <li style={{ marginBottom: '4px' }}>Update version in <code>package.json</code></li>
                          <li style={{ marginBottom: '4px' }}>Update BUILD_NUMBER in <code>src/lib/version.ts</code></li>
                          <li style={{ marginBottom: '4px' }}>Update LAST_UPDATED date in <code>src/lib/version.ts</code></li>
                          <li>Rebuild and redeploy the application</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}