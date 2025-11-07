'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
// Charts temporarily disabled - import commented out
// import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { 
  DollarSign, 
  Plus, 
  TrendingUp,
  TrendingDown, 
  Briefcase, 
  Home,
  Calendar,
  Edit2,
  Trash2,
  X,
  Save,
  Target,
  RefreshCw,
  Upload,
  Download,
  Filter,
  Search,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react'
import { TransactionForm } from '@/components/TransactionForm'
import { calculateCommission } from '@/lib/commissionCalculations'
import { useButtonPress } from '@/hooks/useButtonPress'
import { EmailPanel } from '@/components/EmailPanel'
import Link from 'next/link'

interface Transaction {
  id: string
  propertyType: string
  clientType: string
  transactionType: string
  source?: string | null
  address: string | null
  city: string | null
  listPrice?: number | null
  closedPrice: number | null
  listDate: string | null
  closedDate: string | null
  brokerage: string
  status: string
  createdAt: string
  updatedAt: string
  // Commission fields
  commissionPct?: number | null
  referralPct?: number | null
  referralDollar?: number | null
  referringAgent?: string | null
  referralFeeReceived?: number | null
  // KW fields
  eo?: number | null
  royalty?: number | null
  companyDollar?: number | null
  hoaTransfer?: number | null
  homeWarranty?: number | null
  kwCares?: number | null
  kwNextGen?: number | null
  boldScholarship?: number | null
  tcConcierge?: number | null
  jelmbergTeam?: number | null
  // BDH fields
  bdhSplitPct?: number | null
  asf?: number | null
  foundation10?: number | null
  adminFee?: number | null
  preSplitDeduction?: number | null
  // Universal
  otherDeductions?: number | null
  buyersAgentSplit?: number | null
  assistantBonus?: number | null
  notes?: string | null // May contain CSV NCI for referral transactions
  netVolume?: number | null // For referrals, temporarily stores CSV NCI
}

