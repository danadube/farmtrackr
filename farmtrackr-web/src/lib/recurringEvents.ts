/**
 * Recurring events helper functions
 * Handles RRULE generation and parsing for recurring calendar events
 */

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export type RecurrenceRule = {
  frequency: RecurrenceFrequency
  interval: number // e.g., every 2 weeks = interval: 2
  count?: number // Number of occurrences
  until?: Date // End date
  byDay?: string[] // e.g., ['MO', 'WE', 'FR'] for Monday, Wednesday, Friday
  byMonth?: number[] // e.g., [1, 3, 5] for January, March, May
  byMonthDay?: number[] // e.g., [1, 15] for 1st and 15th of month
}

/**
 * Generate RRULE string from recurrence rule
 * Follows RFC 5545 standard
 */
export function generateRRULE(rule: RecurrenceRule): string {
  const parts: string[] = []

  // Frequency (required)
  parts.push(`FREQ=${rule.frequency}`)

  // Interval
  if (rule.interval && rule.interval > 1) {
    parts.push(`INTERVAL=${rule.interval}`)
  }

  // Count or Until
  if (rule.count) {
    parts.push(`COUNT=${rule.count}`)
  } else if (rule.until) {
    parts.push(`UNTIL=${rule.until.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`)
  }

  // ByDay (e.g., MO, TU, WE, TH, FR, SA, SU)
  if (rule.byDay && rule.byDay.length > 0) {
    parts.push(`BYDAY=${rule.byDay.join(',')}`)
  }

  // ByMonth (1-12)
  if (rule.byMonth && rule.byMonth.length > 0) {
    parts.push(`BYMONTH=${rule.byMonth.join(',')}`)
  }

  // ByMonthDay (1-31)
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`)
  }

  return parts.join(';')
}

/**
 * Parse RRULE string into RecurrenceRule object
 */
export function parseRRULE(rrule: string): RecurrenceRule | null {
  try {
    const parts = rrule.split(';')
    const rule: Partial<RecurrenceRule> = {}

    for (const part of parts) {
      const [key, value] = part.split('=')
      if (!key || !value) continue

      switch (key) {
        case 'FREQ':
          rule.frequency = value as RecurrenceFrequency
          break
        case 'INTERVAL':
          rule.interval = parseInt(value, 10)
          break
        case 'COUNT':
          rule.count = parseInt(value, 10)
          break
        case 'UNTIL':
          // Parse ISO date format
          const dateStr = value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
          rule.until = new Date(dateStr)
          break
        case 'BYDAY':
          rule.byDay = value.split(',')
          break
        case 'BYMONTH':
          rule.byMonth = value.split(',').map((v) => parseInt(v, 10))
          break
        case 'BYMONTHDAY':
          rule.byMonthDay = value.split(',').map((v) => parseInt(v, 10))
          break
      }
    }

    if (!rule.frequency) {
      return null
    }

    return {
      frequency: rule.frequency,
      interval: rule.interval || 1,
      count: rule.count,
      until: rule.until,
      byDay: rule.byDay,
      byMonth: rule.byMonth,
      byMonthDay: rule.byMonthDay,
    }
  } catch (error) {
    console.error('Failed to parse RRULE:', error)
    return null
  }
}

/**
 * Generate recurring event instances from a base event
 */
export function generateRecurringInstances(
  startDate: Date,
  endDate: Date,
  rule: RecurrenceRule,
  maxInstances: number = 100
): Array<{ start: Date; end: Date }> {
  const instances: Array<{ start: Date; end: Date }> = []
  const duration = endDate.getTime() - startDate.getTime()

  let currentDate = new Date(startDate)
  let instanceCount = 0

  while (instanceCount < maxInstances) {
    // Check if we've exceeded count or until date
    if (rule.count && instanceCount >= rule.count) {
      break
    }
    if (rule.until && currentDate > rule.until) {
      break
    }

    // Check if current date matches recurrence pattern
    if (matchesRecurrencePattern(currentDate, startDate, rule)) {
      const instanceEnd = new Date(currentDate.getTime() + duration)
      instances.push({
        start: new Date(currentDate),
        end: instanceEnd,
      })
      instanceCount++
    }

    // Move to next potential occurrence
    currentDate = getNextOccurrenceDate(currentDate, rule)
  }

  return instances
}

/**
 * Check if a date matches the recurrence pattern
 */
function matchesRecurrencePattern(date: Date, startDate: Date, rule: RecurrenceRule): boolean {
  // Check byDay
  if (rule.byDay && rule.byDay.length > 0) {
    const dayOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()]
    if (!rule.byDay.includes(dayOfWeek)) {
      return false
    }
  }

  // Check byMonth
  if (rule.byMonth && rule.byMonth.length > 0) {
    const month = date.getMonth() + 1 // JavaScript months are 0-indexed
    if (!rule.byMonth.includes(month)) {
      return false
    }
  }

  // Check byMonthDay
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    const day = date.getDate()
    if (!rule.byMonthDay.includes(day)) {
      return false
    }
  }

  // Check interval
  if (rule.interval && rule.interval > 1) {
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    switch (rule.frequency) {
      case 'DAILY':
        if (daysDiff % rule.interval !== 0) return false
        break
      case 'WEEKLY':
        if (Math.floor(daysDiff / 7) % rule.interval !== 0) return false
        break
      case 'MONTHLY':
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth())
        if (monthsDiff % rule.interval !== 0) return false
        break
      case 'YEARLY':
        const yearsDiff = date.getFullYear() - startDate.getFullYear()
        if (yearsDiff % rule.interval !== 0) return false
        break
    }
  }

  return true
}

/**
 * Get the next potential occurrence date based on recurrence rule
 */
function getNextOccurrenceDate(currentDate: Date, rule: RecurrenceRule): Date {
  const next = new Date(currentDate)

  switch (rule.frequency) {
    case 'DAILY':
      next.setDate(next.getDate() + (rule.interval || 1))
      break
    case 'WEEKLY':
      next.setDate(next.getDate() + 7 * (rule.interval || 1))
      break
    case 'MONTHLY':
      next.setMonth(next.getMonth() + (rule.interval || 1))
      break
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + (rule.interval || 1))
      break
  }

  return next
}

/**
 * Get human-readable description of recurrence rule
 */
export function getRecurrenceDescription(rule: RecurrenceRule): string {
  const parts: string[] = []

  // Frequency description
  const frequencyDesc = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
  }[rule.frequency]

  if (rule.interval && rule.interval > 1) {
    parts.push(`Every ${rule.interval} ${frequencyDesc.toLowerCase()}`)
  } else {
    parts.push(frequencyDesc)
  }

  // ByDay
  if (rule.byDay && rule.byDay.length > 0) {
    const dayNames: Record<string, string> = {
      SU: 'Sunday',
      MO: 'Monday',
      TU: 'Tuesday',
      WE: 'Wednesday',
      TH: 'Thursday',
      FR: 'Friday',
      SA: 'Saturday',
    }
    const days = rule.byDay.map((d) => dayNames[d] || d).join(', ')
    parts.push(`on ${days}`)
  }

  // ByMonthDay
  if (rule.byMonthDay && rule.byMonthDay.length > 0) {
    const days = rule.byMonthDay.map((d) => {
      const suffix = d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th'
      return `${d}${suffix}`
    }).join(', ')
    parts.push(`on the ${days}`)
  }

  // Count or Until
  if (rule.count) {
    parts.push(`(${rule.count} occurrences)`)
  } else if (rule.until) {
    parts.push(`until ${rule.until.toLocaleDateString()}`)
  }

  return parts.join(' ')
}

