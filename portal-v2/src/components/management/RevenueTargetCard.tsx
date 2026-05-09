import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import { revenue } from '../../mock/revenue'
import { formatINR, formatPct } from '../../format'
import { vclTokens } from '../../theme'

export default function RevenueTargetCard() {
  const barColor = revenue.status === 'on-track' ? vclTokens.green : vclTokens.red

  return (
    <SectionCard
      id="revenue"
      title="Revenue vs Target"
      subtitle={revenue.period}
      source="ERPNEXT"
      actions={<StatusChip status={revenue.status} />}
    >
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
          color: primary ? '#fff' : 'rgba(231,234,242,0.78)',
        }}
      >
        {value}
      </Mono>
    </Box>
  )
}
