import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FarmContact } from '@/types'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const fileContent = await file.arrayBuffer()
    
    let contacts: Partial<FarmContact>[] = []

    // Parse CSV
    if (fileExtension === 'csv') {
      const text = new TextDecoder().decode(fileContent)
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      })
      
      contacts = parsed.data.map((row: any) => ({
        // capture potential single field name
        fullName: row['Name'] || row['Full Name'] || row['name'] || row['fullName'] || row['Organization'] || row['organization'] || row['Organization Name'] || row['Trust'] || row['trust'] || undefined,
        firstName: row['First Name'] || row['firstName'] || row['First'] || '',
        lastName: row['Last Name'] || row['lastName'] || row['Last'] || '',
        organizationName: row['Organization'] || row['organization'] || row['Organization Name'] || row['organizationName'] || row['Trust'] || row['trust'] || undefined,
        farm: row['Farm'] || row['farm'] || undefined,
        mailingAddress: row['Mailing Address'] || row['mailingAddress'] || row['Address'] || undefined,
        city: row['City'] || row['city'] || undefined,
        state: row['State'] || row['state'] || undefined,
        zipCode: row['Zip Code'] || row['zipCode'] || row['ZIP'] ? parseInt(row['Zip Code'] || row['zipCode'] || row['ZIP']) : undefined,
        email1: row['Email'] || row['email'] || row['Email 1'] || row['email1'] || undefined,
        email2: row['Email 2'] || row['email2'] || undefined,
        phoneNumber1: row['Phone'] || row['phone'] || row['Phone 1'] || row['phoneNumber1'] || undefined,
        phoneNumber2: row['Phone 2'] || row['phoneNumber2'] || undefined,
        phoneNumber3: row['Phone 3'] || row['phoneNumber3'] || undefined,
        phoneNumber4: row['Phone 4'] || row['phoneNumber4'] || undefined,
        phoneNumber5: row['Phone 5'] || row['phoneNumber5'] || undefined,
        phoneNumber6: row['Phone 6'] || row['phoneNumber6'] || undefined,
        siteMailingAddress: row['Site Address'] || row['siteMailingAddress'] || undefined,
        siteCity: row['Site City'] || row['siteCity'] || undefined,
        siteState: row['Site State'] || row['siteState'] || undefined,
        siteZipCode: row['Site Zip Code'] || row['siteZipCode'] ? parseInt(row['Site Zip Code'] || row['siteZipCode']) : undefined,
        notes: row['Notes'] || row['notes'] || undefined,
      })).map((contact: any) => {
        // Business/Trust rule: if only one name provided, move it to organizationName field
        const hasFirst = !!contact.firstName && String(contact.firstName).trim().length > 0
        const hasLast = !!contact.lastName && String(contact.lastName).trim().length > 0
        const hasOrg = !!contact.organizationName && String(contact.organizationName).trim().length > 0
        const hasFull = !!contact.fullName && String(contact.fullName).trim().length > 0
        
        // If we have a full name or explicit organization field, use it
        if (hasFull && !hasFirst && !hasLast && !hasOrg) {
          contact.organizationName = String(contact.fullName).trim()
        } else if ((hasFirst && !hasLast) || (hasLast && !hasFirst)) {
          // Single name field - treat as organization
          contact.organizationName = String(hasFirst ? contact.firstName : contact.lastName).trim()
          contact.firstName = ''
          contact.lastName = ''
        } else if (!hasOrg && hasFull) {
          // Fallback: if full name exists and no org, use it
          contact.organizationName = String(contact.fullName).trim()
        }
        
        delete contact.fullName
        return contact
      }).filter((contact: any) => contact.firstName || contact.lastName || contact.organizationName || contact.farm)
    }
    // Parse Excel
    else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const workbook = XLSX.read(fileContent, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const data: any[] = XLSX.utils.sheet_to_json(worksheet)
      
      contacts = data.map((row: any) => ({
        fullName: row['Name'] || row['Full Name'] || row['name'] || row['fullName'] || row['Organization'] || row['organization'] || row['Organization Name'] || row['Trust'] || row['trust'] || undefined,
        firstName: row['First Name'] || row['firstName'] || row['First'] || '',
        lastName: row['Last Name'] || row['lastName'] || row['Last'] || '',
        organizationName: row['Organization'] || row['organization'] || row['Organization Name'] || row['organizationName'] || row['Trust'] || row['trust'] || undefined,
        farm: row['Farm'] || row['farm'] || undefined,
        mailingAddress: row['Mailing Address'] || row['mailingAddress'] || row['Address'] || undefined,
        city: row['City'] || row['city'] || undefined,
        state: row['State'] || row['state'] || undefined,
        zipCode: row['Zip Code'] || row['zipCode'] || row['ZIP'] ? parseInt(row['Zip Code'] || row['zipCode'] || row['ZIP']) : undefined,
        email1: row['Email'] || row['email'] || row['Email 1'] || row['email1'] || undefined,
        email2: row['Email 2'] || row['email2'] || undefined,
        phoneNumber1: row['Phone'] || row['phone'] || row['Phone 1'] || row['phoneNumber1'] || undefined,
        phoneNumber2: row['Phone 2'] || row['phoneNumber2'] || undefined,
        phoneNumber3: row['Phone 3'] || row['phoneNumber3'] || undefined,
        phoneNumber4: row['Phone 4'] || row['phoneNumber4'] || undefined,
        phoneNumber5: row['Phone 5'] || row['phoneNumber5'] || undefined,
        phoneNumber6: row['Phone 6'] || row['phoneNumber6'] || undefined,
        siteMailingAddress: row['Site Address'] || row['siteMailingAddress'] || undefined,
        siteCity: row['Site City'] || row['siteCity'] || undefined,
        siteState: row['Site State'] || row['siteState'] || undefined,
        siteZipCode: row['Site Zip Code'] || row['siteZipCode'] ? parseInt(row['Site Zip Code'] || row['siteZipCode']) : undefined,
        notes: row['Notes'] || row['notes'] || undefined,
      })).map((contact: any) => {
        const hasFirst = !!contact.firstName && String(contact.firstName).trim().length > 0
        const hasLast = !!contact.lastName && String(contact.lastName).trim().length > 0
        const hasOrg = !!contact.organizationName && String(contact.organizationName).trim().length > 0
        const hasFull = !!contact.fullName && String(contact.fullName).trim().length > 0
        
        // If we have a full name or explicit organization field, use it
        if (hasFull && !hasFirst && !hasLast && !hasOrg) {
          contact.organizationName = String(contact.fullName).trim()
        } else if ((hasFirst && !hasLast) || (hasLast && !hasFirst)) {
          // Single name field - treat as organization
          contact.organizationName = String(hasFirst ? contact.firstName : contact.lastName).trim()
          contact.firstName = ''
          contact.lastName = ''
        } else if (!hasOrg && hasFull) {
          // Fallback: if full name exists and no org, use it
          contact.organizationName = String(contact.fullName).trim()
        }
        
        delete contact.fullName
        return contact
      }).filter((contact: any) => contact.firstName || contact.lastName || contact.organizationName || contact.farm)
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 })
    }

    // Import contacts
    let imported = 0
    let skipped = 0
    let errors = 0
    
    for (const contactData of contacts) {
      try {
        if (contactData.firstName || contactData.lastName || contactData.organizationName || contactData.farm) {
          // Check for duplicates
          const existing = await prisma.farmContact.findFirst({
            where: contactData.firstName || contactData.lastName
              ? {
                  firstName: contactData.firstName || '',
                  lastName: contactData.lastName || '',
                  farm: contactData.farm || undefined,
                }
              : contactData.organizationName
              ? {
                  firstName: '',
                  lastName: '',
                  organizationName: contactData.organizationName,
                  farm: contactData.farm || undefined,
                }
              : {
                  firstName: '',
                  lastName: '',
                  organizationName: '',
                  farm: contactData.farm || undefined,
                },
          })
          
          if (existing) {
            skipped++
            continue
          }
          
          await prisma.farmContact.create({
            data: {
              firstName: contactData.firstName || '',
              lastName: contactData.lastName || '',
              organizationName: contactData.organizationName,
              farm: contactData.farm,
              mailingAddress: contactData.mailingAddress,
              city: contactData.city,
              state: contactData.state,
              zipCode: contactData.zipCode,
              email1: contactData.email1,
              email2: contactData.email2,
              phoneNumber1: contactData.phoneNumber1,
              phoneNumber2: contactData.phoneNumber2,
              phoneNumber3: contactData.phoneNumber3,
              phoneNumber4: contactData.phoneNumber4,
              phoneNumber5: contactData.phoneNumber5,
              phoneNumber6: contactData.phoneNumber6,
              siteMailingAddress: contactData.siteMailingAddress,
              siteCity: contactData.siteCity,
              siteState: contactData.siteState,
              siteZipCode: contactData.siteZipCode,
              notes: contactData.notes,
            },
          })
          imported++
        }
      } catch (error) {
        errors++
        console.error('Error importing contact:', error)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      total: contacts.length,
      message: `Successfully imported ${imported} of ${contacts.length} contacts${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import contacts' },
      { status: 500 }
    )
  }
}
