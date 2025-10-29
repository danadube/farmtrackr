import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import PDFDocument from 'pdfkit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const format = body.format || 'csv' // 'csv', 'excel', 'json', or 'pdf'
    const farm = body.farm // Optional: filter by farm
    const startDate = body.startDate // Optional: filter by date range
    const endDate = body.endDate // Optional: filter by date range
    const columns = body.columns // Optional: array of column names to include
    
    // Build query
    const where: any = {}
    if (farm) {
      where.farm = farm
    }
    if (startDate || endDate) {
      where.dateCreated = {}
      if (startDate) {
        where.dateCreated.gte = new Date(startDate)
      }
      if (endDate) {
        where.dateCreated.lte = new Date(endDate)
      }
    }
    
    // Get all contacts from database
    const contacts = await prisma.farmContact.findMany({
      where,
      orderBy: { dateCreated: 'desc' },
    })
    
    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts to export' }, { status: 400 })
    }

    // Define all available columns
    const allColumns = {
      'First Name': 'firstName',
      'Last Name': 'lastName',
      'Farm': 'farm',
      'Mailing Address': 'mailingAddress',
      'City': 'city',
      'State': 'state',
      'Zip Code': 'zipCode',
      'Email 1': 'email1',
      'Email 2': 'email2',
      'Phone 1': 'phoneNumber1',
      'Phone 2': 'phoneNumber2',
      'Phone 3': 'phoneNumber3',
      'Phone 4': 'phoneNumber4',
      'Phone 5': 'phoneNumber5',
      'Phone 6': 'phoneNumber6',
      'Site Address': 'siteMailingAddress',
      'Site City': 'siteCity',
      'Site State': 'siteState',
      'Site Zip Code': 'siteZipCode',
      'Notes': 'notes',
      'Date Created': 'dateCreated',
      'Date Modified': 'dateModified',
    }

    // Determine which columns to include
    const columnsToInclude = columns && Array.isArray(columns) && columns.length > 0
      ? columns
      : Object.keys(allColumns) // Include all if not specified

    // Format contacts for export
    const exportData = contacts.map(contact => {
      // Handle dates (could be Date object or string from Prisma)
      const dateCreated = contact.dateCreated instanceof Date 
        ? contact.dateCreated.toISOString().split('T')[0]
        : new Date(contact.dateCreated).toISOString().split('T')[0]
      const dateModified = contact.dateModified instanceof Date 
        ? contact.dateModified.toISOString().split('T')[0]
        : new Date(contact.dateModified).toISOString().split('T')[0]
      
      // Build object with only selected columns
      const row: Record<string, any> = {}
      columnsToInclude.forEach((colName: string) => {
        const fieldKey = allColumns[colName as keyof typeof allColumns]
        if (fieldKey) {
          if (fieldKey === 'dateCreated') {
            row[colName] = dateCreated
          } else if (fieldKey === 'dateModified') {
            row[colName] = dateModified
          } else {
            row[colName] = contact[fieldKey as keyof typeof contact] || ''
          }
        }
      })
      
      return row
    })

    if (format === 'csv') {
      // Generate CSV
      const csv = Papa.unparse(exportData)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const buffer = Buffer.from(await blob.arrayBuffer())
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="farmtrackr_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else if (format === 'excel') {
      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="farmtrackr_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    } else if (format === 'json') {
      // Generate JSON
      const jsonData = JSON.stringify(exportData, null, 2)
      
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="farmtrackr_export_${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    } else if (format === 'pdf') {
      // Generate PDF report with pdfkit
      const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50
      })
      
      // Create buffer to store PDF
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      
      // Track page numbers manually
      let pageNumber = 0
      doc.on('pageAdded', () => {
        pageNumber++
      })
      
      // PDF Metadata
      const generationDate = new Date()
      const fileName = `farmtrackr_report_${generationDate.toISOString().split('T')[0]}.pdf`
      
      // Set PDF metadata - pdfkit requires setting these properties directly
      doc.info.Title = 'FarmTrackr Contact Report'
      doc.info.Author = 'FarmTrackr'
      doc.info.Subject = `Contact Export - ${exportData.length} contacts`
      doc.info.Keywords = 'FarmTrackr, Contacts, Export'
      doc.info.CreationDate = generationDate
      
      // Helper function to add page number
      const addPageNumber = () => {
        const currentPage = pageNumber || 1
        const pageWidth = doc.page.width || 612
        const pageHeight = doc.page.height || 792
        
        // Save current position
        const savedY = doc.y
        const savedX = doc.x
        
        doc.fontSize(9)
          .fillColor('#666666')
          .text(
            `Page ${currentPage}`,
            pageWidth - 100,
            pageHeight - 30,
            {
              align: 'right',
              width: 100
            }
          )
        
        // Restore position
        doc.y = savedY
        doc.x = savedX
      }
      
      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        const currentY = doc.y
        const pageHeight = doc.page.height || 792
        const bottomMargin = 50
        if (currentY + requiredHeight > pageHeight - bottomMargin) {
          addPageNumber()
          doc.addPage()
          pageNumber++
          return true
        }
        return false
      }
      
      // Title Page
      pageNumber = 1
      const pageWidth = doc.page.width || 612
      
      doc.fontSize(32)
        .fillColor('#2E7D32') // Farm green
        .text('FarmTrackr', 50, 100, { align: 'center', width: pageWidth - 100 })
      
      doc.fontSize(24)
        .fillColor('#333333')
        .text('Contact Report', 50, 150, { align: 'center', width: pageWidth - 100 })
      
      doc.fontSize(12)
        .fillColor('#666666')
        .text(`Generated: ${generationDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`, 50, 220, { align: 'center', width: pageWidth - 100 })
      
      doc.text(`Total Contacts: ${exportData.length}`, 50, 240, { align: 'center', width: pageWidth - 100 })
      
      if (farm) {
        doc.text(`Farm: ${farm}`, 50, 260, { align: 'center', width: pageWidth - 100 })
      }
      
      // Add page number to title page
      addPageNumber()
      doc.addPage()
      pageNumber++
      
      // Contact Section Header
      doc.fontSize(18)
        .fillColor('#2E7D32')
        .text('Contacts', 50, 50)
      
      doc.moveDown(1)
      
      // Process contacts
      exportData.forEach((contact, index) => {
        // Check if we need a new page before adding a contact
        checkNewPage(150) // Approximate height needed for a contact
        
        // Contact header with background
        const contactStartY = doc.y
        const pageWidth = doc.page.width || 612
        doc.rect(50, contactStartY, pageWidth - 100, 30)
          .fillColor('#E8F5E9') // Light green background
          .fill()
          .stroke('#2E7D32') // Green border
        
        // Contact name/number
        doc.fontSize(14)
          .fillColor('#1B5E20') // Dark green
          .font('Helvetica-Bold')
          .text(`Contact ${index + 1}`, 55, contactStartY + 8)
        
        doc.y = contactStartY + 35
        
        // Contact details
        doc.fontSize(10)
          .fillColor('#333333')
          .font('Helvetica')
        
        const lineHeight = 14
        const leftColumn = 55
        const rightColumn = (pageWidth - 100) / 2 + 55
        
        let currentColumn = leftColumn
        let currentLine = doc.y
        let itemsInCurrentColumn = 0
        const maxItemsPerColumn = 12
        
        // Sort fields for better presentation
        const fieldOrder = [
          'First Name', 'Last Name', 'Farm',
          'Email 1', 'Email 2',
          'Phone 1', 'Phone 2', 'Phone 3', 'Phone 4', 'Phone 5', 'Phone 6',
          'Mailing Address', 'City', 'State', 'Zip Code',
          'Site Address', 'Site City', 'Site State', 'Site Zip Code',
          'Notes',
          'Date Created', 'Date Modified'
        ]
        
        const sortedFields = fieldOrder.filter(key => 
          columnsToInclude.includes(key) && contact[key] && String(contact[key]).trim()
        )
        
        // Add remaining fields not in the sorted list
        Object.keys(contact).forEach(key => {
          if (!fieldOrder.includes(key) && columnsToInclude.includes(key) && contact[key] && String(contact[key]).trim()) {
            sortedFields.push(key)
          }
        })
        
        sortedFields.forEach((key, fieldIndex) => {
          const value = String(contact[key]).trim()
          if (!value) return
          
          // Move to next column if current column is full
          if (itemsInCurrentColumn >= maxItemsPerColumn) {
            currentColumn = rightColumn
            currentLine = contactStartY + 35
            itemsInCurrentColumn = 0
          }
          
          // Check if we need a new page
          if (checkNewPage(20)) {
            currentLine = doc.y
            currentColumn = leftColumn
            itemsInCurrentColumn = 0
          }
          
          // Format field name (remove common prefixes, capitalize)
          const displayKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim()
          
          doc.fontSize(9)
            .fillColor('#666666')
            .font('Helvetica')
            .text(`${displayKey}:`, currentColumn, currentLine, {
              width: 200,
              continued: false
            })
          
          doc.fontSize(10)
            .fillColor('#333333')
            .font('Helvetica')
            .text(value, currentColumn + 80, currentLine, {
              width: 200
            })
          
          currentLine += lineHeight
          doc.y = currentLine
          itemsInCurrentColumn++
        })
        
        // Add spacing after contact
        doc.moveDown(1)
        doc.moveDown(0.5)
      })
      
      // Add page number to last page
      addPageNumber()
      
      // Finalize PDF
      doc.end()
      
      // Wait for PDF to be fully generated
      await new Promise<void>((resolve) => {
        doc.on('end', () => resolve())
      })
      
      const buffer = Buffer.concat(chunks)
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    } else {
      return NextResponse.json({ error: 'Invalid format. Use "csv", "excel", "json", or "pdf"' }, { status: 400 })
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export contacts' },
      { status: 500 }
    )
  }
}
