'use client'

import { useState, useEffect } from 'react'
import { FarmContact, Stats } from '@/types'
import { 
  Users, 
  Building2, 
  FileText, 
  Upload, 
  Printer, 
  Plus,
  Calendar,
  TrendingUp,
  Home,
  DollarSign,
  Briefcase,
  Settings,
  Contact,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  CheckSquare,
  Bell,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { FarmTrackrLogo } from '@/components/FarmTrackrLogo'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { normalizeFarmName } from '@/lib/farmNames'
import { getFarmColor } from '@/lib/farmColors'
import { validateAllContacts } from '@/lib/dataQuality'
import { calculateCommission } from '@/lib/commissionCalculations'

interface DashboardClientProps {
  contacts: FarmContact[];
  stats: Stats;
}

interface Transaction {
  id: string
  address: string | null
  city: string | null
  closedDate: string | null
  closedPrice: number | null
  brokerage: string
  transactionType: string
  clientType: string
  createdAt: string
  nci?: number | null
}

export default function DashboardClient({ contacts, stats }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false)
  const { colors, isDark, card, cardWithLeftBorder, headerCard, headerDivider, background, text, spacing } = useThemeStyles()
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set())
  const [recentTransaction, setRecentTransaction] = useState<Transaction | null>(null)
  const [upcomingClosings, setUpcomingClosings] = useState<number>(0)
  const [thisMonthCommissions, setThisMonthCommissions] = useState<{ count: number; total: number }>({ count: 0, total: 0 })
  const [quickStats, setQuickStats] = useState<{ ytdTotal: number; avgDealSize: number; biggestDeal: number; pendingCount: number }>({
    ytdTotal: 0,
    avgDealSize: 0,
    biggestDeal: 0,
    pendingCount: 0
  })
  const [mostActiveFarm, setMostActiveFarm] = useState<{ name: string; count: number } | null>(null)
  const [recentActivity, setRecentActivity] = useState<Array<{ type: 'contact' | 'transaction'; id: string; title: string; date: Date; link: string }>>([])
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())
  const [calendarAppointments, setCalendarAppointments] = useState<Array<{ id: string; title: string; date: Date; time?: string; color?: string }>>([])

  // Validation issue counts (subtract dismissed) – must be declared before any early returns
  const [issuesCount, setIssuesCount] = useState(0)
  const [errorsCount, setErrorsCount] = useState(0)
  const [warningsCount, setWarningsCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    
    // Update date/time every minute
    const updateDateTime = () => setCurrentDateTime(new Date())
    updateDateTime()
    const dateTimeInterval = setInterval(updateDateTime, 60000) // Update every minute

    // Sample appointments data (in production, this would come from Google Calendar API)
    const today = new Date()
    const sampleAppointments = [
      {
        id: '1',
        title: 'Storquest - 245.00',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        time: '9:00 AM',
        color: '#f4516c' // Pink/Cherry
      },
      {
        id: '2',
        title: 'Liz-Work',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        time: '5:00 PM',
        color: '#673ab7' // Purple/Plum
      },
      {
        id: '3',
        title: 'Client Meeting',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
        time: '2:00 PM',
        color: '#42a5f5' // Sky Blue
      },
      {
        id: '4',
        title: 'Property Showing',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        time: '10:00 AM',
        color: '#689f38' // Meadow Green
      }
    ]
    setCalendarAppointments(sampleAppointments)
    
    // Fetch recent transaction and commission stats
    const fetchTransactionData = async () => {
      try {
        // Fetch all transactions (API orders by closingDate desc, so first is most recent)
        const response = await fetch('/api/transactions')
        if (response.ok) {
          const allData = await response.json()
          
          // Most recent transaction (first in array since API sorts by closingDate desc)
          if (allData.length > 0) {
            const t = allData[0]
            
            // Calculate NCI for the recent transaction
            let nci = null
            try {
              const calc = calculateCommission({
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
                preSplitDeduction: t.preSplitDeduction || '',
                asf: parseFloat(String(t.asf || 0)),
                foundation10: parseFloat(String(t.foundation10 || 0)),
                adminFee: parseFloat(String(t.adminFee || 0)),
                brokerageSplit: parseFloat(String((t as any).brokerageSplit || 0)),
                otherDeductions: parseFloat(String(t.otherDeductions || 0)),
                buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0)),
                nci: t.notes ? (() => {
                  try {
                    const notesData = JSON.parse(t.notes)
                    return notesData?.csvNci
                  } catch {
                    return t.netVolume
                  }
                })() : t.netVolume
              })
              nci = parseFloat(calc.nci || '0')
            } catch (error) {
              console.error('Error calculating NCI for recent transaction:', error)
            }
            
            setRecentTransaction({
              id: t.id,
              address: t.address,
              city: t.city,
              closedDate: t.closingDate || t.closedDate || null,
              closedPrice: t.closedPrice,
              brokerage: t.brokerage,
              transactionType: t.transactionType,
              clientType: t.clientType,
              createdAt: t.createdAt,
              nci: nci
            })
          }
          
          const now = new Date()
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const fourteenDaysFromNow = new Date()
          fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14)
          fourteenDaysFromNow.setHours(23, 59, 59, 999)
          
          // This month's closed transactions
          const thisMonth = allData.filter((t: any) => {
            const closeDate = t.closingDate || t.closedDate
            if (!closeDate) return false
            const date = new Date(closeDate)
            return date >= startOfMonth && date <= endOfMonth && t.status === 'Closed'
          })
          
          setThisMonthCommissions({
            count: thisMonth.length,
            total: thisMonth.reduce((sum: number, t: any) => {
              // Simple calculation - can be enhanced with full commission calc later
              const price = parseFloat(String(t.closedPrice || 0))
              const pct = parseFloat(String(t.commissionPct || 0))
              return sum + (price * pct)
            }, 0)
          })
          
          // Upcoming closings (next 14 days) - transactions with future closing dates (regardless of status)
          const upcoming = allData.filter((t: any) => {
            const closeDate = t.closingDate || t.closedDate
            if (!closeDate) return false
            const date = new Date(closeDate)
            date.setHours(0, 0, 0, 0)
            // Include transactions closing today or in the next 14 days
            return date >= today && date <= fourteenDaysFromNow
          })
          
          setUpcomingClosings(upcoming.length)
          
          // Quick Stats (reuse 'now' from above)
          const startOfYear = new Date(now.getFullYear(), 0, 1)
          
          // YTD transactions (closed this year)
          const ytdTransactions = allData.filter((t: any) => {
            const closeDate = t.closingDate || t.closedDate
            if (!closeDate || t.status !== 'Closed') return false
            const date = new Date(closeDate)
            return date >= startOfYear
          })
          
          // Calculate YTD total using commission calculation for accuracy
          const ytdTotal = ytdTransactions.reduce((sum: number, t: any) => {
            try {
              const calc = calculateCommission({
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
                preSplitDeduction: t.preSplitDeduction || '',
                asf: parseFloat(String(t.asf || 0)),
                foundation10: parseFloat(String(t.foundation10 || 0)),
                adminFee: parseFloat(String(t.adminFee || 0)),
                brokerageSplit: parseFloat(String((t as any).brokerageSplit || 0)),
                otherDeductions: parseFloat(String(t.otherDeductions || 0)),
                buyersAgentSplit: parseFloat(String(t.buyersAgentSplit || 0)),
                nci: t.notes ? (() => {
                  try {
                    const notesData = JSON.parse(t.notes)
                    return notesData?.csvNci
                  } catch {
                    return t.netVolume
                  }
                })() : t.netVolume
              })
              return sum + parseFloat(calc.nci || '0')
            } catch (error) {
              // Fallback to simple calculation if commission calc fails
              const price = parseFloat(String(t.closedPrice || 0))
              const pct = parseFloat(String(t.commissionPct || 0))
              return sum + (price * pct)
            }
          }, 0)
          
          // Average deal size (all closed transactions)
          const closedTransactions = allData.filter((t: any) => t.status === 'Closed' && t.closedPrice)
          const totalValue = closedTransactions.reduce((sum: number, t: any) => sum + parseFloat(String(t.closedPrice || 0)), 0)
          const avgDealSize = closedTransactions.length > 0 ? totalValue / closedTransactions.length : 0
          
          // Biggest deal (all time)
          const biggestDeal = closedTransactions.length > 0 
            ? Math.max(...closedTransactions.map((t: any) => parseFloat(String(t.closedPrice || 0))))
            : 0
          
          // Pending transactions (not closed)
          const pendingCount = allData.filter((t: any) => t.status !== 'Closed').length
          
          setQuickStats({
            ytdTotal,
            avgDealSize,
            biggestDeal,
            pendingCount
          })
        }
      } catch (error) {
        console.error('Error fetching transaction data:', error)
      }
    }
    
    // Fetch activity feed
    const fetchActivityFeed = async () => {
      try {
        const activities: Array<{ type: 'contact' | 'transaction'; id: string; title: string; date: Date; link: string }> = []
        
        // Recent contacts (last 10)
        const recentContacts = contacts
          .sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime())
          .slice(0, 5)
          .map(c => ({
            type: 'contact' as const,
            id: c.id,
            title: c.organizationName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact',
            date: c.dateCreated,
            link: `/contacts/${c.id}`
          }))
        
        activities.push(...recentContacts)
        
        // Recent transactions (if we have them)
        const transactionResponse = await fetch('/api/transactions')
        if (transactionResponse.ok) {
          const transactions = await transactionResponse.json()
          const recentTxs = transactions
            .sort((a: any, b: any) => new Date(b.createdAt || b.closingDate || 0).getTime() - new Date(a.createdAt || a.closingDate || 0).getTime())
            .slice(0, 5)
            .map((t: any) => ({
              type: 'transaction' as const,
              id: t.id,
              title: t.address || 'Transaction',
              date: new Date(t.createdAt || t.closingDate || Date.now()),
              link: `/commissions`
            }))
          
          activities.push(...recentTxs)
        }
        
        // Sort by date (most recent first) and take top 8
        activities.sort((a, b) => b.date.getTime() - a.date.getTime())
        setRecentActivity(activities.slice(0, 8))
      } catch (error) {
        console.error('Error fetching activity feed:', error)
      }
    }
    
    // Calculate most active farm
    const calculateMostActiveFarm = () => {
      const farmCounts = new Map<string, number>()
      contacts.forEach(c => {
        if (c.farm) {
          const farm = normalizeFarmName(c.farm)
          farmCounts.set(farm, (farmCounts.get(farm) || 0) + 1)
        }
      })
      
      if (farmCounts.size > 0) {
        const entries = Array.from(farmCounts.entries())
        entries.sort((a, b) => b[1] - a[1])
        setMostActiveFarm({
          name: entries[0][0],
          count: entries[0][1]
        })
      }
    }
    
    if (mounted) {
      fetchTransactionData()
      fetchActivityFeed()
      calculateMostActiveFarm()
    }
    
    return () => {
      if (dateTimeInterval) clearInterval(dateTimeInterval)
    }
  }, [mounted, contacts])

  const computeCounts = () => {
    const allIssues = validateAllContacts(contacts)
    let dismissed = new Set<string>()
    try {
      const raw = localStorage.getItem('dq.dismissedIssues')
      if (raw) dismissed = new Set<string>(JSON.parse(raw))
    } catch {}
    const visible = allIssues.filter(i => !dismissed.has(i.id))
    setIssuesCount(visible.length)
    setErrorsCount(visible.filter(i => i.severity === 'error').length)
    setWarningsCount(visible.filter(i => i.severity === 'warning').length)
  }

  useEffect(() => {
    if (!mounted) return
    computeCounts()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dq.dismissedIssues') computeCounts()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') computeCounts()
    }
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [mounted, contacts])

  if (!mounted) {
    return null
  }

  // Button press handlers for visual feedback
  const getButtonPressHandlers = (buttonId: string) => ({
    onMouseDown: () => setPressedButtons(prev => new Set(prev).add(buttonId)),
    onMouseUp: () => setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(buttonId)
      return next
    }),
    onMouseLeave: () => setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(buttonId)
      return next
    })
  })

  const getButtonPressStyle = (buttonId: string, baseStyle: React.CSSProperties, baseBg: string, hoverBg?: string) => ({
    ...baseStyle,
    backgroundColor: pressedButtons.has(buttonId) ? (hoverBg || baseBg) : baseBg,
    transform: pressedButtons.has(buttonId) ? 'scale(0.97)' : 'scale(1)',
    boxShadow: pressedButtons.has(buttonId) ? 'inset 0 2px 4px rgba(0,0,0,0.15)' : baseStyle.boxShadow || 'none',
    transition: 'all 0.1s ease'
  })

  const activeFarms = Array.from(
    new Set(
      contacts
        .map(c => c.farm ? normalizeFarmName(c.farm) : '')
        .filter(Boolean)
    )
  ).sort()

  return (
    <Sidebar>
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
            paddingLeft: spacing(6),
            paddingRight: spacing(6),
            paddingTop: spacing(4),
            paddingBottom: spacing(4)
          }}
        >
          {/* Hero Section */}
          <div style={{ marginBottom: spacing(6) }}>
            <div 
              style={{
                padding: spacing(3),
                // BRAND GREEN HEADER - Gradient from Meadow Green to Forest Green
                background: 'linear-gradient(135deg, #689f38 0%, #558b2f 100%)', // Meadow Green to Forest Green gradient
                backgroundColor: 'transparent', // Force gradient to show (remove any solid color)
                border: '1px solid #689f38',
                color: '#ffffff',
                borderRadius: '16px',
                position: 'relative' as const,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing(3) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(3), flex: 1 }}>
                  <div 
                    style={{
                      width: spacing(8),
                      height: spacing(8),
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Home style={{ width: spacing(3.5), height: spacing(3.5), color: '#ffffff' }} />
                  </div>
                  <div>
                    <h1 
                      style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        color: '#ffffff',
                        lineHeight: '40px',
                        marginBottom: '8px',
                        margin: '0 0 8px 0',
                        // Force white text - brand guidelines
                        backgroundColor: 'transparent'
                      }}
                    >
                      Welcome back
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', lineHeight: '24px', margin: '0' }}>
                      Manage your farm contacts and operations efficiently
                    </p>
                  </div>
                </div>
                {/* Date and Time - Inline with title */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ 
                    fontSize: '11px', 
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)', 
                    margin: '0 0 2px 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {currentDateTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}
                  </p>
                  <p style={{ 
                    fontSize: '28px', 
                    fontWeight: '700',
                    color: '#ffffff', 
                    margin: '0 0 2px 0',
                    lineHeight: '32px'
                  }}>
                    {currentDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p style={{ 
                    fontSize: '11px', 
                    fontWeight: '400',
                    color: 'rgba(255, 255, 255, 0.7)', 
                    margin: '0 0 4px 0'
                  }}>
                    {currentDateTime.toLocaleDateString('en-US', { year: 'numeric' })}
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    color: 'rgba(255, 255, 255, 0.9)', 
                    margin: '0',
                    letterSpacing: '0.3px'
                  }}>
                    {currentDateTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </p>
                </div>
              </div>
              {/* Header divider - white on green background */}
              <div style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.2)'
              }} />
            </div>
          </div>

          {/* Overview Section */}
          <div style={{ marginBottom: spacing(4) }}>
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: '600',
                ...text.primary,
                lineHeight: '32px',
                marginBottom: spacing(1.5),
                margin: `0 0 ${spacing(1.5)} 0`
              }}
            >
              Overview
            </h2>
            <div style={{ display: 'flex', gap: spacing(3), alignItems: 'flex-start' }}>
              {/* Left side - Auto-fit grid for regular cards */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing(3), alignItems: 'stretch' }}>
              {/* Total Contacts */}
              <Link 
                href="/contacts"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: spacing(3),
                  ...card,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Users style={{ width: spacing(3), height: spacing(3), color: colors.primary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Total Contacts
                    </p>
                    <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {stats.totalContacts}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Active Farms */}
              <Link 
                href="/google-sheets"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: spacing(3),
                  ...card,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Building2 style={{ width: spacing(3), height: spacing(3), color: colors.success }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Active Farms
                    </p>
                    <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {activeFarms.length}
                    </p>
                    {activeFarms.length > 0 && activeFarms.length <= 3 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {activeFarms.slice(0, 3).map((farm) => {
                          const c = getFarmColor(farm)
                          return (
                          <span
                            key={farm}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: c.bg,
                              border: `1px solid ${c.border}`,
                              fontSize: '11px',
                              color: c.text,
                              fontWeight: 600,
                            }}
                          >
                            {farm}
                          </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Validation Issues */}
              <Link 
                href="/data-quality"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: spacing(3),
                  ...card,
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                    ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                    : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = issuesCount > 0 ? (isDark ? '#dc2626' : '#dc2626') : colors.border
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                  ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      backgroundColor: isDark ? '#7f1d1d' : '#fef2f2',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <TrendingUp style={{ width: spacing(3), height: spacing(3), color: issuesCount > 0 ? colors.error : colors.success }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Validation Issues
                    </p>
                    <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                      {issuesCount}
                      {issuesCount === 0 && (
                        <span style={{ fontSize: '12px', marginLeft: '8px', color: colors.success, fontWeight: 600 }}>
                          Fixed
                        </span>
                      )}
                    </p>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '4px 0 0 0' }}>
                      Errors {errorsCount} • Warnings {warningsCount}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Most Recent Transaction */}
              {recentTransaction && (
                <Link 
                  href="/commissions"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: spacing(3),
                    ...cardWithLeftBorder(colors.info), // Sky Blue for transaction cards
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                      ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <div 
                      style={{
                        width: spacing(6),
                        height: spacing(6),
                        backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Briefcase style={{ width: spacing(3), height: spacing(3), color: colors.info || colors.primary }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        Recent Transaction
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recentTransaction.address || 'No address'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {recentTransaction.nci !== null && recentTransaction.nci !== undefined && recentTransaction.nci > 0 && (
                          <p style={{ fontSize: '14px', fontWeight: '600', color: colors.success, margin: '0' }}>
                            NCI: ${recentTransaction.nci.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                          {recentTransaction.closedDate 
                            ? new Date(recentTransaction.closedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : 'No date'}
                          {recentTransaction.city && ` • ${recentTransaction.city}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* This Month Commissions */}
              {thisMonthCommissions.count > 0 && (
                <Link 
                  href="/commissions"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: spacing(3),
                    ...cardWithLeftBorder(colors.warning), // Tangerine for financial cards
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                      ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <div 
                      style={{
                        width: spacing(6),
                        height: spacing(6),
                        backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <DollarSign style={{ width: spacing(3), height: spacing(3), color: colors.success }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        This Month
                      </p>
                      <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                        {thisMonthCommissions.count}
                      </p>
                      <p style={{ fontSize: '12px', ...text.tertiary, margin: '4px 0 0 0' }}>
                        Closed transactions
                      </p>
                    </div>
                  </div>
                </Link>
              )}

              {/* Upcoming Closings */}
              {upcomingClosings > 0 && (
                <Link 
                  href="/commissions"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: spacing(3),
                    ...card,
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                      ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <div 
                      style={{
                        width: spacing(6),
                        height: spacing(6),
                        backgroundColor: isDark ? '#7c2d12' : '#fff7ed',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Clock style={{ width: spacing(3), height: spacing(3), color: colors.warning }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        Upcoming Closings
                      </p>
                      <p style={{ fontSize: '30px', fontWeight: '700', ...text.primary, margin: '0' }}>
                        {upcomingClosings}
                      </p>
                      <p style={{ fontSize: '12px', ...text.tertiary, margin: '4px 0 0 0' }}>
                        Next 14 days
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              </div>

              {/* Right side - Calendar and Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(3), width: '380px', flexShrink: 0 }}>
              {/* Calendar Card - Full Calendar View */}
              <div 
                style={{
                  padding: spacing(3),
                  ...card,
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: '600px'
                }}
              >
                {/* Calendar Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(3) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <Calendar style={{ width: '20px', height: '20px', color: colors.primary }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, margin: 0 }}>
                      {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(1) }}>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate)
                        newDate.setMonth(newDate.getMonth() - 1)
                        setCalendarDate(newDate)
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = colors.cardHover
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      <ChevronLeft style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      onClick={() => {
                        const newDate = new Date(calendarDate)
                        newDate.setMonth(newDate.getMonth() + 1)
                        setCalendarDate(newDate)
                      }}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: colors.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = colors.cardHover
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      <ChevronRight style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Day Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: spacing(1) }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div
                        key={idx}
                        style={{
                          textAlign: 'center',
                          fontSize: '12px',
                          fontWeight: '600',
                          ...text.secondary,
                          padding: '8px 4px'
                        }}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
                    {(() => {
                      const year = calendarDate.getFullYear()
                      const month = calendarDate.getMonth()
                      const firstDay = new Date(year, month, 1)
                      const lastDay = new Date(year, month + 1, 0)
                      const startDate = new Date(firstDay)
                      startDate.setDate(startDate.getDate() - startDate.getDay())
                      
                      const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean }> = []
                      const currentDate = new Date(startDate)
                      
                      for (let i = 0; i < 42; i++) {
                        const isCurrentMonth = currentDate.getMonth() === month
                        const today = new Date()
                        const isToday = currentDate.toDateString() === today.toDateString()
                        
                        days.push({
                          date: new Date(currentDate),
                          isCurrentMonth,
                          isToday
                        })
                        
                        currentDate.setDate(currentDate.getDate() + 1)
                      }
                      
                      return days.map((day, idx) => {
                        const dayAppointments = calendarAppointments.filter(apt => {
                          const aptDate = new Date(apt.date)
                          return aptDate.toDateString() === day.date.toDateString()
                        })
                        
                        return (
                          <div
                            key={idx}
                            style={{
                              aspectRatio: '1',
                              minHeight: '40px',
                              padding: '4px',
                              borderRadius: '6px',
                              backgroundColor: day.isToday 
                                ? (isDark ? 'rgba(104, 159, 56, 0.2)' : 'rgba(104, 159, 56, 0.1)')
                                : 'transparent',
                              border: day.isToday ? `2px solid ${colors.primary}` : '2px solid transparent',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!day.isToday) {
                                (e.currentTarget as HTMLElement).style.backgroundColor = colors.cardHover
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!day.isToday) {
                                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                              }
                            }}
                          >
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: day.isToday ? '700' : '500',
                                color: day.isCurrentMonth 
                                  ? (day.isToday ? colors.primary : text.primary.color)
                                  : text.tertiary.color,
                                marginBottom: '2px'
                              }}
                            >
                              {day.date.getDate()}
                            </span>
                            {dayAppointments.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', alignItems: 'center' }}>
                                {dayAppointments.slice(0, 2).map((apt, aptIdx) => (
                                  <div
                                    key={aptIdx}
                                    style={{
                                      width: '100%',
                                      height: '3px',
                                      borderRadius: '2px',
                                      backgroundColor: apt.color || colors.primary,
                                      fontSize: '8px'
                                    }}
                                    title={apt.title}
                                  />
                                ))}
                                {dayAppointments.length > 2 && (
                                  <span style={{ fontSize: '8px', ...text.tertiary }}>
                                    +{dayAppointments.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Today's Appointments */}
                <div style={{ marginTop: spacing(3), paddingTop: spacing(3), borderTop: `1px solid ${colors.border}` }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, marginBottom: spacing(2), margin: `0 0 ${spacing(2)} 0` }}>
                    TODAY
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing(2), maxHeight: '200px', overflowY: 'auto' }}>
                    {(() => {
                      const today = new Date()
                      const todayAppointments = calendarAppointments.filter(apt => {
                        const aptDate = new Date(apt.date)
                        return aptDate.toDateString() === today.toDateString()
                      })
                      
                      if (todayAppointments.length === 0) {
                        return (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: 0, fontStyle: 'italic' }}>
                            No appointments today
                          </p>
                        )
                      }
                      
                      return todayAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing(2),
                            padding: spacing(1.5),
                            borderRadius: '8px',
                            backgroundColor: colors.cardHover
                          }}
                        >
                          <div
                            style={{
                              width: '4px',
                              height: '100%',
                              minHeight: '32px',
                              borderRadius: '2px',
                              backgroundColor: apt.color || colors.primary,
                              flexShrink: 0
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '14px', fontWeight: '500', ...text.primary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {apt.title}
                            </p>
                            {apt.time && (
                              <p style={{ fontSize: '12px', ...text.tertiary, margin: '4px 0 0 0' }}>
                                {apt.time}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>

              {/* Tasks Card - Below Calendar */}
              <div 
                style={{
                  padding: spacing(3),
                  ...card,
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2), marginBottom: spacing(2) }}>
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      backgroundColor: colors.iconBg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <CheckSquare style={{ width: spacing(3), height: spacing(3), color: colors.primary }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                      Tasks & Reminders
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0' }}>
                      Coming Soon
                    </p>
                    <p style={{ fontSize: '12px', ...text.tertiary, margin: '4px 0 0 0' }}>
                      Task management (v0.10.0)
                    </p>
                  </div>
                </div>
              </div>
              </div>
              
              {/* Quick Stats Card */}
              {quickStats.ytdTotal > 0 || quickStats.pendingCount > 0 ? (
                <Link 
                  href="/commissions"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: spacing(3),
                    ...cardWithLeftBorder(colors.warning), // Tangerine for financial cards
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                      ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <div 
                      style={{
                        width: spacing(6),
                        height: spacing(6),
                        backgroundColor: isDark ? '#1e3a8a' : '#eff6ff',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <TrendingUp style={{ width: spacing(3), height: spacing(3), color: colors.info || colors.primary }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        Quick Stats
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {quickStats.ytdTotal > 0 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            YTD: ${(quickStats.ytdTotal / 1000).toFixed(1)}k
                          </p>
                        )}
                        {quickStats.avgDealSize > 0 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            Avg: ${(quickStats.avgDealSize / 1000).toFixed(1)}k
                          </p>
                        )}
                        {quickStats.biggestDeal > 0 && (
                          <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                            Biggest: ${(quickStats.biggestDeal / 1000).toFixed(1)}k
                          </p>
                        )}
                        {quickStats.pendingCount > 0 && (
                          <p style={{ fontSize: '12px', color: colors.warning, margin: '4px 0 0 0', fontWeight: '600' }}>
                            {quickStats.pendingCount} pending
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : null}

              {/* Most Active Farm */}
              {mostActiveFarm && (
                <Link 
                  href="/contacts"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    padding: spacing(3),
                    ...card,
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    height: '100%'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = isDark 
                      ? '0 4px 6px -1px rgba(0,0,0,0.5), 0 2px 4px -1px rgba(0,0,0,0.3)'
                      : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.primary
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = card.boxShadow
                    ;(e.currentTarget as HTMLElement).style.borderColor = colors.border
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing(2) }}>
                    <div 
                      style={{
                        width: spacing(6),
                        height: spacing(6),
                        backgroundColor: isDark ? '#064e3b' : '#f0fdf4',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Building2 style={{ width: spacing(3), height: spacing(3), color: colors.success }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', ...text.secondary, marginBottom: '4px', margin: '0 0 4px 0' }}>
                        Most Active Farm
                      </p>
                      <p style={{ fontSize: '16px', fontWeight: '600', ...text.primary, margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mostActiveFarm.name}
                      </p>
                      <p style={{ fontSize: '12px', ...text.tertiary, margin: '0' }}>
                        {mostActiveFarm.count} contact{mostActiveFarm.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              )}
              </div>
            </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: spacing(4) }}>
            <h2 
              style={{
                fontSize: '24px',
                fontWeight: '600',
                ...text.primary,
                lineHeight: '32px',
                marginBottom: spacing(1.5),
                margin: `0 0 ${spacing(1.5)} 0`
              }}
            >
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing(2) }}>
              {/* Quick Action Component Helper */}
              {([
                { id: 'addContact', href: '/contacts/new', icon: Plus, title: 'Add Contact', desc: 'Create a new farm contact', bgColor: colors.iconBg, iconColor: colors.primary },
                { id: 'newTransaction', href: '/commissions', icon: DollarSign, title: 'New Transaction', desc: 'Add a commission transaction', bgColor: isDark ? '#064e3b' : '#f0fdf4', iconColor: colors.success },
                { id: 'viewCommissions', href: '/commissions', icon: Briefcase, title: 'View Commissions', desc: 'Manage transactions', bgColor: isDark ? '#1e3a8a' : '#eff6ff', iconColor: colors.info || colors.primary },
                { id: 'importExport', href: '/import-export', icon: Upload, title: 'Import & Export', desc: 'Manage data files', bgColor: isDark ? '#064e3b' : '#f0fdf4', iconColor: colors.success },
                { id: 'printLabels', href: '/print-labels', icon: Printer, title: 'Print Labels', desc: 'Print address labels', bgColor: isDark ? '#4c1d95' : '#f3e8ff', iconColor: colors.accent },
                { id: 'documents', href: '/documents', icon: FileText, title: 'Documents', desc: 'Manage documents', bgColor: isDark ? '#7c2d12' : '#fff7ed', iconColor: colors.warning },
                { id: 'dataQuality', href: '/data-quality', icon: CheckCircle2, title: 'Data Quality', desc: 'Validation issues', bgColor: isDark ? '#7f1d1d' : '#fef2f2', iconColor: issuesCount > 0 ? colors.error : colors.success },
                { id: 'googleContacts', href: '/google-contacts', icon: Contact, title: 'Google Contacts', desc: 'Sync contacts', bgColor: isDark ? '#1e3a8a' : '#eff6ff', iconColor: colors.info || colors.primary },
                { id: 'googleSheets', href: '/google-sheets', icon: FileSpreadsheet, title: 'Google Sheets', desc: 'Sync spreadsheets', bgColor: isDark ? '#064e3b' : '#f0fdf4', iconColor: colors.success },
                { id: 'settings', href: '/settings', icon: Settings, title: 'Settings', desc: 'Preferences', bgColor: colors.iconBg, iconColor: colors.text.secondary }
              ] as const).map(({ id, href, icon: Icon, title, desc, bgColor, iconColor }) => (
                <Link
                  key={id}
                  href={href}
                  {...getButtonPressHandlers(id)}
                  style={getButtonPressStyle(id, {
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing(2),
                    padding: spacing(2.5),
                    ...card,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }, card.backgroundColor || 'transparent', colors.cardHover)}
                  onMouseEnter={(e) => {
                    if (!pressedButtons.has(id)) {
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      e.currentTarget.style.borderColor = colors.primary
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!pressedButtons.has(id)) {
                      e.currentTarget.style.boxShadow = card.boxShadow
                      e.currentTarget.style.borderColor = colors.border
                    }
                  }}
                >
                  <div 
                    style={{
                      width: spacing(6),
                      height: spacing(6),
                      minWidth: spacing(6),
                      backgroundColor: bgColor,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon style={{ width: spacing(3), height: spacing(3), color: iconColor }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontWeight: '600', 
                      ...text.primary, 
                      fontSize: '14px', 
                      margin: '0 0 4px 0',
                      textAlign: 'left'
                    }}>
                      {title}
                    </h3>
                    <p style={{ 
                      fontSize: '12px', 
                      ...text.secondary, 
                      margin: '0',
                      textAlign: 'left'
                    }}>
                      {desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>


        </div>
      </div>
    </Sidebar>
  )
}