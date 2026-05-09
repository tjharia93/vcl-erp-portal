import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import { stock } from '../../mock/stock'
import { vclTokens } from '../../theme'

export default function StockSummaryCard() {
  return (
    <SectionCard
      id="stock"
      title="Stock Summary"
      subtitle="Critical raw materials"
      source="ERPNEXT"
    >
      <Stack divider={<Box sx={{ borderTop: `1px solid ${vclTokens.border}` }} />} spacing={0}>
        {stock.map((item) => {
          const barColor =
            item.severity === 'CRITICAL'
              ? vclTokens.red
              : item.severity === 'LOW'
                ? vclTokens.amber
                : vclTokens.green
          return (
            <Box key={item.sku} sx={{ py: 1.5 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 2 }}
                sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
              >
                <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 500 }}>{item.name}</Typography>
                  <Mono
                    sx={{ fontSize: '0.7rem', letterSpacing: '0.12em', color: 'text.secondary' }}
                  >
                    {item.sku}
                  </Mono>
                </Box>
                <Stack direction="row" spacing={2} sx={{ minWidth: 180 }}>
                  <Stat label="On hand" value={item.onHand.toLocaleString()} />
                  <Stat label="Reorder" value={item.reorder.toLocaleString()} muted />
                </Stack>
                <Box sx={{ flex: '1 1 200px', width: '100%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, item.pct)}
                    sx={{ '& .MuiLinearProgress-bar': { backgroundColor: barColor } }}
                  />
                </Box>
                <Box sx={{ minWidth: 90, textAlign: 'right' }}>
                  {item.severity === 'OK' ? (
                    <Mono sx={{ color: vclTokens.green, fontSize: '0.75rem' }}>OK</Mono>
                  ) : (
                    <StatusChip status={item.severity} />
                  )}
                </Box>
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </SectionCard>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
        {label}
      </Typography>
      <Mono
        sx={{
          fontSize: '0.95rem',
          fontWeight: 500,
          color: muted ? 'rgba(231,234,242,0.55)' : '#fff',
        }}
      >
        {value}
      </Mono>
    </Box>
  )
}
