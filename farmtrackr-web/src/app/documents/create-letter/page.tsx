'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  ChevronRight,
  ChevronLeft,
  Check,
  Users,
  FileEdit,
  PenTool,
  Download,
  Printer
} from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import Link from 'next/link'

interface LetterTemplate {
  id: string
  name: string
  description?: string
  content: string
}

interface Signature {
  id: string
  name: string
  closing: string
  signature: string
  type: string
}

export default function CreateLetterPage() {
  const { colors, isDark, card, background, text } = useThemeStyles()
  const [currentStep, setCurrentStep] = useState(1)
  const [templates, setTemplates] = useState<LetterTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null)
  const [selectedFarms, setSelectedFarms] = useState<string[]>([])
  const [availableFarms, setAvailableFarms] = useState<string[]>([])
  const [letterContent, setLetterContent] = useState('')
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [selectedSignature, setSelectedSignature] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Fetch templates and farms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch letter templates
        const templatesRes = await fetch('/api/letter-templates')
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          setTemplates(templatesData)
        }
        
        // Fetch farms
        const contactsRes = await fetch('/api/contacts')
        if (contactsRes.ok) {
          const contactsData = await contactsRes.json()
          const farms = Array.from(new Set(
            contactsData.map((c: any) => c.farm).filter(Boolean)
          )).sort()
          setAvailableFarms(farms)
        }
        
        // Fetch signatures
        const sigsRes = await fetch('/api/signatures')
        if (sigsRes.ok) {
          const sigsData = await sigsRes.json()
          setSignatures(sigsData)
          // Set default signature if available
          const defaultSig = sigsData.find((s: Signature) => s.isDefault)
          if (defaultSig) setSelectedSignature(defaultSig.id)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Load template content when template is selected
  useEffect(() => {
    if (selectedTemplate && currentStep === 3) {
      setLetterContent(selectedTemplate.content)
    }
  }, [selectedTemplate, currentStep])

  const handleTemplateSelect = (template: LetterTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep(2)
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFarmToggle = (farm: string) => {
    setSelectedFarms(prev => 
      prev.includes(farm) 
        ? prev.filter(f => f !== farm)
        : [...prev, farm]
    )
  }

  const handleGenerateLetters = async () => {
    if (!selectedTemplate || selectedFarms.length === 0 || !letterContent || !selectedSignature) {
      alert('Please complete all steps')
      return
    }

    try {
      const response = await fetch('/api/documents/mail-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          farms: selectedFarms,
          content: letterContent,
          signatureId: selectedSignature,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Successfully generated ${result.count} letters`)
        // TODO: Navigate to generated letters view or download
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to generate letters:', error)
      alert('Failed to generate letters')
    }
  }

  const steps = [
    { number: 1, label: 'Choose Template', icon: FileText },
    { number: 2, label: 'Select Farms', icon: Users },
    { number: 3, label: 'Edit Letter', icon: FileEdit },
    { number: 4, label: 'Signature', icon: PenTool },
  ]

  const getAvailableVariables = () => [
    '{{farm}}',
    '{{contact_name}}',
    '{{contact_first_name}}',
    '{{contact_last_name}}',
    '{{mailing_address}}',
    '{{city}}',
    '{{state}}',
    '{{zip_code}}',
    '{{email}}',
    '{{phone}}',
  ]

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
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <Link 
                href="/documents"
                style={{ 
                  textDecoration: 'none', 
                  color: colors.text.secondary,
                  fontSize: '14px'
                }}
              >
                ← Back to Documents
              </Link>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', ...text.primary, margin: '0 0 8px 0' }}>
              Create Mail Merge Letter
            </h1>
            <p style={{ ...text.secondary, fontSize: '16px', margin: '0' }}>
              Generate personalized letters for selected farms
            </p>
          </div>

          {/* Step Indicator */}
          <div style={{ ...card, padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = currentStep === step.number
                const isCompleted = currentStep > step.number
                
                return (
                  <div key={step.number} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          backgroundColor: isCompleted 
                            ? colors.success 
                            : isActive 
                            ? colors.primary 
                            : colors.cardHover,
                          color: isCompleted || isActive ? '#ffffff' : colors.text.tertiary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        {isCompleted ? (
                          <Check style={{ width: '20px', height: '20px' }} />
                        ) : (
                          <StepIcon style={{ width: '20px', height: '20px' }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', ...text.secondary }}>
                          Step {step.number}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '500', ...(isActive ? text.primary : text.secondary) }}>
                          {step.label}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          color: colors.text.tertiary,
                          margin: '0 16px'
                        }} 
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div style={{ ...card, padding: '24px', minHeight: '400px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <p style={{ ...text.secondary }}>Loading...</p>
              </div>
            ) : (
              <>
                {/* Step 1: Choose Template */}
                {currentStep === 1 && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                      Select a Letter Template
                    </h2>
                    {templates.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px' }}>
                        <FileText style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
                        <p style={{ ...text.secondary, marginBottom: '16px' }}>No templates available</p>
                        <button
                          style={{
                            padding: '12px 24px',
                            backgroundColor: colors.success,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Create Template
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {templates.map(template => (
                          <div
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            style={{
                              padding: '20px',
                              border: `2px solid ${selectedTemplate?.id === template.id ? colors.primary : colors.border}`,
                              borderRadius: '12px',
                              backgroundColor: selectedTemplate?.id === template.id ? `${colors.primary}10` : colors.card,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = colors.primary
                              e.currentTarget.style.backgroundColor = `${colors.primary}10`
                            }}
                            onMouseLeave={(e) => {
                              if (selectedTemplate?.id !== template.id) {
                                e.currentTarget.style.borderColor = colors.border
                                e.currentTarget.style.backgroundColor = colors.card
                              }
                            }}
                          >
                            <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary, marginBottom: '8px' }}>
                              {template.name}
                            </h3>
                            {template.description && (
                              <p style={{ fontSize: '14px', ...text.secondary, margin: '0' }}>
                                {template.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Select Farms */}
                {currentStep === 2 && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '16px' }}>
                      Select Farms ({selectedFarms.length} selected)
                    </h2>
                    <div style={{ marginBottom: '16px' }}>
                      <button
                        onClick={() => setSelectedFarms(availableFarms)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: colors.cardHover,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          ...text.secondary,
                          marginRight: '8px'
                        }}
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedFarms([])}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: colors.cardHover,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          ...text.secondary
                        }}
                      >
                        Clear All
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '8px' }}>
                      {availableFarms.map(farm => {
                        const isSelected = selectedFarms.includes(farm)
                        return (
                          <div
                            key={farm}
                            onClick={() => handleFarmToggle(farm)}
                            style={{
                              padding: '12px 16px',
                              border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                              borderRadius: '10px',
                              backgroundColor: isSelected ? `${colors.primary}10` : colors.cardHover,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            {isSelected && <Check style={{ width: '16px', height: '16px', color: colors.primary }} />}
                            <span style={{ fontSize: '14px', fontWeight: isSelected ? '600' : '500', ...text.primary }}>
                              {farm}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Edit Letter */}
                {currentStep === 3 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary }}>
                        Edit Letter Content
                      </h2>
                      <div style={{ fontSize: '12px', ...text.secondary }}>
                        Available variables: {getAvailableVariables().join(', ')}
                      </div>
                    </div>
                    <textarea
                      value={letterContent}
                      onChange={(e) => setLetterContent(e.target.value)}
                      placeholder="Enter letter content. Use variables like {{farm}}, {{contact_name}}, etc."
                      style={{
                        width: '100%',
                        minHeight: '400px',
                        padding: '16px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        backgroundColor: colors.card,
                        color: colors.text.primary,
                        lineHeight: '1.6',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}

                {/* Step 4: Signature */}
                {currentStep === 4 && (
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', ...text.primary, marginBottom: '24px' }}>
                      Choose Signature
                    </h2>
                    {signatures.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '48px' }}>
                        <PenTool style={{ width: '48px', height: '48px', color: colors.text.tertiary, margin: '0 auto 16px' }} />
                        <p style={{ ...text.secondary, marginBottom: '16px' }}>No signatures available</p>
                        <button
                          style={{
                            padding: '12px 24px',
                            backgroundColor: colors.success,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          Create Signature
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {signatures.map(sig => {
                          const isSelected = selectedSignature === sig.id
                          return (
                            <div
                              key={sig.id}
                              onClick={() => setSelectedSignature(sig.id)}
                              style={{
                                padding: '20px',
                                border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                                borderRadius: '12px',
                                backgroundColor: isSelected ? `${colors.primary}10` : colors.card,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', ...text.primary }}>
                                  {sig.name}
                                </h3>
                                {isSelected && <Check style={{ width: '20px', height: '20px', color: colors.primary }} />}
                              </div>
                              <div style={{ ...text.secondary, fontStyle: 'italic', marginBottom: '8px' }}>
                                {sig.closing}
                              </div>
                              <div style={{ ...text.primary, fontWeight: '500' }}>
                                {sig.signature}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              style={{
                padding: '12px 24px',
                backgroundColor: currentStep === 1 ? colors.cardHover : colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                color: currentStep === 1 ? colors.text.tertiary : colors.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: currentStep === 1 ? 0.5 : 1
              }}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
              Back
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !selectedTemplate) ||
                  (currentStep === 2 && selectedFarms.length === 0) ||
                  (currentStep === 3 && !letterContent.trim())
                }
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
                  opacity: ((currentStep === 1 && !selectedTemplate) ||
                    (currentStep === 2 && selectedFarms.length === 0) ||
                    (currentStep === 3 && !letterContent.trim())) ? 0.5 : 1
                }}
              >
                Next
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            ) : (
              <button
                onClick={handleGenerateLetters}
                disabled={!selectedSignature}
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.success,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: !selectedSignature ? 0.5 : 1
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Generate Letters
              </button>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}

