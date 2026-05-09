import type { StockItem } from './types'

function severity(pct: number): StockItem['severity'] {
  if (pct < 25) return 'CRITICAL'
  if (pct < 60) return 'LOW'
  return 'OK'
}

const raw = [
  { sku: 'BOPP-22-1250', name: 'BOPP Film 22µ × 1250mm', onHand: 1_240, reorder: 4_000 },
  { sku: 'INK-CYAN-FX', name: 'Cyan Process Ink (FX)', onHand: 18, reorder: 60 },
  { sku: 'ADH-PU-2K', name: 'Adhesive PU 2K (kg)', onHand: 320, reorder: 500 },
  { sku: 'CORE-76-PAPER', name: 'Paper Core 76mm', onHand: 4_800, reorder: 6_000 },
  { sku: 'PE-LAM-30', name: 'PE Lamination 30µ', onHand: 90, reorder: 800 },
]

export const stock: StockItem[] = raw.map((item) => {
  const pct = Math.min(100, Math.round((item.onHand / item.reorder) * 100))
  return { ...item, pct, severity: severity(pct) }
})
