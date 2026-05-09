import {
  Box,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import SectionCard from '../components/Card/SectionCard'
import Mono from '../components/Mono'
import StatusChip from '../components/StatusChip'
import FallbackBanner from '../components/FallbackBanner'
import {
  myAR as mockMyAR,
  myOrders as mockMyOrders,
  personalTarget as mockTarget,
} from '../mock/sales'
import type { MyARRow, OrderRow, PersonalTarget } from '../mock/types'
import { formatINR, formatPct } from '../format'
import { FONT_MONO, vclTokens } from '../theme'
import { frappeCall } from '../api/client'
import { useApi } from '../api/hooks'
import type {
  MyProfileResp,
  OpenSalesInvoiceRow,
  SalesAgeingRow,
  SalesKpisResp,
} from '../api/types'

const orderStageColor: Record<string, string> = {
  Confirmed: vclTokens.blue,
  'In Production': vclTokens.amber,
  Dispatched: vclTokens.green,
  Pending: vclTokens.textMuted,
  Unpaid: vclTokens.amber,
  Overdue: vclTokens.red,
  'Partly Paid': vclTokens.amber,
  Submitted: vclTokens.blue,
  Paid: vclTokens.green,
  Draft: vclTokens.textMuted,
}

interface OpenSiBundle {
  submitted?: OpenSalesInvoiceRow[]
  drafts?: OpenSalesInvoiceRow[]
}

const PERSONAL_TARGET = mockTarget.target // Sales Person target source-of-truth pending

async function loadTarget(): Promise<PersonalTarget> {
  const [profile, sales] = await Promise.all([
    frappeCall<MyProfileResp>('vcl_portal.api.get_my_profile'),
    frappeCall<SalesKpisResp>('vcl_portal.api.get_sales_kpis'),
  ])
  const achieved = sales.mtd_revenue ?? 0
  const pct = PERSONAL_TARGET > 0
    ? Math.round((achieved / PERSONAL_TARGET) * 1000) / 10
    : 0
  return {
    rep: profile.full_name ?? profile.user ?? 'My Desk',
    period: new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    target: PERSONAL_TARGET,
    achieved,
    pct,
    status: pct >= 75 ? 'on-track' : 'behind',
  }
}

async function loadOrders(): Promise<OrderRow[]> {
  const bundle = await frappeCall<OpenSiBundle>(
    'vcl_portal.api.get_open_sales_invoices',
    { limit: 5 },
  )
  const list = bundle.submitted ?? []
  return list.slice(0, 5).map((r) => ({
    number: r.name,
    customer: r.customer ?? '—',
    value: r.grand_total ?? 0,
    status: ((r.status as OrderRow['status']) || 'Pending') as OrderRow['status'],
    date: r.posting_date ?? '—',
  }))
}

async function loadAr(): Promise<MyARRow[]> {
  const rows = await frappeCall<SalesAgeingRow[]>(
    'vcl_portal.api.get_sales_ageing',
    { limit: 5 },
  )
  return (Array.isArray(rows) ? rows : []).slice(0, 5).map((r) => {
    const total = r.total ?? 0
    // crude oldest-bucket → days estimation for the prototype
    const daysOverdue = r.b_90_plus > 0 ? 95 : r.b_61_90 > 0 ? 75 : r.b_31_60 > 0 ? 45 : 0
    return {
      customer: r.customer,
      outstanding: total,
      daysOverdue,
    }
  })
}

export default function SalesRep() {
  const targetState = useApi(loadTarget, mockTarget)
  const ordersState = useApi(loadOrders, mockMyOrders)
  const arState = useApi(loadAr, mockMyAR)
  const target = targetState.data
  const orders = ordersState.data
  const ar = arState.data

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          My Desk
        </Typography>
        <Typography
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            color: vclTokens.textMuted,
            mt: 0.5,
          }}
        >
          {target.rep.toUpperCase()} · {target.period.toUpperCase()}
        </Typography>
      </Box>

      <SectionCard
        id="target"
        title="My Target"
        subtitle={target.period}
        source="ERPNEXT"
        actions={<StatusChip status={target.status} />}
      >
        <FallbackBanner error={targetState.error} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
          <Stat label="Achieved" value={formatINR(target.achieved, { compact: true })} primary />
          <Stat label="Target" value={formatINR(target.target, { compact: true })} />
          <Stat label="Attainment" value={formatPct(target.pct, 0)} />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, target.pct)}
          sx={{
            height: 12,
            '& .MuiLinearProgress-bar': {
              backgroundColor: target.status === 'on-track' ? vclTokens.green : vclTokens.red,
            },
          }}
        />
      </SectionCard>

      <SectionCard id="orders" title="My Orders" subtitle="Open Sales Invoices · last 5" source="ERPNEXT">
        <FallbackBanner error={ordersState.error} />
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                    No open invoices in scope.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const c = orderStageColor[o.status] || vclTokens.textMuted
                  return (
                    <TableRow key={o.number} hover>
                      <TableCell><Mono>{o.number}</Mono></TableCell>
                      <TableCell>{o.customer}</TableCell>
                      <TableCell align="right">
                        <Mono>{formatINR(o.value, { compact: true })}</Mono>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={String(o.status).toUpperCase()}
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            letterSpacing: '0.12em',
                            color: c,
                            backgroundColor: `${c}1A`,
                            border: `1px solid ${c}55`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right"><Mono>{o.date}</Mono></TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard id="ar" title="My AR" subtitle="Outstanding by customer" source="ERPNEXT">
        <FallbackBanner error={arState.error} />
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Days Overdue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ar.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                    No outstanding invoices in scope.
                  </TableCell>
                </TableRow>
              ) : (
                ar.map((r) => {
                  const overdue = r.daysOverdue > 30
                  const stale = r.daysOverdue > 60
                  const color = stale
                    ? vclTokens.red
                    : overdue
                      ? vclTokens.amber
                      : 'text.primary'
                  return (
                    <TableRow key={r.customer} hover>
                      <TableCell>{r.customer}</TableCell>
                      <TableCell align="right">
                        <Mono>{formatINR(r.outstanding, { compact: true })}</Mono>
                      </TableCell>
                      <TableCell align="right">
                        <Mono sx={{ color, fontWeight: overdue ? 600 : 500 }}>
                          {r.daysOverdue}
                        </Mono>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    </Stack>
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