export default function CommissionsPage() {
  const { colors, isDark, card, headerCard, headerDivider, headerTint, background, text } = useThemeStyles()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showFeeTooltip, setShowFeeTooltip] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { pressedButtons, getButtonPressHandlers, getButtonPressStyle } = useButtonPress()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)
  const [transactionDetailTab, setTransactionDetailTab] = useState<'details' | 'emails'>('details')
  
  // Filters and search
  const [filterYear, setFilterYear] = useState('all')
  const [filterClientType, setFilterClientType] = useState('all')
  const [filterBrokerage, setFilterBrokerage] = useState('all')
  const [filterPropertyType, setFilterPropertyType] = useState('all')
  const [filterReferralType, setFilterReferralType] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Sort order
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        // Map closingDate to closedDate for frontend compatibility
        const mappedData = data.map((t: any) => ({
          ...t,
          closedDate: t.closingDate || t.closedDate || null,
          listDate: t.listDate || null
        }))
        setTransactions(mappedData)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    
    // Check if URL has #new hash to auto-open form
    if (typeof window !== 'undefined') {
      const checkHash = () => {
        if (window.location.hash === '#new') {
          setShowForm(true)
          // Remove hash from URL after opening form
          window.history.replaceState(null, '', '/commissions')
        }
      }
      checkHash()
      // Listen for hash changes
      window.addEventListener('hashchange', checkHash)
      return () => window.removeEventListener('hashchange', checkHash)
    }
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

  const handleImportFromGoogle = async () => {
    setIsImporting(true)
    try {
      const response = await fetch('/api/transactions/import-google', { method: 'POST' })
      const result = await response.json()
      
      if (response.ok) {
        alert(`Successfully imported ${result.imported} transactions!\nUpdated: ${result.updated}\nSkipped: ${result.skipped}`)
        await fetchTransactions()
      } else {
        alert(`Import failed: ${result.message || result.error}`)
      }
    } catch (error) {
      console.error('Error importing transactions:', error)
      alert('Failed to import transactions')
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(`Successfully imported ${result.imported} transactions!\nUpdated: ${result.updated}\nSkipped: ${result.skipped}\nErrors: ${result.errors}`)
        await fetchTransactions()
      } else {
        alert(`Import failed: ${result.message || result.error}`)
      }
    } catch (error) {
      console.error('Error importing transactions:', error)
      alert('Failed to import transactions')
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  // Button press handlers are now provided by useButtonPress hook

  // Clear all filters
  const handleClearFilters = () => {
    setFilterYear('all')
    setFilterClientType('all')
    setFilterBrokerage('all')
    setFilterPropertyType('all')
    setFilterReferralType('all')
    setFilterDateRange('all')
    setSearchQuery('')
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/transactions-template.csv'
    link.download = 'transactions-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportToCSV = () => {
    const headers = [
      'Property Type', 'Client Type', 'Transaction Type', 'Source', 'Address', 'City',
      'List Price', 'Closed Price', 'List Date', 'Closing Date',
      'Brokerage', 'Commission %', 'Referral %', 'Referral $',
      'Status', 'Referring Agent', 'Referral Fee Received'
    ]

    const rows = filteredTransactions.map(t => {
      const calc = getCommissionForTransaction(t)
      return [
        t.propertyType,
        t.clientType,
        t.transactionType || 'Sale',
        t.source || '',
        t.address || '',
        t.city || '',
        (t.listPrice || 0).toString(),
        (t.closedPrice || 0).toString(),
        t.listDate || '',
        t.closedDate || '',
        t.brokerage,
        (parseFloat(String(t.commissionPct || 0)) * 100).toFixed(4),
        (parseFloat(String(t.referralPct || 0)) * 100).toFixed(4),
        (t.referralDollar || 0).toString(),
        t.status,
        t.referringAgent || '',
        (t.referralFeeReceived || 0).toString()
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `real-estate-transactions-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Helper function to get commission calculation for a transaction
  const getCommissionForTransaction = useCallback((t: Transaction) => {
    // For referral transactions, extract CSV NCI from notes or netVolume (temporary storage)
    let csvNci: number | undefined = undefined
    if (t.transactionType === 'Referral $ Received') {
      console.log(`[Referral Debug] Processing transaction ${t.id} at ${t.address}:`, {
        notes: t.notes,
        netVolume: t.netVolume,
        referralFeeReceived: t.referralFeeReceived
      })
      
      // First try notes field (if migration has been run)
      if (t.notes) {
        try {
          const notesData = JSON.parse(t.notes)
          if (notesData && typeof notesData.csvNci === 'number') {
            csvNci = notesData.csvNci
            console.log(`[Referral] ✓ Using CSV NCI from notes: ${csvNci}`)
          }
        } catch (e) {
          // Notes might not be JSON, ignore
          console.log(`[Referral] Notes not JSON: ${t.notes}`)
        }
      }
      
      // Fallback: check netVolume (temporary storage until notes migration)
      // For referrals, netVolume is repurposed to store CSV NCI
      if (csvNci === undefined && t.netVolume) {
        const netVolume = parseFloat(String(t.netVolume))
        // For referrals, netVolume stores CSV NCI directly - no need to compare with referralFeeReceived
        // They can be equal (100% NCI = GCI for some referrals)
        if (netVolume > 0 && !isNaN(netVolume)) {
          csvNci = netVolume
          console.log(`[Referral] ✓ Using CSV NCI from netVolume: ${csvNci} (referralFeeReceived: ${t.referralFeeReceived})`)
        } else {
          console.log(`[Referral] netVolume invalid: ${netVolume}, isNaN: ${isNaN(netVolume)}`)
        }
      } else if (csvNci === undefined) {
        console.log(`[Referral] No netVolume found for transaction ${t.id}`)
      }
      
      // Note: Missing CSV NCI for referral transactions is expected for some transactions
      // The calculation will use referralFeeReceived as NCI when CSV NCI is not available
      if (csvNci === undefined) {
        // Only log in development mode to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Referral] No CSV NCI found for referral transaction ${t.id} at ${t.address} - using referralFeeReceived as NCI`)
        }
      }
    }
    
    return calculateCommission({
      brokerage: t.brokerage,
      transactionType: t.transactionType,
      closedPrice: parseFloat(String(t.closedPrice || 0)),
      commissionPct: parseFloat(String(t.commissionPct || 0)),
      referralPct: parseFloat(String(t.referralPct || 0)),
      referralFeeReceived: parseFloat(String(t.referralFeeReceived || 0)),
      nci: csvNci, // Pass CSV NCI for referral transactions
      eo: parseFloat(String(t.eo || 0)),
      royalty: t.royalty || '',
      companyDollar: t.companyDollar || '',
      hoaTransfer: parseFloat(String(t.hoaTransfer || 0)),
      homeWarranty: parseFloat(String(t.homeWarranty || 0)),
      kwCares: parseFloat(String(t.kwCares || 0)),
      kwNextGen: parseFloat(String(t.kwNextGen || 0)),
      boldScholarship: parseFloat(String(t.boldScholarship || 0)),
      tcConcierge: parseFloat(String(t.tcConcierge || 0)),
      jelmbergTeam: parseFloat(String(t.jelmbergTeam || 0)),
      bdhSplitPct: (() => {
        const val = parseFloat(String(t.bdhSplitPct || 0))
        // If > 1, it's a whole number (94), convert to decimal (0.94)
        // If <= 1, it's already decimal (0.94)
        return val > 1 ? val / 100 : val
      })(),
      asf: parseFloat(String(t.asf || 0)),
      foundation10: parseFloat(String(t.foundation10 || 0)),
      adminFee: parseFloat(String(t.adminFee || 0)),
      preSplitDeduction: t.preSplitDeduction || '',
      brokerageSplit: parseFloat(String((t as any).brokerageSplit || 0)), // Flat value from CSV
      brokerageSplitPct: (t as any).brokerageSplitPct || undefined, // Percentage if provided
      otherDeductions: parseFloat(String(t.otherDeductions || 0)),
      buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0))
    })
  }, [])

  // Generate fee breakdown text for tooltip
  const getFeeBreakdown = (t: Transaction): string => {
    const calc = getCommissionForTransaction(t)
    const adjustedGci = parseFloat(calc.adjustedGci) || 0
    const parts: string[] = []
    
    if (t.brokerage === 'KW' || t.brokerage === 'Keller Williams') {
      // KW Breakdown
      const eo = parseFloat(String(t.eo || 0))
      const royalty = t.royalty ? parseFloat(String(t.royalty)) : adjustedGci * 0.06
      const companyDollar = t.companyDollar ? parseFloat(String(t.companyDollar)) : adjustedGci * 0.10
      const hoa = parseFloat(String(t.hoaTransfer || 0))
      const warranty = parseFloat(String(t.homeWarranty || 0))
      const kwCares = parseFloat(String(t.kwCares || 0))
      const kwNextGen = parseFloat(String(t.kwNextGen || 0))
      const bold = parseFloat(String(t.boldScholarship || 0))
      const tc = parseFloat(String(t.tcConcierge || 0))
      const jelmberg = parseFloat(String(t.jelmbergTeam || 0))
      const other = parseFloat(String(t.otherDeductions || 0))
      const buyers = parseFloat(String(t.buyersAgentSplit || 0))
      
      if (eo > 0) parts.push(`E&O: $${eo.toFixed(2)}`)
      parts.push(`Royalty: $${royalty.toFixed(2)}`)
      parts.push(`Company Dollar: $${companyDollar.toFixed(2)}`)
      if (hoa > 0) parts.push(`HOA Transfer: $${hoa.toFixed(2)}`)
      if (warranty > 0) parts.push(`Home Warranty: $${warranty.toFixed(2)}`)
      if (kwCares > 0) parts.push(`KW Cares: $${kwCares.toFixed(2)}`)
      if (kwNextGen > 0) parts.push(`NEXT GEN: $${kwNextGen.toFixed(2)}`)
      if (bold > 0) parts.push(`BOLD Scholarship: $${bold.toFixed(2)}`)
      if (tc > 0) parts.push(`TC/Concierge: $${tc.toFixed(2)}`)
      if (jelmberg > 0) parts.push(`Jelmberg Team: $${jelmberg.toFixed(2)}`)
      if (other > 0) parts.push(`Other Deductions: $${other.toFixed(2)}`)
      if (buyers > 0) parts.push(`Buyer's Agent Split: $${buyers.toFixed(2)}`)
    } else if (t.brokerage === 'BDH' || t.brokerage === 'Bennion Deville Homes') {
      // BDH Breakdown (Exact Formula Chain)
      const calc = getCommissionForTransaction(t)
      const preSplit = parseFloat(calc.preSplitDeduction || '0')
      const bdhSplit = parseFloat((calc as any).bdhSplit || '0')
      const admin = parseFloat(String(t.adminFee || 0))
      const other = parseFloat(String(t.otherDeductions || 0))
      const adminFeesCombined = admin + other
      const asf = parseFloat(String(t.asf || 0))
      const foundation = parseFloat(String(t.foundation10 || 0))
      const buyers = parseFloat(String(t.buyersAgentSplit || 0))
      
      // Show calculated Pre-Split Deduction (6% + $10 deducted from Adjusted GCI)
      const deductedAmount = adjustedGci - preSplit
      if (deductedAmount > 0) {
        parts.push(`Pre-Split Deduction (6% + $10): $${deductedAmount.toFixed(2)}`)
      }
      parts.push(`After Pre-Split: $${preSplit.toFixed(2)}`)
      
      // Show calculated BDH Split (10% of Pre-Split)
      if (bdhSplit > 0) {
        parts.push(`BDH Split (10%): $${bdhSplit.toFixed(2)}`)
      }
      
      if (adminFeesCombined > 0) parts.push(`Admin Fees / Other: $${adminFeesCombined.toFixed(2)}`)
      if (asf > 0) parts.push(`ASF: $${asf.toFixed(2)}`)
      if (foundation > 0) parts.push(`Foundation10: $${foundation.toFixed(2)}`)
      if (buyers > 0) parts.push(`Buyer's Agent Split: $${buyers.toFixed(2)}`)
    }
    
    return parts.length > 0 ? parts.join('\\n') : 'No fees calculated'
  }

  // Compute filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Year filter
      if (filterYear !== 'all') {
        if (!transaction.closedDate) return false
        const year = new Date(transaction.closedDate).getFullYear()
        if (year.toString() !== filterYear) return false
      }
      
      // Client type filter
      if (filterClientType !== 'all' && transaction.clientType !== filterClientType) {
        return false
      }
      
      // Brokerage filter
      if (filterBrokerage !== 'all') {
        const brokerageMatch = filterBrokerage === 'KW' 
          ? (transaction.brokerage === 'KW' || transaction.brokerage === 'Keller Williams')
          : (transaction.brokerage === 'BDH' || transaction.brokerage === 'Bennion Deville Homes')
        if (!brokerageMatch) return false
      }
      
      // Property type filter
      if (filterPropertyType !== 'all' && transaction.propertyType !== filterPropertyType) {
        return false
      }
      
      // Referral type filter
      if (filterReferralType !== 'all') {
        const hasReferralPaid = parseFloat(String(transaction.referralDollar || 0)) > 0
        const hasReferralReceived = parseFloat(String(transaction.referralFeeReceived || 0)) > 0
        const hasAnyReferral = hasReferralPaid || hasReferralReceived
        
        switch (filterReferralType) {
          case 'referralOnly':
            if (!hasAnyReferral) return false
            break
          case 'referralReceived':
            if (!hasReferralReceived) return false
            break
          case 'referralPaid':
            if (!hasReferralPaid) return false
            break
          case 'regularOnly':
            if (hasAnyReferral) return false
            break
        }
      }
      
      // Date range filter
      if (filterDateRange !== 'all' && transaction.closedDate) {
        const closingDate = new Date(transaction.closedDate)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        switch (filterDateRange) {
          case '3months': {
            const threeMonthsAgo = new Date(today)
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
            if (closingDate < threeMonthsAgo) return false
            break
          }
          case '6months': {
            const sixMonthsAgo = new Date(today)
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
            if (closingDate < sixMonthsAgo) return false
            break
          }
          case '12months': {
            const twelveMonthsAgo = new Date(today)
            twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
            if (closingDate < twelveMonthsAgo) return false
            break
          }
          case 'ytd': {
            const yearStart = new Date(today.getFullYear(), 0, 1)
            if (closingDate < yearStart) return false
            break
          }
          case 'lastYear': {
            const lastYearStart = new Date(today.getFullYear() - 1, 0, 1)
            const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)
            if (closingDate < lastYearStart || closingDate > lastYearEnd) return false
            break
          }
        }
      }
      
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const searchableFields = [
          transaction.address || '',
          transaction.city || '',
          transaction.source || '',
          transaction.referringAgent || '',
          transaction.propertyType || '',
          transaction.brokerage || '',
          transaction.status || '',
          transaction.transactionType || ''
        ]
        
        const matchesSearch = searchableFields.some(field => 
          field.toLowerCase().includes(query)
        )
        
        if (!matchesSearch) return false
      }
      
      return true
    })
    
    // Sort by closing date
    return filtered.sort((a, b) => {
      // Handle null dates - put them at the end
      if (!a.closedDate && !b.closedDate) return 0
      if (!a.closedDate) return 1 // a goes to end
      if (!b.closedDate) return -1 // b goes to end
      
      const dateA = new Date(a.closedDate).getTime()
      const dateB = new Date(b.closedDate).getTime()
      
      // For newest first: larger dates first (dateB - dateA)
      // For oldest first: smaller dates first (dateA - dateB)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
  }, [transactions, filterYear, filterClientType, filterBrokerage, filterPropertyType, filterReferralType, filterDateRange, searchQuery, sortOrder])

  // Calculate analytics based on FILTERED transactions
  const analytics = useMemo(() => {
    const filtered = filteredTransactions
    const totalTransactions = filtered.length
    const totalVolume = filtered.reduce((sum, t) => sum + (parseFloat(String(t.closedPrice || 0))), 0)
    const closedTransactions = filtered.filter(t => t.status === 'Closed').length
    
    // Calculate NCI for filtered transactions
    // Only include transactions with valid commission data (has closedPrice and commissionPct)
    const totalNCI = filtered.reduce((sum, t) => {
      // Handle Referral $ Received transactions separately - use referralFeeReceived directly
      if (t.transactionType === 'Referral $ Received' && t.referralFeeReceived) {
        // For referral received, NCI = referral fee received (no deductions)
        return sum + (parseFloat(String(t.referralFeeReceived || 0)))
      }
      
      // Skip transactions missing critical commission data
      if (!t.closedPrice || t.closedPrice === 0 || !t.commissionPct || t.commissionPct === 0) {
        return sum
      }
      const calc = getCommissionForTransaction(t)
      return sum + (parseFloat(calc.nci) || 0)
    }, 0)
    
    // Calculate GCI for filtered transactions
    const totalGCI = filtered.reduce((sum, t) => {
      // Handle Referral $ Received transactions separately - GCI = referral fee received
      if (t.transactionType === 'Referral $ Received' && t.referralFeeReceived) {
        return sum + (parseFloat(String(t.referralFeeReceived || 0)))
      }
      
      // Skip transactions missing critical commission data
      if (!t.closedPrice || t.closedPrice === 0 || !t.commissionPct || t.commissionPct === 0) {
        return sum
      }
      const calc = getCommissionForTransaction(t)
      return sum + (parseFloat(calc.gci) || 0)
    }, 0)
    
    // Calculate avg commission from Closed filtered transactions with valid commission data only
    const closedTransactionsWithData = filtered.filter(t => 
      t.status === 'Closed' && 
      ((t.closedPrice && t.closedPrice > 0 && t.commissionPct && t.commissionPct > 0) ||
       (t.transactionType === 'Referral $ Received' && t.referralFeeReceived))
    ).length
    const avgCommission = closedTransactionsWithData > 0 ? totalNCI / closedTransactionsWithData : 0
    const referralFeesPaid = filtered.reduce((sum, t) => sum + (parseFloat(String(t.referralDollar || 0))), 0)
    const referralFeesReceived = filtered.reduce((sum, t) => sum + (parseFloat(String(t.referralFeeReceived || 0))), 0)
    
    // Monthly data for charts - only include filtered transactions with valid commission data
    const monthlyData = filtered.reduce((acc, t) => {
      if (t.closedDate) {
        // Skip transactions missing critical commission data unless it's a referral received
        const hasValidData = (t.closedPrice && t.closedPrice > 0 && t.commissionPct && t.commissionPct > 0) ||
                            (t.transactionType === 'Referral $ Received' && t.referralFeeReceived)
        if (!hasValidData) return acc
        
        const date = new Date(t.closedDate)
        // Store both the formatted string and the date timestamp for proper sorting
        const month = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM for reliable sorting
        
        if (!acc[monthKey]) {
          acc[monthKey] = { 
            month, 
            monthKey, // Store sortable key
            dateTimestamp: date.getTime(), // Store timestamp for sorting
            gci: 0, 
            nci: 0, 
            transactions: 0 
          }
        }
        const calc = getCommissionForTransaction(t)
        acc[monthKey].gci += parseFloat(calc.gci) || 0
        acc[monthKey].nci += parseFloat(calc.nci) || 0
        acc[monthKey].transactions += 1
      }
      return acc
    }, {} as Record<string, { month: string; monthKey: string; dateTimestamp: number; gci: number; nci: number; transactions: number }>)
    
    const chartData = Object.values(monthlyData).sort((a, b) => {
      // Sort by date timestamp for proper chronological order
      return a.dateTimestamp - b.dateTimestamp
    })
    
    const pieData = [
      { name: 'Buyer', value: filtered.filter(t => t.clientType === 'Buyer').length },
      { name: 'Seller', value: filtered.filter(t => t.clientType === 'Seller').length }
    ]
    
    const brokerageData = [
      { 
        name: 'KW', 
        value: filtered.filter(t => 
          t.brokerage === 'KW' || t.brokerage === 'Keller Williams'
        ).reduce((sum, t) => {
          const calc = getCommissionForTransaction(t)
          return sum + (parseFloat(calc.nci) || 0)
        }, 0)
      },
      { 
        name: 'BDH', 
        value: filtered.filter(t => 
          t.brokerage === 'BDH' || t.brokerage === 'Bennion Deville Homes'
        ).reduce((sum, t) => {
          const calc = getCommissionForTransaction(t)
          return sum + (parseFloat(calc.nci) || 0)
        }, 0)
      }
    ].filter(item => item.value > 0)
    
    // Smart Insights
    const insights = []
    
    // Best performing month
    if (Object.keys(monthlyData).length > 0) {
      const bestMonth = Object.values(monthlyData).sort((a, b) => b.nci - a.nci)[0]
      if (bestMonth) {
        insights.push({
          icon: '🏆',
          label: 'Best Month',
          value: bestMonth.month,
          subtext: `$${bestMonth.nci.toLocaleString('en-US', { minimumFractionDigits: 2 })} earned`,
        })
      }
    }
    
    // Top property type
    const propertyTypes = filtered.reduce((acc, t) => {
      const calc = getCommissionForTransaction(t)
      acc[t.propertyType] = (acc[t.propertyType] || 0) + (parseFloat(calc.nci) || 0)
      return acc
    }, {} as Record<string, number>)
    if (Object.keys(propertyTypes).length > 0) {
      const topProperty = Object.entries(propertyTypes).sort((a, b) => b[1] - a[1])[0]
      if (topProperty) {
        insights.push({
          icon: '🏠',
          label: 'Top Property Type',
          value: topProperty[0],
          subtext: `$${topProperty[1].toLocaleString('en-US', { minimumFractionDigits: 2 })} in commissions`,
        })
      }
    }
    
    // Average days to close
    const daysToClose = transactions
      .filter(t => t.listDate && t.closedDate)
      .map(t => {
        const start = new Date(t.listDate)
        const end = new Date(t.closedDate)
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      })
      .filter(days => days > 0)
    
    if (daysToClose.length > 0) {
      const avgDays = Math.round(daysToClose.reduce((sum, d) => sum + d, 0) / daysToClose.length)
      insights.push({
        icon: '⏱️',
        label: 'Avg Days to Close',
        value: `${avgDays} days`,
        subtext: `Based on ${daysToClose.length} transactions`,
      })
    }
    
    // Stronger side (Buyer vs Seller)
    const buyerNCI = transactions
      .filter(t => t.clientType === 'Buyer')
      .reduce((sum, t) => {
        const calc = getCommissionForTransaction(t)
        return sum + (parseFloat(calc.nci) || 0)
      }, 0)
    const sellerNCI = transactions
      .filter(t => t.clientType === 'Seller')
      .reduce((sum, t) => {
        const calc = getCommissionForTransaction(t)
        return sum + (parseFloat(calc.nci) || 0)
      }, 0)
    
    if (buyerNCI + sellerNCI > 0) {
      const strongerSide = buyerNCI > sellerNCI ? 'Buyers' : 'Sellers'
      const percentage = Math.round((Math.max(buyerNCI, sellerNCI) / (buyerNCI + sellerNCI)) * 100)
      
      insights.push({
        icon: strongerSide === 'Buyers' ? '🔵' : '⭐',
        label: 'Stronger Side',
        value: strongerSide,
        subtext: `${percentage}% of total income`,
      })
    }
    
    // Biggest deal
    if (filtered.length > 0) {
      const biggestDeal = [...filtered].sort((a, b) => {
        const calcA = getCommissionForTransaction(a)
        const calcB = getCommissionForTransaction(b)
        return (parseFloat(calcB.nci) || 0) - (parseFloat(calcA.nci) || 0)
      })[0]
      
      if (biggestDeal) {
        const calc = getCommissionForTransaction(biggestDeal)
        insights.push({
          icon: '💎',
          label: 'Biggest Deal',
          value: `$${(parseFloat(calc.nci) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          subtext: biggestDeal.address || '',
        })
      }
    }
    
    return { 
      totalTransactions, 
      totalVolume, 
      closedTransactions, 
      totalGCI,
      totalNCI,
      avgCommission,
      referralFeesPaid,
      referralFeesReceived,
      chartData, 
      pieData, 
      brokerageData,
      insights
    }
  }, [filteredTransactions, getCommissionForTransaction])
  
  const { 
    totalTransactions, 
    totalVolume, 
    closedTransactions,
    totalGCI,
    totalNCI,
    avgCommission,
    referralFeesPaid,
    referralFeesReceived,
    chartData, 
    pieData, 
    brokerageData,
    insights
  } = analytics

  if (isLoading) {
    return (
      <Sidebar>
        <div 
          style={{ 
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
        .stats-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .stats-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .stats-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div 
        style={{ 
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
                // BRAND GREEN HEADER - Explicit gradient to override any parent styles
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                backgroundColor: 'transparent',
                border: `1px solid ${colors.primary}`,
                borderRadius: '16px',
                position: 'relative' as const,
                color: '#ffffff',
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
                        color: '#ffffff', // White text on colored background
                        margin: '0 0 4px 0'
                      }}
                    >
                      Commissions
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', margin: '0' }}>
                      Track your real estate transactions and commissions
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setShowForm(true)
                    }}
                    {...getButtonPressHandlers('newTransaction')}
                    style={getButtonPressStyle('newTransaction', {
                      padding: '12px 24px',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }, colors.primary, colors.primaryHover)}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} />
                    New Transaction
                  </button>
                </div>
              </div>
              <div style={headerDivider} />
            </div>
          </div>

          {/* Filter & Sort Section */}
          {transactions.length > 0 && (
            <div style={{ ...card, marginBottom: '24px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Filter style={{ width: '18px', height: '18px', color: colors.primary }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Filter & Search Transactions
                </h3>
                <div style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '500', ...text.secondary }}>
                  {filteredTransactions.length} of {transactions.length} shown
                </div>
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: colors.text.tertiary }} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = colors.border}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: colors.text.tertiary
                    }}
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Years</option>
                  {Array.from(new Set(transactions.map(t => t.closedDate ? new Date(t.closedDate).getFullYear() : null))).filter(Boolean).sort((a, b) => (b || 0) - (a || 0)).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={filterClientType}
                  onChange={(e) => setFilterClientType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Types</option>
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                </select>
                <select
                  value={filterBrokerage}
                  onChange={(e) => setFilterBrokerage(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Brokerages</option>
                  <option value="KW">Keller Williams</option>
                  <option value="BDH">Bennion Deville Homes</option>
                </select>
                <select
                  value={filterPropertyType}
                  onChange={(e) => setFilterPropertyType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Properties</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Land">Land</option>
                </select>
                <select
                  value={filterReferralType}
                  onChange={(e) => setFilterReferralType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Transactions</option>
                  <option value="regularOnly">Regular</option>
                  <option value="referralOnly">Referral</option>
                  <option value="referralReceived">Referral Received</option>
                  <option value="referralPaid">Referral Paid</option>
                </select>
                <select
                  value={filterDateRange}
                  onChange={(e) => setFilterDateRange(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Time</option>
                  <option value="3months">3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="12months">12 Months</option>
                  <option value="ytd">YTD</option>
                  <option value="lastYear">Last Year</option>
                </select>
              </div>

              {/* Active Filter Chips */}
              {(filterYear !== 'all' || filterClientType !== 'all' || filterBrokerage !== 'all' || filterPropertyType !== 'all' || filterReferralType !== 'all' || filterDateRange !== 'all' || searchQuery.trim()) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, alignItems: 'center' }}>
                  {/* Clear All Filters Button */}
                    <button
                      onClick={handleClearFilters}
                      {...getButtonPressHandlers('clearFilters')}
                      style={getButtonPressStyle(
                        'clearFilters',
                        {
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '999px',
                          border: 'none',
                          cursor: 'pointer',
                          color: pressedButtons.has('clearFilters') ? '#ffffff' : colors.primary
                        },
                        colors.primaryLight,
                        colors.primary
                      )}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                      Clear Filters
                    </button>
                  {filterDateRange !== 'all' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: colors.primaryLight, color: colors.primary, borderRadius: '999px' }}>
                      {filterDateRange === '3months' ? '3 Months' : filterDateRange === '6months' ? '6 Months' : filterDateRange === '12months' ? '12 Months' : filterDateRange === 'ytd' ? 'YTD' : 'Last Year'}
                      <button onClick={() => setFilterDateRange('all')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                  {filterYear !== 'all' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: colors.primaryLight, color: colors.primary, borderRadius: '999px' }}>
                      Year: {filterYear}
                      <button onClick={() => setFilterYear('all')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                  {filterClientType !== 'all' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '999px' }}>
                      {filterClientType}
                      <button onClick={() => setFilterClientType('all')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                  {filterBrokerage !== 'all' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '999px' }}>
                      {filterBrokerage}
                      <button onClick={() => setFilterBrokerage('all')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                  {filterPropertyType !== 'all' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#f3e8ff', color: '#6b21a8', borderRadius: '999px' }}>
                      {filterPropertyType}
                      <button onClick={() => setFilterPropertyType('all')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                  {filterReferralType !== 'all' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: colors.primaryLight, color: colors.primary, borderRadius: '999px' }}>
                      {filterReferralType === 'regularOnly' ? 'Regular' : filterReferralType === 'referralOnly' ? 'Referral' : filterReferralType === 'referralReceived' ? 'Referral Received' : 'Referral Paid'}
                      <button onClick={() => setFilterReferralType('all')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: colors.primaryLight, color: colors.primary, borderRadius: '999px' }}>
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery('')} style={{ marginLeft: '8px', padding: '0', border: 'none', background: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Stats Cards - 3 columns, 2 rows */}
          <div className="stats-cards-grid" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {/* Row 1: Gross Commission, Net Commission, Total Sales Volume */}
            <div style={{ padding: '20px', ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Gross Commission
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    ${totalGCI.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                    Total earned before fees
                  </p>
                </div>
                <DollarSign style={{ width: '32px', height: '32px', color: colors.info, opacity: 0.6, flexShrink: 0 }} />
              </div>
            </div>

            <div style={{ padding: '20px', ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Net Commission
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    ${totalNCI.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                    Your take-home pay
                  </p>
                </div>
                <TrendingUp style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6, flexShrink: 0 }} />
              </div>
            </div>

            <div style={{ padding: '20px', ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Total Sales Volume
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                    Combined property value
                  </p>
                </div>
                <Home style={{ width: '32px', height: '32px', color: colors.info, opacity: 0.6, flexShrink: 0 }} />
              </div>
            </div>

            {/* Row 2: Average Per Deal, Referral Fees Paid, Referral Fees Received */}
            <div style={{ padding: '20px', ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Average Per Deal
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    ${avgCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                    Average commission earned
                  </p>
                </div>
                <Target style={{ width: '32px', height: '32px', color: colors.referral, opacity: 0.6, flexShrink: 0 }} />
              </div>
            </div>

            <div style={{ padding: '20px', ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Referral Fees Paid
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    ${referralFeesPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                    Paid to referral partners
                  </p>
                </div>
                <TrendingUp style={{ width: '32px', height: '32px', color: colors.warning, opacity: 0.6, flexShrink: 0 }} />
              </div>
            </div>

            <div style={{ padding: '20px', ...card, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: '1', minWidth: 0 }}>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Referral Fees Received
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: '700', ...text.primary, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                    ${referralFeesReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                    Received from referral partners
                  </p>
                </div>
                <TrendingDown style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6, flexShrink: 0 }} />
              </div>
            </div>
          </div>

          {/* Transaction Import & Export Section */}
          <div style={{ ...card, marginBottom: '32px' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                    📊 Transaction Import & Export
                  </h3>
                  <span 
                    style={{ 
                      fontSize: '11px', 
                      padding: '4px 8px', 
                      backgroundColor: colors.cardHover, 
                      borderRadius: '6px',
                      ...text.tertiary,
                      fontWeight: '500'
                    }}
                    title="Import transaction data from files or Google Sheets, export filtered results"
                  >
                    Quick Actions
                  </span>
                </div>
                <Link 
                  href="/import-export"
                  style={{ 
                    fontSize: '13px', 
                    color: colors.primary, 
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  View Import/Export Hub
                  <Upload style={{ width: '14px', height: '14px' }} />
                </Link>
              </div>
              <p style={{ fontSize: '13px', ...text.secondary, margin: '0 0 16px 0', lineHeight: '1.5' }}>
                Import transaction data from CSV/Excel files or Google Sheets. Export includes all currently filtered transactions.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                {/* Import from File */}
                <div style={{ padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Upload style={{ width: '16px', height: '16px', color: colors.success }} />
                    <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Import from File
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    Upload CSV or Excel files with transaction data
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImportFromFile}
                    disabled={isImporting}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => {
                      if (!isImporting && fileInputRef.current) {
                        fileInputRef.current.click()
                      }
                    }}
                    disabled={isImporting}
                    {...getButtonPressHandlers('importCSV')}
                    style={getButtonPressStyle('importCSV', {
                      width: '100%',
                      padding: '10px 16px',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }, isImporting ? colors.text.tertiary : colors.success, colors.successHover)}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw style={{ width: '14px', height: '14px' }} />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload style={{ width: '14px', height: '14px' }} />
                        Choose File
                      </>
                    )}
                  </button>
                </div>

                {/* Import from Google Sheets */}
                <div style={{ padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FileSpreadsheet style={{ width: '16px', height: '16px', color: colors.info }} />
                    <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Import from Google Sheets
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    Sync transaction data from a Google Sheet
                  </p>
                  <button
                    onClick={handleImportFromGoogle}
                    disabled={isImporting}
                    {...getButtonPressHandlers('importGoogle')}
                    style={getButtonPressStyle('importGoogle', {
                      width: '100%',
                      padding: '10px 16px',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }, isImporting ? colors.text.tertiary : colors.info, colors.infoHover || colors.info)}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw style={{ width: '14px', height: '14px' }} />
                        Importing...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet style={{ width: '14px', height: '14px' }} />
                        Import from Google
                      </>
                    )}
                  </button>
                </div>

                {/* Download Template */}
                <div style={{ padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Download style={{ width: '16px', height: '16px', color: colors.info }} />
                    <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Download Template
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 12px 0', lineHeight: '1.4' }}>
                    Get a CSV template for proper formatting
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    {...getButtonPressHandlers('downloadTemplate')}
                    style={getButtonPressStyle('downloadTemplate', {
                      width: '100%',
                      padding: '10px 16px',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }, colors.info, colors.infoHover)}
                  >
                    <Download style={{ width: '14px', height: '14px' }} />
                    Download CSV Template
                  </button>
                </div>

                {/* Export to CSV */}
                {transactions.length > 0 && (
                  <div style={{ padding: '16px', backgroundColor: colors.cardHover, borderRadius: '10px', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Download style={{ width: '16px', height: '16px', color: colors.success }} />
                      <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                        Export to CSV
                      </h4>
                    </div>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 12px 0', lineHeight: '1.4' }}>
                      Export {filteredTransactions.length} filtered transaction{filteredTransactions.length !== 1 ? 's' : ''}
                    </p>
                    <button
                      onClick={handleExportToCSV}
                      {...getButtonPressHandlers('exportCSV')}
                      style={getButtonPressStyle('exportCSV', {
                        width: '100%',
                        padding: '10px 16px',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }, colors.success, colors.successHover)}
                    >
                      <Download style={{ width: '14px', height: '14px' }} />
                      Export CSV
                    </button>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: colors.cardHover, borderRadius: '8px', fontSize: '12px', ...text.tertiary }}>
                <strong style={{ ...text.secondary }}>💡 Tip:</strong> For importing contacts or other data types, visit the{' '}
                <Link href="/import-export" style={{ color: colors.primary, textDecoration: 'underline' }}>
                  Import & Export Hub
                </Link>
                . You can also use the AI Commission Sheet Scanner when adding new transactions.
              </div>
            </div>
          </div>

          {/* Analytics Charts - Temporarily disabled to allow page compilation */}
          {transactions.length > 0 && (
            <div style={{ ...card, padding: '24px', marginBottom: '32px', textAlign: 'center', ...text.secondary }}>
              <p style={{ margin: '0', fontSize: '14px' }}>Charts temporarily disabled during compilation. They will be available once the build completes.</p>
            </div>
          )}

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
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
                    Smart Insights
                  </h2>
                  <p style={{ fontSize: '14px', ...text.secondary, margin: '8px 0 0 0' }}>
                    Key performance highlights from your data
                  </p>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {insights.map((insight, index) => (
                    <div 
                      key={index}
                      style={{ 
                        padding: '16px', 
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.cardHover
                      }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                        {insight.icon}
                      </div>
                      <p style={{ fontSize: '12px', ...text.secondary, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {insight.label}
                      </p>
                      <p style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0 0 4px 0' }}>
                        {insight.value}
                      </p>
                      <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                        {insight.subtext}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              {transactions.length > 0 && (
                <button
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.card,
                    color: text.primary.color,
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                    e.currentTarget.style.borderColor = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.card
                    e.currentTarget.style.borderColor = colors.border
                  }}
                >
                  <ArrowUpDown style={{ width: '16px', height: '16px' }} />
                  {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </button>
              )}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTransactions.map((transaction) => {
                  const calc = getCommissionForTransaction(transaction)
                  const nci = parseFloat(calc.nci) || 0
                  return (
                    <div
                      key={transaction.id}
                      onClick={() => setViewingTransaction(transaction)}
                      style={{
                        padding: '20px 24px',
                        ...card,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: `1px solid ${colors.border}`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.cardHover
                        e.currentTarget.style.borderColor = colors.primary
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.card
                        e.currentTarget.style.borderColor = colors.border
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ flex: '1', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontWeight: '600', ...text.primary, fontSize: '18px', margin: '0' }}>
                              {transaction.address || 'No Address'}
                            </h3>
                            {(transaction.transactionType === 'Referral $ Received' || transaction.transactionType === 'Referral $ Paid') && (
                              <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: isDark ? colors.referralLight : '#FAF0FF', color: isDark ? colors.referral : '#9d4edd', borderRadius: '999px', flexShrink: 0 }}>
                                {transaction.transactionType === 'Referral $ Received' ? '💰 Referral $ Received' : '💸 Referral $ Paid'}
                              </span>
                            )}
                            <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: transaction.clientType === 'Buyer' ? (isDark ? '#1e3a5f' : '#3b82f6') : (isDark ? '#78350f' : '#f59e0b'), color: transaction.clientType === 'Buyer' ? (isDark ? colors.info : '#ffffff') : (isDark ? colors.warning : '#ffffff'), borderRadius: '999px', flexShrink: 0 }}>
                              {transaction.clientType === 'Buyer' ? '🔵 ' : '⭐ '}{transaction.clientType}
                            </span>
                            <span style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: (() => {
                              const br = transaction.brokerage || ''
                              if (br === 'KW' || br === 'Keller Williams') {
                                return isDark ? '#7f1d1d' : '#e63946' // Keller Williams Red
                              }
                              if (br === 'BDH' || br === 'Bennion Deville Homes') {
                                return isDark ? '#0c4a6e' : '#06b6d4' // BDH Aqua/Turquoise
                              }
                              return isDark ? '#1a2542' : '#9273FF' // Default purple
                            })(), color: '#ffffff', borderRadius: '999px', flexShrink: 0 }}>
                              {(() => {
                                const br = transaction.brokerage || ''
                                if (br === 'KW' || br === 'Keller Williams') return 'Keller Williams'
                                if (br === 'BDH' || br === 'Bennion Deville Homes') return 'Bennion Deville Homes'
                                if (!br || !isNaN(parseFloat(br))) return 'N/A'  // Numeric or empty = bad data
                                return br
                              })()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', ...text.secondary, flexWrap: 'wrap' }}>
                            {(() => {
                              // Check both closedDate (frontend) and closingDate (database) for compatibility
                              const closedDate = transaction.closedDate || (transaction as any).closingDate
                              if (!closedDate) return null
                              try {
                                const date = new Date(closedDate)
                                if (isNaN(date.getTime())) return null
                                return (
                                  <span style={{ fontWeight: '600', color: colors.text.primary }}>
                                    📅 {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                )
                              } catch {
                                return null
                              }
                            })()}
                            {(() => {
                              const closedDate = transaction.closedDate || (transaction as any).closingDate
                              return closedDate && transaction.city ? <span>•</span> : null
                            })()}
                            {transaction.city && (
                              <span>{transaction.city}</span>
                            )}
                            {transaction.city && transaction.closedPrice && <span>•</span>}
                            {transaction.closedPrice && (
                              <span>${transaction.closedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ minWidth: '120px', textAlign: 'right', padding: '12px', borderRadius: '8px', backgroundColor: colors.successLight, border: `2px solid ${colors.success}` }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>NCI</p>
                          <p style={{ fontSize: '16px', fontWeight: '700', color: colors.success, margin: '0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            ${nci.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(transaction.id)
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
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Transaction Detail Modal */}
      {viewingTransaction && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => {
            setViewingTransaction(null)
            setTransactionDetailTab('details') // Reset to details tab when closing
          }}
        >
          <div
            style={{
              ...card,
              maxWidth: transactionDetailTab === 'emails' ? '900px' : '600px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              padding: '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, margin: '0' }}>
                  Transaction Details
                </h2>
                <button
                  onClick={() => setViewingTransaction(null)}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: colors.text.secondary }} />
                </button>
              </div>
              
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: `1px solid ${colors.border}` }}>
                <button
                  onClick={() => setTransactionDetailTab('details')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: transactionDetailTab === 'details' ? `2px solid ${colors.primary}` : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: transactionDetailTab === 'details' ? '600' : '400',
                    color: transactionDetailTab === 'details' ? colors.primary : colors.text.secondary,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Details
                </button>
                <button
                  onClick={() => setTransactionDetailTab('emails')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: transactionDetailTab === 'emails' ? `2px solid ${colors.primary}` : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: transactionDetailTab === 'emails' ? '600' : '400',
                    color: transactionDetailTab === 'emails' ? colors.primary : colors.text.secondary,
                    transition: 'all 0.2s ease'
                  }}
                >
                  Emails
                </button>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', minHeight: '400px', maxHeight: '70vh', overflowY: 'auto' }}>
              {transactionDetailTab === 'emails' ? (
                <EmailPanel 
                  transactionId={viewingTransaction.id}
                  contactEmail={(viewingTransaction as any).clientEmail}
                />
              ) : (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0 0 8px 0' }}>
                      {viewingTransaction.address || 'N/A'}{viewingTransaction.city ? ` • ${viewingTransaction.city}` : ''}
                    </h3>
                  </div>

                  {(() => {
                const calc = getCommissionForTransaction(viewingTransaction)
                const gci = parseFloat(calc.gci) || 0
                const adjustedGci = parseFloat(calc.adjustedGci) || 0
                const totalFees = parseFloat(calc.totalBrokerageFees) || 0
                const nci = parseFloat(calc.nci) || 0

                return (
                  <>
                    {/* Property Information */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Home style={{ width: '18px', height: '18px', color: colors.primary }} />
                        <h4 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                          Property Information
                        </h4>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Address</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {viewingTransaction.address || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>City</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {viewingTransaction.city || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Property Type</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {viewingTransaction.propertyType || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Client Type</p>
                          <span
                            style={{
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: viewingTransaction.clientType === 'Buyer'
                                ? (isDark ? '#1e3a5f' : '#dbeafe')
                                : (isDark ? '#78350f' : '#fef3c7'),
                              color: viewingTransaction.clientType === 'Buyer'
                                ? colors.info
                                : colors.warning,
                              borderRadius: '9999px',
                              display: 'inline-block'
                            }}
                          >
                            {viewingTransaction.clientType || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <DollarSign style={{ width: '18px', height: '18px', color: colors.primary }} />
                        <h4 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                          Financial Information
                        </h4>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>List Price</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            ${(parseFloat(String(viewingTransaction.listPrice || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Closed Price</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            ${(parseFloat(String(viewingTransaction.closedPrice || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Commission %</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {((parseFloat(String(viewingTransaction.commissionPct || 0)) * 100).toFixed(3))}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Commission Breakdown */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <TrendingUp style={{ width: '18px', height: '18px', color: colors.primary }} />
                        <h4 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                          Commission Breakdown
                        </h4>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.referralLight, border: `1px solid ${colors.primary}` }}>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Gross Commission</p>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: colors.primary, margin: '0' }}>
                            ${gci.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.infoLight, border: `1px solid ${colors.info}` }}>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 8px 0', textTransform: 'uppercase' }}>After Referrals</p>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: colors.info, margin: '0' }}>
                            ${adjustedGci.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div 
                          style={{ 
                            padding: '16px', 
                            borderRadius: '12px', 
                            backgroundColor: colors.warningLight, 
                            border: `1px solid ${colors.warning}`,
                            position: 'relative',
                            cursor: 'help'
                          }}
                          onMouseEnter={() => setShowFeeTooltip(true)}
                          onMouseLeave={() => setShowFeeTooltip(false)}
                        >
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Total Fees</p>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: colors.warning, margin: '0' }}>
                            ${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <div 
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: colors.warning,
                              color: '#ffffff',
                              fontSize: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              opacity: 0.7
                            }}
                          >
                            i
                          </div>
                          
                          {/* Tooltip */}
                          {showFeeTooltip && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                marginBottom: '8px',
                                padding: '12px 16px',
                                backgroundColor: colors.card,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                                zIndex: 1000,
                                minWidth: '250px',
                                maxWidth: '400px',
                                whiteSpace: 'pre-line',
                                fontSize: '12px',
                                ...text.secondary,
                                pointerEvents: 'none'
                              }}
                            >
                              <div style={{ fontWeight: '600', ...text.primary, marginBottom: '8px', fontSize: '13px' }}>
                                Fee Breakdown ({viewingTransaction.brokerage === 'KW' || viewingTransaction.brokerage === 'Keller Williams' ? 'KW' : 'BDH'})
                              </div>
                              <div style={{ lineHeight: '1.6' }}>
                                {getFeeBreakdown(viewingTransaction).split('\\n').map((line, idx) => (
                                  <div key={idx} style={{ marginBottom: idx === 0 ? '0' : '4px' }}>{line}</div>
                                ))}
                              </div>
                              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colors.border}`, fontWeight: '600', ...text.primary }}>
                                Total: ${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: colors.successLight, border: `1px solid ${colors.success}` }}>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Net Commission Income</p>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: colors.success, margin: '0' }}>
                            ${nci.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dates & Status */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Calendar style={{ width: '18px', height: '18px', color: colors.primary }} />
                        <h4 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                          Dates & Status
                        </h4>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>List Date</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {(() => {
                              // Check both closedDate (frontend) and closingDate (database) for compatibility
                              const listDate = viewingTransaction.listDate || (viewingTransaction as any).listDate
                              if (!listDate) return 'N/A'
                              // Handle both string and Date object
                              const dateStr = typeof listDate === 'string' ? listDate : listDate.toString()
                              if (!dateStr || dateStr.trim() === '' || dateStr === 'null' || dateStr === 'undefined') return 'N/A'
                              try {
                                const date = new Date(dateStr)
                                if (isNaN(date.getTime())) return 'N/A'
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              } catch {
                                return 'N/A'
                              }
                            })()}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Closing Date</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {(() => {
                              // Check both closedDate (frontend) and closingDate (database) for compatibility
                              const closedDate = viewingTransaction.closedDate || (viewingTransaction as any).closingDate
                              if (!closedDate) return 'N/A'
                              // Handle both string and Date object
                              const dateStr = typeof closedDate === 'string' ? closedDate : closedDate.toString()
                              if (!dateStr || dateStr.trim() === '' || dateStr === 'null' || dateStr === 'undefined') return 'N/A'
                              try {
                                const date = new Date(dateStr)
                                if (isNaN(date.getTime())) return 'N/A'
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              } catch {
                                return 'N/A'
                              }
                            })()}
                          </p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Brokerage</p>
                          <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                            {(() => {
                              const brokerage = viewingTransaction.brokerage
                              if (!brokerage) return 'N/A'
                              if (brokerage === 'KW' || brokerage === 'Keller Williams') return 'Keller Williams'
                              if (brokerage === 'BDH' || brokerage === 'Bennion Deville Homes') return 'Bennion Deville Homes'
                              // If it looks like a number/price, return N/A
                              if (!isNaN(parseFloat(brokerage))) return 'N/A'
                              return brokerage
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {viewingTransaction.source && (
                      <div>
                        <p style={{ fontSize: '12px', ...text.tertiary, margin: '0 0 4px 0', textTransform: 'uppercase' }}>Source</p>
                        <p style={{ fontSize: '14px', ...text.primary, margin: '0', fontWeight: '500' }}>
                          {viewingTransaction.source}
                        </p>
                      </div>
                    )}
                  </>
                )
              })()}
              )}
            </div>

            {/* Footer Buttons - Only show on Details tab */}
            {transactionDetailTab === 'details' && (
              <div style={{ padding: '24px', borderTop: `1px solid ${colors.border}`, display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setViewingTransaction(null)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: colors.cardHover,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    ...text.primary
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDelete(viewingTransaction.id)
                    setViewingTransaction(null)
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: colors.error,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setEditingId(viewingTransaction.id)
                    setViewingTransaction(null)
                    setShowForm(true)
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: colors.primary,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  Edit Transaction
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

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

