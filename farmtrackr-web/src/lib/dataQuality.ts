// Duplicate detection and data validation utilities
import { FarmContact } from '@/types'

export interface DuplicateGroup {
  id: string
  contacts: FarmContact[]
  confidence: 'high' | 'medium' | 'low'
  matchFields: string[]
}

export interface ValidationIssue {
  id: string
  contactId: string
  contactName: string
  type: 'missing' | 'invalid' | 'format'
  field: string
  message: string
  severity: 'error' | 'warning'
}

// Normalize phone number for comparison
function normalizePhone(phone: string | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '') // Remove all non-digits
}

// Normalize email for comparison
function normalizeEmail(email: string | undefined): string {
  if (!email) return ''
  return email.toLowerCase().trim()
}

// Normalize name for comparison
function normalizeName(name: string | undefined): string {
  if (!name) return ''
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

// Check if two contacts are duplicates
function areDuplicates(contact1: FarmContact, contact2: FarmContact): {
  isDuplicate: boolean
  confidence: 'high' | 'medium' | 'low'
  matchFields: string[]
} {
  const matchFields: string[] = []
  let matchCount = 0

  // Exact name match (high confidence)
  const name1 = normalizeName(`${contact1.firstName} ${contact1.lastName}`)
  const name2 = normalizeName(`${contact2.firstName} ${contact2.lastName}`)
  if (name1 && name2 && name1 === name2) {
    matchFields.push('name')
    matchCount += 2
  }

  // Email match (high confidence)
  const email1 = normalizeEmail(contact1.email1)
  const email2 = normalizeEmail(contact2.email1)
  if (email1 && email2 && email1 === email2) {
    matchFields.push('email')
    matchCount += 2
  }

  // Phone match (medium-high confidence)
  const phone1 = normalizePhone(contact1.phoneNumber1)
  const phone2 = normalizePhone(contact2.phoneNumber1)
  if (phone1 && phone2 && phone1.length >= 10 && phone1 === phone2) {
    matchFields.push('phone')
    matchCount += 1.5
  }

  // Same farm with similar name (medium confidence)
  if (contact1.farm && contact2.farm && 
      normalizeName(contact1.farm) === normalizeName(contact2.farm) &&
      name1 && name2 && 
      (name1.includes(name2) || name2.includes(name1))) {
    if (!matchFields.includes('name')) {
      matchFields.push('name')
      matchCount += 1
    }
  }

  // Determine confidence and if it's a duplicate
  let confidence: 'high' | 'medium' | 'low' = 'low'
  let isDuplicate = false

  if (matchCount >= 3) {
    confidence = 'high'
    isDuplicate = true
  } else if (matchCount >= 2) {
    confidence = 'medium'
    isDuplicate = true
  } else if (matchCount >= 1.5) {
    confidence = 'low'
    isDuplicate = true
  }

  return { isDuplicate, confidence, matchFields }
}

// Detect duplicate groups in contacts
export function detectDuplicates(contacts: FarmContact[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = []
  const processed = new Set<string>()

  for (let i = 0; i < contacts.length; i++) {
    if (processed.has(contacts[i].id)) continue

    const group: FarmContact[] = [contacts[i]]
    let groupConfidence: 'high' | 'medium' | 'low' = 'low'
    let groupMatchFields: string[] = []

    for (let j = i + 1; j < contacts.length; j++) {
      if (processed.has(contacts[j].id)) continue

      const result = areDuplicates(contacts[i], contacts[j])
      if (result.isDuplicate) {
        group.push(contacts[j])
        processed.add(contacts[j].id)
        
        // Update group confidence to highest match
        if (result.confidence === 'high' || groupConfidence === 'low') {
          groupConfidence = result.confidence
        }
        // Merge match fields
        result.matchFields.forEach(field => {
          if (!groupMatchFields.includes(field)) {
            groupMatchFields.push(field)
          }
        })
      }
    }

    // Only create group if there are duplicates (more than 1 contact)
    if (group.length > 1) {
      processed.add(contacts[i].id)
      groups.push({
        id: `group-${i}`,
        contacts: group,
        confidence: groupConfidence,
        matchFields: groupMatchFields,
      })
    }
  }

  return groups
}

// Validate contact data
export function validateContact(contact: FarmContact): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Required fields
  if (!contact.firstName?.trim()) {
    issues.push({
      id: `missing-firstname-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
      type: 'missing',
      field: 'firstName',
      message: 'First name is required',
      severity: 'error',
    })
  }

  if (!contact.lastName?.trim()) {
    issues.push({
      id: `missing-lastname-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown',
      type: 'missing',
      field: 'lastName',
      message: 'Last name is required',
      severity: 'error',
    })
  }

  // Email validation
  if (contact.email1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email1)) {
    issues.push({
      id: `invalid-email1-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      type: 'invalid',
      field: 'email1',
      message: 'Invalid email format',
      severity: 'error',
    })
  }

  if (contact.email2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email2)) {
    issues.push({
      id: `invalid-email2-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      type: 'invalid',
      field: 'email2',
      message: 'Invalid email format',
      severity: 'error',
    })
  }

  // ZIP code validation (allow 5-digit or ZIP+4)
  if (contact.zipCode) {
    const z = String(contact.zipCode)
    const isFive = /^\d{5}$/.test(z)
    const isPlus4 = /^\d{5}-\d{4}$/.test(z)
    if (!isFive && !isPlus4) {
    issues.push({
      id: `invalid-zip-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      type: 'format',
      field: 'zipCode',
      message: 'ZIP must be 5-digit or ZIP+4 (12345 or 12345-6789)',
      severity: 'warning',
    })
  }
  }

  if (contact.siteZipCode) {
    const z = String(contact.siteZipCode)
    const isFive = /^\d{5}$/.test(z)
    const isPlus4 = /^\d{5}-\d{4}$/.test(z)
    if (!isFive && !isPlus4) {
    issues.push({
      id: `invalid-sitezip-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      type: 'format',
      field: 'siteZipCode',
      message: 'Site ZIP must be 5-digit or ZIP+4 (12345 or 12345-6789)',
      severity: 'warning',
    })
  }
  }

  // Warning for missing contact info
  if (!contact.email1 && !contact.phoneNumber1) {
    issues.push({
      id: `missing-contact-${contact.id}`,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      type: 'missing',
      field: 'contactInfo',
      message: 'Missing email and phone number',
      severity: 'warning',
    })
  }

  return issues
}

// Validate all contacts
export function validateAllContacts(contacts: FarmContact[]): ValidationIssue[] {
  const allIssues: ValidationIssue[] = []
  
  for (const contact of contacts) {
    const issues = validateContact(contact)
    allIssues.push(...issues)
  }

  return allIssues
}

// Calculate data quality score
export function calculateQualityScore(
  contacts: FarmContact[],
  duplicates: DuplicateGroup[],
  issues: ValidationIssue[]
): number {
  if (contacts.length === 0) return 100

  const totalIssues = duplicates.reduce((sum, group) => sum + group.contacts.length, 0) + issues.length
  const maxPossibleIssues = contacts.length * 3 // Rough estimate
  const issueRatio = totalIssues / maxPossibleIssues
  const score = Math.max(0, Math.min(100, Math.round((1 - issueRatio) * 100)))

  return score
}
