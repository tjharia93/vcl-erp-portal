import { Chip } from '@mui/material'
import { vclTokens } from '../theme'

export type Status =
  | 'RUNNING'
  | 'IDLE'
  | 'DOWN'
  | 'LOW'
  | 'CRITICAL'
  | 'on-track'
  | 'behind'

interface Props {
  status: Status
  labelOverride?: string
}

const labelMap: Record<Status, string> = {
  RUNNING: 'RUNNING',
  IDLE: 'IDLE',
  DOWN: 'DOWN',
  LOW: 'LOW',
  CRITICAL: 'CRITICAL',
  'on-track': 'ON TRACK',
  behind: 'BEHIND',
}

const colorMap: Record<Status, { fg: string; bg: string; dot: string }> = {
  RUNNING: { fg: vclTokens.green, bg: vclTokens.greenLight, dot: vclTokens.green },
  'on-track': { fg: vclTokens.green, bg: vclTokens.greenLight, dot: vclTokens.green },
  IDLE: { fg: vclTokens.textMuted, bg: '#EEF0F6', dot: vclTokens.textMuted },
  LOW: { fg: vclTokens.amber, bg: vclTokens.amberLight, dot: vclTokens.amber },
  DOWN: { fg: vclTokens.red, bg: vclTokens.redLight, dot: vclTokens.red },
  CRITICAL: { fg: vclTokens.red, bg: vclTokens.redLight, dot: vclTokens.red },
  behind: { fg: vclTokens.red, bg: vclTokens.redLight, dot: vclTokens.red },
}

export default function StatusChip({ status, labelOverride }: Props) {
  const c = colorMap[status]
  return (
    <Chip
      size="small"
      label={labelOverride ?? labelMap[status]}
      icon={
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: c.dot,
            display: 'inline-block',
            marginLeft: 8,
          }}
        />
      }
      sx={{
        height: 22,
        fontSize: '0.66rem',
        fontWeight: 600,
        letterSpacing: '0.14em',
        color: c.fg,
        backgroundColor: c.bg,
        border: `1px solid ${c.fg}33`,
        '& .MuiChip-label': { px: 1 },
        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
      }}
    />
  )
}
