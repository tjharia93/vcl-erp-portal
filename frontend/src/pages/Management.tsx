import { Box, Stack, Typography } from '@mui/material'
import KpiStrip from '../components/management/KpiStrip'
import CashCard from '../components/management/CashCard'
import ARAgeingCard from '../components/management/ARAgeingCard'
import RevenueTargetCard from '../components/management/RevenueTargetCard'
import StockSummaryCard from '../components/management/StockSummaryCard'
import ProductionFloorCard from '../components/management/ProductionFloorCard'
import { FONT_MONO, vclTokens } from '../theme'

export default function Management() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
          Management Desk
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
          OPERATIONS · FINANCE · FLOOR
        </Typography>
      </Box>

      <KpiStrip />
      <CashCard />
      <ARAgeingCard />
      <RevenueTargetCard />
      <StockSummaryCard />
      <ProductionFloorCard />
    </Stack>
  )
}
