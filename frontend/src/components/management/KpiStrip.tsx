import { Box } from '@mui/material'
import KpiTile from '../KpiTile'
import FallbackBanner from '../FallbackBanner'
import { kpis as mockKpis } from '../../mock/kpi'
import type { Kpi } from '../../mock/types'
import { frappeCall } from '../../api/client'
import { useApi } from '../../api/hooks'
import type { FinanceKpisResp, SalesKpisResp } from '../../api/types'
import { formatINR } from '../../format'

interface ManagementKpiBundle {
  kpis: Kpi[]
}

async function loadManagementKpis(): Promise<ManagementKpiBundle> {
  const [finance, sales] = await Promise.all([
    frappeCall<FinanceKpisResp>('vcl_portal.api.get_finance_kpis'),
    frappeCall<SalesKpisResp>('vcl_portal.api.get_sales_kpis'),
  ])
  const kpis: Kpi[] = [
    {
      id: 'revenue-mtd',
      label: 'Revenue MTD',
      value: formatINR(sales.mtd_revenue ?? 0, { compact: true }),
      delta: 'live',
      deltaDirection: 'flat',
      source: 'ERPNEXT',
    },
    {
      id: 'cash-position',
      label: 'Cash Position',
      value:
        finance.cash_balance == null
          ? '—'
          : formatINR(finance.cash_balance, { compact: true }),
      delta: finance._cash_error ? 'unavailable' : 'live',
      deltaDirection: 'flat',
      source: 'ERPNEXT',
    },
    {
      id: 'ar-outstanding',
      label: 'AR Outstanding',
      value: formatINR(finance.total_ar ?? 0, { compact: true }),
      delta: 'live',
      deltaDirection: 'flat',
      source: 'ERPNEXT',
    },
    {
      id: 'gross-margin',
      label: 'Gross Margin',
      value: '—',
      delta: 'wiring deferred',
      deltaDirection: 'flat',
      source: 'ERPNEXT',
    },
  ]
  return { kpis }
}

const mock: ManagementKpiBundle = { kpis: mockKpis }

export default function KpiStrip() {
  const state = useApi(loadManagementKpis, mock)
  return (
    <Box id="kpis">
      <FallbackBanner error={state.error} compact />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {state.data.kpis.map((k) => (
          <KpiTile key={k.id} kpi={k} />
        ))}
      </Box>
    </Box>
  )
}
