'use client'

import { useState, useEffect } from 'react'
import {
  Printer,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { FarmContact } from '@/types'
import {
  AVERY_FORMATS,
  LabelFormatId,
  getLabelFormat,
  calculateLabelPosition,
  formatAddressForLabel,
} from '@/lib/labelFormats'

type AddressType = 'mailing' | 'site'
type FontFamily = 'system' | 'times' | 'arial' | 'courier'

const FONT_FAMILIES: Record<FontFamily, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  times: '"Times New Roman", Times, serif',
  arial: 'Arial, Helvetica, sans-serif',
  courier: '"Courier New", Courier, monospace',
}

export default function PrintLabelsPage() {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [contacts, setContacts] = useState<FarmContact[]>([])
  const [selectedFarm, setSelectedFarm] = useState<string>('all')
  const [selectedFormat, setSelectedFormat] = useState<LabelFormatId>('5160')
  const [addressType, setAddressType] = useState<AddressType>('mailing')
  const [fontFamily, setFontFamily] = useState<FontFamily>('system')
  const [showPreview, setShowPreview] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(0.75) // 75% zoom for preview
  const [isLoading, setIsLoading] = useState(true)

  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/contacts')
        if (response.ok) {
          const data = await response.json()
          const contactsWithDates = data.map((contact: any) => ({
            ...contact,
            dateCreated: new Date(contact.dateCreated),
            dateModified: new Date(contact.dateModified),
          }))
          setContacts(contactsWithDates)
        }
      } catch (error) {
        console.error('Error fetching contacts:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchContacts()
  }, [])

  // Filter contacts by farm
  const filteredContacts = contacts.filter(
    (contact) => selectedFarm === 'all' || contact.farm === selectedFarm
  )

  // Get unique farms for dropdown
  const uniqueFarms = Array.from(new Set(contacts.map((c) => c.farm).filter(Boolean))).sort()

  // Calculate pages needed
  const format = getLabelFormat(selectedFormat)
  const contactsPerPage = format.labelsPerSheet
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage)

  // Get contacts for current page
  const startIndex = (currentPage - 1) * contactsPerPage
  const pageContacts = filteredContacts.slice(startIndex, startIndex + contactsPerPage)

  // Handle print
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow popups to print labels')
      return
    }

    // Get all pages of labels
    const allPages: string[] = []
    Array.from({ length: totalPages }).forEach((_, pageIdx) => {
      const pageStart = pageIdx * contactsPerPage
      const pageContacts = filteredContacts.slice(pageStart, pageStart + contactsPerPage)
      
      let pageHTML = '<div class="label-page" style="width: 612px; height: 792px; position: relative; page-break-after: always;">'
      
      pageContacts.forEach((contact, idx) => {
        const position = calculateLabelPosition(idx, format)
        const addressLines = formatAddressForLabel(contact, addressType)
        
        pageHTML += `
          <div class="label" style="
            position: absolute;
            top: ${position.top}px;
            left: ${position.left}px;
            width: ${format.labelWidth}px;
            height: ${format.labelHeight}px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: ${FONT_FAMILIES[fontFamily]};
            font-size: 11px;
            line-height: 1.3;
            text-align: center;
            padding: 2px 4px;
            box-sizing: border-box;
            overflow: hidden;
            word-wrap: break-word;
            white-space: normal;
          ">
            ${addressLines.map(line => `<div class="label-line" style="margin: 0; padding: 0 2px;">${line}</div>`).join('')}
          </div>
        `
      })
      
      pageHTML += '</div>'
      allPages.push(pageHTML)
    })

    // Write the print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels - ${selectedFarm === 'all' ? 'All Farms' : selectedFarm}</title>
          <style>
            @page {
              size: letter;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: ${FONT_FAMILIES[fontFamily]};
              background: white;
              color: black;
            }
            .label-page {
              width: 8.5in;
              height: 11in;
              position: relative;
              page-break-after: always;
              page-break-inside: avoid;
              margin: 0;
              padding: 0;
              background: white;
            }
            .label {
              position: absolute;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              box-sizing: border-box;
              overflow: hidden;
              border: none;
              background: white;
              color: black;
              word-wrap: break-word;
              white-space: normal;
            }
            .label-line {
              line-height: 1.3;
              margin: 0;
              padding: 0 2px;
              color: black;
              font-size: 11px;
              word-wrap: break-word;
              max-width: 100%;
            }
          </style>
        </head>
        <body>
          ${allPages.join('')}
        </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <Sidebar>
      <div style={{ marginLeft: '256px', padding: '24px', overflow: 'auto', ...background }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', ...text.primary }}>
              Print Labels
            </h1>
            <p style={{ fontSize: '14px', ...text.secondary }}>
              Generate and print address labels for your contacts
            </p>
          </div>

          {isLoading ? (
            <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
              <RefreshCw style={{ width: '32px', height: '32px', ...text.secondary, animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px', ...text.secondary }}>Loading contacts...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
              {/* Controls */}
              <div style={{ ...card, padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  {/* Farm Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Farm
                    </label>
                    <select
                      value={selectedFarm}
                      onChange={(e) => {
                        setSelectedFarm(e.target.value)
                        setCurrentPage(1)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        ...background,
                        ...text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="all">All Farms ({contacts.length} contacts)</option>
                      {uniqueFarms.map((farm) => {
                        const count = contacts.filter((c) => c.farm === farm).length
                        return (
                          <option key={farm} value={farm}>
                            {farm} ({count} contacts)
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  {/* Label Format */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Label Format
                    </label>
                    <select
                      value={selectedFormat}
                      onChange={(e) => {
                        setSelectedFormat(e.target.value as LabelFormatId)
                        setCurrentPage(1)
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        ...background,
                        ...text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      {Object.values(AVERY_FORMATS).map((fmt) => (
                        <option key={fmt.id} value={fmt.id}>
                          {fmt.name} ({fmt.labelsPerSheet} per sheet)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Address Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Address Type
                    </label>
                    <select
                      value={addressType}
                      onChange={(e) => setAddressType(e.target.value as AddressType)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        ...background,
                        ...text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="mailing">Mailing Address</option>
                      <option value="site">Site Address</option>
                    </select>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Font
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value as FontFamily)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        fontSize: '14px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        ...background,
                        ...text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="system">System Default</option>
                      <option value="times">Times New Roman</option>
                      <option value="arial">Arial</option>
                      <option value="courier">Courier New</option>
                    </select>
                  </div>
                </div>

                {/* Stats and Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ ...text.secondary, fontSize: '14px' }}>
                    <strong style={{ ...text.primary }}>{filteredContacts.length}</strong> contact{filteredContacts.length !== 1 ? 's' : ''} selected
                    {' • '}
                    <strong style={{ ...text.primary }}>{totalPages}</strong> page{totalPages !== 1 ? 's' : ''} needed
                    {' • '}
                    {format.labelsPerSheet} labels per page
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        ...background,
                        ...text.primary,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Eye style={{ width: '16px', height: '16px' }} />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                    <button
                      onClick={handlePrint}
                      disabled={filteredContacts.length === 0}
                      style={{
                        padding: '10px 24px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: filteredContacts.length === 0 ? 'not-allowed' : 'pointer',
                        opacity: filteredContacts.length === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Printer style={{ width: '16px', height: '16px' }} />
                      Print Labels
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div style={{ ...card, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', ...text.primary }}>Preview</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                        disabled={zoom <= 0.25}
                        style={{
                          padding: '6px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          ...background,
                          cursor: zoom <= 0.25 ? 'not-allowed' : 'pointer',
                          opacity: zoom <= 0.25 ? 0.5 : 1,
                        }}
                      >
                        <ZoomOut style={{ width: '16px', height: '16px', ...text.primary }} />
                      </button>
                      <span style={{ fontSize: '12px', ...text.secondary, minWidth: '60px', textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => setZoom(Math.min(1.5, zoom + 0.25))}
                        disabled={zoom >= 1.5}
                        style={{
                          padding: '6px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          ...background,
                          cursor: zoom >= 1.5 ? 'not-allowed' : 'pointer',
                          opacity: zoom >= 1.5 ? 0.5 : 1,
                        }}
                      >
                        <ZoomIn style={{ width: '16px', height: '16px', ...text.primary }} />
                      </button>
                      {totalPages > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{
                              padding: '6px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              ...background,
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                              opacity: currentPage === 1 ? 0.5 : 1,
                            }}
                          >
                            <ChevronLeft style={{ width: '16px', height: '16px', ...text.primary }} />
                          </button>
                          <span style={{ fontSize: '12px', ...text.secondary, minWidth: '40px', textAlign: 'center' }}>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                              padding: '6px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              ...background,
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                              opacity: currentPage === totalPages ? 0.5 : 1,
                            }}
                          >
                            <ChevronRight style={{ width: '16px', height: '16px', ...text.primary }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto', padding: '20px', backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', borderRadius: '8px' }}>
                    <div
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top center',
                        width: `${612 / zoom}px`,
                        height: `${792 / zoom}px`,
                        position: 'relative',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      {pageContacts.map((contact, idx) => {
                        const position = calculateLabelPosition(idx, format)
                        const addressLines = formatAddressForLabel(contact, addressType)
                        return (
                          <div
                            key={`preview-${contact.id}-${idx}`}
                            style={{
                              position: 'absolute',
                              top: `${(position.top / zoom).toFixed(2)}px`,
                              left: `${(position.left / zoom).toFixed(2)}px`,
                              width: `${(format.labelWidth / zoom).toFixed(2)}px`,
                              height: `${(format.labelHeight / zoom).toFixed(2)}px`,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontFamily: FONT_FAMILIES[fontFamily],
                              fontSize: `${(11 / zoom).toFixed(1)}px`,
                              lineHeight: '1.3',
                              textAlign: 'center',
                              padding: `${(2 / zoom).toFixed(1)}px ${(4 / zoom).toFixed(1)}px`,
                              boxSizing: 'border-box',
                              border: isDark ? '1px solid #333' : '1px dashed #ddd',
                              overflow: 'hidden',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal',
                              ...text.primary,
                            }}
                          >
                            {addressLines.map((line, lineIdx) => (
                              <div 
                                key={lineIdx} 
                                style={{ 
                                  margin: 0, 
                                  padding: `0 ${(2 / zoom).toFixed(1)}px`,
                                  wordWrap: 'break-word',
                                  maxWidth: '100%',
                                }}
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  )
}

