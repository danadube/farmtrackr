'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { 
  Upload, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react'
import { normalizeFarmName } from '@/lib/farmNames'

export default function GoogleSheetsPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [selectedFarm, setSelectedFarm] = useState<FarmName | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [farmCounts, setFarmCounts] = useState<Record<string, number>>({})
  const [totalContacts, setTotalContacts] = useState<number>(0)
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/contacts/farm-status', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setFarmCounts(data.counts || {})
        }
        const statsRes = await fetch('/api/contacts/stats', { cache: 'no-store' })
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setTotalContacts(stats.totalContacts || 0)
          setLastSyncedAt(stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : '')
        }
      } catch (_) {}
    }
    load()
  }, [])

  const handleImport = async () => {
    if (!selectedFarm) return
    
    setIsImporting(true)
    setImportStatus({ type: null, message: '' })
    setShowImportModal(true)
    
    try {
      const response = await fetch('/api/google-sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm: selectedFarm })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setImportStatus({ 
          type: 'success', 
          message: `Successfully imported ${result.imported ?? result.count ?? 0} contacts from ${selectedFarm}` 
        })
        // Refresh counts and totals
        try {
          const [statusRes, statsRes] = await Promise.all([
            fetch('/api/contacts/farm-status', { cache: 'no-store' }),
            fetch('/api/contacts/stats', { cache: 'no-store' })
          ])
          if (statusRes.ok) {
            const data = await statusRes.json()
            setFarmCounts(data.counts || {})
          }
          if (statsRes.ok) {
            const stats = await statsRes.json()
            setTotalContacts(stats.totalContacts || 0)
            setLastSyncedAt(stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleString() : '')
          }
        } catch (_) {}
      } else {
        setImportStatus({ 
          type: 'error', 
          message: result.error || 'Import failed' 
        })
      }
    } catch (error) {
      setImportStatus({ 
        type: 'error', 
        message: 'Failed to connect to Google Sheets' 
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async () => {
    if (!selectedFarm) return
    
    setIsExporting(true)
    setShowExportModal(true)
    
    try {
      const response = await fetch('/api/google-sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm: selectedFarm })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedFarm}-contacts.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
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
            <div 
              style={{
                padding: '24px',
                ...headerCard,
                ...headerTint(colors.success)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isDark ? '#065f46' : (colors as any).successTint || '#dcfce7',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileSpreadsheet style={{ width: '24px', height: '24px', color: colors.success }} />
                </div>
                <div>
                  <h1 
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#ffffff', // White text on colored background
                      margin: '0 0 4px 0'
                    }}
                  >
                    Google Sheets Integration
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Import and export farm contact data
                  </p>
                </div>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

        {/* Totals Card */}
        <div style={{ marginBottom: '24px' }}>
          <div 
            style={{
              padding: '16px',
              ...card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div>
              <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '16px', margin: '0 0 4px 0' }}>
                Total Farm Contacts
              </h3>
              <p style={{ fontSize: '12px', ...text.secondary, margin: 0 }}>
                {lastSyncedAt ? `Last synced: ${lastSyncedAt}` : 'Last synced: —'}
              </p>
            </div>
            <div 
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
                border: `1px solid ${colors.success}`,
                color: colors.success,
                fontWeight: 700,
                fontSize: '16px'
              }}
            >
              {totalContacts.toLocaleString()}
            </div>
          </div>
        </div>

          {/* (Sync note moved into How To section) */}

          {/* Status messages moved into modal */}

          {/* Farm Selection */}
          <div style={{ marginBottom: '32px' }}>
            <h2 
              style={{
                fontSize: '20px',
                fontWeight: '600',
                ...text.primary,
                marginBottom: '16px'
              }}
            >
              Select Farm
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {Object.entries(FARM_SPREADSHEETS).map(([farmName, config]) => (
                <div
                  key={farmName}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: selectedFarm === farmName 
                      ? `2px solid ${colors.success}` 
                      : `1px solid ${colors.border}`,
                    backgroundColor: selectedFarm === farmName 
                      ? (isDark ? '#064e3b' : '#f0fdf4') 
                      : colors.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedFarm === farmName ? card.boxShadow : 'none'
                  }}
                  onClick={() => setSelectedFarm(farmName as FarmName)}
                  onMouseEnter={(e) => {
                    if (selectedFarm !== farmName) {
                      e.currentTarget.style.borderColor = colors.borderHover
                      e.currentTarget.style.boxShadow = card.boxShadow
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFarm !== farmName) {
                      e.currentTarget.style.borderColor = colors.border
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '16px', margin: '0' }}>
                        {farmName}
                      </h3>
                      {farmCounts[normalizeFarmName(farmName)] ? (
                        <span
                          title={`${farmCounts[normalizeFarmName(farmName)]} in app`}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            backgroundColor: isDark ? '#064e3b' : '#ecfdf5',
                            border: `1px solid ${colors.success}`,
                            color: colors.success,
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          Imported
                        </span>
                      ) : null}
                    </div>
                    <ExternalLink style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                  </div>
                  {farmCounts[normalizeFarmName(farmName)] ? (
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0 0 8px 0' }}>
                      {farmCounts[normalizeFarmName(farmName)]} contacts in app
                    </p>
                  ) : (
                    <p style={{ fontSize: '12px', ...text.secondary, margin: '0 0 8px 0' }}>
                      Not yet imported
                    </p>
                  )}
                  <p style={{ fontSize: '12px', ...text.secondary, margin: '0 0 8px 0' }}>
                    Google Sheet
                  </p>
                  <a
                    href={config.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      color: colors.primary,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.textDecoration = 'underline'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.textDecoration = 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Sheet →
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {selectedFarm && (
            <div 
              style={{
                padding: '24px',
                ...card,
                marginBottom: '24px'
              }}
            >
              <h2 
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  ...text.primary,
                  marginBottom: '24px'
                }}
              >
                Actions for {selectedFarm}
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                {/* Import */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: colors.iconBg,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Upload style={{ width: '20px', height: '20px', color: colors.primary }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '16px', margin: '0 0 4px 0' }}>
                        Import Contacts
                      </h3>
                      <p style={{ fontSize: '13px', ...text.secondary, margin: '0' }}>
                        Import contacts from Google Sheet
                      </p>
                    </div>
                  </div>
                  <button
                    {...getButtonPressHandlers('import')}
                    onClick={handleImport}
                    disabled={isImporting}
                    style={getButtonPressStyle('import', {
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: isImporting ? colors.text.tertiary : colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }, isImporting ? colors.text.tertiary : colors.primary, isDark ? '#5F1FFF' : '#6B3AE8')}
                    onMouseEnter={(e) => {
                      if (!isImporting && !pressedButtons.has('import')) {
                        e.currentTarget.style.backgroundColor = isDark ? '#5F1FFF' : '#6B3AE8'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isImporting && !pressedButtons.has('import')) {
                        e.currentTarget.style.backgroundColor = colors.primary
                      }
                    }}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload style={{ width: '16px', height: '16px' }} />
                        Import Contacts
                      </>
                    )}
                  </button>
                </div>

                {/* Export */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: isDark ? '#065f46' : '#f0fdf4',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Download style={{ width: '20px', height: '20px', color: colors.success }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '16px', margin: '0 0 4px 0' }}>
                        Export Contacts
                      </h3>
                      <p style={{ fontSize: '13px', ...text.secondary, margin: '0' }}>
                        Export contacts to CSV file
                      </p>
                    </div>
                  </div>
                  <button
                    {...getButtonPressHandlers('export')}
                    onClick={handleExport}
                    disabled={isExporting}
                    style={getButtonPressStyle('export', {
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: isExporting ? colors.text.tertiary : colors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }, isExporting ? colors.text.tertiary : colors.success, isDark ? '#059669' : '#15803d')}
                    onMouseEnter={(e) => {
                      if (!isExporting && !pressedButtons.has('export')) {
                        e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting && !pressedButtons.has('export')) {
                        e.currentTarget.style.backgroundColor = colors.success
                      }
                    }}
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download style={{ width: '16px', height: '16px' }} />
                        Export Contacts
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div 
            style={{
              padding: '24px',
              backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
              border: `1px solid ${colors.primary}`,
              borderRadius: '12px'
            }}
          >
            <h3 style={{ fontWeight: '600', color: isDark ? '#93c5fd' : '#1e40af', fontSize: '16px', marginBottom: '12px' }}>
              How to Use Google Sheets Integration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: isDark ? '#bfdbfe' : '#1e3a8a' }}>
              <p style={{ margin: '0' }}>
                <strong>Import:</strong> Select a farm and click "Import Contacts" to sync data from the Google Sheet to FarmTrackr.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Export:</strong> Export your FarmTrackr contacts to a CSV file for backup or external use.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Setup:</strong> Make sure your Google Sheets have the correct column headers for proper data mapping.
              </p>
              <p style={{ margin: '0' }}>
                <strong>Note:</strong> Edits made in the app do not auto-sync to Google Sheets. Use Export to push updates. We can add optional "auto-sync on save" later for selected farms.
              </p>
            </div>
          </div>
        </div>
      </div>
    {/* Import Modal */}
    {showImportModal && (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowImportModal(false) }}
      >
        <div style={{ ...card, padding: '24px', maxWidth: '520px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {importStatus.type === 'error' ? (
              <AlertCircle style={{ width: '20px', height: '20px', color: colors.error }} />
            ) : (
              <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
            )}
            <h3 style={{ fontSize: '16px', fontWeight: 600, ...text.primary, margin: 0 }}>Import Status</h3>
          </div>
          <p style={{ fontSize: '14px', ...text.secondary, margin: 0 }}>
            {isImporting ? 'Importing... This may take a moment.' : (importStatus.message || 'Done.')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
            <button
              {...getButtonPressHandlers('closeImport')}
              onClick={() => setShowImportModal(false)}
              disabled={isImporting}
              style={getButtonPressStyle('closeImport', {
                padding: '10px 16px',
                backgroundColor: colors.cardHover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                ...text.secondary,
                cursor: isImporting ? 'not-allowed' : 'pointer'
              }, colors.cardHover, colors.borderHover)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    {/* Export Modal */}
    {showExportModal && (
      <div
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) setShowExportModal(false) }}
      >
        <div style={{ ...card, padding: '24px', maxWidth: '520px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Download style={{ width: '20px', height: '20px', color: colors.success }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, ...text.primary, margin: 0 }}>Export Status</h3>
          </div>
          <p style={{ fontSize: '14px', ...text.secondary, margin: 0 }}>
            {isExporting ? 'Exporting... Your file will download shortly.' : 'Export completed or started.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px' }}>
            <button
              {...getButtonPressHandlers('closeExport')}
              onClick={() => setShowExportModal(false)}
              disabled={isExporting}
              style={getButtonPressStyle('closeExport', {
                padding: '10px 16px',
                backgroundColor: colors.cardHover,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                ...text.secondary,
                cursor: isExporting ? 'not-allowed' : 'pointer'
              }, colors.cardHover, colors.borderHover)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </Sidebar>
  )
}