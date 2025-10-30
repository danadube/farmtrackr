// Assign consistent colors to farms based on their names
// Uses a hash function to ensure the same farm always gets the same color

const FARM_COLORS = [
  // Green palette (for farms/growth theme)
  { bg: '#10b981', text: '#ffffff', border: '#059669' }, // emerald-500
  { bg: '#059669', text: '#ffffff', border: '#047857' }, // emerald-600
  { bg: '#34d399', text: '#064e3b', border: '#10b981' }, // emerald-400
  { bg: '#047857', text: '#ffffff', border: '#065f46' }, // emerald-700
  // Blue palette
  { bg: '#3b82f6', text: '#ffffff', border: '#2563eb' }, // blue-500
  { bg: '#2563eb', text: '#ffffff', border: '#1d4ed8' }, // blue-600
  { bg: '#60a5fa', text: '#1e3a8a', border: '#3b82f6' }, // blue-400
  // Purple palette
  { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' }, // violet-500
  { bg: '#7c3aed', text: '#ffffff', border: '#6d28d9' }, // violet-600
  // Amber/Orange palette
  { bg: '#f59e0b', text: '#ffffff', border: '#d97706' }, // amber-500
  { bg: '#fb923c', text: '#78350f', border: '#f59e0b' }, // orange-400
  // Teal/Cyan palette
  { bg: '#14b8a6', text: '#ffffff', border: '#0d9488' }, // teal-500
  { bg: '#06b6d4', text: '#ffffff', border: '#0891b2' }, // cyan-500
  // Rose/Pink palette
  { bg: '#ec4899', text: '#ffffff', border: '#db2777' }, // pink-500
  { bg: '#f43f5e', text: '#ffffff', border: '#e11d48' }, // rose-500
]

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
  
  const hash = hashFarm(farmName)
  const colorIndex = hash % FARM_COLORS.length
  return FARM_COLORS[colorIndex]
}

