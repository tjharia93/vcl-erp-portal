import type { ARSummary } from './types'

const rows = [
  { customer: 'Asha Industries', b0_30: 920_000, b31_60: 410_000, b61_90: 0, b90_plus: 0, total: 1_330_000 },
  { customer: 'Krishna Packaging Pvt Ltd', b0_30: 1_240_000, b31_60: 0, b61_90: 280_000, b90_plus: 110_000, total: 1_630_000 },
  { customer: 'Meridian Foods', b0_30: 540_000, b31_60: 320_000, b61_90: 180_000, b90_plus: 0, total: 1_040_000 },
  { customer: 'Northstar Beverages', b0_30: 410_000, b31_60: 0, b61_90: 0, b90_plus: 220_000, total: 630_000 },
  { customer: 'Pravin Pharma', b0_30: 1_580_000, b31_60: 740_000, b61_90: 0, b90_plus: 0, total: 2_320_000 },
]

export const ar: ARSummary = {
  erpnextTotal: rows.reduce((s, r) => s + r.total, 0),
  qboTotal: 6_812_000,
  rows,
}
