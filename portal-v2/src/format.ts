export function formatINR(value: number, opts: { compact?: boolean } = {}): string {
  const { compact = false } = opts
  if (compact) {
    if (Math.abs(value) >= 1e7) return `₹ ${(value / 1e7).toFixed(2)} Cr`
    if (Math.abs(value) >= 1e5) return `₹ ${(value / 1e5).toFixed(2)} L`
    if (Math.abs(value) >= 1000) return `₹ ${(value / 1000).toFixed(1)}k`
    return `₹ ${value.toLocaleString('en-IN')}`
  }
  return `₹ ${value.toLocaleString('en-IN')}`
}

export function formatPct(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}
