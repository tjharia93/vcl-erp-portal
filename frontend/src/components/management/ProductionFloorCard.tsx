import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import { production } from '../../mock/production'
import { vclTokens } from '../../theme'

const oeeColor = (state: string, oee: number) => {
  if (state === 'DOWN') return vclTokens.red
  if (state === 'IDLE') return 'rgba(231,234,242,0.45)'
  if (oee >= 80) return vclTokens.green
  if (oee >= 60) return vclTokens.amber
  return vclTokens.red
}

export default function ProductionFloorCard() {
  return (
    <SectionCard
      id="production"
      title="Production Floor"
      subtitle="Live OEE per machine"
      source="ERPNEXT"
    >
      <Stack
        divider={<Box sx={{ borderTop: `1px solid ${vclTokens.border}` }} />}
        spacing={0}
      >
        {production.map((m) => {
          const color = oeeColor(m.status, m.oee)
          return (
            <Stack
              key={m.id}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
              sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, py: 1.5 }}
            >
              <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                <Typography sx={{ color: '#fff', fontWeight: 500 }}>{m.name}</Typography>
                <Mono
                  sx={{ fontSize: '0.7rem', letterSpacing: '0.12em', color: 'text.secondary' }}
                >
                  {m.id}
                </Mono>
              </Box>
              <Box sx={{ minWidth: 100 }}>
                <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>
                  OEE
                </Typography>
                <Mono sx={{ fontSize: '1.3rem', fontWeight: 600, color }}>{m.oee}%</Mono>
              </Box>
              <Box sx={{ flex: '1 1 200px', width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, m.oee)}
                  sx={{ '& .MuiLinearProgress-bar': { backgroundColor: color } }}
                />
              </Box>
              <Box sx={{ minWidth: 110, textAlign: 'right' }}>
                <StatusChip status={m.status} />
              </Box>
            </Stack>
          )
        })}
      </Stack>
    </SectionCard>
  )
}
