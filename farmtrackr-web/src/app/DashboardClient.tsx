'use client'

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
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { Sidebar } from '@/components/Sidebar'

interface DashboardClientProps {
  contacts: FarmContact[]
  stats: Stats
}

export default function DashboardClient({ contacts, stats }: DashboardClientProps) {
  const recentContactsList = contacts
    .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
    .slice(0, 5)

  return (
    <Sidebar>
      <div className="p-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <FarmTrackrLogo size="lg" variant="icon" className="text-green-700" />
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
                  <p className="text-sm text-gray-500">Active farms</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Contacts */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Contacts</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {recentContactsList.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h3>
                <p className="text-gray-500 mb-6">Get started by adding your first farm contact.</p>
                <Link href="/contacts/new" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add First Contact</span>
                </Link>
              </div>
            ) : (
              recentContactsList.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`} className="block p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-700">
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
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
              ))
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
