import { Box, Paper, Stack, Typography } from '@mui/material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import RemoveIcon from '@mui/icons-material/Remove'
import Mono from './Mono'
import SourceTag from './SourceTag'
import { vclTokens } from '../theme'
import type { Kpi } from '../mock/types'

interface Props {
  kpi: Kpi
}

const deltaColor = {
  up: vclTokens.green,
  down: vclTokens.red,
  flat: vclTokens.textMuted,
} as const

const deltaIcon = {
  up: ArrowDropUpIcon,
  down: ArrowDropDownIcon,
  flat: RemoveIcon,
} as const

export default function KpiTile({ kpi }: Props) {
  const Icon = deltaIcon[kpi.deltaDirection]
  const color = deltaColor[kpi.deltaDirection]
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1.5,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(135deg, rgba(43,57,144,0.04) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
      <Stack spacing={0.5} sx={{ position: 'relative' }}>
        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {kpi.label}
        </Typography>
        <Mono
          sx={{
            fontSize: { xs: '1.6rem', sm: '1.85rem' },
            fontWeight: 600,
            color: 'text.primary',
            letterSpacing: '-0.01em',
          }}
        >
          {kpi.value}
        </Mono>
      </Stack>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', color }}>
          <Icon fontSize="small" />
          <Mono sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{kpi.delta}</Mono>
        </Stack>
        <SourceTag source={kpi.source} />
      </Stack>
    </Paper>
  )
}
