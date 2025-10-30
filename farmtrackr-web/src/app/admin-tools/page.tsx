"use client"

import React, { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'

export default function AdminToolsPage() {
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const adminEnabled = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_ADMIN === 'true'

  const run = async (label: string, url: string) => {
    if (!adminEnabled) {
      setLog((l) => [`Admin disabled`, ...l])
      return
    }
    setBusy(true)
    try {
      const res = await fetch(url, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      setLog((l) => [`${label}: ${JSON.stringify(data)}`, ...l])
    } catch (e: any) {
      setLog((l) => [`${label} ERROR: ${e.message}`, ...l])
    } finally {
      setBusy(false)
    }
  }

  const buttonStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 12,
    border: 'none',
    cursor: busy ? 'not-allowed' : 'pointer',
    color: '#fff',
    background: '#ef4444',
    fontWeight: 600,
  }

  const card: React.CSSProperties = {
    background: 'var(--card-bg, #fff)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }

  return (
    <Sidebar>
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 16px 0' }}>Admin Tools (Dev)</h1>
        {process.env.NEXT_PUBLIC_ENABLE_ADMIN !== 'true' && (
          <p style={{ color: '#b91c1c', marginBottom: 16 }}>Disabled. Set NEXT_PUBLIC_ENABLE_ADMIN=true to enable.</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Danger Zone</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button disabled={busy} style={buttonStyle} onClick={() => run('Purge Contacts', '/api/admin/purge/contacts')}>Purge All Contacts</button>
              <button disabled={busy} style={buttonStyle} onClick={() => run('Purge Documents', '/api/admin/purge/documents')}>Purge All Documents</button>
              <button disabled={busy} style={buttonStyle} onClick={() => run('Purge Letterheads', '/api/admin/purge/letterheads')}>Purge All Letterheads</button>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Log</h3>
            <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 12 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{log.join('\n')}</pre>
            </div>
          </div>
        </div>
        </div>
      </div>
    </Sidebar>
  )
}


