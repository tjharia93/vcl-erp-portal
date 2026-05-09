import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import SectionCard from '../Card/SectionCard'
import Mono from '../Mono'
import { ar } from '../../mock/ar'
import { formatINR } from '../../format'
import { vclTokens } from '../../theme'

export default function ARAgeingCard() {
  return (
    <SectionCard id="ar" title="AR Ageing" source="ERPNEXT + QBO">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ mb: 2.5 }}
      >
        <SummaryTile label="ERPNext Total" value={ar.erpnextTotal} accent={vclTokens.blue} />
        <SummaryTile label="QBO Total" value={ar.qboTotal} accent="rgba(231,234,242,0.65)" />
      </Stack>

      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell align="right">0&ndash;30</TableCell>
              <TableCell align="right">31&ndash;60</TableCell>
              <TableCell align="right">61&ndash;90</TableCell>
              <TableCell align="right">90+</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ar.rows.map((r) => (
              <TableRow key={r.customer} hover>
                <TableCell>{r.customer}</TableCell>
                <TableCell align="right"><Mono>{formatINR(r.b0_30, { compact: true })}</Mono></TableCell>
                <TableCell align="right"><Mono>{formatINR(r.b31_60, { compact: true })}</Mono></TableCell>
                <TableCell align="right">
                  <Mono sx={{ color: r.b61_90 > 0 ? vclTokens.amber : 'inherit' }}>
                    {formatINR(r.b61_90, { compact: true })}
                  </Mono>
                </TableCell>
                <TableCell align="right">
                  <Mono sx={{ color: r.b90_plus > 0 ? vclTokens.red : 'inherit' }}>
                    {formatINR(r.b90_plus, { compact: true })}
                  </Mono>
                </TableCell>
                <TableCell align="right">
                  <Mono sx={{ fontWeight: 600 }}>{formatINR(r.total, { compact: true })}</Mono>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  )
}

function SummaryTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 2,
        border: `1px solid ${vclTokens.border}`,
        borderRadius: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
      }}
    >
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <Mono sx={{ fontSize: '1.4rem', fontWeight: 600, color: accent, display: 'block', mt: 0.5 }}>
        {formatINR(value, { compact: true })}
      </Mono>
    </Box>
  )
}
