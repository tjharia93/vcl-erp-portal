import { Alert, Box, Divider, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import FallbackBanner from '../FallbackBanner'
import { cash as mockCash } from '../../mock/cash'
import { formatINR, formatPct } from '../../format'
import { vclTokens } from '../../theme'
import { frappeCall } from '../../api/client'
import { useApi } from '../../api/hooks'
import type { FinanceKpisResp, QboCashResp } from '../../api/types'

interface CashState {
  asOf: string
  erpnext: number | null
  qbo: number | null
  qboConnected: boolean
  qboNote?: string
  driftAbs: number | null
  driftPct: number | null
  alertThresholdPct: number
}

async function loadCash(): Promise<CashState> {
  const [finance, qbo] = await Promise.all([
    frappeCall<FinanceKpisResp>('vcl_portal.api.get_finance_kpis'),
    frappeCall<QboCashResp>('vcl_portal.qbo_api.get_qbo_cash_position'),
  ])
  const erp = finance.cash_balance
  const qboVal = qbo.value
  const driftAbs = erp != null && qboVal != null ? erp - qboVal : null
  const driftPct =
    erp != null && qboVal != null && erp !== 0 ? (driftAbs! / erp) * 100 : null
  return {
    asOf:
      qbo.as_of ??
      new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }),
    erpnext: erp,
    qbo: qboVal,
    qboConnected: qbo.connected,
    qboNote: qbo.note,
    driftAbs,
    driftPct,
    alertThresholdPct: 1,
  }
}

const mock: CashState = {
  asOf: mockCash.asOf,
  erpnext: mockCash.erpnext,
  qbo: mockCash.qbo,
  qboConnected: true,
  driftAbs: mockCash.driftAbs,
  driftPct: mockCash.driftPct,
  alertThresholdPct: mockCash.alertThresholdPct,
}

export default function CashCard() {
  const state = useApi(loadCash, mock)
  const cash = state.data
  const overThreshold =
    cash.driftPct != null && Math.abs(cash.driftPct) > cash.alertThresholdPct

  return (
    <SectionCard
      id="cash"
      title="Cash Position"
      subtitle={`As of ${cash.asOf}`}
      source="ERPNEXT + QBO"
    >
      <FallbackBanner error={state.error} />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 0 }}
        divider={<Divider orientation="vertical" flexItem sx={{ borderColor: vclTokens.border }} />}
        sx={{ alignItems: 'stretch' }}
      >
        <CashColumn
          label="ERPNEXT"
          value={cash.erpnext}
          accent={vclTokens.blue}
        />
        <CashColumn
          label="QBO"
          value={cash.qbo}
          accent={vclTokens.text}
          notConnectedNote={!cash.qboConnected ? cash.qboNote : undefined}
        />
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={3}>
            <DriftStat
              label="Drift (abs)"
              value={
                cash.driftAbs == null
                  ? '—'
                  : formatINR(cash.driftAbs, { compact: true })
              }
            />
            <DriftStat
              label="Drift %"
              value={cash.driftPct == null ? '—' : formatPct(cash.driftPct, 2)}
            />
            <DriftStat
              label="Threshold"
              value={`±${formatPct(cash.alertThresholdPct, 1)}`}
              muted
            />
          </Stack>
          {overThreshold && <StatusChip status="CRITICAL" labelOverride="DRIFT ALERT" />}
        </Stack>
        {overThreshold && (
          <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
            ERPNext and QBO cash balances differ by{' '}
            <Mono>{formatPct(cash.driftPct!, 2)}</Mono>, exceeding the{' '}
            <Mono>±{formatPct(cash.alertThresholdPct, 1)}</Mono> threshold. Trigger
            reconciliation.
          </Alert>
        )}
        {!cash.qboConnected && (
          <Alert severity="info" variant="outlined" sx={{ mt: 2, fontSize: '0.85rem' }}>
            QBO comparison not available — {cash.qboNote ?? 'QBO read endpoint not yet wired.'}
          </Alert>
        )}
      </Box>
    </SectionCard>
  )
}

function CashColumn({
  label,
  value,
  accent,
  notConnectedNote,
}: {
  label: string
  value: number | null
  accent: string
  notConnectedNote?: string
}) {
  return (
    <Box sx={{ flex: 1, py: { xs: 0, sm: 0.5 }, px: { sm: 2 } }}>
      <Typography
        variant="overline"
        sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}
      >
        {label}
      </Typography>
      <Mono
        sx={{
          display: 'block',
          fontSize: { xs: '1.6rem', sm: '2rem' },
          fontWeight: 600,
          color: value == null ? vclTokens.textMuted : accent,
        }}
      >
        {value == null ? '—' : formatINR(value, { compact: true })}
      </Mono>
      {notConnectedNote && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          QBO sync pending
        </Typography>
      )}
    </Box>
  )
}

function DriftStat({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Mono
        sx={{
          fontSize: '0.95rem',
          color: muted ? vclTokens.textMuted : 'text.primary',
          fontWeight: 500,
        }}
      >
        {value}
      </Mono>
    </Stack>
  )
}
