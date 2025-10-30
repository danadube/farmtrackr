'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { 
  Upload, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react'

export default function GoogleSheetsPage() {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [selectedFarm, setSelectedFarm] = useState<FarmName | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [farmCounts, setFarmCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/contacts/farm-status')
        if (res.ok) {
          const data = await res.json()
          setFarmCounts(data.counts || {})
        }
      } catch (_) {}
    }
    load()
  }, [])

  const handleImport = async () => {
    if (!selectedFarm) return
    
    setIsImporting(true)
    setImportStatus({ type: null, message: '' })
    
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
          message: `Successfully imported ${result.count} contacts from ${selectedFarm}` 
        })
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
                ...card
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isDark ? '#065f46' : '#f0fdf4',
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
                      ...text.primary,
                      margin: '0 0 4px 0'
                    }}
                  >
                    Google Sheets Integration
                  </h1>
                  <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                    Import and export farm contact data
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Note */}
          <div 
            style={{
              marginBottom: '24px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              border: `1px solid ${colors.border}`,
              color: colors.text.secondary,
              fontSize: '13px'
            }}
          >
            Edits made in the app do not auto-sync to Google Sheets. Use Export to push updates. We can add optional "auto-sync on save" later for selected farms.
          </div>

          {/* Status Messages */}
          {importStatus.type && (
            <div 
              style={{
                marginBottom: '24px',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: importStatus.type === 'success' 
                  ? (isDark ? '#064e3b' : '#f0fdf4') 
                  : (isDark ? '#7f1d1d' : '#fef2f2'),
                border: `1px solid ${importStatus.type === 'success' ? colors.success : colors.error}`
              }}
            >
              {importStatus.type === 'success' ? (
                <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
              ) : (
                <AlertCircle style={{ width: '20px', height: '20px', color: colors.error }} />
              )}
              <span style={{ 
                fontSize: '14px', 
                color: importStatus.type === 'success' 
                  ? (isDark ? '#6ee7b7' : '#166534') 
                  : (isDark ? '#fca5a5' : '#991b1b') 
              }}>
                {importStatus.message}
              </span>
            </div>
          )}

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
                      {farmCounts[farmName] ? (
                        <span
                          title={`${farmCounts[farmName]} in app`}
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
                    onClick={handleImport}
                    disabled={isImporting}
                    style={{
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
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isImporting) {
                        e.currentTarget.style.backgroundColor = colors.primaryHover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isImporting) {
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
                    onClick={handleExport}
                    disabled={isExporting}
                    style={{
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
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting) {
                        e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#059669'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting) {
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
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}