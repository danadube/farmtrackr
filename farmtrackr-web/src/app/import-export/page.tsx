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
  RefreshCw,
  Users,
  DollarSign,
  ExternalLink,
  HelpCircle,
  FileJson
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import Link from 'next/link'

type TabType = 'contacts' | 'transactions'

export default function ImportExportPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [activeTab, setActiveTab] = useState<TabType>('contacts')
  
  // Contact import/export state
  const [contactImportStatus, setContactImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    imported?: number
    updated?: number
    skipped?: number
    errors?: number
    total?: number
    fileName?: string
  } | null>(null)
  const [selectedContactFile, setSelectedContactFile] = useState<File | null>(null)
  const [contactFileValidationError, setContactFileValidationError] = useState<string | null>(null)
  const [isContactDragging, setIsContactDragging] = useState(false)
  const [contactExportStatus, setContactExportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  } | null>(null)
  const [isContactImporting, setIsContactImporting] = useState(false)
  const [isContactExporting, setIsContactExporting] = useState(false)
  const contactFileInputRef = useRef<HTMLInputElement>(null)
  
  // Contact export settings
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedFarm, setSelectedFarm] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [showColumnSelector, setShowColumnSelector] = useState(false)
  
  // Transaction import/export state
  const [transactionImportStatus, setTransactionImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    imported?: number
    updated?: number
    skipped?: number
    errors?: number
  } | null>(null)
  const [selectedTransactionFile, setSelectedTransactionFile] = useState<File | null>(null)
  const [transactionFileValidationError, setTransactionFileValidationError] = useState<string | null>(null)
  const [isTransactionDragging, setIsTransactionDragging] = useState(false)
  const [isTransactionImporting, setIsTransactionImporting] = useState(false)
  const transactionFileInputRef = useRef<HTMLInputElement>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  
  // Available columns for contact export
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
          setSelectedColumns(availableColumns)
        }
      } catch (error) {
        console.error('Error fetching contacts:', error)
      }
    }
    if (activeTab === 'contacts') {
      fetchContacts()
    }
  }, [activeTab])

  // Load transactions count for transactions tab
  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch('/api/transactions')
        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      }
    }
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [activeTab])

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return 'File size exceeds 10MB limit. Please use a smaller file.'
    }
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !['csv', 'xlsx', 'xls'].includes(extension)) {
      return 'Unsupported file format. Please use CSV (.csv) or Excel (.xlsx, .xls) files.'
    }
    return null
  }

  // ========== CONTACT IMPORT/EXPORT HANDLERS ==========
  const handleContactDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsContactDragging(true)
  }

  const handleContactDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsContactDragging(false)
  }

  const processContactFile = async (file: File) => {
    if (!file) return
    const validationError = validateFile(file)
    if (validationError) {
      setContactFileValidationError(validationError)
      setSelectedContactFile(null)
      if (contactFileInputRef.current) {
        contactFileInputRef.current.value = ''
      }
      return
    }

    setContactFileValidationError(null)
    setSelectedContactFile(file)
    setIsContactImporting(true)
    setContactImportStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (response.ok) {
        setContactImportStatus({
          type: 'success',
          message: result.message || `Successfully processed ${result.total || 0} contacts from ${file.name}`,
          imported: result.imported || 0,
          updated: result.updated || 0,
          skipped: result.skipped || 0,
          errors: result.errors || 0,
          total: result.total || 0,
          fileName: file.name
        })
        setSelectedContactFile(null)
        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        let errorMessage = result.error || 'Failed to import contacts'
        if (result.message) errorMessage = result.message
        setContactImportStatus({
          type: 'error',
          message: errorMessage,
          fileName: file.name,
          errors: result.errors || 0,
          total: result.total || 0
        })
        setSelectedContactFile(null)
      }
    } catch (error) {
      let errorMessage = 'Failed to import contacts'
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error: Could not connect to server.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. File may be too large.'
        } else {
          errorMessage = `Import failed: ${error.message}`
        }
      }
      setContactImportStatus({
        type: 'error',
        message: errorMessage,
        fileName: file.name
      })
      setSelectedContactFile(null)
    } finally {
      setIsContactImporting(false)
      if (contactFileInputRef.current) {
        contactFileInputRef.current.value = ''
      }
    }
  }

  const handleContactDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsContactDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processContactFile(files[0])
    }
  }

  const handleContactFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    await processContactFile(file)
  }

  const handleContactExport = async (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    setIsContactExporting(true)
    setContactExportStatus(null)

    try {
      const exportBody: any = { 
        format,
        columns: selectedColumns.length > 0 ? selectedColumns : undefined
      }
      if (selectedFarm !== 'all') exportBody.farm = selectedFarm
      if (startDate) exportBody.startDate = startDate
      if (endDate) exportBody.endDate = endDate
      
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
          : `farmtrackr_contacts_export_${new Date().toISOString().split('T')[0]}.${ext}`
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)

        setContactExportStatus({
          type: 'success',
          message: `Successfully exported contacts to ${fileName}`
        })
      } else {
        const error = await response.json()
        setContactExportStatus({
          type: 'error',
          message: error.error || 'Failed to export contacts'
        })
      }
    } catch (error) {
      setContactExportStatus({
        type: 'error',
        message: `Failed to export contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsContactExporting(false)
    }
  }

  // ========== TRANSACTION IMPORT/EXPORT HANDLERS ==========
  const handleTransactionDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsTransactionDragging(true)
  }

  const handleTransactionDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsTransactionDragging(false)
  }

  const processTransactionFile = async (file: File) => {
    if (!file) return
    const validationError = validateFile(file)
    if (validationError) {
      setTransactionFileValidationError(validationError)
      setSelectedTransactionFile(null)
      if (transactionFileInputRef.current) {
        transactionFileInputRef.current.value = ''
      }
      return
    }

    setTransactionFileValidationError(null)
    setSelectedTransactionFile(file)
    setIsTransactionImporting(true)
    setTransactionImportStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (response.ok) {
        setTransactionImportStatus({
          type: 'success',
          message: `Successfully imported ${result.imported || 0} transactions!`,
          imported: result.imported || 0,
          updated: result.updated || 0,
          skipped: result.skipped || 0,
          errors: result.errors || 0,
        })
        setSelectedTransactionFile(null)
        // Refresh transactions
        const refreshResponse = await fetch('/api/transactions')
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setTransactions(data)
        }
      } else {
        setTransactionImportStatus({
          type: 'error',
          message: result.message || result.error || 'Failed to import transactions'
        })
        setSelectedTransactionFile(null)
      }
    } catch (error) {
      setTransactionImportStatus({
        type: 'error',
        message: `Failed to import transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      setSelectedTransactionFile(null)
    } finally {
      setIsTransactionImporting(false)
      if (transactionFileInputRef.current) {
        transactionFileInputRef.current.value = ''
      }
    }
  }

  const handleTransactionDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsTransactionDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await processTransactionFile(files[0])
    }
  }

  const handleTransactionFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    await processTransactionFile(file)
  }

  const handleTransactionExport = () => {
    const headers = [
      'Property Type', 'Client Type', 'Transaction Type', 'Source', 'Address', 'City',
      'List Price', 'Closed Price', 'List Date', 'Closing Date',
      'Brokerage', 'Commission %', 'Referral %', 'Referral $',
      'Status', 'Referring Agent', 'Referral Fee Received'
    ]

    const rows = transactions.map((t: any) => {
      // Calculate commission values
      const commissionPct = t.commissionPct ? (parseFloat(String(t.commissionPct)) * 100).toFixed(4) : '0'
      const referralPct = t.referralPct ? (parseFloat(String(t.referralPct)) * 100).toFixed(4) : '0'
      
      return [
        t.propertyType || '',
        t.clientType || '',
        t.transactionType || 'Sale',
        t.source || '',
        t.address || '',
        t.city || '',
        (t.listPrice || 0).toString(),
        (t.closedPrice || 0).toString(),
        t.listDate || '',
        t.closedDate || '',
        t.brokerage || '',
        commissionPct,
        referralPct,
        (t.referralDollar || 0).toString(),
        t.status || '',
        t.referringAgent || '',
        (t.referralFeeReceived || 0).toString()
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `real-estate-transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadTemplate = (type: 'contacts' | 'transactions', format: 'csv' | 'excel') => {
    if (type === 'contacts') {
      const link = document.createElement('a')
      link.href = format === 'csv' 
        ? '/api/contacts/import-template?format=csv'
        : '/api/contacts/import-template?format=excel'
      link.download = format === 'csv' ? 'contacts-template.csv' : 'contacts-template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      const link = document.createElement('a')
      link.href = '/templates/transactions-template.csv'
      link.download = 'transactions-template.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Sidebar>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#064e3b' : (colors as any).successTint || '#dcfce7',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Upload style={{ width: '24px', height: '24px', color: colors.success }} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px 0' }}>
                      Import & Export Hub
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                      Import and export your contacts and transaction data
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  {...getButtonPressHandlers('tab-contacts')}
                  onClick={() => setActiveTab('contacts')}
                  style={getButtonPressStyle('tab-contacts', {
                    padding: '10px 20px',
                    backgroundColor: activeTab === 'contacts' ? '#ffffff' : 'transparent',
                    color: activeTab === 'contacts' ? colors.primary : 'rgba(255, 255, 255, 0.85)',
                    border: `1px solid ${activeTab === 'contacts' ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }, activeTab === 'contacts' ? '#ffffff' : 'transparent', 'rgba(255, 255, 255, 0.15)')}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'contacts' && !pressedButtons.has('tab-contacts')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'contacts' && !pressedButtons.has('tab-contacts')) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                    }
                  }}
                >
                  <Users style={{ width: '18px', height: '18px' }} />
                  Contacts
                </button>
                <button
                  {...getButtonPressHandlers('tab-transactions')}
                  onClick={() => setActiveTab('transactions')}
                  style={getButtonPressStyle('tab-transactions', {
                    padding: '10px 20px',
                    backgroundColor: activeTab === 'transactions' ? '#ffffff' : 'transparent',
                    color: activeTab === 'transactions' ? colors.primary : 'rgba(255, 255, 255, 0.85)',
                    border: `1px solid ${activeTab === 'transactions' ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }, activeTab === 'transactions' ? '#ffffff' : 'transparent', 'rgba(255, 255, 255, 0.15)')}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'transactions' && !pressedButtons.has('tab-transactions')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'transactions' && !pressedButtons.has('tab-transactions')) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                    }
                  }}
                >
                  <DollarSign style={{ width: '18px', height: '18px' }} />
                  Transactions
                </button>
              </div>

              {/* Quick Links */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: 'rgba(255, 255, 255, 0.9)' }}>
                <span style={{ fontWeight: '500', color: '#ffffff' }}>Quick Links:</span>
                <Link href="/google-sheets" style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
                    Sync Google Sheets
                  </span>
                </Link>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>•</span>
                <Link href="/contacts?view=google" style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Users style={{ width: '14px', height: '14px' }} />
                    Sync Google Contacts
                  </span>
                </Link>
                {activeTab === 'transactions' && (
                  <>
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>•</span>
                    <Link href="/commissions" style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ExternalLink style={{ width: '14px', height: '14px' }} />
                        View Commissions Page
                      </span>
                    </Link>
                  </>
                )}
              </div>

              <div style={headerDivider} />
            </div>
          </div>

          {/* Contacts Tab Content */}
          {activeTab === 'contacts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {/* Import Contacts Section */}
              <div
                style={{
                  padding: '32px',
                  ...card,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <FileUp style={{ width: '24px', height: '24px', color: colors.success }} />
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Import Contacts
                  </h2>
                  <span 
                    title="Import contact data from CSV or Excel files. Files should have proper column headers."
                    style={{ display: 'inline-flex', cursor: 'help' }}
                  >
                    <HelpCircle 
                      style={{ width: '18px', height: '18px', color: colors.text.tertiary }}
                    />
                  </span>
                </div>

                <div style={{ marginBottom: 'auto' }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '16px', lineHeight: '1.5' }}>
                    Import contacts from CSV or Excel files. Make sure your file has the correct column headers.
                  </p>

                  <div 
                    style={{
                      border: `2px dashed ${isContactDragging ? colors.success : colors.border}`,
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isContactDragging ? (isDark ? '#065f46' : '#f0fdf4') : colors.cardHover,
                      opacity: isContactImporting ? 0.6 : 1
                    }}
                    onDragOver={handleContactDragOver}
                    onDragLeave={handleContactDragLeave}
                    onDrop={handleContactDrop}
                    onMouseEnter={(e) => {
                      if (!isContactDragging && !isContactImporting) {
                        e.currentTarget.style.borderColor = colors.success
                        e.currentTarget.style.backgroundColor = isDark ? '#065f46' : '#f0fdf4'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isContactDragging && !isContactImporting) {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.backgroundColor = colors.cardHover
                      }
                    }}
                    onClick={() => !isContactImporting && contactFileInputRef.current?.click()}
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
                    ref={contactFileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleContactFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Selected File Info */}
                {selectedContactFile && !isContactImporting && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: colors.cardHover,
                    borderRadius: '10px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FileText style={{ width: '18px', height: '18px', color: colors.success }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', ...text.primary, margin: '0 0 2px 0' }}>
                        {selectedContactFile.name}
                      </p>
                      <p style={{ fontSize: '11px', ...text.tertiary, margin: '0' }}>
                        {(selectedContactFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}

                {/* File Validation Error */}
                {contactFileValidationError && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: isDark ? '#7f1d1d' : '#fef2f2',
                    border: `1px solid ${colors.error}`,
                    borderRadius: '10px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <XCircle style={{ width: '18px', height: '18px', color: colors.error }} />
                    <p style={{ fontSize: '13px', color: isDark ? '#fca5a5' : '#dc2626', margin: '0' }}>
                      {contactFileValidationError}
                    </p>
                  </div>
                )}

                {/* Supported Formats */}
                <div style={{ marginBottom: '12px' }}>
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

                {/* Template Downloads */}
                <div style={{ paddingTop: '24px', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.secondary, margin: 0 }}>
                    Download Sample Files
                  </h3>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: 0 }}>
                    Use these samples to ensure your headers and columns match our expected format.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      {...getButtonPressHandlers('template-csv')}
                      onClick={() => handleDownloadTemplate('contacts', 'csv')}
                      style={getButtonPressStyle(
                        'template-csv',
                        {
                          padding: '10px 14px',
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '13px',
                          ...text.secondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        },
                        colors.cardHover,
                        colors.borderHover
                      )}
                    >
                      <Download style={{ width: '14px', height: '14px' }} />
                      Download CSV
                    </button>
                    <button
                      {...getButtonPressHandlers('template-excel')}
                      onClick={() => handleDownloadTemplate('contacts', 'excel')}
                      style={getButtonPressStyle(
                        'template-excel',
                        {
                          padding: '10px 14px',
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          fontSize: '13px',
                          ...text.secondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        },
                        colors.cardHover,
                        colors.borderHover
                      )}
                    >
                      <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
                      Download Excel
                    </button>
                  </div>
                </div>

                {/* Supported Formats */}
                <div style={{ marginBottom: '12px' }}>
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
                {contactExportStatus && (
                  <div 
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: contactExportStatus.type === 'success' 
                        ? (isDark ? '#064e3b' : '#f0fdf4') 
                        : (isDark ? '#7f1d1d' : '#fef2f2'),
                      border: `1px solid ${contactExportStatus.type === 'success' ? colors.success : colors.error}`
                    }}
                  >
                    {contactExportStatus.type === 'success' ? (
                      <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                    ) : (
                      <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                    )}
                    <p style={{ fontSize: '14px', color: contactExportStatus.type === 'success' 
                      ? (isDark ? '#6ee7b7' : '#15803d') 
                      : (isDark ? '#fca5a5' : '#dc2626'), margin: '0' }}>
                      {contactExportStatus.message}
                    </p>
                  </div>
                )}

                {isContactExporting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                    <RefreshCw style={{ width: '20px', height: '20px', color: colors.success, animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: '14px', color: colors.success, margin: '0' }}>
                      Generating export...
                    </p>
                  </div>
                )}

                <div style={{ paddingTop: '24px', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={() => handleContactExport('csv')}
                    disabled={isContactExporting || selectedColumns.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: isContactExporting || selectedColumns.length === 0 ? colors.text.tertiary : colors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isContactExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.success
                      }
                    }}
                  >
                    <FileText style={{ width: '16px', height: '16px' }} />
                    Export as CSV
                  </button>

                  <button
                    onClick={() => handleContactExport('excel')}
                    disabled={isContactExporting || selectedColumns.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: isContactExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.card
                        e.currentTarget.style.borderColor = colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
                        e.currentTarget.style.borderColor = colors.border
                      }
                    }}
                  >
                    <FileSpreadsheet style={{ width: '16px', height: '16px' }} />
                    Export as Excel
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => handleContactExport('json')}
                    disabled={isContactExporting || selectedColumns.length === 0}
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      backgroundColor: colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: isContactExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.card
                        e.currentTarget.style.borderColor = colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
                        e.currentTarget.style.borderColor = colors.border
                      }
                    }}
                  >
                    <FileJson style={{ width: '16px', height: '16px' }} />
                    Export JSON
                  </button>

                  <button
                    onClick={() => handleContactExport('pdf')}
                    disabled={isContactExporting || selectedColumns.length === 0}
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      backgroundColor: colors.cardHover,
                      ...text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: isContactExporting || selectedColumns.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.card
                        e.currentTarget.style.borderColor = colors.primary
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isContactExporting && selectedColumns.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.cardHover
                        e.currentTarget.style.borderColor = colors.border
                      }
                    }}
                  >
                    <Download style={{ width: '16px', height: '16px' }} />
                    Export PDF
                  </button>
                </div>

                <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                  Need more control? Visit the{' '}
                  <Link href="/contacts" style={{ color: colors.primary, textDecoration: 'underline' }}>
                    Contacts hub
                  </Link>
                  {' '}for advanced filtering.
                </p>
              </div>
            </div>
          )}

          {/* Transactions Tab Content */}
          {activeTab === 'transactions' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              {/* Import Transactions Section */}
              <div
                style={{
                  padding: '32px',
                  ...card,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <FileUp style={{ width: '24px', height: '24px', color: colors.success }} />
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Import Transactions
                  </h2>
                  <span 
                    title="Import transaction data from CSV or Excel files. Files should match the commission template format."
                    style={{ display: 'inline-flex', cursor: 'help' }}
                  >
                    <HelpCircle 
                      style={{ width: '18px', height: '18px', color: colors.text.tertiary }}
                    />
                  </span>
                </div>

                <div style={{ marginBottom: 'auto' }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '16px', lineHeight: '1.5' }}>
                    Import transaction data from CSV or Excel files. Make sure your file matches the transaction template format.
                  </p>

                  <div 
                    style={{
                      border: `2px dashed ${isTransactionDragging ? colors.success : colors.border}`,
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isTransactionDragging ? (isDark ? '#065f46' : '#f0fdf4') : colors.cardHover,
                      opacity: isTransactionImporting ? 0.6 : 1
                    }}
                    onDragOver={handleTransactionDragOver}
                    onDragLeave={handleTransactionDragLeave}
                    onDrop={handleTransactionDrop}
                    onMouseEnter={(e) => {
                      if (!isTransactionDragging && !isTransactionImporting) {
                        e.currentTarget.style.borderColor = colors.success
                        e.currentTarget.style.backgroundColor = isDark ? '#065f46' : '#f0fdf4'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isTransactionDragging && !isTransactionImporting) {
                        e.currentTarget.style.borderColor = colors.border
                        e.currentTarget.style.backgroundColor = colors.cardHover
                      }
                    }}
                    onClick={() => !isTransactionImporting && transactionFileInputRef.current?.click()}
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
                    ref={transactionFileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleTransactionFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Selected File Info */}
                {selectedTransactionFile && !isTransactionImporting && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: colors.cardHover,
                    borderRadius: '10px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <FileText style={{ width: '18px', height: '18px', color: colors.success }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', ...text.primary, margin: '0 0 2px 0' }}>
                        {selectedTransactionFile.name}
                      </p>
                      <p style={{ fontSize: '11px', ...text.tertiary, margin: '0' }}>
                        {(selectedTransactionFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}

                {/* File Validation Error */}
                {transactionFileValidationError && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: isDark ? '#7f1d1d' : '#fef2f2',
                    border: `1px solid ${colors.error}`,
                    borderRadius: '10px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <XCircle style={{ width: '18px', height: '18px', color: colors.error }} />
                    <p style={{ fontSize: '13px', color: isDark ? '#fca5a5' : '#dc2626', margin: '0' }}>
                      {transactionFileValidationError}
                    </p>
                  </div>
                )}

                {/* Template Download */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '24px',
                    borderTop: `1px solid ${colors.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.secondary, margin: 0 }}>
                    Download Sample CSV
                  </h3>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: 0 }}>
                    Use this sample to match the expected columns and data formats.
                  </p>
                  <button
                    onClick={() => handleDownloadTemplate('transactions', 'csv')}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '13px',
                      ...text.secondary,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                      e.currentTarget.style.borderColor = colors.borderHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.surface
                      e.currentTarget.style.borderColor = colors.border
                    }}
                  >
                    <Download style={{ width: '16px', height: '16px' }} />
                    Download CSV
                  </button>
                </div>

                {/* Supported Formats */}
                <div style={{ marginBottom: '12px' }}>
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

                {/* Import Options */}
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.secondary, marginBottom: '12px' }}>
                    Alternative Import Methods
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link href="/commissions" style={{ color: colors.primary, textDecoration: 'none', fontSize: '13px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
                        Import from Google Sheets (on Commissions page)
                      </span>
                    </Link>
                    <Link href="/commissions" style={{ color: colors.primary, textDecoration: 'none', fontSize: '13px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Upload style={{ width: '14px', height: '14px' }} />
                        Use AI Commission Sheet Scanner (on Commissions page)
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Status Message */}
                {transactionImportStatus && (
                  <div 
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: transactionImportStatus.type === 'success' 
                        ? (isDark ? '#064e3b' : '#f0fdf4') 
                        : (isDark ? '#7f1d1d' : '#fef2f2'),
                      border: `1px solid ${transactionImportStatus.type === 'success' ? colors.success : colors.error}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: transactionImportStatus.type === 'success' && (transactionImportStatus.imported !== undefined || transactionImportStatus.updated !== undefined) ? '12px' : '0' }}>
                      {transactionImportStatus.type === 'success' ? (
                        <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                      ) : (
                        <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: transactionImportStatus.type === 'success' 
                          ? (isDark ? '#6ee7b7' : '#15803d') 
                          : (isDark ? '#fca5a5' : '#dc2626'), margin: '0 0 4px 0' }}>
                          {transactionImportStatus.message}
                        </p>
                      </div>
                    </div>

                    {/* Detailed Import Results */}
                    {transactionImportStatus.type === 'success' && (transactionImportStatus.imported !== undefined || transactionImportStatus.updated !== undefined) && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: `1px solid ${isDark ? '#047857' : '#bbf7d0'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {transactionImportStatus.imported !== undefined && transactionImportStatus.imported > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: isDark ? '#6ee7b7' : '#15803d' }}>✓ Imported:</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#6ee7b7' : '#15803d' }}>
                              {transactionImportStatus.imported}
                            </span>
                          </div>
                        )}
                        {transactionImportStatus.updated !== undefined && transactionImportStatus.updated > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: isDark ? '#34d399' : '#16a34a' }}>↻ Updated:</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#34d399' : '#16a34a' }}>
                              {transactionImportStatus.updated}
                            </span>
                          </div>
                        )}
                        {transactionImportStatus.skipped !== undefined && transactionImportStatus.skipped > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: isDark ? '#a3a3a3' : '#737373' }}>⊘ Skipped:</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: isDark ? '#a3a3a3' : '#737373' }}>
                              {transactionImportStatus.skipped}
                            </span>
                          </div>
                        )}
                        {transactionImportStatus.errors !== undefined && transactionImportStatus.errors > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: colors.error }}>✗ Errors:</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: colors.error }}>
                              {transactionImportStatus.errors}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isTransactionImporting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: colors.cardHover, borderRadius: '12px' }}>
                    <RefreshCw style={{ width: '20px', height: '20px', color: colors.success, animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: '14px', color: colors.success, margin: '0' }}>
                      Processing import...
                    </p>
                  </div>
                )}
              </div>

              {/* Export Transactions Section */}
              <div style={{ padding: '32px', ...card }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <FileDown style={{ width: '24px', height: '24px', color: colors.success }} />
                  <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    Export Transactions
                  </h2>
                  <span 
                    title="Export your transaction data to CSV. Exports include all currently visible/filtered transactions from the Commissions page."
                    style={{ display: 'inline-flex', cursor: 'help' }}
                  >
                    <HelpCircle 
                      style={{ width: '18px', height: '18px', color: colors.text.tertiary }}
                    />
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <p style={{ fontSize: '14px', ...text.secondary, margin: 0, lineHeight: '1.5' }}>
                    Export your transaction data to CSV format. The export includes all transaction details including commission calculations.
                  </p>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: colors.cardHover,
                      borderRadius: '10px'
                    }}
                  >
                    <p style={{ fontSize: '13px', ...text.secondary, margin: 0 }}>
                      <strong style={{ ...text.primary }}>Note:</strong> For filtered exports or advanced options, use the export feature on the{' '}
                      <Link href="/commissions" style={{ color: colors.primary, textDecoration: 'underline' }}>
                        Commissions page
                      </Link>
                      .
                    </p>
                  </div>

                  <button
                    onClick={handleTransactionExport}
                    disabled={transactions.length === 0}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: transactions.length === 0 ? colors.text.tertiary : colors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: transactions.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (transactions.length > 0) {
                        e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (transactions.length > 0) {
                        e.currentTarget.style.backgroundColor = colors.success
                      }
                    }}
                  >
                    <FileText style={{ width: '16px', height: '16px' }} />
                    Export All Transactions as CSV ({transactions.length} total)
                  </button>

                  <p style={{ fontSize: '12px', ...text.tertiary, margin: 0 }}>
                    For filtered exports (by year, brokerage, etc.), use the export feature on the{' '}
                    <Link href="/commissions" style={{ color: colors.primary, textDecoration: 'underline' }}>
                      Commissions page
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div style={{ marginTop: '24px', padding: '24px', ...card }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: colors.warning, flexShrink: '0', marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
                  Import Tips & Field Mapping
                </h3>
                {activeTab === 'contacts' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                        Required Fields
                      </h4>
                      <ul style={{ fontSize: '13px', ...text.secondary, lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
                        <li>First Name / Last Name <em style={{ ...text.tertiary }}>(or Organization Name)</em></li>
                        <li>At least one name field must be present</li>
                      </ul>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                        Supported Headers
                      </h4>
                      <ul style={{ fontSize: '13px', ...text.secondary, lineHeight: '1.6', margin: '0', paddingLeft: '20px' }}>
                        <li><strong>Name:</strong> Name, Full Name, Organization, Trust</li>
                        <li><strong>Address:</strong> Mailing Address, Address, City, State, Zip Code</li>
                        <li><strong>Contact:</strong> Email, Email 1, Phone, Phone 1-6</li>
                        <li><strong>Site:</strong> Site Address, Site City, Site State, Site Zip Code</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                      Transaction Import Format
                    </h4>
                    <ul style={{ fontSize: '13px', ...text.secondary, lineHeight: '1.6', margin: '0 0 12px 20px' }}>
                      <li>Download the transaction template to see all required and optional fields</li>
                      <li>Common fields: Property Type, Client Type, Address, Closing Date, Brokerage, Commission %</li>
                      <li>Dates should be in MM/DD/YYYY format</li>
                      <li>Currency values can include $ and commas (they'll be automatically cleaned)</li>
                    </ul>
                  </div>
                )}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: colors.cardHover, 
                  borderRadius: '8px',
                  fontSize: '13px',
                  ...text.secondary,
                  lineHeight: '1.6'
                }}>
                  <strong style={{ ...text.primary }}>Note:</strong> Field names are case-insensitive and support common variations. 
                  Existing records with matching identifiers will be updated, not duplicated. 
                  Maximum file size is 10MB. For more options, visit the{' '}
                  {activeTab === 'contacts' ? (
                    <>
                      <Link href="/google-sheets" style={{ color: colors.primary, textDecoration: 'underline' }}>
                        Google Sheets
                      </Link>
                      {' or '}
                      <Link href="/contacts?view=google" style={{ color: colors.primary, textDecoration: 'underline' }}>
                        Google Contacts
                      </Link>
                      {' '}pages for sync options.
                    </>
                  ) : (
                    <>
                      <Link href="/commissions" style={{ color: colors.primary, textDecoration: 'underline' }}>
                        Commissions page
                      </Link>
                      {' '}for Google Sheets import and AI-powered commission sheet scanning.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
