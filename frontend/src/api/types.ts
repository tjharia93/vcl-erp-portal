// Response shapes for the whitelisted methods we call from the React app.
// Mirrors vcl_portal/api.py and vcl_portal/qbo_api.py — keep in sync.

export interface FinanceKpisResp {
  total_ar: number | null
  total_ap: number | null
  cash_balance: number | null
  vat_payable: number | null
  vat_payable_note?: string
  _ar_error?: string
  _ap_error?: string
  _cash_error?: string
}

export interface SalesKpisResp {
  mtd_revenue: number
  open_sos: number
  overdue_ar: number
  customers: number
  _rev_error?: string
}

export interface SalesAgeingRow {
  customer: string
  b_0_30: number
  b_31_60: number
  b_61_90: number
  b_90_plus: number
  total: number
}

export interface StockAlertRow {
  item_code: string
  item_name?: string
  warehouse?: string
  actual_qty: number
  reserved_qty?: number
  reorder_level?: number
  uom?: string
}

export interface JobCardRow {
  name: string
  workstation?: string
  operation?: string
  status: string
  for_quantity?: number
  total_completed_qty?: number
}

export interface RepPerformanceRow {
  rep: string
  target?: number
  achieved?: number
  achievement_pct?: number
}

export interface SalesManagerView {
  pipeline?: PipelineRow[]
  team?: RepPerformanceRow[]
}

export interface PipelineRow {
  name: string
  customer?: string
  status?: string
  grand_total?: number
  transaction_date?: string
  delivery_date?: string
}

export interface OpenSalesInvoiceRow {
  name: string
  customer?: string
  posting_date?: string
  status?: string
  grand_total?: number
  outstanding_amount?: number
}

export interface QboCashResp {
  connected: boolean
  value: number | null
  as_of?: string
  note?: string
}

export interface QboArResp {
  connected: boolean
  total: number | null
  as_of?: string
  note?: string
}

export interface MyProfileResp {
  user: string
  full_name?: string
  employee?: string | null
  roles?: string[]
}
