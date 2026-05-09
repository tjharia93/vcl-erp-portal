export type Role = 'management' | 'sales-manager' | 'sales-rep'

export type SourceTag = 'ERPNEXT' | 'QBO' | 'ERPNEXT + QBO'

export type DeltaDirection = 'up' | 'down' | 'flat'

export interface Kpi {
  id: string
  label: string
  value: string
  delta: string
  deltaDirection: DeltaDirection
  source: SourceTag
}

export interface CashSnapshot {
  asOf: string
  erpnext: number
  qbo: number
  driftAbs: number
  driftPct: number
  alertThresholdPct: number
}

export interface ARRow {
  customer: string
  b0_30: number
  b31_60: number
  b61_90: number
  b90_plus: number
  total: number
}

export interface ARSummary {
  erpnextTotal: number
  qboTotal: number
  rows: ARRow[]
}

export interface RevenueTarget {
  period: string
  achieved: number
  target: number
  pct: number
  status: 'on-track' | 'behind'
}

export type StockSeverity = 'OK' | 'LOW' | 'CRITICAL'

export interface StockItem {
  sku: string
  name: string
  onHand: number
  reorder: number
  pct: number
  severity: StockSeverity
}

export type MachineState = 'RUNNING' | 'IDLE' | 'DOWN'

export interface MachineStatus {
  id: string
  name: string
  oee: number
  status: MachineState
}

// Sales

export interface RepRow {
  rep: string
  target: number
  achieved: number
  achievementPct: number
}

export interface PipelineDeal {
  deal: string
  customer: string
  stage: 'Qualified' | 'Proposal' | 'Negotiation' | 'Closing'
  value: number
  expectedClose: string
}

export interface OrderRow {
  number: string
  customer: string
  value: number
  status: 'Confirmed' | 'In Production' | 'Dispatched' | 'Pending'
  date: string
}

export interface MyARRow {
  customer: string
  outstanding: number
  daysOverdue: number
}

export interface PersonalTarget {
  rep: string
  period: string
  target: number
  achieved: number
  pct: number
  status: 'on-track' | 'behind'
}
