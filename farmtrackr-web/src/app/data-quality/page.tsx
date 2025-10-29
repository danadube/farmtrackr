'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Users, 
  RefreshCw,
  AlertCircle,
  FileCheck,
  Merge,
  Trash2,
  Eye,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { FarmContact } from '@/types'
import { formatPhoneNumber } from '@/lib/formatters'

interface DuplicateGroup {
  id: string
  contacts: FarmContact[]
  confidence: 'high' | 'medium' | 'low'
  matchFields: string[]
}

interface ValidationIssue {
  id: string
  contactId: string
  contactName: string
  type: 'missing' | 'invalid' | 'format'
  field: string
  message: string
  severity: 'error' | 'warning'
}

export default function DataQualityPage() {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'duplicates' | 'validation' | 'cleanup'>('duplicates')
  const [cleanupAction, setCleanupAction] = useState<string>('')
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanupStatus, setCleanupStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    updatedCount?: number
  } | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [qualityScore, setQualityScore] = useState<number>(100)
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null)
  const [mergingGroupId, setMergingGroupId] = useState<string | null>(null)
  const [mergeStatus, setMergeStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  } | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/data-quality')
      if (response.ok) {
        const data = await response.json()
        setDuplicates(data.duplicates || [])
        setValidationIssues(data.validationIssues || [])
        setQualityScore(data.qualityScore || 100)
        setLastAnalyzed(new Date())
      }
    } catch (error) {
      console.error('Error analyzing data quality:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    handleAnalyze()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return colors.error
      case 'medium':
        return colors.warning
      case 'low':
        return colors.text.tertiary
      default:
        return colors.text.tertiary
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return colors.error
      case 'warning':
        return colors.warning
      default:
        return colors.text.tertiary
    }
  }

  const handleCleanup = async (action: string) => {
    setIsCleaning(true)
    setCleanupAction(action)
    setCleanupStatus(null)

    try {
      const response = await fetch('/api/contacts/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (response.ok) {
        setCleanupStatus({
          type: 'success',
          message: result.message || 'Cleanup completed successfully',
          updatedCount: result.updatedCount
        })
        
        // Refresh data after cleanup
        setTimeout(() => {
          handleAnalyze()
          setCleanupStatus(null)
        }, 2000)
      } else {
        setCleanupStatus({
          type: 'error',
          message: result.error || 'Failed to cleanup contacts'
        })
      }
    } catch (error) {
      setCleanupStatus({
        type: 'error',
        message: `Failed to cleanup contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setIsCleaning(false)
      setCleanupAction('')
    }
  }

  const handleMerge = async (group: DuplicateGroup) => {
    if (group.contacts.length < 2) {
      setMergeStatus({
        type: 'error',
        message: 'At least 2 contacts are required to merge'
      })
      return
    }

    setMergingGroupId(group.id)
    setMergeStatus(null)

    try {
      const contactIds = group.contacts.map(c => c.id)
      const response = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds }),
      })

      const result = await response.json()

      if (response.ok) {
        setMergeStatus({
          type: 'success',
          message: result.message || 'Contacts merged successfully'
        })
        
        // Refresh duplicates after merge
        setTimeout(() => {
          handleAnalyze()
          setMergeStatus(null)
        }, 2000)
      } else {
        setMergeStatus({
          type: 'error',
          message: result.error || 'Failed to merge contacts'
        })
      }
    } catch (error) {
      setMergeStatus({
        type: 'error',
        message: `Failed to merge contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setMergingGroupId(null)
    }
  }

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
                ...card
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div 
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: isDark ? '#78350f' : '#fef3c7',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TrendingUp style={{ width: '24px', height: '24px', color: colors.warning }} />
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
                      Data Quality
                    </h1>
                    <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
                      Detect duplicates and validate contact data
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: isAnalyzing ? colors.text.tertiary : colors.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isAnalyzing) {
                      e.currentTarget.style.backgroundColor = isDark ? '#059669' : '#15803d'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAnalyzing) {
                      e.currentTarget.style.backgroundColor = colors.success
                    }
                  }}
                >
                  <RefreshCw 
                    style={{ 
                      width: '16px', 
                      height: '16px',
                      animation: isAnalyzing ? 'spin 1s linear infinite' : 'none'
                    }} 
                  />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <AlertTriangle style={{ width: '20px', height: '20px', color: colors.error }} />
                <span style={{ fontSize: '14px', fontWeight: '500', ...text.secondary }}>
                  Duplicate Groups
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: '700', ...text.primary, margin: '0' }}>
                {duplicates.length}
              </p>
            </div>

            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <FileCheck style={{ width: '20px', height: '20px', color: colors.warning }} />
                <span style={{ fontSize: '14px', fontWeight: '500', ...text.secondary }}>
                  Validation Issues
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: '700', ...text.primary, margin: '0' }}>
                {validationIssues.length}
              </p>
            </div>

            <div style={{ padding: '24px', ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                <span style={{ fontSize: '14px', fontWeight: '500', ...text.secondary }}>
                  Data Quality Score
                </span>
              </div>
              <p style={{ fontSize: '32px', fontWeight: '700', ...text.primary, margin: '0 0 4px 0' }}>
                {qualityScore}%
              </p>
              <div style={{ marginTop: '8px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '6px', 
                  backgroundColor: colors.cardHover, 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${qualityScore}%`,
                    height: '100%',
                    backgroundColor: qualityScore >= 80 ? colors.success : qualityScore >= 60 ? colors.warning : colors.error,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ fontSize: '11px', ...text.tertiary, margin: '4px 0 0 0' }}>
                  {qualityScore >= 80 ? 'Excellent' : qualityScore >= 60 ? 'Good' : qualityScore >= 40 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>

          {/* Merge Status Message */}
          {mergeStatus && (
            <div 
              style={{
                marginBottom: '24px',
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: mergeStatus.type === 'success' 
                  ? (isDark ? '#064e3b' : '#f0fdf4') 
                  : (isDark ? '#7f1d1d' : '#fef2f2'),
                border: `1px solid ${mergeStatus.type === 'success' ? colors.success : colors.error}`
              }}
            >
              {mergeStatus.type === 'success' ? (
                <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
              ) : (
                <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
              )}
              <p style={{ fontSize: '14px', color: mergeStatus.type === 'success' 
                ? (isDark ? '#6ee7b7' : '#15803d') 
                : (isDark ? '#fca5a5' : '#dc2626'), margin: '0' }}>
                {mergeStatus.message}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div style={{ marginBottom: '24px' }}>
            <div 
              style={{
                display: 'flex',
                ...card,
                padding: '4px',
                gap: '4px'
              }}
            >
              <button
                onClick={() => setActiveTab('duplicates')}
                style={{
                  flex: '1',
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'duplicates' ? colors.card : 'transparent',
                  color: activeTab === 'duplicates' ? colors.text.primary : colors.text.secondary,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: activeTab === 'duplicates' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'duplicates') {
                    e.currentTarget.style.backgroundColor = colors.cardHover
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'duplicates') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                Duplicate Detection
              </button>
              <button
                onClick={() => setActiveTab('validation')}
                style={{
                  flex: '1',
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'validation' ? colors.card : 'transparent',
                  color: activeTab === 'validation' ? colors.text.primary : colors.text.secondary,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: activeTab === 'validation' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Validation
              </button>
              <button
                onClick={() => setActiveTab('cleanup')}
                style={{
                  flex: '1',
                  padding: '8px 16px',
                  backgroundColor: activeTab === 'cleanup' ? colors.card : 'transparent',
                  color: activeTab === 'cleanup' ? colors.text.primary : colors.text.secondary,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: activeTab === 'cleanup' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cleanup
              </button>
            </div>
          </div>
                Data Validation
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'duplicates' && (
            <div style={{ padding: '24px', ...card }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    ...text.primary,
                    margin: '0 0 8px 0'
                  }}
                >
                  Duplicate Groups ({duplicates.length})
                </h2>
                <p style={{ ...text.secondary, fontSize: '14px', margin: '0' }}>
                  Potential duplicate contacts found in your database
                </p>
              </div>

              {duplicates.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <CheckCircle style={{ width: '48px', height: '48px', color: colors.success, margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                    No duplicates found
                  </h3>
                  <p style={{ ...text.secondary }}>
                    Your contact database is clean and free of duplicates!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {duplicates.map((group) => (
                    <div 
                      key={group.id}
                      style={{
                        padding: '20px',
                        border: `1px solid ${getConfidenceColor(group.confidence)}`,
                        borderRadius: '12px',
                        backgroundColor: colors.cardHover
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Users style={{ width: '20px', height: '20px', color: getConfidenceColor(group.confidence) }} />
                          <span 
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: getConfidenceColor(group.confidence),
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: '4px 8px',
                              backgroundColor: `${getConfidenceColor(group.confidence)}20`,
                              borderRadius: '4px'
                            }}
                          >
                            {group.confidence} confidence
                          </span>
                          <span style={{ fontSize: '12px', ...text.secondary }}>
                            Matches on: {group.matchFields.join(', ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleMerge(group)}
                            disabled={mergingGroupId === group.id}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: mergingGroupId === group.id 
                                ? colors.text.tertiary 
                                : (isDark ? '#064e3b' : '#f0fdf4'),
                              color: mergingGroupId === group.id ? '#ffffff' : colors.success,
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: mergingGroupId === group.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (mergingGroupId !== group.id) {
                                e.currentTarget.style.backgroundColor = isDark ? '#065f46' : '#dcfce7'
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (mergingGroupId !== group.id) {
                                e.currentTarget.style.backgroundColor = isDark ? '#064e3b' : '#f0fdf4'
                              }
                            }}
                          >
                            {mergingGroupId === group.id ? (
                              <>
                                <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                                Merging...
                              </>
                            ) : (
                              <>
                                <Merge style={{ width: '14px', height: '14px' }} />
                                Merge
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {group.contacts.map((contact) => (
                          <Link 
                            key={contact.id}
                            href={`/contacts/${contact.id}`}
                            style={{
                              padding: '12px',
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              textDecoration: 'none',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.cardHover
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.card
                            }}
                          >
                            <div style={{ flex: '1' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                                  {contact.firstName} {contact.lastName}
                                </h3>
                                {contact.farm && (
                                  <span style={{ fontSize: '12px', ...text.secondary }}>
                                    {contact.farm}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                                {contact.email1 && (
                                  <span style={{ fontSize: '12px', ...text.secondary }}>
                                    {contact.email1}
                                  </span>
                                )}
                                {contact.phoneNumber1 && (
                                  <span style={{ fontSize: '12px', ...text.secondary }}>
                                    {formatPhoneNumber(contact.phoneNumber1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Eye style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                              <ArrowRight style={{ width: '16px', height: '16px', color: colors.text.tertiary }} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cleanup' && (
            <div style={{ padding: '24px', ...card }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    ...text.primary,
                    marginBottom: '8px'
                  }}
                >
                  Bulk Cleanup Operations
                </h2>
                <p style={{ fontSize: '14px', ...text.secondary }}>
                  Clean and normalize contact data across all contacts
                </p>
              </div>

              {/* Cleanup Status */}
              {cleanupStatus && (
                <div 
                  style={{
                    marginBottom: '24px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: cleanupStatus.type === 'success' 
                      ? (isDark ? '#064e3b' : '#f0fdf4') 
                      : (isDark ? '#7f1d1d' : '#fef2f2'),
                    border: `1px solid ${cleanupStatus.type === 'success' ? colors.success : colors.error}`
                  }}
                >
                  {cleanupStatus.type === 'success' ? (
                    <CheckCircle style={{ width: '20px', height: '20px', color: colors.success }} />
                  ) : (
                    <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                  )}
                  <p style={{ fontSize: '14px', color: cleanupStatus.type === 'success' 
                    ? (isDark ? '#6ee7b7' : '#15803d') 
                    : (isDark ? '#fca5a5' : '#dc2626'), margin: '0' }}>
                    {cleanupStatus.message}
                  </p>
                </div>
              )}

              {/* Cleanup Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => handleCleanup('format-phones')}
                  disabled={isCleaning}
                  style={{
                    padding: '16px',
                    backgroundColor: isCleaning ? colors.text.tertiary : colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isCleaning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                      Format Phone Numbers
                    </div>
                    <div style={{ fontSize: '12px', ...text.tertiary }}>
                      Format all phone numbers to (XXX) XXX-XXXX format
                    </div>
                  </div>
                  {isCleaning && cleanupAction === 'format-phones' ? (
                    <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: colors.success }} />
                  ) : (
                    <FileCheck style={{ width: '20px', height: '20px', color: colors.success }} />
                  )}
                </button>

                <button
                  onClick={() => handleCleanup('normalize-emails')}
                  disabled={isCleaning}
                  style={{
                    padding: '16px',
                    backgroundColor: isCleaning ? colors.text.tertiary : colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isCleaning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                      Normalize Email Addresses
                    </div>
                    <div style={{ fontSize: '12px', ...text.tertiary }}>
                      Convert all emails to lowercase and trim whitespace
                    </div>
                  </div>
                  {isCleaning && cleanupAction === 'normalize-emails' ? (
                    <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: colors.success }} />
                  ) : (
                    <FileCheck style={{ width: '20px', height: '20px', color: colors.success }} />
                  )}
                </button>

                <button
                  onClick={() => handleCleanup('normalize-zip')}
                  disabled={isCleaning}
                  style={{
                    padding: '16px',
                    backgroundColor: isCleaning ? colors.text.tertiary : colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isCleaning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                      Normalize ZIP Codes
                    </div>
                    <div style={{ fontSize: '12px', ...text.tertiary }}>
                      Format ZIP codes to 5-digit standard format
                    </div>
                  </div>
                  {isCleaning && cleanupAction === 'normalize-zip' ? (
                    <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: colors.success }} />
                  ) : (
                    <FileCheck style={{ width: '20px', height: '20px', color: colors.success }} />
                  )}
                </button>

                <button
                  onClick={() => handleCleanup('normalize-names')}
                  disabled={isCleaning}
                  style={{
                    padding: '16px',
                    backgroundColor: isCleaning ? colors.text.tertiary : colors.cardHover,
                    ...text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isCleaning ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.borderHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCleaning) {
                      e.currentTarget.style.backgroundColor = colors.cardHover
                    }
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '4px' }}>
                      Normalize Names
                    </div>
                    <div style={{ fontSize: '12px', ...text.tertiary }}>
                      Format names to proper case (First Last)
                    </div>
                  </div>
                  {isCleaning && cleanupAction === 'normalize-names' ? (
                    <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', color: colors.success }} />
                  ) : (
                    <FileCheck style={{ width: '20px', height: '20px', color: colors.success }} />
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'validation' && (
            <div style={{ padding: '24px', ...card }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 
                  style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    ...text.primary,
                    margin: '0 0 8px 0'
                  }}
                >
                  Validation Issues ({validationIssues.length})
                </h2>
                <p style={{ ...text.secondary, fontSize: '14px', margin: '0' }}>
                  Data quality issues that need your attention
                </p>
              </div>

              {validationIssues.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <CheckCircle style={{ width: '48px', height: '48px', color: colors.success, margin: '0 auto 16px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                    No validation issues
                  </h3>
                  <p style={{ ...text.secondary }}>
                    All contact data is valid and properly formatted!
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {validationIssues.map((issue) => (
                    <div 
                      key={issue.id}
                      style={{
                        padding: '16px',
                        border: `1px solid ${getSeverityColor(issue.severity)}`,
                        borderRadius: '12px',
                        backgroundColor: colors.card,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1' }}>
                        {issue.severity === 'error' ? (
                          <XCircle style={{ width: '20px', height: '20px', color: colors.error }} />
                        ) : (
                          <AlertCircle style={{ width: '20px', height: '20px', color: colors.warning }} />
                        )}
                        <div style={{ flex: '1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', ...text.primary, margin: '0' }}>
                              {issue.contactName}
                            </h3>
                            <span 
                              style={{
                                fontSize: '11px',
                                fontWeight: '500',
                                color: getSeverityColor(issue.severity),
                                textTransform: 'uppercase',
                                padding: '2px 6px',
                                backgroundColor: `${getSeverityColor(issue.severity)}20`,
                                borderRadius: '4px'
                              }}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', ...text.secondary, margin: '0' }}>
                            <strong>{issue.field}:</strong> {issue.message}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          href={`/contacts/${issue.contactId}`}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: colors.cardHover,
                            ...text.secondary,
                            textDecoration: 'none',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = colors.borderHover
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.cardHover
                          }}
                        >
                          View Contact
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  )
}