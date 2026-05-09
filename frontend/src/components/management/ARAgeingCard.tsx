import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import FallbackBanner from '../FallbackBanner'
import { ar as mockAr } from '../../mock/ar'
import type { ARRow } from '../../mock/types'
import { formatINR } from '../../format'
import { vclTokens } from '../../theme'
import { frappeCall } from '../../api/client'
import { useApi } from '../../api/hooks'
import type { FinanceKpisResp, QboArResp, SalesAgeingRow } from '../../api/types'

interface ARState {
  erpnextTotal: number | null
  qboTotal: number | null
  qboConnected: boolean
  qboNote?: string
  rows: ARRow[]
}

async function loadAr(): Promise<ARState> {
  const [finance, ageing, qbo] = await Promise.all([
    frappeCall<FinanceKpisResp>('vcl_portal.api.get_finance_kpis'),
    frappeCall<SalesAgeingRow[]>('vcl_portal.api.get_sales_ageing', { limit: 5 }),
    frappeCall<QboArResp>('vcl_portal.qbo_api.get_qbo_ar_total'),
  ])
  const rows: ARRow[] = (Array.isArray(ageing) ? ageing : []).map((r) => ({
    customer: r.customer,
    b0_30: r.b_0_30 ?? 0,
    b31_60: r.b_31_60 ?? 0,
    b61_90: r.b_61_90 ?? 0,
    b90_plus: r.b_90_plus ?? 0,
    total: r.total ?? 0,
  }))
  return {
    erpnextTotal: finance.total_ar,
    qboTotal: qbo.total,
    qboConnected: qbo.connected,
    qboNote: qbo.note,
    rows,
  }
}

const mock: ARState = {
  erpnextTotal: mockAr.erpnextTotal,
  qboTotal: mockAr.qboTotal,
  qboConnected: true,
  rows: mockAr.rows,
}

export default function ARAgeingCard() {
  const state = useApi(loadAr, mock)
  const ar = state.data
  return (
    <SectionCard id="ar" title="AR Ageing" source="ERPNEXT + QBO">
      <FallbackBanner error={state.error} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ mb: 2.5 }}
      >
        <SummaryTile
          label="ERPNext Total"
          value={ar.erpnextTotal}
          accent={vclTokens.blue}
        />
        <SummaryTile
          label="QBO Total"
          value={ar.qboTotal}
          accent={vclTokens.text}
          note={!ar.qboConnected ? 'QBO sync pending' : undefined}
        />
      </Stack>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell align="right">0&ndash;30</TableCell>
              <TableCell align="right">31&ndash;60</TableCell>
              <TableCell align="right">61&ndash;90</TableCell>
              <TableCell align="right">90+</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ar.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary' }}>
                  No outstanding invoices in scope.
                </TableCell>
              </TableRow>
            ) : (
              ar.rows.map((r) => (
                <TableRow key={r.customer} hover>
                  <TableCell>{r.customer}</TableCell>
                  <TableCell align="right">
                    <Mono>{formatINR(r.b0_30, { compact: true })}</Mono>
                  </TableCell>
                  <TableCell align="right">
                    <Mono>{formatINR(r.b31_60, { compact: true })}</Mono>
                  </TableCell>
                  <TableCell align="right">
                    <Mono sx={{ color: r.b61_90 > 0 ? vclTokens.amber : 'inherit' }}>
                      {formatINR(r.b61_90, { compact: true })}
                    </Mono>
                  </TableCell>
                  <TableCell align="right">
                    <Mono sx={{ color: r.b90_plus > 0 ? vclTokens.red : 'inherit' }}>
                      {formatINR(r.b90_plus, { compact: true })}
                    </Mono>
                  </TableCell>
                  <TableCell align="right">
                    <Mono sx={{ fontWeight: 600 }}>
                      {formatINR(r.total, { compact: true })}
                    </Mono>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  )
}

function SummaryTile({
  label,
  value,
  accent,
  note,
}: {
  label: string
  value: number | null
  accent: string
  note?: string
}) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        border: `1px solid ${vclTokens.border}`,
        borderRadius: 1,
        backgroundColor: vclTokens.paperAlt,
      }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Mono
        sx={{
          fontSize: '1.4rem',
          fontWeight: 600,
          color: value == null ? vclTokens.textMuted : accent,
          display: 'block',
          mt: 0.5,
        }}
      >
        {value == null ? '—' : formatINR(value, { compact: true })}
      </Mono>
      {note && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          {note}
        </Typography>
      )}
    </Box>
  )
}
