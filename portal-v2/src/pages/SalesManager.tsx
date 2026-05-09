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
import { pipeline, repProgress, teamVsTarget } from '../mock/sales'
import { formatINR, formatPct } from '../format'
import { FONT_MONO, vclTokens } from '../theme'

const stageColor: Record<string, string> = {
  Qualified: 'rgba(231,234,242,0.65)',
  Proposal: vclTokens.blue,
  Negotiation: vclTokens.amber,
  Closing: vclTokens.green,
}

export default function SalesManager() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ color: '#fff' }}>
          SALES MANAGER DESK
        </Typography>
        <Typography
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            color: 'rgba(231,234,242,0.5)',
            mt: 0.5,
          }}
        >
          TEAM · PIPELINE · PROGRESS
        </Typography>
      </Box>

      <SectionCard id="team" title="Team vs Target" subtitle="May 2026" source="ERPNEXT">
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
              {teamVsTarget.map((r) => {
                const color = r.achievementPct >= 100
                  ? vclTokens.green
                  : r.achievementPct >= 75
                    ? '#fff'
                    : vclTokens.red
                return (
                  <TableRow key={r.rep} hover>
                    <TableCell>{r.rep}</TableCell>
                    <TableCell align="right"><Mono>{formatINR(r.target, { compact: true })}</Mono></TableCell>
                    <TableCell align="right"><Mono>{formatINR(r.achieved, { compact: true })}</Mono></TableCell>
                    <TableCell align="right">
                      <Mono sx={{ color, fontWeight: 600 }}>{formatPct(r.achievementPct, 0)}</Mono>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard id="pipeline" title="Pipeline" subtitle="Open opportunities" source="ERPNEXT">
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
              {pipeline.map((d) => (
                <TableRow key={d.deal} hover>
                  <TableCell><Mono>{d.deal}</Mono></TableCell>
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
                        color: stageColor[d.stage],
                        backgroundColor: `${stageColor[d.stage]}1F`,
                        border: `1px solid ${stageColor[d.stage]}55`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right"><Mono>{formatINR(d.value, { compact: true })}</Mono></TableCell>
                  <TableCell align="right"><Mono>{d.expectedClose}</Mono></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard id="progress" title="Rep Progress" subtitle="Attainment %" source="ERPNEXT">
        <Stack spacing={2}>
          {repProgress.map((r) => {
            const color = r.pct >= 100 ? vclTokens.green : r.pct >= 75 ? vclTokens.blue : vclTokens.red
            return (
              <Box key={r.rep}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: '#fff', fontWeight: 500 }}>{r.rep}</Typography>
                  <Mono sx={{ color, fontWeight: 600 }}>{formatPct(r.pct, 0)}</Mono>
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
