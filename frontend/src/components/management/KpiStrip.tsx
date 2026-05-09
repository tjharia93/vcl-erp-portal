import { Box } from '@mui/material'
import KpiTile from '../KpiTile'
import { kpis } from '../../mock/kpi'

export default function KpiStrip() {
  return (
    <Box
      id="kpis"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {kpis.map((k) => (
        <KpiTile key={k.id} kpi={k} />
      ))}
    </Box>
  )
}
