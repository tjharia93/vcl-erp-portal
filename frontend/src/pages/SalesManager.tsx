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
import FallbackBanner from '../components/FallbackBanner'
import { pipeline as mockPipeline, repProgress as mockRepProgress, teamVsTarget as mockTeam } from '../mock/sales'
import type { PipelineDeal, RepRow } from '../mock/types'
import { formatINR, formatPct } from '../format'
import { FONT_MONO, vclTokens } from '../theme'
import { frappeCall } from '../api/client'
import { useApi } from '../api/hooks'

const stageColor: Record<string, string> = {
  Qualified: vclTokens.textMuted,
  Proposal: vclTokens.blue,
  Negotiation: vclTokens.amber,
  Closing: vclTokens.green,
  'To Deliver and Bill': vclTokens.amber,
  'To Bill': vclTokens.blue,
  'To Deliver': vclTokens.amber,
  Completed: vclTokens.green,
  Draft: vclTokens.textMuted,
}

interface RepApiRow {
  sales_person: string
  actual_mtd?: number
  target_period?: number | null
  pct_achieved?: number | null
}

interface SalesOrderApiRow {
  name: string
  customer?: string
  status?: string
  grand_total?: number
  delivery_date?: string
  transaction_date?: string
}

async function loadTeam(): Promise<RepRow[]> {
  const rows = await frappeCall<RepApiRow[]>('vcl_portal.api.get_rep_performance')
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    rep: r.sales_person,
    target: r.target_period ?? 0,
    achieved: r.actual_mtd ?? 0,
    achievementPct:
      r.pct_achieved != null
        ? r.pct_achieved
        : r.target_period && r.target_period > 0
          ? Math.round(((r.actual_mtd ?? 0) / r.target_period) * 1000) / 10
          : 0,
  }))
}

async function loadPipeline(): Promise<PipelineDeal[]> {
  const rows = await frappeCall<SalesOrderApiRow[]>('frappe.client.get_list', {
    doctype: 'Sales Order',
    filters: [['status', 'not in', ['Closed', 'Cancelled', 'Completed']]],
    fields: ['name', 'customer', 'status', 'grand_total', 'delivery_date', 'transaction_date'],
    order_by: 'transaction_date desc',
    limit_page_length: 5,
  })
  return (Array.isArray(rows) ? rows : []).map((r) => ({
    deal: r.name,
    customer: r.customer ?? '—',
    stage: ((r.status as PipelineDeal['stage']) || 'Qualified') as PipelineDeal['stage'],
    value: r.grand_total ?? 0,
    expectedClose: r.delivery_date ?? r.transaction_date ?? '—',
  }))
}

export default function SalesManager() {
  const teamState = useApi(loadTeam, mockTeam)
  const pipelineState = useApi(loadPipeline, mockPipeline)
  const team = teamState.data
  const pipeline = pipelineState.data
  const repProgress = team.length
    ? team.map((r) => ({ rep: r.rep, pct: r.achievementPct }))
    : mockRepProgress

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Sales Manager Desk
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
          TEAM · PIPELINE · PROGRESS
        </Typography>
      </Box>

      <SectionCard id="team" title="Team vs Target" subtitle="Month-to-date" source="ERPNEXT">
        <FallbackBanner error={teamState.error} />
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 540 }}>
            <TableHead>
              <TableRow>
                <TableCell>Rep</TableCell>
                <TableCell align="right">Target</TableCell>
                <TableCell align="right">Achieved</TableCell>
                <TableCell align="right">Attainment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {team.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                    No reps in scope.
                  </TableCell>
                </TableRow>
              ) : (
                team.map((r) => {
                  const pct = r.achievementPct
                  const color =
                    pct >= 100 ? vclTokens.green : pct >= 75 ? vclTokens.text : vclTokens.red
                  return (
                    <TableRow key={r.rep} hover>
                      <TableCell>{r.rep}</TableCell>
                      <TableCell align="right">
                        <Mono>
                          {r.target ? formatINR(r.target, { compact: true }) : '—'}
                        </Mono>
                      </TableCell>
                      <TableCell align="right">
                        <Mono>{formatINR(r.achieved, { compact: true })}</Mono>
                      </TableCell>
                      <TableCell align="right">
                        <Mono sx={{ color, fontWeight: 600 }}>
                          {r.target ? formatPct(pct, 0) : '—'}
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

      <SectionCard
        id="pipeline"
        title="Pipeline"
        subtitle="Open Sales Orders (5 most recent)"
        source="ERPNEXT"
      >
        <FallbackBanner error={pipelineState.error} />
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 620 }}>
            <TableHead>
              <TableRow>
                <TableCell>Deal</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Expected close</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pipeline.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>
                    No open sales orders in scope.
                  </TableCell>
                </TableRow>
              ) : (
                pipeline.map((d) => {
                  const c = stageColor[d.stage] || vclTokens.textMuted
                  return (
                    <TableRow key={d.deal} hover>
                      <TableCell>
                        <Mono>{d.deal}</Mono>
                      </TableCell>
                      <TableCell>{d.customer}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={d.stage.toUpperCase()}
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            letterSpacing: '0.14em',
                            color: c,
                            backgroundColor: `${c}1A`,
                            border: `1px solid ${c}55`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Mono>{formatINR(d.value, { compact: true })}</Mono>
                      </TableCell>
                      <TableCell align="right">
                        <Mono>{d.expectedClose}</Mono>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard id="progress" title="Rep Progress" subtitle="Attainment %" source="ERPNEXT">
        <FallbackBanner error={teamState.error} />
        <Stack spacing={2}>
          {repProgress.map((r) => {
            const color =
              r.pct >= 100 ? vclTokens.green : r.pct >= 75 ? vclTokens.blue : vclTokens.red
            return (
              <Box key={r.rep}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {r.rep}
                  </Typography>
                  <Mono sx={{ color, fontWeight: 600 }}>
                    {formatPct(r.pct, 0)}
                  </Mono>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, r.pct)}
                  sx={{ '& .MuiLinearProgress-bar': { backgroundColor: color } }}
                />
              </Box>
            )
          })}
        </Stack>
      </SectionCard>
    </Stack>
  )
}
