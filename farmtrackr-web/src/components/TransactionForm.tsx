'use client'

import React, { useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { calculateCommission, formatCurrencyForInput, parseCurrencyFromInput, formatPercentageForInput, parsePercentageFromInput } from '@/lib/commissionCalculations'
import { X, Save, Home, DollarSign } from 'lucide-react'

interface TransactionFormData {
  propertyType: string
  clientType: string
  transactionType: string
  source: string
  address: string
  city: string
  listPrice: string
  closedPrice: string
  listDate: string
  closingDate: string
  status: string
  referringAgent: string
  referralFeeReceived: string
  brokerage: string
  commissionPct: string
  referralPct: string
  referralDollar: string
  netVolume: string
  // KW Specific
  eo: string
  royalty: string
  companyDollar: string
  hoaTransfer: string
  homeWarranty: string
  kwCares: string
  kwNextGen: string
  boldScholarship: string
  tcConcierge: string
  jelmbergTeam: string
  // BDH Specific
  bdhSplitPct: string
  asf: string
  foundation10: string
  adminFee: string
  preSplitDeduction: string
  // Universal
  otherDeductions: string
  buyersAgentSplit: string
  assistantBonus: string
  // Calculated
  gci: string
  adjustedGci: string
  totalBrokerageFees: string
  nci: string
}

interface TransactionFormProps {
  transactionId?: string | null
  onClose: () => void
  onSuccess: () => void
}

export function TransactionForm({ transactionId, onClose, onSuccess }: TransactionFormProps) {
  const { colors, isDark, text } = useThemeStyles()
  const [manuallyEditedFields, setManuallyEditedFields] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<TransactionFormData>({
    propertyType: 'Residential',
    clientType: 'Seller',
    transactionType: 'Sale',
    source: '',
    address: '',
    city: '',
    listPrice: '',
    closedPrice: '',
    listDate: '',
    closingDate: '',
    status: 'Closed',
    referringAgent: '',
    referralFeeReceived: '',
    brokerage: 'Keller Williams',
    commissionPct: '',
    referralPct: '',
    referralDollar: '',
    netVolume: '',
    // KW Specific
    eo: '',
    royalty: '',
    companyDollar: '',
    hoaTransfer: '',
    homeWarranty: '',
    kwCares: '',
    kwNextGen: '',
    boldScholarship: '',
    tcConcierge: '',
    jelmbergTeam: '',
    // BDH Specific
    bdhSplitPct: '',
    asf: '',
    foundation10: '',
    adminFee: '',
    preSplitDeduction: '',
    // Universal
    otherDeductions: '',
    buyersAgentSplit: '',
    assistantBonus: '',
    // Calculated
    gci: '',
    adjustedGci: '',
    totalBrokerageFees: '',
    nci: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing transaction if editing
  useEffect(() => {
    if (transactionId) {
      const loadTransaction = async () => {
        try {
          const response = await fetch(`/api/transactions/${transactionId}`)
          if (response.ok) {
            const data = await response.json()
            setFormData({
              propertyType: data.propertyType || 'Residential',
              clientType: data.clientType || 'Seller',
              transactionType: data.transactionType || 'Sale',
              source: data.source || '',
              address: data.address || '',
              city: data.city || '',
              listPrice: data.listPrice || '',
              closedPrice: data.closedPrice || '',
              listDate: data.listDate ? new Date(data.listDate).toISOString().split('T')[0] : '',
              closingDate: data.closingDate ? new Date(data.closingDate).toISOString().split('T')[0] : '',
              status: data.status || 'Closed',
              referringAgent: data.referringAgent || '',
              referralFeeReceived: data.referralFeeReceived || '',
              brokerage: data.brokerage || 'Keller Williams',
              commissionPct: data.commissionPct || '',
              referralPct: data.referralPct || '',
              referralDollar: data.referralDollar || '',
              netVolume: data.netVolume || '',
              eo: data.eo || '',
              royalty: data.royalty || '',
              companyDollar: data.companyDollar || '',
              hoaTransfer: data.hoaTransfer || '',
              homeWarranty: data.homeWarranty || '',
              kwCares: data.kwCares || '',
              kwNextGen: data.kwNextGen || '',
              boldScholarship: data.boldScholarship || '',
              tcConcierge: data.tcConcierge || '',
              jelmbergTeam: data.jelmbergTeam || '',
              bdhSplitPct: data.bdhSplitPct || '',
              asf: data.asf || '',
              foundation10: data.foundation10 || '',
              adminFee: data.adminFee || '',
              preSplitDeduction: data.preSplitDeduction || '',
              otherDeductions: data.otherDeductions || '',
              buyersAgentSplit: data.buyersAgentSplit || '',
              assistantBonus: data.assistantBonus || '',
              gci: data.gci || '',
              adjustedGci: data.adjustedGci || '',
              totalBrokerageFees: data.totalBrokerageFees || '',
              nci: data.nci || ''
            })
          }
        } catch (error) {
          console.error('Error loading transaction:', error)
        }
      }
      loadTransaction()
    }
  }, [transactionId])

  // Calculate commissions when relevant fields change
  useEffect(() => {
    // Don't auto-calculate if user manually edited calculated fields
    if (manuallyEditedFields.has('gci') || manuallyEditedFields.has('referralDollar')) {
      return
    }
    
    const calculated = calculateCommission(formData)
    setFormData(prev => ({
      ...prev,
      gci: calculated.gci,
      adjustedGci: calculated.adjustedGci,
      totalBrokerageFees: calculated.totalBrokerageFees,
      nci: calculated.nci,
      netVolume: calculated.netVolume,
      royalty: calculated.royalty || prev.royalty,
      companyDollar: calculated.companyDollar || prev.companyDollar,
      preSplitDeduction: calculated.preSplitDeduction || prev.preSplitDeduction
    }))
  }, [
    formData.closedPrice,
    formData.commissionPct,
    formData.referralPct,
    formData.transactionType,
    formData.referralFeeReceived,
    formData.brokerage,
    manuallyEditedFields
  ])

  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    // Bidirectional GCI → Commission % calculation
    if (field === 'gci' && value) {
      const gciValue = parseFloat(value) || 0
      const closedPrice = parseFloat(formData.closedPrice) || 0
      if (closedPrice > 0 && gciValue > 0) {
        // Calculate percentage (3.0 = 3%) but store as decimal (0.03)
        const percentageValue = (gciValue / closedPrice) * 100
        const newCommissionPct = (percentageValue / 100).toFixed(4)
        setFormData(prev => ({
          ...prev,
          commissionPct: newCommissionPct,
          gci: value
        }))
        setManuallyEditedFields(prev => new Set(Array.from(prev).concat('gci')))
        return
      }
    }
    
    // Bidirectional Referral $ → Referral % calculation
    if (field === 'referralDollar' && value) {
      const referralValue = parseFloat(value) || 0
      const gci = parseFloat(formData.gci) || 0
      if (gci > 0 && referralValue > 0) {
        // Calculate percentage (25.0 = 25%) but store as decimal (0.25)
        const percentageValue = (referralValue / gci) * 100
        const newReferralPct = (percentageValue / 100).toFixed(4)
        setFormData(prev => ({
          ...prev,
          referralPct: newReferralPct,
          referralDollar: value
        }))
        setManuallyEditedFields(prev => new Set(Array.from(prev).concat('referralDollar')))
        return
      }
    }
    
    // Track manually edited calculated fields
    const manuallyEditableFields = ['gci', 'referralDollar', 'adjustedGci', 'royalty', 'companyDollar', 'preSplitDeduction', 'totalBrokerageFees', 'nci']
    if (manuallyEditableFields.includes(field)) {
      setManuallyEditedFields(prev => new Set(Array.from(prev).concat(field)))
    }
    
    // Normal field update
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const url = transactionId ? `/api/transactions/${transactionId}` : '/api/transactions'
      const method = transactionId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save transaction')
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      alert('Failed to save transaction')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        style={{
          backgroundColor: colors.card,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${colors.border}`
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', ...text.primary, margin: '0' }}>
              {transactionId ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.cardHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <X style={{ width: '24px', height: '24px', color: colors.text.secondary }} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: '1' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Basic Information */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home style={{ width: '18px', height: '18px', color: colors.primary }} />
                Basic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="brokerage" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Brokerage *
                  </label>
                  <select
                    id="brokerage"
                    name="brokerage"
                    value={formData.brokerage}
                    onChange={(e) => handleInputChange('brokerage', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Keller Williams">Keller Williams (KW)</option>
                    <option value="BDH">Bennion Deville Homes (BDH)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="propertyType" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Property Type *
                  </label>
                  <select
                    id="propertyType"
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={(e) => handleInputChange('propertyType', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Land">Land</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="clientType" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Client Type *
                  </label>
                  <select
                    id="clientType"
                    name="clientType"
                    value={formData.clientType}
                    onChange={(e) => handleInputChange('clientType', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Buyer">Buyer</option>
                    <option value="Seller">Seller</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="transactionType" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Transaction Type *
                  </label>
                  <select
                    id="transactionType"
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={(e) => handleInputChange('transactionType', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Sale">Regular Sale</option>
                    <option value="Referral $ Received">Referral $ Received</option>
                    <option value="Referral $ Paid">Referral $ Paid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="address" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Address *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="123 Main St"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="city" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                    placeholder="Palm Desert"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="closedPrice" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Closed Price *
                  </label>
                  <input
                    id="closedPrice"
                    name="closedPrice"
                    type="text"
                    value={formatCurrencyForInput(formData.closedPrice)}
                    onChange={(e) => handleInputChange('closedPrice', parseCurrencyFromInput(e.target.value))}
                    required
                    placeholder="$0.00"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="closingDate" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Closing Date *
                  </label>
                  <input
                    id="closingDate"
                    name="closingDate"
                    type="date"
                    value={formData.closingDate}
                    onChange={(e) => handleInputChange('closingDate', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="status" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="Closed">Closed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Commission Details */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign style={{ width: '18px', height: '18px', color: colors.success }} />
                Commission Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label htmlFor="commissionPct" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Commission % *
                  </label>
                  <input
                    id="commissionPct"
                    name="commissionPct"
                    type="text"
                    value={formatPercentageForInput(formData.commissionPct)}
                    onChange={(e) => handleInputChange('commissionPct', parsePercentageFromInput(e.target.value))}
                    required
                    placeholder="3.00%"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="referralPct" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Referral %
                  </label>
                  <input
                    id="referralPct"
                    name="referralPct"
                    type="text"
                    value={formatPercentageForInput(formData.referralPct)}
                    onChange={(e) => handleInputChange('referralPct', parsePercentageFromInput(e.target.value))}
                    placeholder="0.00%"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: colors.card,
                      color: colors.text.primary
                    }}
                  />
                </div>

                {/* Calculated Fields */}
                <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
                    Calculated Values
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, display: 'block', marginBottom: '4px' }}>
                        GCI
                      </label>
                      <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                        ${parseFloat(formData.gci || '0').toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, display: 'block', marginBottom: '4px' }}>
                        Adjusted GCI
                      </label>
                      <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                        ${parseFloat(formData.adjustedGci || '0').toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, display: 'block', marginBottom: '4px' }}>
                        Total Brokerage Fees
                      </label>
                      <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                        ${parseFloat(formData.totalBrokerageFees || '0').toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, display: 'block', marginBottom: '4px' }}>
                        NCI
                      </label>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: colors.success, margin: '0' }}>
                        ${parseFloat(formData.nci || '0').toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.cardHover,
                ...text.secondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = colors.borderHover
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = colors.cardHover
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: isSubmitting ? colors.text.tertiary : colors.primary,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = colors.primaryHover
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = colors.primary
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save style={{ width: '16px', height: '16px' }} />
                  {transactionId ? 'Update Transaction' : 'Create Transaction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

