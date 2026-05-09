import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import FallbackBanner from '../FallbackBanner'
import { revenue as mockRevenue } from '../../mock/revenue'
import { formatINR, formatPct } from '../../format'
import { vclTokens } from '../../theme'
import { frappeCall } from '../../api/client'
import { useApi } from '../../api/hooks'
import type { SalesKpisResp } from '../../api/types'

// MTD revenue target lives in mock for now — it should move to a Frappe
// Single (e.g. VCL Revenue Targets) once Finance owns it.
const TARGET = mockRevenue.target

interface RevenueState {
  period: string
  achieved: number
  target: number
  pct: number
  status: 'on-track' | 'behind'
}

async function loadRevenue(): Promise<RevenueState> {
  const sales = await frappeCall<SalesKpisResp>('vcl_portal.api.get_sales_kpis')
  const achieved = sales.mtd_revenue ?? 0
  const pct = TARGET > 0 ? Math.round((achieved / TARGET) * 1000) / 10 : 0
  return {
    period: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    achieved,
    target: TARGET,
    pct,
    status: pct >= 75 ? 'on-track' : 'behind',
  }
}

const mock: RevenueState = {
  period: mockRevenue.period,
  achieved: mockRevenue.achieved,
  target: mockRevenue.target,
  pct: mockRevenue.pct,
  status: mockRevenue.status,
}

export default function RevenueTargetCard() {
  const state = useApi(loadRevenue, mock)
  const revenue = state.data
  const barColor = revenue.status === 'on-track' ? vclTokens.green : vclTokens.red

  return (
    <SectionCard
      id="revenue"
      title="Revenue vs Target"
      subtitle={revenue.period}
      source="ERPNEXT"
      actions={<StatusChip status={revenue.status} />}
    >
      <FallbackBanner error={state.error} />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
        <Stat label="Achieved" value={formatINR(revenue.achieved, { compact: true })} primary />
        <Stat label="Target" value={formatINR(revenue.target, { compact: true })} />
        <Stat label="Attainment" value={formatPct(revenue.pct, 1)} />
      </Stack>

      <Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, revenue.pct)}
          sx={{
            height: 12,
            '& .MuiLinearProgress-bar': { backgroundColor: barColor },
          }}
        />
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            0
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatINR(revenue.target, { compact: true })}
          </Typography>
        </Stack>
      </Box>
    </SectionCard>
  )
}

function Stat({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Mono
        sx={{
          fontSize: { xs: '1.4rem', sm: '1.6rem' },
          fontWeight: 600,
          color: primary ? 'text.primary' : vclTokens.textMuted,
        }}
      >
        {value}
      </Mono>
    </Box>
  )
}
