import { Box, type BoxProps } from '@mui/material'
import { FONT_MONO } from '../theme'

export default function Mono({ sx, children, ...rest }: BoxProps) {
  return (
    <Box
      component="span"
      {...rest}
      sx={{ fontFamily: FONT_MONO, fontFeatureSettings: '"tnum" 1', ...sx }}
    >
      {children}
    </Box>
  )
}
