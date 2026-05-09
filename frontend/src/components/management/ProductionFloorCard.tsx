import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import StatusChip from '../StatusChip'
import FallbackBanner from '../FallbackBanner'
import { production as mockProduction } from '../../mock/production'
import type { MachineStatus, MachineState } from '../../mock/types'
import { vclTokens } from '../../theme'
import { frappeCall } from '../../api/client'
import { useApi } from '../../api/hooks'

interface JobCardApiRow {
  name: string
  status?: string
  workstation?: string
  for_quantity?: number
  customer?: string
  production_item?: string
}

const STATE_MAP: Record<string, MachineState> = {
  'Work In Progress': 'RUNNING',
  Open: 'IDLE',
  'On Hold': 'DOWN',
  'Material Transferred': 'IDLE',
  Completed: 'IDLE',
  Cancelled: 'DOWN',
}

function mapStatus(s?: string): MachineState {
  if (!s) return 'IDLE'
  return STATE_MAP[s] ?? 'IDLE'
}

const oeeColor = (state: MachineState, oee: number) => {
  if (state === 'DOWN') return vclTokens.red
  if (state === 'IDLE') return vclTokens.textMuted
  if (oee >= 80) return vclTokens.green
  if (oee >= 60) return vclTokens.amber
  return vclTokens.red
}

async function loadProduction(): Promise<MachineStatus[]> {
  const rows = await frappeCall<JobCardApiRow[]>(
    'vcl_portal.api.get_open_job_cards',
    { limit: 5 },
  )
  return (Array.isArray(rows) ? rows : []).slice(0, 5).map((r) => {
    const state = mapStatus(r.status)
    // OEE % is not currently captured per Job Card — show 0 for DOWN, 100
    // for RUNNING placeholder until a Workstation OEE endpoint is added.
    const oee = state === 'DOWN' ? 0 : state === 'IDLE' ? 0 : 100
    return {
      id: r.name,
      name: r.workstation || r.production_item || r.name,
      oee,
      status: state,
    }
  })
}

export default function ProductionFloorCard() {
  const state = useApi(loadProduction, mockProduction)
  const machines = state.data
  return (
    <SectionCard
      id="production"
      title="Production Floor"
      subtitle="Open Job Cards (OEE wiring deferred to Workstation feed)"
      source="ERPNEXT"
    >
      <FallbackBanner error={state.error} />

      {machines.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No open job cards.
        </Typography>
      ) : (
        <Stack
          divider={<Box sx={{ borderTop: `1px solid ${vclTokens.border}` }} />}
          spacing={0}
        >
          {machines.map((m) => {
            const color = oeeColor(m.status, m.oee)
            return (
              <Stack
                key={m.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 2 }}
                sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, py: 1.5 }}
              >
                <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                  <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {m.name}
                  </Typography>
                  <Mono
                    sx={{ fontSize: '0.7rem', letterSpacing: '0.12em', color: 'text.secondary' }}
                  >
                    {m.id}
                  </Mono>
                </Box>
                <Box sx={{ minWidth: 100 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}
                  >
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
      )}
    </SectionCard>
  )
}
