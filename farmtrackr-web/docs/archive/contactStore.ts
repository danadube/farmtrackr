// Simple in-memory data store for contacts
// In production, this would be replaced with a real database

import { FarmContact } from '@/types'

let contacts: FarmContact[] = [
  {
    id: '1',
    firstName: 'Donald',
    lastName: 'Shelton',
    organizationName: undefined,
    farm: 'Cielo',
    mailingAddress: '123 Farm Road',
    city: 'Farm City',
    state: 'CA',
    zipCode: '90210',
    email1: 'donald@cielo.com',
    email2: undefined,
    phoneNumber1: '(555) 123-4567',
    phoneNumber2: undefined,
    phoneNumber3: undefined,
    phoneNumber4: undefined,
    phoneNumber5: undefined,
    phoneNumber6: undefined,
    siteMailingAddress: undefined,
    siteCity: undefined,
    siteState: undefined,
    siteZipCode: undefined,
    website: '',
    notes: undefined,
    dateCreated: new Date('2025-07-14'),
    dateModified: new Date('2025-07-14'),
  },
  {
    id: '2',
    firstName: 'Tawna',
    lastName: 'Baxter',
    organizationName: undefined,
    farm: 'Cielo',
    mailingAddress: '456 Ranch Lane',
    city: 'Ranch Town',
    state: 'CA',
    zipCode: '90211',
    email1: 'tawna@cielo.com',
    email2: undefined,
    phoneNumber1: '(555) 234-5678',
    phoneNumber2: undefined,
    phoneNumber3: undefined,
    phoneNumber4: undefined,
    phoneNumber5: undefined,
    phoneNumber6: undefined,
    siteMailingAddress: undefined,
    siteCity: undefined,
    siteState: undefined,
    siteZipCode: undefined,
    website: '',
    notes: undefined,
    dateCreated: new Date('2025-07-13'),
    dateModified: new Date('2025-07-13'),
  },
  {
    id: '3',
    firstName: 'Diana',
    lastName: 'Johnson',
    organizationName: undefined,
    farm: 'Cielo',
    mailingAddress: '789 Orchard Way',
    city: 'Orchard City',
    state: 'CA',
    zipCode: '90212',
    email1: 'diana@cielo.com',
    email2: undefined,
    phoneNumber1: '(555) 345-6789',
    phoneNumber2: undefined,
    phoneNumber3: undefined,
    phoneNumber4: undefined,
    phoneNumber5: undefined,
    phoneNumber6: undefined,
    siteMailingAddress: undefined,
    siteCity: undefined,
    siteState: undefined,
    siteZipCode: undefined,
    website: '',
    notes: undefined,
    dateCreated: new Date('2025-07-12'),
    dateModified: new Date('2025-07-12'),
  },
  {
    id: '4',
    firstName: 'Stephen',
    lastName: 'Maitland-lewis',
    organizationName: undefined,
    farm: 'Cielo',
    mailingAddress: '321 Vineyard Drive',
    city: 'Vineyard Valley',
    state: 'CA',
    zipCode: '90213',
    email1: 'stephen@cielo.com',
    email2: undefined,
    phoneNumber1: '(555) 456-7890',
    phoneNumber2: undefined,
    phoneNumber3: undefined,
    phoneNumber4: undefined,
    phoneNumber5: undefined,
    phoneNumber6: undefined,
    siteMailingAddress: undefined,
    siteCity: undefined,
    siteState: undefined,
    siteZipCode: undefined,
    website: '',
    notes: undefined,
    dateCreated: new Date('2025-07-11'),
    dateModified: new Date('2025-07-11'),
  },
  {
    id: '5',
    firstName: 'Gerald',
    lastName: 'Morris',
    organizationName: undefined,
    farm: 'Cielo',
    mailingAddress: '654 Harvest Hill',
    city: 'Harvest Heights',
    state: 'CA',
    zipCode: '90214',
    email1: 'gerald@cielo.com',
    email2: undefined,
    phoneNumber1: '(555) 567-8901',
    phoneNumber2: undefined,
    phoneNumber3: undefined,
    phoneNumber4: undefined,
    phoneNumber5: undefined,
    phoneNumber6: undefined,
    siteMailingAddress: undefined,
    siteCity: undefined,
    siteState: undefined,
    siteZipCode: undefined,
    website: '',
    notes: undefined,
    dateCreated: new Date('2025-07-10'),
    dateModified: new Date('2025-07-10'),
  },
]

let nextId = 6

export const contactStore = {
  // Get all contacts with optional filters
  getAll: (filters?: { search?: string; farm?: string }): FarmContact[] => {
    let result = [...contacts]
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(contact =>
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.organizationName?.toLowerCase().includes(searchLower) ||
        contact.farm?.toLowerCase().includes(searchLower) ||
        contact.email1?.toLowerCase().includes(searchLower) ||
        contact.email2?.toLowerCase().includes(searchLower)
      )
    }
    
    if (filters?.farm) {
      result = result.filter(contact => contact.farm === filters.farm)
    }
    
    return result.sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
  },

  // Get a single contact by ID
  getById: (id: string): FarmContact | undefined => {
    return contacts.find(contact => contact.id === id)
  },

  // Create a new contact
  create: (data: Omit<FarmContact, 'id' | 'dateCreated' | 'dateModified'>): FarmContact => {
    const newContact: FarmContact = {
      ...data,
      id: String(nextId++),
      dateCreated: new Date(),
      dateModified: new Date(),
    }
    contacts.push(newContact)
    return newContact
  },

  // Update an existing contact
  update: (id: string, data: Partial<Omit<FarmContact, 'id' | 'dateCreated'>>): FarmContact | null => {
    const index = contacts.findIndex(contact => contact.id === id)
    if (index === -1) return null
    
    contacts[index] = {
      ...contacts[index],
      ...data,
      dateModified: new Date(),
    }
    
    return contacts[index]
  },

  // Delete a contact
  delete: (id: string): boolean => {
    const index = contacts.findIndex(contact => contact.id === id)
    if (index === -1) return false
    
    contacts.splice(index, 1)
    return true
  },

  // Get stats
  getStats: () => {
    const uniqueFarms = new Set(contacts.map(c => c.farm).filter(Boolean))
    return {
      totalContacts: contacts.length,
      farmsWithContacts: uniqueFarms.size,
      recentContacts: contacts.filter(c => {
        const daysSinceCreated = (Date.now() - c.dateCreated.getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceCreated <= 7
      }).length
    }
  }
}
