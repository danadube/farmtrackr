'use client'

import { useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { ChevronDown, Search, X } from 'lucide-react'

export interface Transaction {
  id: string
  propertyAddress: string
  clientName: string
  clientEmail?: string
  status: string
  price: number
}

interface TransactionSelectorProps {
  selectedTransactionId?: string
  onSelect: (transactionId: string | null) => void
  placeholder?: string
}

export function TransactionSelector({
  selectedTransactionId,
  onSelect,
  placeholder = 'Select a transaction...'
}: TransactionSelectorProps) {
  const { colors, text, spacing } = useThemeStyles()
  const { getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && transactions.length === 0) {
      fetchTransactions()
    }
  }, [isOpen])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/emails/transactions')
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      const data = await response.json()
      setTransactions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const selectedTransaction = transactions.find(t => t.id === selectedTransactionId)

  const filteredTransactions = transactions.filter(txn =>
    txn.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    txn.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (transactionId: string | null) => {
    onSelect(transactionId)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Selected Transaction Display */}
      <div
        {...getButtonPressHandlers('transaction-selector')}
        onClick={() => setIsOpen(!isOpen)}
        style={getButtonPressStyle(
          'transaction-selector',
          {
            width: '100%',
            padding: spacing(2),
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: spacing(1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            gap: spacing(2),
          },
          colors.card,
          colors.cardHover
        )}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedTransaction ? (
            <div>
              <div style={{ fontSize: '14px', ...text.primary, fontWeight: '500' }}>
                {selectedTransaction.propertyAddress}
              </div>
              <div style={{ fontSize: '12px', ...text.tertiary, marginTop: '2px' }}>
                {selectedTransaction.clientName} • {selectedTransaction.status}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', ...text.tertiary }}>
              {placeholder}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
          {selectedTransaction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(null)
              }}
              style={{
                padding: spacing(0.5),
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X style={{ width: '16px', height: '16px', color: colors.text.secondary }} />
            </button>
          )}
          <ChevronDown
            style={{
              width: '16px',
              height: '16px',
              color: colors.text.secondary,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: spacing(1),
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: spacing(1),
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1001,
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search */}
            <div style={{ padding: spacing(2), borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: spacing(2),
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: colors.text.tertiary,
                  }}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  style={{
                    width: '100%',
                    padding: `${spacing(1.5)} ${spacing(1.5)} ${spacing(1.5)} ${spacing(5)}`,
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: spacing(1),
                    fontSize: '14px',
                    ...text.primary,
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.border
                  }}
                />
              </div>
            </div>

            {/* Options */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: spacing(3), textAlign: 'center', ...text.secondary }}>
                  Loading transactions...
                </div>
              ) : error ? (
                <div style={{ padding: spacing(3), textAlign: 'center', color: colors.error }}>
                  {error}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div style={{ padding: spacing(3), textAlign: 'center', ...text.tertiary }}>
                  No transactions found
                </div>
              ) : (
                <>
                  <div
                    {...getButtonPressHandlers('clear-selection')}
                    onClick={() => handleSelect(null)}
                    style={getButtonPressStyle(
                      'clear-selection',
                      {
                        padding: spacing(2),
                        borderBottom: `1px solid ${colors.border}`,
                        cursor: 'pointer',
                        ...text.secondary,
                        fontSize: '14px',
                        fontStyle: 'italic',
                      },
                      colors.card,
                      colors.cardHover
                    )}
                  >
                    Clear selection
                  </div>
                  {filteredTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      {...getButtonPressHandlers(`transaction-${txn.id}`)}
                      onClick={() => handleSelect(txn.id)}
                      style={getButtonPressStyle(
                        `transaction-${txn.id}`,
                        {
                          padding: spacing(2),
                          borderBottom: `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          backgroundColor: selectedTransactionId === txn.id ? colors.primaryLight : 'transparent',
                        },
                        selectedTransactionId === txn.id ? colors.primaryLight : colors.card,
                        colors.cardHover
                      )}
                    >
                      <div style={{ fontSize: '14px', ...text.primary, fontWeight: '500', marginBottom: '4px' }}>
                        {txn.propertyAddress}
                      </div>
                      <div style={{ fontSize: '12px', ...text.secondary }}>
                        {txn.clientName}
                        {txn.clientEmail && ` • ${txn.clientEmail}`}
                      </div>
                      <div style={{ fontSize: '12px', ...text.tertiary, marginTop: '2px' }}>
                        {txn.status} • ${txn.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

