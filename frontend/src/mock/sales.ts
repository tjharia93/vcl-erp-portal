import type {
  MyARRow,
  OrderRow,
  PersonalTarget,
  PipelineDeal,
  RepRow,
} from './types'

export const teamVsTarget: RepRow[] = [
  { rep: 'Rohan Mehta', target: 9_000_000, achieved: 7_640_000, achievementPct: 85 },
  { rep: 'Priya Shah', target: 8_500_000, achieved: 6_120_000, achievementPct: 72 },
  { rep: 'Vikram Iyer', target: 7_500_000, achieved: 7_840_000, achievementPct: 105 },
  { rep: 'Neha Kulkarni', target: 6_000_000, achieved: 3_180_000, achievementPct: 53 },
  { rep: 'Arjun Desai', target: 7_000_000, achieved: 5_410_000, achievementPct: 77 },
]

export const repProgress = teamVsTarget.map(({ rep, achievementPct }) => ({
  rep,
  pct: achievementPct,
}))

export const pipeline: PipelineDeal[] = [
  { deal: 'D-2041', customer: 'Asha Industries', stage: 'Negotiation', value: 1_850_000, expectedClose: '2026-05-22' },
  { deal: 'D-2046', customer: 'Krishna Packaging', stage: 'Proposal', value: 920_000, expectedClose: '2026-05-30' },
  { deal: 'D-2052', customer: 'Northstar Beverages', stage: 'Closing', value: 3_400_000, expectedClose: '2026-05-15' },
  { deal: 'D-2058', customer: 'Meridian Foods', stage: 'Qualified', value: 640_000, expectedClose: '2026-06-12' },
  { deal: 'D-2061', customer: 'Pravin Pharma', stage: 'Proposal', value: 2_120_000, expectedClose: '2026-06-04' },
]

export const personalTarget: PersonalTarget = {
  rep: 'Rohan Mehta',
  period: 'May 2026',
  target: 9_000_000,
  achieved: 7_640_000,
  pct: 85,
  status: 'on-track',
}

export const myOrders: OrderRow[] = [
  { number: 'SO-7841', customer: 'Asha Industries', value: 612_000, status: 'In Production', date: '2026-05-04' },
  { number: 'SO-7855', customer: 'Krishna Packaging', value: 248_000, status: 'Confirmed', date: '2026-05-06' },
  { number: 'SO-7860', customer: 'Pravin Pharma', value: 1_140_000, status: 'Dispatched', date: '2026-05-02' },
  { number: 'SO-7872', customer: 'Northstar Beverages', value: 380_000, status: 'Pending', date: '2026-05-08' },
  { number: 'SO-7878', customer: 'Meridian Foods', value: 905_000, status: 'In Production', date: '2026-05-08' },
]

export const myAR: MyARRow[] = [
  { customer: 'Asha Industries', outstanding: 920_000, daysOverdue: 12 },
  { customer: 'Krishna Packaging', outstanding: 410_000, daysOverdue: 0 },
  { customer: 'Pravin Pharma', outstanding: 1_580_000, daysOverdue: 38 },
  { customer: 'Northstar Beverages', outstanding: 220_000, daysOverdue: 92 },
  { customer: 'Meridian Foods', outstanding: 540_000, daysOverdue: 4 },
]
