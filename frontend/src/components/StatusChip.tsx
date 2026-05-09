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
  RUNNING: { fg: vclTokens.green, bg: 'rgba(62,180,137,0.12)', dot: vclTokens.green },
  'on-track': { fg: vclTokens.green, bg: 'rgba(62,180,137,0.12)', dot: vclTokens.green },
  IDLE: { fg: 'rgba(231,234,242,0.78)', bg: 'rgba(255,255,255,0.06)', dot: 'rgba(231,234,242,0.5)' },
  LOW: { fg: vclTokens.amber, bg: 'rgba(242,168,59,0.12)', dot: vclTokens.amber },
  DOWN: { fg: vclTokens.red, bg: 'rgba(237,28,36,0.14)', dot: vclTokens.red },
  CRITICAL: { fg: vclTokens.red, bg: 'rgba(237,28,36,0.14)', dot: vclTokens.red },
  behind: { fg: vclTokens.red, bg: 'rgba(237,28,36,0.14)', dot: vclTokens.red },
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
