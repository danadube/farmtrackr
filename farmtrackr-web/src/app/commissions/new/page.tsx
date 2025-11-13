'use client'

import { useRouter } from 'next/navigation'
import { TransactionForm } from '@/components/TransactionForm'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { DollarSign } from 'lucide-react'

export default function NewTransactionPage() {
  const router = useRouter()
  const { colors, background, spacing } = useThemeStyles()

  const handleClose = () => {
    router.push('/commissions')
  }

  const handleSuccess = async () => {
    router.push('/commissions')
  }

  return (
    <Sidebar>
      <div 
        style={{ 
          minHeight: '100vh',
          backgroundColor: colors.background
        }}
      >
        <div 
          style={{
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingTop: '32px',
            boxSizing: 'border-box',
            paddingBottom: '32px'
          }}
        >
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div 
              style={{
                padding: '24px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.primary}`,
                borderRadius: '16px',
                position: 'relative' as const,
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div 
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: colors.iconBg,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <DollarSign style={{ width: '24px', height: '24px', color: colors.primary }} />
                </div>
                <div>
                  <h1 
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#ffffff',
                      margin: '0 0 4px 0'
                    }}
                  >
                    New Transaction
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                    Create a new commission transaction
                  </p>
                </div>
              </div>
            </div>
          </div>
          <TransactionForm
            transactionId={null}
            onClose={handleClose}
            onSuccess={handleSuccess}
            asPage={true}
          />
        </div>
      </div>
    </Sidebar>
  )
}

