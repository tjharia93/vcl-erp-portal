import type { CashSnapshot } from './types'

const erpnext = 14_215_000
const qbo = 13_910_000
const driftAbs = erpnext - qbo
const driftPct = (driftAbs / erpnext) * 100

export const cash: CashSnapshot = {
  asOf: '2026-05-09 09:30 IST',
  erpnext,
  qbo,
  driftAbs,
  driftPct,
  alertThresholdPct: 1,
}
