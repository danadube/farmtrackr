// Normalize farm names to their full/correct form
const FARM_NAME_MAP: Record<string, string> = {
  'Presidential': 'Presidential Estates',
  'presidential': 'Presidential Estates',
  'PRESIDENTIAL': 'Presidential Estates',
  'Santo Tomas': 'Santo Tomas',
  'Santo_Tomas': 'Santo Tomas',
  'santo tomas': 'Santo Tomas',
  'Victoria Falls': 'Victoria Falls',
  'Victoria_Falls': 'Victoria Falls',
  'victoria falls': 'Victoria Falls',
}

/**
 * Normalizes a farm name to its standard full form
 * @param farmName - The farm name to normalize
 * @returns The normalized farm name, or the original if no mapping exists
 */
export function normalizeFarmName(farmName: string | null | undefined): string {
  if (!farmName) return ''
  
  // Check exact match first (case-sensitive)
  if (FARM_NAME_MAP[farmName]) {
    return FARM_NAME_MAP[farmName]
  }
  
  // Check case-insensitive match
  const normalized = Object.keys(FARM_NAME_MAP).find(
    key => key.toLowerCase() === farmName.toLowerCase()
  )
  
  return normalized ? FARM_NAME_MAP[normalized] : farmName
}

/**
 * Gets the display letter for a contact's icon badge
 * Priority: Farm first letter > Organization first letter > Name initials
 */
export function getContactBadgeLetter(contact: {
  farm?: string | null
  organizationName?: string | null
  firstName?: string | null
  lastName?: string | null
}): string {
  if (contact.farm) {
    return contact.farm[0].toUpperCase()
  }
  if (contact.organizationName) {
    return contact.organizationName[0].toUpperCase()
  }
  const first = contact.firstName?.[0] || ''
  const last = contact.lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

