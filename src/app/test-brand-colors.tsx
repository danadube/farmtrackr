// Temporary test component to verify brand colors are working
// This can be added to any page to debug color issues

'use client'

import { useThemeStyles } from '@/hooks/useThemeStyles'

export function BrandColorTest() {
  const { colors, headerCard, headerTint } = useThemeStyles()
  
  return (
    <div style={{ padding: '20px', background: '#f5f5f7' }}>
      <h2>Brand Color Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Theme Colors:</h3>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          {JSON.stringify({
            primary: colors.primary,
            primaryHover: colors.primaryHover,
            success: colors.success,
            warning: colors.warning,
            info: colors.info,
          }, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Header Card Styles:</h3>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          {JSON.stringify(headerCard, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Header Tint (Primary):</h3>
        <pre style={{ background: '#fff', padding: '10px', borderRadius: '8px' }}>
          {JSON.stringify(headerTint(colors.primary), null, 2)}
        </pre>
      </div>
      
      <div style={{ ...headerCard, padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ color: '#fff', margin: 0 }}>Header Card Test</h3>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0' }}>
          This should have a green gradient background
        </p>
      </div>
      
      <div style={{ ...headerTint(colors.primary), padding: '20px' }}>
        <h3 style={{ color: '#fff', margin: 0 }}>Header Tint Test</h3>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '8px 0 0 0' }}>
          This should also have a green gradient background
        </p>
      </div>
    </div>
  )
}

