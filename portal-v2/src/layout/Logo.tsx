import { Box, Stack, Typography } from '@mui/material'
import { vclTokens, FONT_DISPLAY } from '../theme'

interface Props {
  size?: 'sm' | 'md'
}

export default function Logo({ size = 'sm' }: Props) {
  const big = size === 'md'
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', userSelect: 'none' }}>
      <Box
        sx={{
          width: big ? 14 : 10,
          height: big ? 28 : 22,
          background: `linear-gradient(180deg, ${vclTokens.red} 0%, ${vclTokens.blue} 100%)`,
          borderRadius: 0.5,
        }}
      />
      <Typography
        sx={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          letterSpacing: '0.18em',
          fontSize: big ? '1.5rem' : '1.05rem',
          color: '#fff',
        }}
      >
        VCL
      </Typography>
      <Typography
        sx={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 500,
          letterSpacing: '0.22em',
          fontSize: big ? '0.85rem' : '0.66rem',
          color: 'rgba(231,234,242,0.55)',
          mt: big ? '6px' : '2px',
        }}
      >
        PORTAL · v2
      </Typography>
    </Stack>
  )
}
