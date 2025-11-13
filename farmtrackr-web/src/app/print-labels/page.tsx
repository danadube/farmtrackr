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
import { useButtonPress } from '@/hooks/useButtonPress'
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
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
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
    console.log('[PRINT] Total filtered contacts:', filteredContacts.length)
    console.log('[PRINT] Total pages:', totalPages, 'Contacts per page:', contactsPerPage)
    
    Array.from({ length: totalPages }).forEach((_, pageIdx) => {
      const pageStart = pageIdx * contactsPerPage
      const pageContacts = filteredContacts.slice(pageStart, pageStart + contactsPerPage)
      console.log(`[PRINT] Page ${pageIdx}: slice(${pageStart}, ${pageStart + contactsPerPage}) = ${pageContacts.length} contacts`)
      
      let pageHTML = '<div class="label-page" style="width: 612px; height: 792px; position: relative; page-break-after: always;">'
      
      let labelIndex = 0 // Track actual label position within this page (0-29 for 5160)
      let labelsGenerated = 0
      
      // CRITICAL: Print ALL contacts - use labelIndex for position to ensure sequential column-major order
      pageContacts.forEach((contact, arrayIdx) => {
        const addressLines = formatAddressForLabel(contact, addressType)
        
        if (addressLines.length === 0) {
          console.warn(`[PRINT] Contact ${arrayIdx} (label ${labelIndex}) has no address lines:`, contact.firstName, contact.lastName)
        }
        
        // Use labelIndex for positioning (NOT arrayIdx) - ensures sequential positioning
        const position = calculateLabelPosition(labelIndex, format)
        const column = Math.floor(labelIndex / format.rows)
        const row = labelIndex % format.rows
        console.log(`[PRINT] Contact ${arrayIdx} -> Label ${labelIndex} (col ${column}, row ${row}): ${contact.firstName} ${contact.lastName}`)
        labelIndex++ // Always increment for next label position
        labelsGenerated++
        
        // Convert points to inches for more accurate printing
        const topInch = (position.top / 72).toFixed(4)
        const leftInch = (position.left / 72).toFixed(4)
        const widthInch = (format.labelWidth / 72).toFixed(4)
        const heightInch = (format.labelHeight / 72).toFixed(4)
        
        pageHTML += `
          <div class="label" style="
            position: absolute;
            top: ${topInch}in;
            left: ${leftInch}in;
            width: ${widthInch}in;
            height: ${heightInch}in;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            font-family: ${FONT_FAMILIES[fontFamily]};
            font-size: 13px;
            line-height: 1.35;
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
      
      console.log(`[PRINT] Page ${pageIdx}: Generated ${labelsGenerated} labels from ${pageContacts.length} contacts`)
      pageHTML += '</div>'
      allPages.push(pageHTML)
    })
    
    console.log(`[PRINT] Total labels generated across all pages:`, allPages.length, 'pages')

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
              padding: 0;
            }
            html, body {
              width: 8.5in;
              height: 11in;
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: ${FONT_FAMILIES[fontFamily]};
              background: white;
              color: black;
              position: relative;
            }
            .label-page {
              width: 8.5in;
              height: 11in;
              min-height: 11in;
              max-height: 11in;
              position: relative;
              page-break-after: always;
              page-break-inside: avoid;
              margin: 0;
              padding: 0;
              background: white;
              overflow: visible; /* Changed from hidden to ensure all labels are visible */
            }
            .label {
              position: absolute;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              text-align: center;
              box-sizing: border-box;
              overflow: visible; /* Changed to ensure text is visible */
              border: none;
              background: white;
              color: black;
              word-wrap: break-word;
              white-space: normal;
              visibility: visible !important;
              opacity: 1 !important;
            }
            .label-line {
              line-height: 1.35;
              margin: 0;
              padding: 0 2px;
              color: black;
              font-size: 13px;
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
        // Prevent browser from scaling/fitting to page
        printWindow.print()
      }, 300)
    }
    
    // Also handle print with no scaling
    printWindow.addEventListener('beforeprint', () => {
      // Ensure no scaling is applied
      printWindow.document.body.style.zoom = '1'
      printWindow.document.body.style.transform = 'scale(1)'
    })
  }

  return (
    <Sidebar>
          <div style={{ ...background }}>
            <div style={{ padding: '32px 48px 64px 48px', boxSizing: 'border-box' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div 
              style={{
                padding: '24px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.primary}`,
                borderRadius: '16px',
                position: 'relative' as const,
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: colors.iconBg,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Printer style={{ width: '24px', height: '24px', color: colors.primary }} />
                </div>
                <div>
                  <h1 
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#ffffff',
                      margin: '0 0 4px 0'
                    }}
                  >
                    Print Labels
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Generate and print address labels for your contacts
                  </p>
                </div>
              </div>
            </div>
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
                    <label htmlFor="farm-select" style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Farm
                    </label>
                    <select
                      id="farm-select"
                      name="farm-select"
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
                    <label htmlFor="format-select" style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Label Format
                    </label>
                    <select
                      id="format-select"
                      name="format-select"
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
                    <label htmlFor="address-type-select" style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Address Type
                    </label>
                    <select
                      id="address-type-select"
                      name="address-type-select"
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
                    <label htmlFor="font-select" style={{ display: 'block', fontSize: '12px', fontWeight: '600', ...text.secondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Font
                    </label>
                    <select
                      id="font-select"
                      name="font-select"
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
                      {...getButtonPressHandlers('togglePreview')}
                      onClick={() => setShowPreview(!showPreview)}
                      style={getButtonPressStyle('togglePreview', {
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
                        gap: '8px'
                      }, background.backgroundColor || '#ffffff', colors.cardHover)}
                    >
                      <Eye style={{ width: '16px', height: '16px' }} />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </button>
                    <button
                      {...getButtonPressHandlers('print')}
                      onClick={handlePrint}
                      disabled={filteredContacts.length === 0}
                      style={getButtonPressStyle('print', {
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
                        gap: '8px'
                      }, colors.primary, '#558b2f')}
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
                        {...getButtonPressHandlers('zoomOut')}
                        onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                        disabled={zoom <= 0.25}
                        style={getButtonPressStyle('zoomOut', {
                          padding: '6px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          ...background,
                          cursor: zoom <= 0.25 ? 'not-allowed' : 'pointer',
                          opacity: zoom <= 0.25 ? 0.5 : 1
                        }, background.backgroundColor || '#ffffff', colors.cardHover)}
                      >
                        <ZoomOut style={{ width: '16px', height: '16px', ...text.primary }} />
                      </button>
                      <span style={{ fontSize: '12px', ...text.secondary, minWidth: '60px', textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        {...getButtonPressHandlers('zoomIn')}
                        onClick={() => setZoom(Math.min(1.5, zoom + 0.25))}
                        disabled={zoom >= 1.5}
                        style={getButtonPressStyle('zoomIn', {
                          padding: '6px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          ...background,
                          cursor: zoom >= 1.5 ? 'not-allowed' : 'pointer',
                          opacity: zoom >= 1.5 ? 0.5 : 1
                        }, background.backgroundColor || '#ffffff', colors.cardHover)}
                      >
                        <ZoomIn style={{ width: '16px', height: '16px', ...text.primary }} />
                      </button>
                      {totalPages > 1 && (
                        <>
                          <button
                            {...getButtonPressHandlers('prevPage')}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={getButtonPressStyle('prevPage', {
                              padding: '6px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              ...background,
                              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                              opacity: currentPage === 1 ? 0.5 : 1
                            }, background.backgroundColor || '#ffffff', colors.cardHover)}
                          >
                            <ChevronLeft style={{ width: '16px', height: '16px', ...text.primary }} />
                          </button>
                          <span style={{ fontSize: '12px', ...text.secondary, minWidth: '40px', textAlign: 'center' }}>
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            {...getButtonPressHandlers('nextPage')}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={getButtonPressStyle('nextPage', {
                              padding: '6px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '6px',
                              ...background,
                              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                              opacity: currentPage === totalPages ? 0.5 : 1
                            }, background.backgroundColor || '#ffffff', colors.cardHover)}
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
                      {(() => {
                        let previewLabelIndex = 0
                        return pageContacts.map((contact) => {
                          const position = calculateLabelPosition(previewLabelIndex, format)
                          const addressLines = formatAddressForLabel(contact, addressType)
                          previewLabelIndex++
                          
                          // Debug: log what we're rendering
                          if (addressLines.length === 0) {
                            console.warn('Preview: Empty addressLines for', contact.firstName, contact.lastName)
                          }
                          
                          return (
                            <div
                              key={`preview-${contact.id}-${previewLabelIndex - 1}`}
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
                                fontSize: `${(13 / zoom).toFixed(1)}px`,
                                lineHeight: '1.35',
                                textAlign: 'center',
                                padding: `${(2 / zoom).toFixed(1)}px ${(4 / zoom).toFixed(1)}px`,
                                boxSizing: 'border-box',
                                border: isDark ? '1px solid #333' : '1px dashed #ddd',
                                overflow: 'visible', // Changed from hidden to see text
                                wordWrap: 'break-word',
                                whiteSpace: 'normal',
                                color: '#000000', // Always black for visibility
                                zIndex: 10, // Ensure text is on top
                              }}
                            >
                              {addressLines.length > 0 ? (
                                addressLines.map((line, lineIdx) => (
                                  <div 
                                    key={lineIdx} 
                                    style={{ 
                                      margin: 0, 
                                      padding: `0 ${(2 / zoom).toFixed(1)}px`,
                                      wordWrap: 'break-word',
                                      maxWidth: '100%',
                                      color: '#000000', // Always black
                                      display: 'block',
                                      visibility: 'visible',
                                      opacity: 1,
                                      position: 'relative',
                                      zIndex: 11,
                                    }}
                                  >
                                    {line}
                                  </div>
                                ))
                              ) : (
                                <div style={{ color: '#000000', visibility: 'visible', opacity: 1 }}>
                                  {contact.firstName} {contact.lastName}
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
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

