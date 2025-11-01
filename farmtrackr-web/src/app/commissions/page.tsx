'use client'

import { useEffect, useState, useMemo } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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
  Download
} from 'lucide-react'
import { TransactionForm } from '@/components/TransactionForm'
import { calculateCommission } from '@/lib/commissionCalculations'

interface Transaction {
  id: string
  propertyType: string
  clientType: string
  transactionType: string
  address: string | null
  city: string | null
  closedPrice: number | null
  closedDate: string | null
  listDate: string | null
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
  const [isImporting, setIsImporting] = useState(false)

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

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/transactions-template.csv'
    link.download = 'transactions-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper function to get commission calculation for a transaction
  const getCommissionForTransaction = (t: Transaction) => {
    return calculateCommission({
      brokerage: t.brokerage,
      transactionType: t.transactionType,
      closedPrice: parseFloat(String(t.closedPrice || 0)),
      commissionPct: parseFloat(String(t.commissionPct || 0)),
      referralPct: parseFloat(String(t.referralPct || 0)),
      referralFeeReceived: parseFloat(String(t.referralFeeReceived || 0)),
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
      bdhSplitPct: parseFloat(String(t.bdhSplitPct || 0)),
      asf: parseFloat(String(t.asf || 0)),
      foundation10: parseFloat(String(t.foundation10 || 0)),
      adminFee: parseFloat(String(t.adminFee || 0)),
      preSplitDeduction: t.preSplitDeduction || '',
      otherDeductions: parseFloat(String(t.otherDeductions || 0)),
      buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0))
    })
  }

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalTransactions = transactions.length
    const totalVolume = transactions.reduce((sum, t) => sum + (parseFloat(String(t.closedPrice || 0))), 0)
    const closedTransactions = transactions.filter(t => t.status === 'Closed').length
    
    // Calculate NCI for all transactions
    const totalNCI = transactions.reduce((sum, t) => {
      const calc = getCommissionForTransaction(t)
      return sum + (parseFloat(calc.nci) || 0)
    }, 0)
    
    // Calculate GCI for all transactions
    const totalGCI = transactions.reduce((sum, t) => {
      const calc = getCommissionForTransaction(t)
      return sum + (parseFloat(calc.gci) || 0)
    }, 0)
    
    const avgCommission = totalTransactions > 0 ? totalNCI / totalTransactions : 0
    const referralFeesPaid = transactions.reduce((sum, t) => sum + (parseFloat(String(t.referralDollar || 0))), 0)
    const referralFeesReceived = transactions.reduce((sum, t) => sum + (parseFloat(String(t.referralFeeReceived || 0))), 0)
    
    // Monthly data for charts
    const monthlyData = transactions.reduce((acc, t) => {
      if (t.closedDate) {
        const month = new Date(t.closedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        if (!acc[month]) {
          acc[month] = { month, gci: 0, nci: 0, transactions: 0 }
        }
        const calc = getCommissionForTransaction(t)
        acc[month].gci += parseFloat(calc.gci) || 0
        acc[month].nci += parseFloat(calc.nci) || 0
        acc[month].transactions += 1
      }
      return acc
    }, {} as Record<string, { month: string; gci: number; nci: number; transactions: number }>)
    
    const chartData = Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month)
      const dateB = new Date(b.month)
      return dateA.getTime() - dateB.getTime()
    })
    
    const pieData = [
      { name: 'Buyer', value: transactions.filter(t => t.clientType === 'Buyer').length },
      { name: 'Seller', value: transactions.filter(t => t.clientType === 'Seller').length }
    ]
    
    const brokerageData = [
      { 
        name: 'KW', 
        value: transactions.filter(t => 
          t.brokerage === 'KW' || t.brokerage === 'Keller Williams'
        )        .reduce((sum, t) => {
          const calc = getCommissionForTransaction(t)
          return sum + (parseFloat(calc.nci) || 0)
        }, 0)
      },
      { 
        name: 'BDH', 
        value: transactions.filter(t => 
          t.brokerage === 'BDH' || t.brokerage === 'Bennion Deville Homes'
        )        .reduce((sum, t) => {
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
    const propertyTypes = transactions.reduce((acc, t) => {
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
    if (transactions.length > 0) {
      const biggestDeal = [...transactions].sort((a, b) => {
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
  }, [transactions])
  
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
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleImportFromGoogle}
                    disabled={isImporting}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: isImporting ? colors.text.tertiary : colors.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isImporting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isImporting) {
                        e.currentTarget.style.backgroundColor = colors.successHover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isImporting) {
                        e.currentTarget.style.backgroundColor = colors.success
                      }
                    }}
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw style={{ width: '16px', height: '16px' }} />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload style={{ width: '16px', height: '16px' }} />
                        Import from Google Sheets
                      </>
                    )}
                  </button>
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

          {/* Additional Stats Cards */}
          <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Gross Commission
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    ${totalGCI.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Briefcase style={{ width: '32px', height: '32px', color: colors.info, opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                Total earned before fees
              </p>
            </div>

            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Net Commission
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    ${totalNCI.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                Your take-home pay
              </p>
            </div>

            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Avg Per Deal
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    ${avgCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign style={{ width: '32px', height: '32px', color: colors.referral, opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                Average commission earned
              </p>
            </div>

            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Referral Fees Paid
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    ${referralFeesPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp style={{ width: '32px', height: '32px', color: colors.warning, opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                Paid to referral partners
              </p>
            </div>

            <div style={{ padding: '20px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                    Referral Fees Received
                  </p>
                  <p style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0' }}>
                    ${referralFeesReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingDown style={{ width: '32px', height: '32px', color: colors.success, opacity: 0.6 }} />
              </div>
              <p style={{ fontSize: '12px', ...text.tertiary, margin: '8px 0 0 0' }}>
                Received from referral partners
              </p>
            </div>
          </div>

          {/* Download Template */}
          <div style={{ ...card, marginBottom: '32px' }}>
            <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0 0 12px 0' }}>
                📥 Download Transaction Template
              </h3>
              <p style={{ fontSize: '14px', ...text.secondary, margin: '0 0 16px 0' }}>
                Get a CSV template to prepare your own transaction data for import
              </p>
              <button
                onClick={handleDownloadTemplate}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.info,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.infoHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.info
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Download CSV Template
              </button>
            </div>
          </div>

          {/* Analytics Charts */}
          {transactions.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Monthly Income Trend */}
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Monthly Income Trend
                    </h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                        <YAxis tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: colors.text.primary }}
                          formatter={(value: any) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="gci" stroke="#f59e0b" strokeWidth={3} name="Gross Commission" dot={{ fill: '#f59e0b', r: 4 }} />
                        <Line type="monotone" dataKey="nci" stroke="#10b981" strokeWidth={3} name="Net Commission" dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Transactions by Month */}
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Transactions by Month
                    </h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                        <YAxis tick={{ fontSize: 12, fill: colors.text.secondary }} stroke={colors.text.secondary} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: colors.text.primary }}
                        />
                        <Legend />
                        <Bar dataKey="transactions" fill="#3b82f6" name="Transactions" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Client Type Distribution */}
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Client Type Distribution
                    </h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => {
                            const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          })}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: colors.text.primary }}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            paddingTop: '20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.text.primary
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Income by Brokerage */}
                <div style={{ ...card, overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Income by Brokerage
                    </h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    {brokerageData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={brokerageData} margin={{ top: 30, right: 40, left: 40, bottom: 20 }} barCategoryGap="30%">
                          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 14, fill: colors.text.secondary }} 
                            stroke={colors.text.secondary}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: colors.text.secondary }} 
                            stroke={colors.text.secondary}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? card.backgroundColor : '#ffffff',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '8px'
                            }}
                            labelStyle={{ color: colors.text.primary }}
                            formatter={(value: any) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                          />
                          <Legend wrapperStyle={{ paddingTop: '10px', color: colors.text.primary }} />
                          <Bar 
                            dataKey="value" 
                            fill="#10b981" 
                            name="Net Commission Income" 
                            radius={[8, 8, 0, 0]}
                            label={{ position: 'top', fill: colors.text.primary, fontSize: 12, formatter: (value: any) => `$${(value / 1000).toFixed(1)}k` }}
                            minPointSize={5}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...text.secondary }}>
                        <p style={{ fontSize: '14px', margin: '0' }}>No brokerage data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
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

