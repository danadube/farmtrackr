'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Building2, 
  FileText, 
  Upload, 
  TrendingUp,
  Home,
  FileSpreadsheet
} from 'lucide-react'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'

interface SidebarProps {
  children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Contacts', href: '/contacts', icon: Users },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Data Quality', href: '/data-quality', icon: TrendingUp },
    { name: 'Google Sheets', href: '/google-sheets', icon: FileSpreadsheet },
    { name: 'Import & Export', href: '/import-export', icon: Upload },
    { name: 'Settings', href: '/settings', icon: Building2 },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-card shadow-lg border-r border-border">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <FarmTrackrLogo size="lg" variant="logo" />
            <div>
              <h1 className="text-xl font-bold text-card-foreground">FarmTrackr</h1>
              <p className="text-sm text-muted-foreground">Farm CRM</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">MAIN</h3>
            {navigation.slice(0, 3).map((item) => (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-card-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className={pathname === item.href ? 'font-medium' : ''}>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">TOOLS</h3>
            {navigation.slice(3, 6).map((item) => (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-card-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className={pathname === item.href ? 'font-medium' : ''}>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">SETTINGS</h3>
            {navigation.slice(6).map((item) => (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  pathname === item.href 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-card-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className={pathname === item.href ? 'font-medium' : ''}>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {children}
      </div>
    </div>
  )
}
