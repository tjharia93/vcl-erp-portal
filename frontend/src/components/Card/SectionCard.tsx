import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import SourceTag from '../SourceTag'
import type { SourceTag as Source } from '../../mock/types'

interface Props {
  id?: string
  title: string
  subtitle?: string
  source?: Source
  actions?: ReactNode
  children: ReactNode
}

export default function SectionCard({
  id,
  title,
  subtitle,
  source,
  actions,
  children,
}: Props) {
  return (
    <Paper id={id} elevation={0} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}
      >
        <Box>
          <Typography variant="h6" component="h2" sx={{ lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
          {actions}
          {source && <SourceTag source={source} />}
        </Stack>
      </Stack>
      {children}
    </Paper>
  )
}
