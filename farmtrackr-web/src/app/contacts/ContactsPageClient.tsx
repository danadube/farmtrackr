'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useSearchParams, useRouter } from 'next/navigation'
import { FarmContactsView } from '@/components/contacts/FarmContactsView'
import { GoogleContactsView } from '@/components/contacts/GoogleContactsView'

type ContactsView = 'farm' | 'google'

export default function ContactsPageClient() {
  const { colors } = useThemeStyles()
  const searchParams = useSearchParams()
  const router = useRouter()

  const viewParam = searchParams.get('view')
  const [activeView, setActiveView] = useState<ContactsView>(() => {
    if (viewParam === 'google') return 'google'
    if (viewParam === 'farm') return 'farm'
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('contacts.activeView') as ContactsView | null
      if (stored === 'google' || stored === 'farm') return stored
    }
    return 'farm'
  })

  useEffect(() => {
    if (viewParam === 'google' && activeView !== 'google') {
      setActiveView('google')
    } else if (viewParam === 'farm' && activeView !== 'farm') {
      setActiveView('farm')
    }
  }, [viewParam, activeView])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('contacts.activeView', activeView)
    }
  }, [activeView])

  const handleViewChange = (view: ContactsView) => {
    if (view === activeView) return
    setActiveView(view)

    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const viewSwitcher = (
    <div
      style={{
        display: 'flex',
      justifyContent: 'flex-start',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          gap: '8px',
          padding: '6px',
          borderRadius: '999px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {([
          { key: 'farm', label: 'Farm Contacts' },
          { key: 'google', label: 'Google Contacts' },
        ] as const).map((item) => {
          const isActive = activeView === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleViewChange(item.key)}
              style={{
                padding: '8px 18px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.01em',
                backgroundColor: isActive ? colors.primary : 'transparent',
                color: isActive ? '#ffffff' : colors.text.secondary,
                transition: 'all 0.2s ease',
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <Sidebar>
      {activeView === 'farm' ? (
        <FarmContactsView viewSwitcher={viewSwitcher} />
      ) : (
        <GoogleContactsView viewSwitcher={viewSwitcher} />
      )}
    </Sidebar>
  )
}
