// Assign consistent colors to farms based on their names
// Uses a hash function + HSL generation to ensure the same farm always gets the same color,
// while minimizing collisions across many farms.

import { normalizeFarmName } from './farmNames'

// Hash function to convert farm name to a consistent number
function hashFarm(farmName: string): number {
  let hash = 0
  for (let i = 0; i < farmName.length; i++) {
    const char = farmName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getFarmColor(farmName: string | null | undefined): { bg: string; text: string; border: string } {
  if (!farmName) {
    return { bg: '#6b7280', text: '#ffffff', border: '#4b5563' } // gray-500 fallback
  }

  // Normalize farm name first to ensure consistent colors
  const normalized = normalizeFarmName(farmName)
  const hash = hashFarm(normalized)

  // Derive HSL values from hash for a wide color gamut
  // Hue: 0..360, Saturation: 60-70%, Lightness: 40-50%
  const hue = hash % 360
  const saturation = 60 + (hash % 11) // 60..70
  const lightness = 42 + (Math.floor(hash / 7) % 7) // 42..48

  const bg = `hsl(${hue}, ${saturation}%, ${lightness}%)`
  const border = `hsl(${hue}, ${Math.min(saturation + 5, 80)}%, ${Math.max(lightness - 8, 28)}%)`
  const text = '#ffffff'

  return { bg, text, border }
}

