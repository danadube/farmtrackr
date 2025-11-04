// HSB/HSV color helpers

export interface HSB {
  h: number // 0-360
  s: number // 0-100
  b: number // 0-100
}

export function hsbToHex({ h, s, b }: HSB): string {
  const S = Math.min(100, Math.max(0, s)) / 100
  const V = Math.min(100, Math.max(0, b)) / 100
  const C = V * S
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = V - C
  let r = 0, g = 0, bl = 0

  if (h >= 0 && h < 60) { r = C; g = X; bl = 0 }
  else if (h >= 60 && h < 120) { r = X; g = C; bl = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = C; bl = X }
  else if (h >= 180 && h < 240) { r = 0; g = X; bl = C }
  else if (h >= 240 && h < 300) { r = X; g = 0; bl = C }
  else { r = C; g = 0; bl = X }

  const R = Math.round((r + m) * 255)
  const G = Math.round((g + m) * 255)
  const B = Math.round((bl + m) * 255)

  return `#${[R, G, B]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`
}

export function hexToHsb(hex: string): HSB {
  const value = hex.replace('#', '')
  const bigint = parseInt(value, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255

  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === R) h = 60 * (((G - B) / delta) % 6)
    else if (max === G) h = 60 * ((B - R) / delta + 2)
    else h = 60 * ((R - G) / delta + 4)
  }
  if (h < 0) h += 360

  const s = max === 0 ? 0 : (delta / max) * 100
  const v = max * 100

  return { h, s, b: v }
}


