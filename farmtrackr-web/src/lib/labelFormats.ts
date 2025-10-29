// Avery label format specifications
// All dimensions in inches, converted to points (1 inch = 72 points)
// Sheet size: 8.5" x 11" (612 x 792 points)

export interface AveryLabelFormat {
  id: string
  name: string
  labelWidth: number // in points (72 points = 1 inch)
  labelHeight: number // in points
  columns: number // number of labels per row
  rows: number // number of labels per column
  labelsPerSheet: number
  marginTop: number // top margin in points
  marginLeft: number // left margin in points
  gapHorizontal: number // horizontal gap between labels in points
  gapVertical: number // vertical gap between labels in points
}

// Standard Avery label formats
export const AVERY_FORMATS: Record<string, AveryLabelFormat> = {
  '5160': {
    id: '5160',
    name: 'Avery 5160 (1" x 2.625")',
    labelWidth: 189, // 2.625 inches = 189 points exactly
    labelHeight: 72, // 1 inch = 72 points
    columns: 3,
    rows: 10,
    labelsPerSheet: 30,
    marginTop: 30, // Adjusted (0.42") to move labels down - about 2 letter heights
    marginLeft: 13.5, // 0.1875 inch (3/16") left margin - Avery standard
    gapHorizontal: 9, // 0.125 inch gap between columns - calculated for perfect fit
    gapVertical: 0, // no vertical gap (labels touch)
  },
  '5161': {
    id: '5161',
    name: 'Avery 5161 (1" x 4")',
    labelWidth: 288, // 4 inches = 288 points
    labelHeight: 72, // 1 inch = 72 points
    columns: 2,
    rows: 10,
    labelsPerSheet: 20,
    marginTop: 36,
    marginLeft: 36,
    gapHorizontal: 9,
    gapVertical: 0,
  },
  '5162': {
    id: '5162',
    name: 'Avery 5162 (1.33" x 4")',
    labelWidth: 288, // 4 inches = 288 points
    labelHeight: 96, // 1.33 inches = 96 points
    columns: 2,
    rows: 7,
    labelsPerSheet: 14,
    marginTop: 36,
    marginLeft: 36,
    gapHorizontal: 9,
    gapVertical: 0,
  },
  '5163': {
    id: '5163',
    name: 'Avery 5163 (2" x 4")',
    labelWidth: 288, // 4 inches = 288 points
    labelHeight: 144, // 2 inches = 144 points
    columns: 2,
    rows: 5,
    labelsPerSheet: 10,
    marginTop: 36,
    marginLeft: 36,
    gapHorizontal: 9,
    gapVertical: 0,
  },
  '5164': {
    id: '5164',
    name: 'Avery 5164 (3.33" x 4")',
    labelWidth: 288, // 4 inches = 288 points
    labelHeight: 240, // 3.33 inches = 240 points
    columns: 2,
    rows: 3,
    labelsPerSheet: 6,
    marginTop: 36,
    marginLeft: 36,
    gapHorizontal: 9,
    gapVertical: 0,
  },
  '5167': {
    id: '5167',
    name: 'Avery 5167 (0.5" x 1.75")',
    labelWidth: 126, // 1.75 inches = 126 points
    labelHeight: 36, // 0.5 inch = 36 points
    columns: 4,
    rows: 20,
    labelsPerSheet: 80,
    marginTop: 36,
    marginLeft: 36,
    gapHorizontal: 9,
    gapVertical: 0,
  },
}

export type LabelFormatId = keyof typeof AVERY_FORMATS

export function getLabelFormat(id: LabelFormatId): AveryLabelFormat {
  return AVERY_FORMATS[id] || AVERY_FORMATS['5160']
}

// Calculate label position (column-major order: top to bottom, then left to right)
export function calculateLabelPosition(
  index: number,
  format: AveryLabelFormat
): { top: number; left: number } {
  // Column-major: fill first column, then second, etc.
  const column = Math.floor(index / format.rows)
  const row = index % format.rows

  const left = format.marginLeft + column * (format.labelWidth + format.gapHorizontal)
  const top = format.marginTop + row * (format.labelHeight + format.gapVertical)

  return { top, left }
}

// Format address for label printing
export function formatAddressForLabel(
  contact: {
    firstName: string
    lastName: string
    mailingAddress?: string | null
    city?: string | null
    state?: string | null
    zipCode?: number | null
    siteMailingAddress?: string | null
    siteCity?: string | null
    siteState?: string | null
    siteZipCode?: number | null
  },
  addressType: 'mailing' | 'site'
): string[] {
  const lines: string[] = []

  // Name
  const fullName = `${contact.firstName} ${contact.lastName}`.trim()
  if (fullName) {
    lines.push(fullName)
  }

  // Address
  if (addressType === 'mailing') {
    if (contact.mailingAddress) {
      lines.push(contact.mailingAddress)
    }
    const cityStateZip = [contact.city, contact.state, contact.zipCode?.toString()]
      .filter(Boolean)
      .join(', ')
    if (cityStateZip) {
      lines.push(cityStateZip)
    }
  } else {
    // Site address
    if (contact.siteMailingAddress) {
      lines.push(contact.siteMailingAddress)
    }
    const cityStateZip = [
      contact.siteCity,
      contact.siteState,
      contact.siteZipCode?.toString(),
    ]
      .filter(Boolean)
      .join(', ')
    if (cityStateZip) {
      lines.push(cityStateZip)
    }
  }

  const result = lines.filter(Boolean)
  // Always return at least the name, even if address is missing
  if (result.length === 0 && fullName) {
    return [fullName]
  }
  return result
}

