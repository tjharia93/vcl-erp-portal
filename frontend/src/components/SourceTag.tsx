import { Chip } from '@mui/material'
import type { SourceTag as Source } from '../mock/types'
import { vclTokens } from '../theme'

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
        color: vclTokens.textMuted,
        borderColor: vclTokens.border,
        backgroundColor: vclTokens.paperAlt,
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}
