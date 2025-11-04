// Address casing utilities

const ALWAYS_UPPER = new Set([
  'PO', 'P.O.', 'BOX', 'APT', 'STE', 'UNIT', 'BLDG', 'DEPT', 'FL', 'RM', '#',
  'N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW',
])

const ALWAYS_LOWER = new Set(['and', 'or', 'of'])

function titleCaseWord(word: string): string {
  if (!word) return word
  const lower = word.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function smartCaseToken(token: string): string {
  if (!token) return token

  // Preserve numbers and pure punctuation
  if (/^\d+[a-zA-Z]?$/.test(token)) return token.toUpperCase()

  // Keep directional and unit tokens uppercase
  const upper = token.toUpperCase()
  if (ALWAYS_UPPER.has(upper)) return upper

  // Handle hyphenated words (e.g., SAINT-MICHAELS)
  if (token.includes('-')) {
    return token
      .split('-')
      .map((part) => smartCaseToken(part))
      .join('-')
  }

  const lower = token.toLowerCase()
  if (ALWAYS_LOWER.has(lower)) return lower

  // Common street suffixes should be title-cased
  return titleCaseWord(token)
}

function isAllCaps(value: string | undefined | null): boolean {
  if (!value) return false
  const hasLetters = /[A-Z]/i.test(value)
  return hasLetters && value === value.toUpperCase()
}

export function normalizeAddressCasing(value: string | undefined | null): string | undefined {
  if (!value) return value || undefined
  if (!isAllCaps(value)) return value
  return value
    .split(/\s+/)
    .map((t) => smartCaseToken(t))
    .join(' ')
}

export function normalizeCityCasing(value: string | undefined | null): string | undefined {
  if (!value) return value || undefined
  if (!isAllCaps(value)) return value
  // City names: title-case each token, keep hyphen/space separated parts sensible
  return value
    .split(/\s+/)
    .map((t) => {
      if (!t) return t
      if (ALWAYS_UPPER.has(t.toUpperCase())) return t.toUpperCase()
      if (t.includes('-')) return t.split('-').map(titleCaseWord).join('-')
      return titleCaseWord(t)
    })
    .join(' ')
}


