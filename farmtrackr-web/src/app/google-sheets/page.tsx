'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { FARM_SPREADSHEETS, FarmName } from '@/lib/farmSpreadsheets'
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
  const [selectedFarm, setSelectedFarm] = useState<FarmName | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

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
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="w-6 h-6 text-green-700" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Google Sheets Integration</h1>
                <p className="text-gray-700 mt-1">Import and export farm contact data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {importStatus.type && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            importStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {importStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        {/* Farm Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Farm</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(FARM_SPREADSHEETS).map(([farmName, config]) => (
              <div
                key={farmName}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedFarm === farmName
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFarm(farmName as FarmName)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{farmName}</h3>
                    <p className="text-sm text-gray-500">Google Sheet</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
                <a
                  href={config.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-2 block"
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Actions for {selectedFarm}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Import */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Import Contacts</h3>
                    <p className="text-sm text-gray-500">Import contacts from Google Sheet</p>
                  </div>
                </div>
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isImporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isImporting ? 'Importing...' : 'Import Contacts'}</span>
                </button>
              </div>

              {/* Export */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Export Contacts</h3>
                    <p className="text-sm text-gray-500">Export contacts to CSV file</p>
                  </div>
                </div>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isExporting ? 'Exporting...' : 'Export Contacts'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">How to Use Google Sheets Integration</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Import:</strong> Select a farm and click "Import Contacts" to sync data from the Google Sheet to FarmTrackr.</p>
            <p><strong>Export:</strong> Export your FarmTrackr contacts to a CSV file for backup or external use.</p>
            <p><strong>Setup:</strong> Make sure your Google Sheets have the correct column headers for proper data mapping.</p>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
