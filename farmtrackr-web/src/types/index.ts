import { FarmContact as PrismaFarmContact } from '@prisma/client'

export type FarmContact = PrismaFarmContact

export interface ContactFormData {
  firstName: string
  lastName: string
  organizationName?: string
  farm?: string
  mailingAddress?: string
  city?: string
  state?: string
  zipCode?: string
  email1?: string
  email2?: string
  phoneNumber1?: string
  phoneNumber2?: string
  phoneNumber3?: string
  phoneNumber4?: string
  phoneNumber5?: string
  phoneNumber6?: string
  siteMailingAddress?: string
  siteCity?: string
  siteState?: string
  siteZipCode?: string
  website?: string
  notes?: string
  tags?: string[]
}

export interface ImportTemplate {
  id: string
  name: string
  fieldMappings: Record<string, string>
  dateCreated: Date
}

export interface LabelTemplate {
  id: string
  name: string
  template: string
  dateCreated: Date
}

export interface Stats {
  totalContacts: number
  farmsWithContacts: number
  recentContacts: number
}

// Email Integration Types
export interface EmailAttachment {
  name: string
  content?: string // Base64 encoded
  mimeType?: string
  size?: number
}

export interface EmailData {
  to: string
  subject: string
  body: string
  cc?: string
  bcc?: string
  transactionId?: string
  contactId?: string
  attachments?: EmailAttachment[]
}

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  to: string
  cc?: string
  subject: string
  body: string
  plainBody: string
  date: string
  isUnread: boolean
  isStarred?: boolean
  attachments: EmailAttachment[]
  labels: string[]
  transactionId?: string
}

export interface EmailLogEntry {
  messageId: string
  transactionId?: string
  contactId?: string
  direction: 'sent' | 'received'
  from: string
  to: string
  subject: string
  date: string
  bodyPreview: string
  fullBody: string
  attachments: EmailAttachment[]
  threadId: string
  savedBy: string
}