/**
 * Utility functions for formatting contact data
 */

/**
 * Formats a phone number to (XXX) XXX-XXXX format
 * Handles various input formats: (555)123-4567, 5551234567, 555-123-4567, etc.
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // If it's exactly 10 digits, format as (XXX) XXX-XXXX
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
  }
  
  // If it's 11 digits and starts with 1, format as 1 (XXX) XXX-XXXX
  if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
    return `1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`
  }
  
  // If it's not a standard format, return as-is (but cleaned)
  return digitsOnly
}

/**
 * Formats city, state, and zip code as "City, State ZIP" (comma after city, no comma after state)
 */
export function formatCityStateZip(
  city: string | undefined | null,
  state: string | undefined | null,
  zipCode: number | undefined | null
): string {
  const parts: string[] = []
  
  // City with comma if state or zip exists
  if (city) {
    if (state || zipCode) {
      parts.push(`${city},`)
    } else {
      parts.push(city)
    }
  }
  
  // State and ZIP together (space between them)
  if (state && zipCode) {
    parts.push(`${state} ${zipCode}`)
  } else if (state) {
    parts.push(state)
  } else if (zipCode) {
    parts.push(zipCode.toString())
  }
  
  // Join parts with spaces
  return parts.join(' ')
}

