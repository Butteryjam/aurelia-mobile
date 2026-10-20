/**
 * Aurelia Mobile — Dynamic Recipe Quantity Scaler
 *
 * Scales ingredient quantities based on base and target servings.
 * Preserves fractions, decimals, mixed numbers, and non-numeric modifiers.
 */

const FRACTIONS: [number, string][] = [
  [1 / 8, '1/8'],
  [1 / 4, '1/4'],
  [1 / 3, '1/3'],
  [3 / 8, '3/8'],
  [1 / 2, '1/2'],
  [5 / 8, '5/8'],
  [2 / 3, '2/3'],
  [3 / 4, '3/4'],
  [7 / 8, '7/8'],
]

function formatNumberToCookingAmount(value: number): string {
  if (value <= 0) return '0'

  const roundedInt = Math.round(value)
  if (Math.abs(value - roundedInt) < 0.02) {
    return roundedInt.toString()
  }

  const whole = Math.floor(value)
  const remainder = value - whole

  for (const [fracVal, fracStr] of FRACTIONS) {
    if (Math.abs(remainder - fracVal) < 0.035) {
      return whole > 0 ? `${whole} ${fracStr}` : fracStr
    }
  }

  if (Math.abs(remainder - 1) < 0.035) {
    return (whole + 1).toString()
  }

  const rounded = Math.round(value * 100) / 100
  return rounded.toString()
}

function parseQuantity(raw: string): { value: number; trailingText: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // 1. Mixed fraction: "1 1/2" or "2 3/4"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)(.*)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10)
    const num = parseInt(mixedMatch[2], 10)
    const den = parseInt(mixedMatch[3], 10)
    if (den !== 0) {
      return {
        value: whole + num / den,
        trailingText: mixedMatch[4]?.trim() ?? '',
      }
    }
  }

  // 2. Simple fraction: "1/2" or "3/4"
  const fracMatch = trimmed.match(/^(\d+)\/(\d+)(.*)$/)
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10)
    const den = parseInt(fracMatch[2], 10)
    if (den !== 0) {
      return {
        value: num / den,
        trailingText: fracMatch[3]?.trim() ?? '',
      }
    }
  }

  // 3. Decimal or integer: "2", "2.5", "250"
  const decimalMatch = trimmed.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (decimalMatch) {
    const val = parseFloat(decimalMatch[1])
    if (!isNaN(val)) {
      return {
        value: val,
        trailingText: decimalMatch[2]?.trim() ?? '',
      }
    }
  }

  return null
}

export function scaleQuantity(
  quantity: string | null | undefined,
  baseServings: number | null | undefined,
  targetServings: number
): string {
  if (!quantity) return ''
  if (!baseServings || baseServings <= 0 || targetServings <= 0 || baseServings === targetServings) {
    return quantity
  }

  const parsed = parseQuantity(quantity)
  if (!parsed) {
    return quantity
  }

  const factor = targetServings / baseServings
  const scaledValue = parsed.value * factor
  const formatted = formatNumberToCookingAmount(scaledValue)

  if (parsed.trailingText) {
    return `${formatted} ${parsed.trailingText}`
  }

  return formatted
}
