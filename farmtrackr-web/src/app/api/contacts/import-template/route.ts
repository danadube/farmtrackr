import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'excel' // 'csv' or 'excel'

    // Sample data for template
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Smith',
        'Organization Name': '',
        'Farm': 'Farm A',
        'Email 1': 'john.smith@email.com',
        'Email 2': '',
        'Phone 1': '(555) 123-4567',
        'Phone 2': '',
        'Phone 3': '',
        'Phone 4': '',
        'Phone 5': '',
        'Phone 6': '',
        'Mailing Address': '123 Main Street',
        'City': 'Los Angeles',
        'State': 'CA',
        'Zip Code': '90210',
        'Site Mailing Address': '',
        'Site City': '',
        'Site State': '',
        'Site Zip Code': '',
        'Notes': ''
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Doe',
        'Organization Name': '',
        'Farm': 'Farm B',
        'Email 1': 'jane.doe@email.com',
        'Email 2': '',
        'Phone 1': '(555) 234-5678',
        'Phone 2': '',
        'Phone 3': '',
        'Phone 4': '',
        'Phone 5': '',
        'Phone 6': '',
        'Mailing Address': '456 Oak Avenue',
        'City': 'San Diego',
        'State': 'CA',
        'Zip Code': '92101',
        'Site Mailing Address': '',
        'Site City': '',
        'Site State': '',
        'Site Zip Code': '',
        'Notes': ''
      },
      {
        'First Name': '',
        'Last Name': '',
        'Organization Name': 'ABC Corporation',
        'Farm': 'Farm A',
        'Email 1': 'contact@abccorp.com',
        'Email 2': '',
        'Phone 1': '(555) 345-6789',
        'Phone 2': '',
        'Phone 3': '',
        'Phone 4': '',
        'Phone 5': '',
        'Phone 6': '',
        'Mailing Address': '789 Business Blvd',
        'City': 'Santa Monica',
        'State': 'CA',
        'Zip Code': '90401',
        'Site Mailing Address': '',
        'Site City': '',
        'Site State': '',
        'Site Zip Code': '',
        'Notes': ''
      }
    ]

    if (format === 'excel') {
      // Create Excel workbook
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(templateData)
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // First Name
        { wch: 12 }, // Last Name
        { wch: 18 }, // Organization Name
        { wch: 10 }, // Farm
        { wch: 25 }, // Email 1
        { wch: 25 }, // Email 2
        { wch: 15 }, // Phone 1
        { wch: 15 }, // Phone 2
        { wch: 15 }, // Phone 3
        { wch: 15 }, // Phone 4
        { wch: 15 }, // Phone 5
        { wch: 15 }, // Phone 6
        { wch: 25 }, // Mailing Address
        { wch: 15 }, // City
        { wch: 6 },  // State
        { wch: 10 }, // Zip Code
        { wch: 25 }, // Site Mailing Address
        { wch: 15 }, // Site City
        { wch: 6 },  // Site State
        { wch: 10 }, // Site Zip Code
        { wch: 30 }  // Notes
      ]
      worksheet['!cols'] = columnWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts Template')
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="contacts-template.xlsx"',
        },
      })
    } else {
      // Return CSV template
      const csvContent = [
        'First Name,Last Name,Organization Name,Farm,Email 1,Email 2,Phone 1,Phone 2,Phone 3,Phone 4,Phone 5,Phone 6,Mailing Address,City,State,Zip Code,Site Mailing Address,Site City,Site State,Site Zip Code,Notes',
        'John,Smith,,Farm A,john.smith@email.com,,(555) 123-4567,,,,,,123 Main Street,Los Angeles,CA,90210,,,,,',
        'Jane,Doe,,Farm B,jane.doe@email.com,,(555) 234-5678,,,,,,456 Oak Avenue,San Diego,CA,92101,,,,,',
        ',,"ABC Corporation",Farm A,contact@abccorp.com,,(555) 345-6789,,,,,,789 Business Blvd,Santa Monica,CA,90401,,,,,'
      ].join('\n')
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="contacts-template.csv"',
        },
      })
    }
  } catch (error) {
    console.error('Template generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}

