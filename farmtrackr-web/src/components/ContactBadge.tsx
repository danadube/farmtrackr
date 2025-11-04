import React from 'react'
import { getFarmColor } from '@/lib/farmColors'
import { normalizeFarmName, getContactBadgeLetter } from '@/lib/farmNames'

export interface ContactBadgeProps {
  contact: {
    farm?: string | null
    organizationName?: string | null
    firstName?: string | null
    lastName?: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  shape?: 'circle' | 'rounded'
}

export function ContactBadge({ contact, size = 'md', shape = 'circle' }: ContactBadgeProps) {
  const farmName = contact.farm ? normalizeFarmName(contact.farm) : null
  const farmColor = farmName ? getFarmColor(farmName) : { bg: undefined, border: undefined, text: undefined } as any
  const letter = getContactBadgeLetter(contact)

  const px = size === 'lg' ? 64 : size === 'sm' ? 32 : 40
  const radius = shape === 'circle' ? '50%' : '12px'

  return (
    <div 
      style={{
        width: `${px}px`,
        height: `${px}px`,
        backgroundColor: farmColor.bg || undefined,
        border: farmColor.border ? `2px solid ${farmColor.border}` : undefined,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <span style={{ fontSize: size === 'lg' ? '28px' : size === 'sm' ? '12px' : '14px', fontWeight: 700, color: farmColor.text || '#16a34a' }}>
        {letter}
      </span>
    </div>
  )
}
