'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileDown,
  FileUp,
  RefreshCw
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'

export default function ImportExportPage() {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    importedCount?: number
  } | null>(null)
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Export settings
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedFarm, setSelectedFarm] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  
  // Available columns for export
  const availableColumns = [
    'First Name',
    'Last Name',
    'Farm',
    'Mailing Address',
    'City',
    'State',
    'Zip Code',
    'Email 1',
    'Email 2',
    'Phone 1',
    'Phone 2',
    'Phone 3',
    'Phone 4',
    'Phone 5',
    'Phone 6',
    'Site Address',
    'Site City',
    'Site State',
    'Site Zip Code',
    'Notes',
    'Date Created',
    'Date Modified',
  ]
  
  // Get unique farms for filter
  const uniqueFarms = Array.from(new Set(contacts.map(c => c.farm).filter(Boolean))).sort()
  
  // Load contacts for farm filter
  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch('/api/contacts')
        if (response.ok) {
          const data = await response.json()
          const contactsWithDates = data.map((contact: any) => ({
            ...contact,
            dateCreated: new Date(contact.dateCreated),
            dateModified: new Date(contact.dateModified),
          }))
          setContacts(contactsWithDates)
          // Initialize with all columns selected
          setSelectedColumns(availableColumns)
        }
      } catch (error) {
        console.error('Error fetching contacts:', error)
      }
    }
    fetchContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setImportStatus({
          type: 'success',
          message: result.message || `Successfully imported ${result.imported} contacts from ${file.name}`,
          importedCount: result.imported
        })
        // Refresh the page after successful import to show new contacts
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setImportStatus({
          type: 'error',
          message: result.error || 'Failed to import contacts'
        })
      }
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: `Failed to import contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleExport = async (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    setIsExporting(true)
    setExportStatus(null)

    try {
      const exportBody: any = { 
        format,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined
      }
      
      // Add filters
      if (selectedFarm !== 'all') {
        exportBody.farm = selectedFarm
      }
      if (startDate) {
        exportBody.startDate = startDate
      }
      if (endDate) {
        exportBody.endDate = endDate
      }
      
      const response = await fetch('/api/contacts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportBody),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const contentDisposition = response.headers.get('Content-Disposition')
        const ext = format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : format === 'json' ? 'json' : 'pdf'
        const fileName = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : `farmtrackr_export_${new Date().toISOString().split('T')[0]}.${ext}`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)

        setExportStatus({
          type: 'success',
          message: `Successfully exported contacts to ${fileName}`
        })
      } else {
        const error = await response.json()
        setExportStatus({
          type: 'error',
          message: error.error || 'Failed to export contacts'
        })
      }
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: `Failed to export contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
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
            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Upload style={{ width: '24px', height: '24px', color: colors.success }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0 0 4px 0' }}>
                    Import & Export
                  </h1>
                  <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                    Import contacts from files or export your data
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Import Section */}
            <div style={{ padding: '32px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <FileUp style={{ width: '24px', height: '24px', color: colors.success }} />
                <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Import Contacts
                </h2>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '16px', lineHeight: '1.5' }}>
                  Import contacts from CSV or Excel files. Make sure your file has the correct column headers.
                </p>

                <div 
                  style={{
                    border: `2px dashed ${colors.border}`,
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: colors.cardHover
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.success
                    e.currentTarget.style.backgroundColor = isDark ? '#065f46' : '#f0fdf4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload style={{ width: '32px', height: '32px', color: colors.text.tertiary, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '500', ...text.primary, marginBottom: '4px' }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ fontSize: '12px', ...text.secondary, margin: '0' }}>
                    CSV, XLSX up to 10MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Supported Formats */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.secondary, marginBottom: '12px' }}>
                  Supported Formats
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                    <span style={{ fontSize: '14px', ...text.secondary }}>CSV (.csv)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                    <span style={{ fontSize: '14px', ...text.secondary }}>Excel (.xlsx, .xls)</span>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {importStatus && (
                <div 
                  style={{
                    padding: '12px 16px',
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
                    <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                  )}
                  <p style={{ fontSize: '14px', color: importStatus.type === 'success' 
                    ? (isDark ? '#6ee7b7' : '#15803d') 
                    : (isDark ? '#fca5a5' : '#dc2626'), margin: '0' }}>
                    {importStatus.message}
                  </p>
                </div>
              )}

              {isImporting && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                  <RefreshCw style={{ width: '20px', height: '20px', color: colors.success, animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '14px', color: colors.success, margin: '0' }}>
                    Processing import...
                  </p>
                </div>
              )}
            </div>

            {/* Export Section */}
            <div style={{ padding: '32px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <FileDown style={{ width: '24px', height: '24px', color: colors.success }} />
                <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Export Contacts
                </h2>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '16px', lineHeight: '1.5' }}>
                  Export your contacts with customizable filters and column selection.
                </p>

                {/* Export Filters */}
                <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {uniqueFarms.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', ...text.secondary, marginBottom: '6px' }}>
                        Filter by Farm
                      </label>
                      <select
                        value={selectedFarm}
                        onChange={(e) => setSelectedFarm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '14px',
                          backgroundColor: colors.card,
                          color: colors.text.primary,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Farms</option>
                        {uniqueFarms.map(farm => (
                          <option key={farm} value={farm}>{farm}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', ...text.secondary, marginBottom: '8px' }}>
                      Filter by Date Created (Optional)
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1' }}>
                        <label style={{ display: 'block', fontSize: '11px', ...text.tertiary, marginBottom: '4px' }}>
                          From
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            fontSize: '13px',
                            backgroundColor: colors.card,
                            color: colors.text.primary,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ flex: '1' }}>
                        <label style={{ display: 'block', fontSize: '11px', ...text.tertiary, marginBottom: '4px' }}>
                          To
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            fontSize: '13px',
                            backgroundColor: colors.card,
                            color: colors.text.primary,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', ...text.tertiary, marginTop: '6px', marginBottom: '0' }}>
                      Export contacts created within this date range
                    </p>
                  </div>
                </div>

                {/* Column Selector */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '500', ...text.secondary }}>
                      Export Columns
                    </label>
                    <button
                      onClick={() => setShowColumnSelector(!showColumnSelector)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        ...text.secondary,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {showColumnSelector ? 'Hide' : 'Customize'}
                    </button>
                  </div>
                  
                  {showColumnSelector && (
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: colors.cardHover, 
                      borderRadius: '10px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <button
                          onClick={() => setSelectedColumns(availableColumns)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            backgroundColor: colors.border,
                            ...text.secondary,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedColumns([])}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            backgroundColor: colors.border,
                            ...text.secondary,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Clear All
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {availableColumns.map(col => (
                          <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(col)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedColumns([...selectedColumns, col])
                                } else {
                                  setSelectedColumns(selectedColumns.filter(c => c !== col))
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '12px', ...text.secondary }}>{col}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!showColumnSelector && (
                    <p style={{ fontSize: '12px', ...text.tertiary }}>
                      {selectedColumns.length} of {availableColumns.length} columns selected
                    </p>
                  )}
                </div>

                {/* Export Format Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting || selectedColumns.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isExporting || selectedColumns.length === 0 ? colors.text.tertiary : colors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
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
                        <FileText style={{ width: '16px', height: '16px' }} />
                        Export as CSV
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting || selectedColumns.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isExporting || selectedColumns.length === 0 ? colors.text.tertiary : colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.borderHover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
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
                        <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
                        Export as Excel
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleExport('json')}
                    disabled={isExporting || selectedColumns.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isExporting || selectedColumns.length === 0 ? colors.text.tertiary : colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.borderHover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
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
                        <FileText style={{ width: '16px', height: '16px' }} />
                        Export as JSON
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting || selectedColumns.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isExporting || selectedColumns.length === 0 ? colors.text.tertiary : colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.borderHover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
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
                        <FileText style={{ width: '16px', height: '16px' }} />
                        Export as PDF
                      </>
                    )}
                  </button>
                </div>
              </div>


              {/* Status Message */}
              {exportStatus && (
                <div 
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: exportStatus.type === 'success' 
                      ? (isDark ? '#064e3b' : '#f0fdf4') 
                      : (isDark ? '#7f1d1d' : '#fef2f2'),
                    border: `1px solid ${exportStatus.type === 'success' ? colors.success : colors.error}`
                  }}
                >
                  {exportStatus.type === 'success' ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                  ) : (
                    <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                  )}
                  <p style={{ fontSize: '14px', color: exportStatus.type === 'success' 
                    ? (isDark ? '#6ee7b7' : '#15803d') 
                    : (isDark ? '#fca5a5' : '#dc2626'), margin: '0' }}>
                    {exportStatus.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div style={{ marginTop: '24px', padding: '24px', ...card }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: colors.warning, flexShrink: '0', marginTop: '2px' }} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                  Import Tips
                </h3>
                <ul style={{ fontSize: '14px', ...text.secondary, lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
                  <li>Ensure your file includes headers in the first row</li>
                  <li>Required fields: First Name, Last Name</li>
                  <li>Optional fields: Email, Phone, Farm, Address, etc.</li>
                  <li>Dates should be in MM/DD/YYYY format</li>
                  <li>Maximum file size: 10MB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}