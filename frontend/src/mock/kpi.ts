import type { Kpi } from './types'

export const kpis: Kpi[] = [
  {
    id: 'revenue-mtd',
    label: 'Revenue MTD',
    value: '₹ 4.82 Cr',
    delta: '+12.4% vs LM',
    deltaDirection: 'up',
    source: 'ERPNEXT',
  },
  {
    id: 'cash-position',
    label: 'Cash Position',
    value: '₹ 1.42 Cr',
    delta: '−2.1% drift',
    deltaDirection: 'down',
    source: 'ERPNEXT',
  },
  {
    id: 'ar-outstanding',
    label: 'AR Outstanding',
    value: '₹ 3.16 Cr',
    delta: '+₹ 18 L vs LM',
    deltaDirection: 'up',
    source: 'ERPNEXT',
  },
  {
    id: 'gross-margin',
    label: 'Gross Margin',
    value: '27.6%',
    delta: '+0.8 pp',
    deltaDirection: 'up',
    source: 'ERPNEXT',
  },
]
