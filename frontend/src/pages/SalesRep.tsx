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
import StatusChip from '../components/StatusChip'
import { myAR, myOrders, personalTarget } from '../mock/sales'
import { formatINR, formatPct } from '../format'
import { FONT_MONO, vclTokens } from '../theme'

const orderStageColor: Record<string, string> = {
  Confirmed: vclTokens.blue,
  'In Production': vclTokens.amber,
  Dispatched: vclTokens.green,
  Pending: 'rgba(231,234,242,0.65)',
}

export default function SalesRep() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ color: '#fff' }}>
          MY DESK
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
          {personalTarget.rep.toUpperCase()} · {personalTarget.period.toUpperCase()}
        </Typography>
      </Box>

      <SectionCard
        id="target"
        title="My Target"
        subtitle={personalTarget.period}
        source="ERPNEXT"
        actions={<StatusChip status={personalTarget.status} />}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 2 }}>
          <Stat label="Achieved" value={formatINR(personalTarget.achieved, { compact: true })} primary />
          <Stat label="Target" value={formatINR(personalTarget.target, { compact: true })} />
          <Stat label="Attainment" value={formatPct(personalTarget.pct, 0)} />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, personalTarget.pct)}
          sx={{
            height: 12,
            '& .MuiLinearProgress-bar': {
              backgroundColor:
                personalTarget.status === 'on-track' ? vclTokens.green : vclTokens.red,
            },
          }}
        />
      </SectionCard>

      <SectionCard id="orders" title="My Orders" subtitle="Last 5" source="ERPNEXT">
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myOrders.map((o) => (
                <TableRow key={o.number} hover>
                  <TableCell><Mono>{o.number}</Mono></TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell align="right"><Mono>{formatINR(o.value, { compact: true })}</Mono></TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={o.status.toUpperCase()}
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        color: orderStageColor[o.status],
                        backgroundColor: `${orderStageColor[o.status]}1F`,
                        border: `1px solid ${orderStageColor[o.status]}55`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right"><Mono>{o.date}</Mono></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>

      <SectionCard id="ar" title="My AR" subtitle="Outstanding by customer" source="ERPNEXT">
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Outstanding</TableCell>
                <TableCell align="right">Days Overdue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {myAR.map((r) => {
                const overdue = r.daysOverdue > 30
                const stale = r.daysOverdue > 60
                const color = stale ? vclTokens.red : overdue ? vclTokens.amber : 'rgba(231,234,242,0.78)'
                return (
                  <TableRow key={r.customer} hover>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell align="right"><Mono>{formatINR(r.outstanding, { compact: true })}</Mono></TableCell>
                    <TableCell align="right">
                      <Mono sx={{ color, fontWeight: overdue ? 600 : 500 }}>{r.daysOverdue}</Mono>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </SectionCard>
    </Stack>
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
