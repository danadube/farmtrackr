import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { FarmContact, ContactFormData } from '@/types/contact'

export interface ImportResult {
  success: boolean
  contacts: ContactFormData[]
  errors: string[]
  totalRows: number
}

export async function importCSV(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const contacts: ContactFormData[] = []
        const errors: string[] = []
        
        results.data.forEach((row: any, index: number) => {
          try {
            const contact = mapCSVRowToContact(row)
            if (contact.firstName || contact.lastName) {
              contacts.push(contact)
            }
          } catch (error) {
            errors.push(`Row ${index + 1}: ${error}`)
          }
        })
        
        resolve({
          success: errors.length === 0,
          contacts,
          errors,
          totalRows: results.data.length
        })
      },
      error: (error) => {
        resolve({
          success: false,
          contacts: [],
          errors: [error.message],
          totalRows: 0
        })
      }
    })
  })
}

export async function importExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        const contacts: ContactFormData[] = []
        const errors: string[] = []
        
        jsonData.forEach((row: any, index: number) => {
          try {
            const contact = mapExcelRowToContact(row)
            if (contact.firstName || contact.lastName) {
              contacts.push(contact)
            }
          } catch (error) {
            errors.push(`Row ${index + 1}: ${error}`)
          }
        })
        
        resolve({
          success: errors.length === 0,
          contacts,
          errors,
          totalRows: jsonData.length
        })
      } catch (error) {
        resolve({
          success: false,
          contacts: [],
          errors: [error.message],
          totalRows: 0
        })
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

export function exportToCSV(contacts: FarmContact[]): string {
  const csvData = contacts.map(contact => ({
    'First Name': contact.firstName || '',
    'Last Name': contact.lastName || '',
    'Farm': contact.farm || '',
    'Mailing Address': contact.mailingAddress || '',
    'City': contact.city || '',
    'State': contact.state || '',
    'ZIP Code': contact.zipCode || '',
    'Primary Email': contact.email1 || '',
    'Secondary Email': contact.email2 || '',
    'Primary Phone': contact.phoneNumber1 || '',
    'Secondary Phone': contact.phoneNumber2 || '',
    'Notes': contact.notes || '',
    'Date Created': contact.dateCreated.toISOString(),
    'Date Modified': contact.dateModified.toISOString()
  }))
  
  return Papa.unparse(csvData)
}

export function exportToExcel(contacts: FarmContact[]): void {
  const excelData = contacts.map(contact => ({
    'First Name': contact.firstName || '',
    'Last Name': contact.lastName || '',
    'Farm': contact.farm || '',
    'Mailing Address': contact.mailingAddress || '',
    'City': contact.city || '',
    'State': contact.state || '',
    'ZIP Code': contact.zipCode || '',
    'Primary Email': contact.email1 || '',
    'Secondary Email': contact.email2 || '',
    'Primary Phone': contact.phoneNumber1 || '',
    'Secondary Phone': contact.phoneNumber2 || '',
    'Notes': contact.notes || '',
    'Date Created': contact.dateCreated.toISOString(),
    'Date Modified': contact.dateModified.toISOString()
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(excelData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
  XLSX.writeFile(workbook, 'farmtrackr-contacts.xlsx')
}

function mapCSVRowToContact(row: any): ContactFormData {
  return {
    firstName: row['First Name'] || row['firstname'] || row['first_name'] || '',
    lastName: row['Last Name'] || row['lastname'] || row['last_name'] || '',
    farm: row['Farm'] || row['farm'] || '',
    mailingAddress: row['Mailing Address'] || row['address'] || row['mailing_address'] || '',
    city: row['City'] || row['city'] || '',
    state: row['State'] || row['state'] || '',
    zipCode: parseInt(row['ZIP Code'] || row['zipcode'] || row['zip_code'] || '0') || 0,
    email1: row['Primary Email'] || row['email'] || row['email1'] || '',
    email2: row['Secondary Email'] || row['email2'] || '',
    phoneNumber1: row['Primary Phone'] || row['phone'] || row['phone1'] || '',
    phoneNumber2: row['Secondary Phone'] || row['phone2'] || '',
    notes: row['Notes'] || row['notes'] || ''
  }
}

function mapExcelRowToContact(row: any): ContactFormData {
  return {
    firstName: row['First Name'] || row['firstname'] || row['first_name'] || '',
    lastName: row['Last Name'] || row['lastname'] || row['last_name'] || '',
    farm: row['Farm'] || row['farm'] || '',
    mailingAddress: row['Mailing Address'] || row['address'] || row['mailing_address'] || '',
    city: row['City'] || row['city'] || '',
    state: row['State'] || row['state'] || '',
    zipCode: parseInt(row['ZIP Code'] || row['zipcode'] || row['zip_code'] || '0') || 0,
    email1: row['Primary Email'] || row['email'] || row['email1'] || '',
    email2: row['Secondary Email'] || row['email2'] || '',
    phoneNumber1: row['Primary Phone'] || row['phone'] || row['phone1'] || '',
    phoneNumber2: row['Secondary Phone'] || row['phone2'] || '',
    notes: row['Notes'] || row['notes'] || ''
  }
}
