import { Chip } from '@mui/material'
import type { SourceTag as Source } from '../mock/types'

interface Props {
  source: Source
}

export default function SourceTag({ source }: Props) {
  return (
    <Chip
      size="small"
      label={source}
      variant="outlined"
      sx={{
        height: 22,
        fontSize: '0.66rem',
        letterSpacing: '0.14em',
        fontWeight: 600,
        color: 'rgba(231,234,242,0.78)',
        borderColor: 'rgba(255,255,255,0.16)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}
