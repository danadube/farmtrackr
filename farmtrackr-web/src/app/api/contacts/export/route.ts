import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

// PDF generation will use pdfkit - install with: npm install pdfkit @types/pdfkit
// For now, we'll generate a simple text-based PDF structure

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
      // Generate PDF report
      // Simple text-based PDF generation
      let pdfContent = `FarmTrackr Contact Report\n`
      pdfContent += `Generated: ${new Date().toLocaleDateString()}\n`
      pdfContent += `Total Contacts: ${exportData.length}\n`
      pdfContent += `\n${'='.repeat(80)}\n\n`
      
      exportData.forEach((contact, index) => {
        pdfContent += `Contact ${index + 1}\n`
        pdfContent += `${'-'.repeat(80)}\n`
        Object.entries(contact).forEach(([key, value]) => {
          if (value && value.toString().trim()) {
            pdfContent += `${key}: ${value}\n`
          }
        })
        pdfContent += `\n`
      })
      
      // Convert to PDF format (simple approach - in production, use pdfkit)
      // For now, return as text file with .pdf extension
      const buffer = Buffer.from(pdfContent, 'utf-8')
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="farmtrackr_report_${new Date().toISOString().split('T')[0]}.pdf"`,
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
