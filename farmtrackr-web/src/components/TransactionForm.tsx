'use client'

import React, { useState, useEffect } from 'react'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useButtonPress } from '@/hooks/useButtonPress'
import { calculateCommission, formatCurrencyForInput, parseCurrencyFromInput, formatPercentageForInput, parsePercentageFromInput } from '@/lib/commissionCalculations'
import { X, Save, Home, DollarSign, Camera, Loader2 } from 'lucide-react'

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
  asPage?: boolean // If true, render as page instead of modal
}

export function TransactionForm({ transactionId, onClose, onSuccess, asPage = false }: TransactionFormProps) {
  const { colors, isDark, text } = useThemeStyles()
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
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
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)

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

  // ==================== COMMISSION SHEET SCANNER ====================
  
  const handleScanCommissionSheet = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type - OpenAI Vision only supports images, not PDFs
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      if (file.type === 'application/pdf') {
        setScanError('PDFs not supported yet. Please take a screenshot of the PDF and upload the image instead. (JPG, PNG, WebP)')
      } else {
        setScanError('Please upload an image file (JPG, PNG, WebP)')
      }
      return
    }

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setScanError('File size must be less than 20MB')
      return
    }

    setIsScanning(true)
    setScanError(null)

    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string

          // Call our API route
          const response = await fetch('/api/transactions/scan-commission-sheet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: base64Image
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to scan commission sheet')
          }

          const result = await response.json()
          
          if (result.success && result.data) {
            // Auto-fill form with extracted data
            const extracted = result.data
            
            // Helper function to map brokerage
            const mapBrokerage = (brokerage: string): string => {
              const normalized = brokerage?.toLowerCase() || ''
              if (normalized.includes('keller') || normalized.includes('kw') || normalized === 'kw') {
                return 'Keller Williams'
              }
              if (normalized.includes('bennion') || normalized.includes('deville') || normalized === 'bdh') {
                return 'BDH'
              }
              return brokerage // Return as-is if can't determine
            }

            // Helper function to map status
            const mapStatus = (status: string): string => {
              const normalized = status?.toLowerCase() || ''
              if (normalized === 'active') {
                return 'Pending' // Map "Active" to "Pending" since form doesn't have "Active"
              }
              // Map common variations
              if (normalized === 'cancelled' || normalized === 'canceled') {
                return 'Cancelled'
              }
              if (normalized === 'closed' || normalized === 'close') {
                return 'Closed'
              }
              if (normalized === 'pending') {
                return 'Pending'
              }
              return status || 'Closed' // Default to Closed
            }

            // Helper function to map transaction type
            const mapTransactionType = (type: string): string => {
              const normalized = type?.toLowerCase() || ''
              if (normalized.includes('referral out') || normalized.includes('referral received')) {
                return 'Referral $ Received'
              }
              if (normalized.includes('referral in') || normalized.includes('referral paid')) {
                return 'Referral $ Paid'
              }
              if (normalized === 'sale' || normalized === 'regular sale') {
                return 'Sale'
              }
              return type || 'Sale'
            }

            setFormData(prev => ({
              ...prev,
              // Only update fields that were successfully extracted (not null)
              ...(extracted.transactionType && { transactionType: mapTransactionType(extracted.transactionType) }),
              ...(extracted.propertyType && { propertyType: extracted.propertyType }),
              ...(extracted.clientType && { clientType: extracted.clientType }),
              ...(extracted.address && { address: extracted.address }),
              ...(extracted.city && { city: extracted.city }),
              ...(extracted.listPrice && { listPrice: extracted.listPrice.toString() }),
              ...(extracted.closedPrice && { closedPrice: extracted.closedPrice.toString() }),
              ...(extracted.listDate && { listDate: extracted.listDate }),
              ...(extracted.closingDate && { closingDate: extracted.closingDate }),
              ...(extracted.brokerage && { brokerage: mapBrokerage(extracted.brokerage) }),
              // Commission percentage - ensure it's in decimal format (0.03 = 3%)
              ...(extracted.commissionPct !== null && extracted.commissionPct !== undefined && { 
                commissionPct: typeof extracted.commissionPct === 'number' ? extracted.commissionPct.toString() : extracted.commissionPct.toString()
              }),
              ...(extracted.gci && { gci: extracted.gci.toString() }),
              ...(extracted.referralPct !== null && extracted.referralPct !== undefined && { 
                referralPct: typeof extracted.referralPct === 'number' ? extracted.referralPct.toString() : extracted.referralPct.toString()
              }),
              ...(extracted.referralDollar && { referralDollar: extracted.referralDollar.toString() }),
              ...(extracted.adjustedGci && { adjustedGci: extracted.adjustedGci.toString() }),
              ...(extracted.totalBrokerageFees && { totalBrokerageFees: extracted.totalBrokerageFees.toString() }),
              ...(extracted.nci && { nci: extracted.nci.toString() }),
              ...(extracted.status && { status: mapStatus(extracted.status) }),
              ...(extracted.referringAgent && { referringAgent: extracted.referringAgent }),
              ...(extracted.referralFeeReceived && { referralFeeReceived: extracted.referralFeeReceived.toString() }),
            }))

            // Show success message
            alert(`✅ Commission sheet scanned successfully!\n\nConfidence: ${extracted.confidence}%\n\nPlease review the auto-filled data before saving.`)
          } else {
            throw new Error('No data extracted from commission sheet')
          }
        } catch (error) {
          console.error('Scan error:', error)
          setScanError(error instanceof Error ? error.message : 'Failed to scan commission sheet')
        } finally {
          setIsScanning(false)
          // Reset file input
          event.target.value = ''
        }
      }

      reader.onerror = () => {
        setScanError('Failed to read file')
        setIsScanning(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Scan error:', error)
      setScanError(error instanceof Error ? error.message : 'Failed to scan commission sheet')
      setIsScanning(false)
    }
  }

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

  const renderForm = () => (
    <div
      style={{
        backgroundColor: colors.card,
        borderRadius: asPage ? '0' : '16px',
        width: asPage ? '100%' : '90%',
        maxWidth: asPage ? 'none' : '1000px',
        maxHeight: asPage ? 'none' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: asPage ? 'none' : (isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)'),
        border: asPage ? 'none' : `1px solid ${colors.border}`
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
            
            {/* AI Commission Sheet Scanner */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera style={{ width: '18px', height: '18px', color: colors.info }} />
                AI Commission Sheet Scanner
              </h3>
              <div style={{ padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '12px' }}>
                  Upload a commission sheet image (JPG, PNG, WebP) to automatically extract transaction data using AI.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleScanCommissionSheet}
                    disabled={isScanning}
                    style={{ display: 'none' }}
                    id="commission-sheet-scanner"
                  />
                  <label
                    htmlFor="commission-sheet-scanner"
                    style={{
                      padding: '12px 16px',
                      backgroundColor: isScanning ? colors.text.tertiary : colors.info,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isScanning ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isScanning) {
                        e.currentTarget.style.backgroundColor = colors.infoHover || colors.info
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isScanning) {
                        e.currentTarget.style.backgroundColor = colors.info
                      }
                    }}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Camera style={{ width: '16px', height: '16px' }} />
                        📷 Scan Commission Sheet
                      </>
                    )}
                  </label>
                  {scanError && (
                    <div style={{ padding: '12px', backgroundColor: colors.errorLight || '#fee2e2', borderRadius: '8px', border: `1px solid ${colors.error}` }}>
                      <p style={{ fontSize: '14px', color: colors.error, margin: '0' }}>
                        ⚠️ {scanError}
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '0', marginTop: '4px' }}>
                    💡 Tip: PDFs are not supported. Take a screenshot or convert to JPG/PNG first.
                  </p>
                </div>
              </div>
            </div>

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
                    <option value="Lease">Lease</option>
                    <option value="Referral $ Received">Referral $ Received</option>
                    <option value="Referral $ Paid">Referral $ Paid</option>
                  </select>
                  <p style={{ fontSize: '12px', ...text.tertiary, marginTop: '4px', marginBottom: '0' }}>
                    {formData.transactionType === 'Sale' && 'Standard buyer/seller transaction with commission'}
                    {formData.transactionType === 'Lease' && 'Lease transaction with lease-specific commission calculations'}
                    {formData.transactionType === 'Referral $ Received' && 'You refer a client to another agent and receive a referral fee'}
                    {formData.transactionType === 'Referral $ Paid' && 'Another agent refers a client to you and you pay them a referral fee'}
                  </p>
                </div>

                {/* Referral-Specific Fields */}
                {(formData.transactionType === 'Referral $ Received' || formData.transactionType === 'Referral $ Paid') && (
                  <>
                    <div>
                      <label htmlFor="referringAgent" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                        {formData.transactionType === 'Referral $ Received' ? 'Referring Agent (Who you sent client to)' : 'Referring Agent (Who sent you the client)'}
                      </label>
                      <input
                        id="referringAgent"
                        name="referringAgent"
                        type="text"
                        value={formData.referringAgent}
                        onChange={(e) => handleInputChange('referringAgent', e.target.value)}
                        placeholder="Agent Name"
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

                    {formData.transactionType === 'Referral $ Received' && (
                      <div>
                        <label htmlFor="referralFeeReceived" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                          Referral Fee You Receive *
                          <span style={{ fontSize: '12px', ...text.tertiary, marginLeft: '8px' }}>(Amount you get paid)</span>
                        </label>
                        <input
                          id="referralFeeReceived"
                          name="referralFeeReceived"
                          type="text"
                          value={formatCurrencyForInput(formData.referralFeeReceived)}
                          onChange={(e) => handleInputChange('referralFeeReceived', parseCurrencyFromInput(e.target.value))}
                          placeholder="$0.00"
                          required={!transactionId && formData.transactionType === 'Referral $ Received'}
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
                    )}
                  </>
                )}

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
                  <label htmlFor="listPrice" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    List Price
                  </label>
                  <input
                    id="listPrice"
                    name="listPrice"
                    type="text"
                    value={formatCurrencyForInput(formData.listPrice)}
                    onChange={(e) => handleInputChange('listPrice', parseCurrencyFromInput(e.target.value))}
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
                  <label htmlFor="listDate" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    List Date
                  </label>
                  <input
                    id="listDate"
                    name="listDate"
                    type="date"
                    value={formData.listDate}
                    onChange={(e) => handleInputChange('listDate', e.target.value)}
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

                <div>
                  <label htmlFor="gci" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Gross Commission Income (GCI)
                  </label>
                  <input
                    id="gci"
                    name="gci"
                    type="text"
                    value={formatCurrencyForInput(formData.gci)}
                    onChange={(e) => handleInputChange('gci', parseCurrencyFromInput(e.target.value))}
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
                  <label htmlFor="referralDollar" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Referral Fee Paid ($)
                  </label>
                  <input
                    id="referralDollar"
                    name="referralDollar"
                    type="text"
                    value={formatCurrencyForInput(formData.referralDollar)}
                    onChange={(e) => handleInputChange('referralDollar', parseCurrencyFromInput(e.target.value))}
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
                  <label htmlFor="adjustedGci" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Adjusted GCI
                  </label>
                  <input
                    id="adjustedGci"
                    name="adjustedGci"
                    type="text"
                    value={formatCurrencyForInput(formData.adjustedGci)}
                    onChange={(e) => handleInputChange('adjustedGci', parseCurrencyFromInput(e.target.value))}
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
              </div>
            </div>

            {/* Brokerage-Specific Deductions - Keller Williams */}
            {(formData.brokerage === 'Keller Williams' || formData.brokerage === 'KW') && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
                  Keller Williams Deductions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label htmlFor="eo" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Errors & Omissions (E&O)
                    </label>
                    <input
                      id="eo"
                      name="eo"
                      type="text"
                      value={formatCurrencyForInput(formData.eo)}
                      onChange={(e) => handleInputChange('eo', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="royalty" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Royalty (6%)
                    </label>
                    <input
                      id="royalty"
                      name="royalty"
                      type="text"
                      value={formatCurrencyForInput(formData.royalty)}
                      onChange={(e) => handleInputChange('royalty', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="companyDollar" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Company Dollar (10%)
                    </label>
                    <input
                      id="companyDollar"
                      name="companyDollar"
                      type="text"
                      value={formatCurrencyForInput(formData.companyDollar)}
                      onChange={(e) => handleInputChange('companyDollar', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="hoaTransfer" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      HOA Transfer
                    </label>
                    <input
                      id="hoaTransfer"
                      name="hoaTransfer"
                      type="text"
                      value={formatCurrencyForInput(formData.hoaTransfer)}
                      onChange={(e) => handleInputChange('hoaTransfer', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="homeWarranty" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Home Warranty
                    </label>
                    <input
                      id="homeWarranty"
                      name="homeWarranty"
                      type="text"
                      value={formatCurrencyForInput(formData.homeWarranty)}
                      onChange={(e) => handleInputChange('homeWarranty', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="kwCares" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      KW Cares
                    </label>
                    <input
                      id="kwCares"
                      name="kwCares"
                      type="text"
                      value={formatCurrencyForInput(formData.kwCares)}
                      onChange={(e) => handleInputChange('kwCares', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="kwNextGen" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      NEXT GEN
                    </label>
                    <input
                      id="kwNextGen"
                      name="kwNextGen"
                      type="text"
                      value={formatCurrencyForInput(formData.kwNextGen)}
                      onChange={(e) => handleInputChange('kwNextGen', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="boldScholarship" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      BOLD Scholarship
                    </label>
                    <input
                      id="boldScholarship"
                      name="boldScholarship"
                      type="text"
                      value={formatCurrencyForInput(formData.boldScholarship)}
                      onChange={(e) => handleInputChange('boldScholarship', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="tcConcierge" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      TC/Concierge
                    </label>
                    <input
                      id="tcConcierge"
                      name="tcConcierge"
                      type="text"
                      value={formatCurrencyForInput(formData.tcConcierge)}
                      onChange={(e) => handleInputChange('tcConcierge', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="jelmbergTeam" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Jelmberg Team
                    </label>
                    <input
                      id="jelmbergTeam"
                      name="jelmbergTeam"
                      type="text"
                      value={formatCurrencyForInput(formData.jelmbergTeam)}
                      onChange={(e) => handleInputChange('jelmbergTeam', parseCurrencyFromInput(e.target.value))}
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
                </div>
              </div>
            )}

            {/* Brokerage-Specific Deductions - Bennion Deville Homes */}
            {(formData.brokerage === 'BDH' || formData.brokerage === 'Bennion Deville Homes') && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
                  Bennion Deville Homes Deductions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label htmlFor="bdhSplitPct" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      BDH Split % (Default: 94%)
                    </label>
                    <input
                      id="bdhSplitPct"
                      name="bdhSplitPct"
                      type="text"
                      value={formatPercentageForInput(formData.bdhSplitPct)}
                      onChange={(e) => handleInputChange('bdhSplitPct', parsePercentageFromInput(e.target.value))}
                      placeholder="94.00%"
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
                    <label htmlFor="preSplitDeduction" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Pre-Split Deduction (6%)
                    </label>
                    <input
                      id="preSplitDeduction"
                      name="preSplitDeduction"
                      type="text"
                      value={formatCurrencyForInput(formData.preSplitDeduction)}
                      onChange={(e) => handleInputChange('preSplitDeduction', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="asf" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Agent Services Fee (ASF)
                    </label>
                    <input
                      id="asf"
                      name="asf"
                      type="text"
                      value={formatCurrencyForInput(formData.asf)}
                      onChange={(e) => handleInputChange('asf', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="foundation10" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Foundation10
                    </label>
                    <input
                      id="foundation10"
                      name="foundation10"
                      type="text"
                      value={formatCurrencyForInput(formData.foundation10)}
                      onChange={(e) => handleInputChange('foundation10', parseCurrencyFromInput(e.target.value))}
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
                    <label htmlFor="adminFee" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                      Admin Fee
                    </label>
                    <input
                      id="adminFee"
                      name="adminFee"
                      type="text"
                      value={formatCurrencyForInput(formData.adminFee)}
                      onChange={(e) => handleInputChange('adminFee', parseCurrencyFromInput(e.target.value))}
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
                </div>
              </div>
            )}

            {/* Additional Deductions */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
                Additional Deductions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label htmlFor="otherDeductions" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Other Deductions
                  </label>
                  <input
                    id="otherDeductions"
                    name="otherDeductions"
                    type="text"
                    value={formatCurrencyForInput(formData.otherDeductions)}
                    onChange={(e) => handleInputChange('otherDeductions', parseCurrencyFromInput(e.target.value))}
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
                  <label htmlFor="buyersAgentSplit" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Buyer's Agent Split
                  </label>
                  <input
                    id="buyersAgentSplit"
                    name="buyersAgentSplit"
                    type="text"
                    value={formatCurrencyForInput(formData.buyersAgentSplit)}
                    onChange={(e) => handleInputChange('buyersAgentSplit', parseCurrencyFromInput(e.target.value))}
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
                  <label htmlFor="assistantBonus" style={{ fontSize: '14px', fontWeight: '500', ...text.secondary, display: 'block', marginBottom: '8px' }}>
                    Assistant Bonus (FYI only)
                  </label>
                  <input
                    id="assistantBonus"
                    name="assistantBonus"
                    type="text"
                    value={formatCurrencyForInput(formData.assistantBonus)}
                    onChange={(e) => handleInputChange('assistantBonus', parseCurrencyFromInput(e.target.value))}
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
                  <p style={{ fontSize: '12px', ...text.tertiary, marginTop: '4px', marginBottom: '0' }}>
                    Not included in NCI calculation
                  </p>
                </div>
              </div>
            </div>

            {/* Calculated Summary */}
            <div style={{ padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: '12px' }}>
                Calculated Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, display: 'block', marginBottom: '4px' }}>
                    Total Brokerage Fees
                  </label>
                  <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    ${parseFloat(formData.totalBrokerageFees || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '500', ...text.tertiary, display: 'block', marginBottom: '4px' }}>
                    Net Commission Income (NCI)
                  </label>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.success, margin: '0' }}>
                    ${parseFloat(formData.nci || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
            <button
              {...getButtonPressHandlers('cancel')}
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={getButtonPressStyle('cancel', {
                padding: '12px 24px',
                backgroundColor: colors.cardHover,
                ...text.secondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }, colors.cardHover, colors.borderHover)}
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
              {...getButtonPressHandlers('submit')}
              type="submit"
              disabled={isSubmitting}
              style={getButtonPressStyle('submit', {
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
                gap: '8px'
              }, isSubmitting ? colors.text.tertiary : colors.primary, colors.primaryHover || (isDark ? '#5F1FFF' : '#6B3AE8'))}
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

    </div>
  )

  if (asPage) {
    return (
      <>
        {renderForm()}
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  return (
    <>
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
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          {renderForm()}
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}

