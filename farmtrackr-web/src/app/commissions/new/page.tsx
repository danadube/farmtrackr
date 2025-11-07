'use client'

import { useRouter } from 'next/navigation'
import { TransactionForm } from '@/components/TransactionForm'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'

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
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '48px',
            paddingRight: '48px',
            paddingTop: '32px',
            paddingBottom: '32px'
          }}
        >
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

