const formatThousandsRegex = /\B(?=(\d{3})+(?!\d))/g

export const normalizeNumericInput = (
  value: string,
  maxDecimalPlaces?: number,
): string => {
  if (!value) return ''

  const sanitized = value.replaceAll(',', '').replaceAll(' ', '')
  const isNegative = sanitized.startsWith('-')
  const unsigned = sanitized.replaceAll('-', '')
  const hasDecimalPoint = unsigned.includes('.')
  const [integerPartRaw, ...decimalParts] = unsigned.split('.')
  const integerPart = integerPartRaw.replaceAll(/\D/g, '')
  const decimalPart = decimalParts
    .join('')
    .replaceAll(/\D/g, '')
    .slice(0, maxDecimalPlaces)

  const keepsTrailingDot = hasDecimalPoint && maxDecimalPlaces !== 0

  if (!integerPart && hasDecimalPoint) {
    if (!decimalPart) return keepsTrailingDot ? `${isNegative ? '-' : ''}.` : ''
    return `${isNegative ? '-' : ''}.${decimalPart}`
  }

  const baseInteger =
    integerPart.length > 0 ? integerPart : decimalPart.length > 0 ? '0' : ''
  if (!baseInteger && !decimalPart) return ''

  const prefixedInteger = `${isNegative ? '-' : ''}${baseInteger}`
  if (!decimalPart)
    return keepsTrailingDot ? `${prefixedInteger}.` : prefixedInteger

  return `${prefixedInteger}.${decimalPart}`
}

/**
 * Formats a number with thousand separators, e.g. 99999999.99 -> "100,000,000"
 * (rounded to the given decimal places) or formatNumberThousands(44.567, 2) -> "44.57".
 * @param value - The number to format.
 * @param decimalPlaces - Decimal digits to round and pad to (default 0).
 */
export const formatNumberThousands = (
  value: number,
  decimalPlaces = 0,
): string =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)

export const formatNumericWithThousands = (raw: string): string => {
  if (!raw) return ''

  const isNegative = raw.startsWith('-')
  const unsigned = isNegative ? raw.slice(1) : raw
  const [integerPart, decimalPart] = unsigned.split('.')
  const formattedInteger = integerPart.replaceAll(formatThousandsRegex, ',')
  const prefixedInteger = `${isNegative ? '-' : ''}${formattedInteger}`

  if (decimalPart === undefined) return prefixedInteger

  return `${prefixedInteger}.${decimalPart}`
}
