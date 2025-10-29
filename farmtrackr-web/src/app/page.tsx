'use client'

import { useState, useEffect } from 'react'
import { FarmContact, Stats } from '@/types'
import { 
  Users, 
  Building2, 
  FileText, 
  Upload, 
  Printer, 
  Plus,
  Calendar,
  TrendingUp,
  Home
} from 'lucide-react'
import Link from 'next/link'

// Mock data - replace with real API calls
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

export default function DashboardPage() {
  const [contacts, setContacts] = useState<FarmContact[]>([])
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    farmsWithContacts: 0,
    recentContacts: 0
  })

  useEffect(() => {
    // Simulate API call
    setContacts(mockContacts)
    
    const farms = new Set(mockContacts.map(c => c.farm).filter(Boolean))
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 7)
    const recent = mockContacts.filter(c => c.dateCreated > recentDate)

    setStats({
      totalContacts: mockContacts.length,
      farmsWithContacts: farms.size,
      recentContacts: recent.length
    })
  }, [])

  const recentContacts = contacts
    .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
    .slice(0, 5)

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
            <Link href="/" className="flex items-center space-x-3 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
              <Home className="w-4 h-4" />
              <span className="font-medium">Home</span>
            </Link>
            <Link href="/contacts" className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Users className="w-4 h-4" />
              <span>Contacts</span>
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
            <div className="flex items-center space-x-3">
              <Home className="w-6 h-6 text-green-700" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Home</h1>
                <p className="text-gray-700 mt-1">Welcome to your farm dashboard.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/contacts/new" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Add Contact</h3>
                  <p className="text-sm text-gray-500">Create a new farm contact</p>
                </div>
              </div>
            </Link>

            <Link href="/import-export" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Import & Export</h3>
                  <p className="text-sm text-gray-500">Import contacts from file or export...</p>
                </div>
              </div>
            </Link>

            <Link href="/print-labels" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Printer className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Print Labels</h3>
                  <p className="text-sm text-gray-500">Print address labels</p>
                </div>
              </div>
            </Link>

            <Link href="/documents" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-500">Manage documents</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Contacts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalContacts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Unique Farms</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.farmsWithContacts}</p>
                  <p className="text-sm text-gray-500">Cielo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Contacts */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Contacts</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {recentContacts.map((contact) => (
              <Link key={contact.id} href={`/contacts/${contact.id}`} className="block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-700">
                      {contact.firstName[0]}{contact.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</h3>
                    <p className="text-sm text-gray-500">{contact.farm}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{contact.dateCreated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
