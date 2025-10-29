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
  Home,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { Sidebar } from '@/components/Sidebar'

interface DashboardClientProps {
  contacts: FarmContact[];
  stats: Stats;
}

export default function DashboardClient({ contacts, stats }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const recentContactsList = contacts
    .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
    .slice(0, 4)

  return (
    <Sidebar>
      <div className="min-h-screen gradient-bg">
        <div className="container py-8">
          {/* Hero Section */}
          <div className="section-lg">
            <div className="card glass-effect">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FarmTrackrLogo size="lg" variant="icon" className="text-primary" />
                </div>
                <div>
                  <h1 className="heading-1">Welcome back</h1>
                  <p className="body-text">Manage your farm contacts and operations efficiently</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="section">
            <h2 className="heading-2">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/contacts/new" className="card card-hover group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Add Contact</h3>
                    <p className="text-sm text-muted-foreground">Create a new farm contact</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>

              <Link href="/import-export" className="card card-hover group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Import & Export</h3>
                    <p className="text-sm text-muted-foreground">Manage data files</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>

              <Link href="/print-labels" className="card card-hover group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Printer className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Print Labels</h3>
                    <p className="text-sm text-muted-foreground">Print address labels</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>

              <Link href="/documents" className="card card-hover group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Documents</h3>
                    <p className="text-sm text-muted-foreground">Manage documents</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div className="section">
            <h2 className="heading-2">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Contacts</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalContacts}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Farms</p>
                    <p className="text-3xl font-bold text-foreground">{stats.farmsWithContacts}</p>
                    <p className="text-xs text-muted-foreground">Cielo</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Recent Activity</p>
                    <p className="text-3xl font-bold text-foreground">{stats.recentContacts}</p>
                    <p className="text-xs text-muted-foreground">This week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-2">Recent Contacts</h2>
              <Link href="/contacts" className="btn-secondary btn-sm">
                View All
              </Link>
            </div>
            
            <div className="card">
              {recentContactsList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="heading-3">No contacts yet</h3>
                  <p className="body-text mb-6">Get started by adding your first farm contact.</p>
                  <Link href="/contacts/new" className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Contact
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentContactsList.map((contact) => (
                    <Link 
                      key={contact.id} 
                      href={`/contacts/${contact.id}`} 
                      className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {contact.firstName?.[0]}{contact.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {contact.firstName} {contact.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{contact.farm}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {contact.dateCreated.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  )
}