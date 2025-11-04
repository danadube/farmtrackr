'use client'

import { useState } from 'react'
import { FARM_SPREADSHEETS } from '@/lib/farmSpreadsheets'

export default function GoogleSheetsPage() {
  const [selectedFarm, setSelectedFarm] = useState<string>('')
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  const handleImportFromSheet = async () => {
    if (!selectedFarm) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const farm = FARM_SPREADSHEETS.find(f => f.name === selectedFarm)
      if (!farm) throw new Error('Farm not found')

      const response = await fetch(`/api/google-sheets?spreadsheetId=${farm.spreadsheetId}`)
      const result = await response.json()

      if (result.success) {
        setImportResult({
          success: true,
          message: `Successfully imported data from ${selectedFarm}`,
          data: result.data
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: `Failed to import from ${selectedFarm}: ${error.message}`
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleExportToSheet = async () => {
    if (!selectedFarm) return

    setIsExporting(true)

    try {
      const farm = FARM_SPREADSHEETS.find(f => f.name === selectedFarm)
      if (!farm) throw new Error('Farm not found')

      // Fetch current contacts
      const contactsResponse = await fetch('/api/contacts')
      const contacts = await contactsResponse.json()

      // Filter contacts for this farm
      const farmContacts = contacts.filter((contact: any) => 
        contact.farm?.toLowerCase().includes(selectedFarm.toLowerCase())
      )

      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: farm.spreadsheetId,
          contacts: farmContacts
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(`Successfully exported ${farmContacts.length} contacts to ${selectedFarm} spreadsheet!`)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      alert(`Failed to export to ${selectedFarm}: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Google Sheets Integration</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Farm Spreadsheets</h2>
          <p className="text-gray-600 mb-6">
            Connect with your existing Google Sheets for each farm location.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Farm
              </label>
              <select
                value={selectedFarm}
                onChange={(e) => setSelectedFarm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose a farm...</option>
                {FARM_SPREADSHEETS.map((farm) => (
                  <option key={farm.spreadsheetId} value={farm.name}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedFarm && (
              <div className="flex gap-4">
                <button
                  onClick={handleImportFromSheet}
                  disabled={isImporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isImporting ? 'Importing...' : 'Import from Sheet'}
                </button>
                
                <button
                  onClick={handleExportToSheet}
                  disabled={isExporting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isExporting ? 'Exporting...' : 'Export to Sheet'}
                </button>
              </div>
            )}
          </div>

          {importResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Available Spreadsheets */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Spreadsheets</h3>
            <div className="space-y-3">
              {FARM_SPREADSHEETS.map((farm) => (
                <div key={farm.spreadsheetId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{farm.name}</h4>
                    <p className="text-sm text-gray-500">Google Sheets</p>
                  </div>
                  <a
                    href={farm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Open Sheet
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">1. Google Service Account</h4>
                <p>Create a Google Service Account and download the credentials JSON file.</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">2. Share Spreadsheets</h4>
                <p>Share each farm spreadsheet with the service account email address.</p>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">3. Environment Variables</h4>
                <p>Add the service account credentials to your environment variables.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}