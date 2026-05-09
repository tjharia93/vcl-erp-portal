import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import FallbackBanner from '../FallbackBanner'
import { stock as mockStock } from '../../mock/stock'
import type { StockItem } from '../../mock/types'
import { vclTokens } from '../../theme'
import { frappeCall } from '../../api/client'
import { useApi } from '../../api/hooks'

interface StockAlertApiRow {
  item_code: string
  item_name?: string
  warehouse?: string
  actual_qty?: number
  projected_qty?: number
  reorder_level?: number
}

function severity(pct: number): StockItem['severity'] {
  if (pct < 25) return 'CRITICAL'
  if (pct < 60) return 'LOW'
  return 'OK'
}

async function loadStock(): Promise<StockItem[]> {
  const rows = await frappeCall<StockAlertApiRow[]>(
    'vcl_portal.api.get_stock_alerts',
    { limit: 5 },
  )
  return (Array.isArray(rows) ? rows : []).slice(0, 5).map((r) => {
    const onHand = r.actual_qty ?? 0
    const reorder = r.reorder_level ?? 1
    const pct = Math.max(0, Math.min(100, Math.round((onHand / reorder) * 100)))
    return {
      sku: r.item_code,
      name: r.item_name || r.item_code,
      onHand,
      reorder,
      pct,
      severity: severity(pct),
    }
  })
}

export default function StockSummaryCard() {
  const state = useApi(loadStock, mockStock)
  const stock = state.data
  return (
    <SectionCard
      id="stock"
      title="Stock Summary"
      subtitle="Items at or below reorder"
      source="ERPNEXT"
    >
      <FallbackBanner error={state.error} />

      {stock.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No items currently below reorder level.
        </Typography>
      ) : (
        <Stack
          divider={<Box sx={{ borderTop: `1px solid ${vclTokens.border}` }} />}
          spacing={0}
        >
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
                    <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {item.name}
                    </Typography>
                    <Mono
                      sx={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.12em',
                        color: 'text.secondary',
                      }}
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
      )}
    </SectionCard>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}
      >
        {label}
      </Typography>
      <Mono
        sx={{
          fontSize: '0.95rem',
          fontWeight: 500,
          color: muted ? vclTokens.textMuted : 'text.primary',
        }}
      >
        {value}
      </Mono>
    </Box>
  )
}
