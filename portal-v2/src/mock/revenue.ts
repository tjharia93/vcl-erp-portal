import type { RevenueTarget } from './types'

const achieved = 48_200_000
const target = 65_000_000
const pct = Math.round((achieved / target) * 1000) / 10

export const revenue: RevenueTarget = {
  period: 'May 2026',
  achieved,
  target,
  pct,
  status: pct >= 75 ? 'on-track' : 'behind',
}
