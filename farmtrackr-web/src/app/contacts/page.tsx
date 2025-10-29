'use client'

import { useState } from 'react'
import { FarmContact } from '@/types'
import { 
  Users, 
  Building2, 
  FileText, 
  Upload, 
  Printer, 
  Plus,
  Calendar,
  TrendingUp,
  Home,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

// Mock data - same as dashboard
const mockContacts: FarmContact[] = [
  {
    id: '1',
    firstName: 'Donald',
    lastName: 'Shelton',
    farm: 'Cielo',
    email1: 'donald@cielo.com',
    phoneNumber1: '(555) 123-4567',
    dateCreated: new Date('2025-07-14'),
    dateModified: new Date('2025-07-14'),
  },
  {
    id: '2',
    firstName: 'Tawna',
    lastName: 'Baxter',
    farm: 'Cielo',
    email1: 'tawna@cielo.com',
    phoneNumber1: '(555) 234-5678',
    dateCreated: new Date('2025-07-13'),
    dateModified: new Date('2025-07-13'),
  },
  {
    id: '3',
    firstName: 'Diana',
    lastName: 'Johnson',
    farm: 'Cielo',
    email1: 'diana@cielo.com',
    phoneNumber1: '(555) 345-6789',
    dateCreated: new Date('2025-07-12'),
    dateModified: new Date('2025-07-12'),
  },
  {
    id: '4',
    firstName: 'Stephen',
    lastName: 'Maitland-lewis',
    farm: 'Cielo',
    email1: 'stephen@cielo.com',
    phoneNumber1: '(555) 456-7890',
    dateCreated: new Date('2025-07-11'),
    dateModified: new Date('2025-07-11'),
  },
  {
    id: '5',
    firstName: 'Gerald',
    lastName: 'Morris',
    farm: 'Cielo',
    email1: 'gerald@cielo.com',
    phoneNumber1: '(555) 567-8901',
    dateCreated: new Date('2025-07-10'),
    dateModified: new Date('2025-07-10'),
  },
]

export default function ContactsPage() {
  const [contacts] = useState<FarmContact[]>(mockContacts)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      contact.firstName.toLowerCase().includes(query) ||
      contact.lastName.toLowerCase().includes(query) ||
      contact.farm?.toLowerCase().includes(query) ||
      contact.email1?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FarmTrackr</h1>
              <p className="text-sm text-gray-500">Farm CRM</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MAIN</h3>
            <Link href="/" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <Link href="/contacts" className="flex items-center space-x-3 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="font-medium">Contacts</span>
            </Link>
            <Link href="/documents" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </Link>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">TOOLS</h3>
            <Link href="/data-quality" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>Data Quality</span>
            </Link>
            <Link href="/import-export" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              <span>Import & Export</span>
            </Link>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">SETTINGS</h3>
            <Link href="/settings" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Building2 className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-green-700" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
                  <p className="text-gray-700 mt-1">Manage your farm contacts</p>
                </div>
              </div>
              <Link href="/contacts/new" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">All Contacts ({filteredContacts.length})</h2>
          </div>
          
          {filteredContacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first farm contact.'}
              </p>
              {!searchQuery && (
                <Link href="/contacts/new" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add First Contact</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`} className="block p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-700">
                        {contact.firstName[0]}{contact.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{contact.firstName} {contact.lastName}</h3>
                      <p className="text-sm text-gray-500">{contact.farm}</p>
                      {contact.email1 && (
                        <p className="text-sm text-gray-400">{contact.email1}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{contact.dateCreated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
