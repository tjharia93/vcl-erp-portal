import { Box, Stack, Typography } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { FONT_MONO } from '../theme'

export const DEV_SWITCHER_HEIGHT = 32

const routes = [
  { to: '/', label: 'LANDING' },
  { to: '/login', label: 'LOGIN' },
  { to: '/management', label: 'MGMT' },
  { to: '/sales-manager', label: 'SALES MGR' },
  { to: '/sales-rep', label: 'SALES REP' },
]

export default function DevSwitcher() {
  return (
    <Box
      role="navigation"
      aria-label="Dev route switcher"
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: DEV_SWITCHER_HEIGHT,
        zIndex: (t) => t.zIndex.modal + 10,
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px dashed #ED1C24',
        display: 'flex',
        alignItems: 'center',
        px: 1.5,
        overflowX: 'auto',
      }}
    >
      <Typography
        sx={{
          fontFamily: FONT_MONO,
          fontSize: '0.6rem',
          letterSpacing: '0.18em',
          color: '#ED1C24',
          fontWeight: 600,
          mr: 1.5,
          flexShrink: 0,
        }}
      >
        DEV ·
      </Typography>
      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
        {routes.map((r) => (
          <NavLink
            key={r.to}
            to={r.to}
            end={r.to === '/'}
            style={({ isActive }) => ({
              fontFamily: FONT_MONO,
              fontSize: '0.66rem',
              letterSpacing: '0.14em',
              padding: '4px 8px',
              borderRadius: 4,
              textDecoration: 'none',
              color: isActive ? '#fff' : '#1F2937',
              background: isActive ? '#2B3990' : 'transparent',
              border: '1px solid #D9DDE7',
              whiteSpace: 'nowrap',
            })}
          >
            {r.label}
          </NavLink>
        ))}
      </Stack>
    </Box>
  )
}
