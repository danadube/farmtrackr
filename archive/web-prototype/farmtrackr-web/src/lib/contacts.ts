import { FarmContact, ContactFormData } from '@/types/contact'

// Mock database - in production, this would use Prisma with PostgreSQL
let contacts: FarmContact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    farm: 'Sample Farm',
    mailingAddress: '123 Farm Road',
    city: 'Farmville',
    state: 'CA',
    zipCode: 90210,
    email1: 'john@samplefarm.com',
    phoneNumber1: '(555) 123-4567',
    notes: 'Sample contact for testing',
    dateCreated: new Date('2024-01-01'),
    dateModified: new Date('2024-01-01')
  }
]

export async function getAllContacts(): Promise<FarmContact[]> {
  return [...contacts]
}

export async function getContactById(id: string): Promise<FarmContact | null> {
  return contacts.find(contact => contact.id === id) || null
}

export async function createContact(data: ContactFormData): Promise<FarmContact> {
  const newContact: FarmContact = {
    id: Date.now().toString(),
    ...data,
    dateCreated: new Date(),
    dateModified: new Date()
  }
  
  contacts.push(newContact)
  return newContact
}

export async function updateContact(id: string, data: ContactFormData): Promise<FarmContact | null> {
  const index = contacts.findIndex(contact => contact.id === id)
  if (index === -1) return null
  
  contacts[index] = {
    ...contacts[index],
    ...data,
    dateModified: new Date()
  }
  
  return contacts[index]
}

export async function deleteContact(id: string): Promise<boolean> {
  const index = contacts.findIndex(contact => contact.id === id)
  if (index === -1) return false
  
  contacts.splice(index, 1)
  return true
}