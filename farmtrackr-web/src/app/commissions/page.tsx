'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  Briefcase, 
  Home,
  Calendar,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react'
import { TransactionForm } from '@/components/TransactionForm'

interface Transaction {
  id: string
  propertyType: string
  clientType: string
  transactionType: string
  address: string | null
  city: string | null
  closedPrice: number | null
  closedDate: Date | null
  brokerage: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export default function CommissionsPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchTransactions()
      } else {
        alert('Failed to delete transaction')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('Failed to delete transaction')
    }
  }

  // Calculate summary stats
  const totalTransactions = transactions.length
  const totalVolume = transactions.reduce((sum, t) => sum + (t.closedPrice || 0), 0)
  const closedTransactions = transactions.filter(t => t.status === 'Closed').length

  if (isLoading) {
    return (
      <Sidebar>
        <div 
          style={{ 
            marginLeft: '256px', 
            paddingLeft: '0',
            minHeight: '100vh',
            ...background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                border: `4px solid ${colors.border}`,
                borderTop: `4px solid ${colors.primary}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}
            />
            <p style={{ ...text.secondary }}>Loading commissions...</p>
          </div>
        </div>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div 
        style={{ 
          marginLeft: '256px', 
          paddingLeft: '0',
          minHeight: '100vh',
          ...background
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
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <div 
              style={{
                padding: '24px',
                ...headerCard,
                ...headerTint(colors.primary)
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                        ...text.primary,
                        margin: '0 0 4px 0'
                      }}
                    >
                      Commissions
                    </h1>
                    <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                      Track your real estate transactions and commissions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setShowForm(true)
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  New Transaction
                </button>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Total Transactions
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    {totalTransactions}
                  </p>
                </div>
                <Briefcase style={{ width: '32px', height: '32px', color: colors.primary, opacity: 0.6 }} />
              </div>
            </div>
            
            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Total Volume
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    ${totalVolume.toLocaleString()}
                  </p>
                </div>
                <TrendingUp style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6 }} />
              </div>
            </div>

            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Closed Deals
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    {closedTransactions}
                  </p>
                </div>
                <Home style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6 }} />
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <h2 
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  ...text.primary,
                  margin: '0'
                }}
              >
                All Transactions ({transactions.length})
              </h2>
            </div>
            
            {transactions.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <DollarSign style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                  No transactions yet
                </h3>
                <p style={{ ...text.secondary, marginBottom: '24px' }}>
                  Start tracking your commissions by adding your first transaction.
                </p>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setShowForm(true)
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primaryHover
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Add First Transaction
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    style={{
                      padding: '20px 24px',
                      borderBottom: index < transactions.length - 1 ? `1px solid ${colors.border}` : 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '16px', margin: '0' }}>
                            {transaction.propertyType} - {transaction.clientType}
                          </h3>
                          <span
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: transaction.status === 'Closed' 
                                ? (isDark ? '#065f46' : '#dcfce7')
                                : transaction.status === 'Pending'
                                ? (isDark ? '#78350f' : '#fef3c7')
                                : (isDark ? '#991b1b' : '#fee2e2'),
                              color: transaction.status === 'Closed'
                                ? colors.success
                                : transaction.status === 'Pending'
                                ? colors.warning
                                : colors.error,
                              borderRadius: '9999px',
                              border: `1px solid ${transaction.status === 'Closed' ? colors.success : transaction.status === 'Pending' ? colors.warning : colors.error}`
                            }}
                          >
                            {transaction.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          {transaction.address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Home style={{ width: '14px', height: '14px', color: colors.text.tertiary }} />
                              <span style={{ fontSize: '13px', ...text.secondary }}>
                                {transaction.address}{transaction.city ? `, ${transaction.city}` : ''}
                              </span>
                            </div>
                          )}
                          {transaction.closedPrice && (
                            <span style={{ fontSize: '15px', fontWeight: '600', ...text.primary }}>
                              ${transaction.closedPrice.toLocaleString()}
                            </span>
                          )}
                          <span style={{ fontSize: '13px', ...text.tertiary }}>
                            {transaction.brokerage}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingId(transaction.id)
                            setShowForm(true)
                          }}
                          style={{
                            padding: '8px',
                            backgroundColor: colors.cardHover,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.primary + '20'
                            e.currentTarget.style.borderColor = colors.primary
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                            e.currentTarget.style.borderColor = colors.border
                          }}
                          title="Edit"
                        >
                          <Edit2 style={{ width: '16px', height: '16px', color: colors.primary }} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          style={{
                            padding: '8px',
                            backgroundColor: colors.cardHover,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.error + '20'
                            e.currentTarget.style.borderColor = colors.error
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                            e.currentTarget.style.borderColor = colors.border
                          }}
                          title="Delete"
                        >
                          <Trash2 style={{ width: '16px', height: '16px', color: colors.error }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase 1 Complete Notice */}
          <div 
            style={{
              marginTop: '24px',
              padding: '24px',
              backgroundColor: isDark ? '#065f46' : '#dcfce7',
              border: `1px solid ${colors.success}`,
              borderRadius: '12px'
            }}
          >
            <h3 style={{ fontWeight: '600', color: colors.success, fontSize: '16px', marginBottom: '12px' }}>
              ✅ Phase 1: Foundation Complete
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: isDark ? '#a7f3d0' : '#059669' }}>
              <p style={{ margin: '0' }}>
                Database and API are ready! Phase 2 features coming soon:
              </p>
              <ul style={{ margin: '0', paddingLeft: '20px' }}>
                <li>Transaction create/edit form</li>
                <li>Commission calculations (GCI, NCI, Brokerage-specific)</li>
                <li>Analytics dashboard with charts</li>
                <li>Google Sheets sync</li>
                <li>Advanced filters and search</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transactionId={editingId}
          onClose={() => {
            setShowForm(false)
            setEditingId(null)
          }}
          onSuccess={async () => {
            setShowForm(false)
            setEditingId(null)
            await fetchTransactions()
          }}
        />
      )}
    </Sidebar>
  )
}

