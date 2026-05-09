import { Alert, Box, Divider, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import { cash } from '../../mock/cash'
import { formatINR, formatPct } from '../../format'
import { vclTokens } from '../../theme'

export default function CashCard() {
  const overThreshold = Math.abs(cash.driftPct) > cash.alertThresholdPct

  return (
    <SectionCard
      id="cash"
      title="Cash Position"
      subtitle={`As of ${cash.asOf}`}
      source="ERPNEXT + QBO"
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 2, sm: 0 }}
        divider={<Divider orientation="vertical" flexItem sx={{ borderColor: vclTokens.border }} />}
        sx={{ alignItems: { xs: 'stretch', sm: 'stretch' } }}
      >
        <CashColumn label="ERPNEXT" value={cash.erpnext} accent={vclTokens.blue} />
        <CashColumn label="QBO" value={cash.qbo} accent="rgba(231,234,242,0.65)" />
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
            <DriftStat label="Drift (abs)" value={formatINR(cash.driftAbs, { compact: true })} />
            <DriftStat label="Drift %" value={formatPct(cash.driftPct, 2)} />
            <DriftStat
              label="Threshold"
              value={`±${formatPct(cash.alertThresholdPct, 1)}`}
              muted
            />
          </Stack>
          {overThreshold && <StatusChip status="CRITICAL" labelOverride="DRIFT ALERT" />}
        </Stack>
        {overThreshold && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{
              mt: 2,
              borderColor: 'rgba(237,28,36,0.45)',
              color: '#fff',
              backgroundColor: 'rgba(237,28,36,0.06)',
              '& .MuiAlert-icon': { color: vclTokens.red },
            }}
          >
            ERPNext and QBO cash balances differ by{' '}
            <Mono>{formatPct(cash.driftPct, 2)}</Mono>, exceeding the{' '}
            <Mono>±{formatPct(cash.alertThresholdPct, 1)}</Mono> threshold. Trigger
            reconciliation.
          </Alert>
        )}
      </Box>
    </SectionCard>
  )
}

function CashColumn({ label, value, accent }: { label: string; value: number; accent: string }) {
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
          color: accent,
        }}
      >
        {formatINR(value, { compact: true })}
      </Mono>
    </Box>
  )
}

function DriftStat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Mono
        sx={{
          fontSize: '0.95rem',
          color: muted ? 'rgba(231,234,242,0.55)' : 'text.primary',
          fontWeight: 500,
        }}
      >
        {value}
      </Mono>
    </Stack>
  )
}
