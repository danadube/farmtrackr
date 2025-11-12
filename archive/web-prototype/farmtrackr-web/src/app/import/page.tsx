'use client'

import { useState, useRef } from 'react'
import { FarmContact } from '@/types/contact'
import { importCSV, importExcel, exportToCSV, exportToExcel, ImportResult } from '@/lib/importExport'

export default function ImportExportPage() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      let result: ImportResult
      if (file.name.endsWith('.csv')) {
        result = await importCSV(file)
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        result = await importExcel(file)
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.')
      }
      
      setImportResult(result)
    } catch (error) {
      setImportResult({
        success: false,
        contacts: [],
        errors: [error.message],
        totalRows: 0
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleSaveImportedContacts = async () => {
    if (!importResult?.contacts.length) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: importResult.contacts })
      })

      const result = await response.json()
      if (result.success) {
        setImportResult(null)
        alert(`Successfully imported ${result.created} contacts!`)
      } else {
        alert(`Import completed with errors: ${result.errors.join(', ')}`)
      }
    } catch (error) {
      alert('Failed to save imported contacts')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/contacts')
      const contacts: FarmContact[] = await response.json()
      const csv = exportToCSV(contacts)
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'farmtrackr-contacts.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/contacts')
      const contacts: FarmContact[] = await response.json()
      exportToExcel(contacts)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Import & Export</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Import Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Contacts</h2>
            <p className="text-gray-600 mb-6">
              Import contacts from CSV or Excel files. Supported formats: .csv, .xlsx, .xls
            </p>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isImporting ? 'Importing...' : 'Choose File'}
              </button>
              
              {importResult && (
                <div className={`p-4 rounded-lg ${
                  importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className={`font-semibold ${
                    importResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Import {importResult.success ? 'Successful' : 'Failed'}
                  </h3>
                  <p className={`text-sm ${
                    importResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Processed {importResult.totalRows} rows, found {importResult.contacts.length} contacts
                  </p>
                  
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-800">Errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {importResult.success && importResult.contacts.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={handleSaveImportedContacts}
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? 'Saving...' : `Save ${importResult.contacts.length} Contacts`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Contacts</h2>
            <p className="text-gray-600 mb-6">
              Export all contacts to CSV or Excel format for backup or external use.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export to CSV
              </button>
              
              <button
                onClick={handleExportExcel}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Sample Template */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Template</h2>
          <p className="text-gray-600 mb-4">
            Use this template to ensure proper import formatting:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">First Name</th>
                  <th className="text-left p-2">Last Name</th>
                  <th className="text-left p-2">Farm</th>
                  <th className="text-left p-2">Mailing Address</th>
                  <th className="text-left p-2">City</th>
                  <th className="text-left p-2">State</th>
                  <th className="text-left p-2">ZIP Code</th>
                  <th className="text-left p-2">Primary Email</th>
                  <th className="text-left p-2">Primary Phone</th>
                  <th className="text-left p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2">John</td>
                  <td className="p-2">Doe</td>
                  <td className="p-2">Doe Family Farm</td>
                  <td className="p-2">123 Farm Road</td>
                  <td className="p-2">Farmville</td>
                  <td className="p-2">CA</td>
                  <td className="p-2">90210</td>
                  <td className="p-2">john@doefarm.com</td>
                  <td className="p-2">(555) 123-4567</td>
                  <td className="p-2">Sample contact</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}