import { Box, Container, useMediaQuery, useTheme } from '@mui/material'
import { Outlet, useLocation } from 'react-router-dom'
import TopAppBar from './TopAppBar'
import BottomNav, { BOTTOM_NAV_HEIGHT } from './BottomNav'
import DevSwitcher, { DEV_SWITCHER_HEIGHT } from './DevSwitcher'
import { getRole } from '../auth'
import type { Role } from '../mock/types'

const ROLE_PATH: Record<string, Role> = {
  '/management': 'management',
  '/sales-manager': 'sales-manager',
  '/sales-rep': 'sales-rep',
}

export default function AppShell() {
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const isPublic = location.pathname === '/' || location.pathname === '/login'
  const pathRole = ROLE_PATH[location.pathname]
  const role = pathRole ?? getRole()

  const showBottomNav = !isPublic && role !== null && isMobile

  const bottomPad =
    DEV_SWITCHER_HEIGHT + (showBottomNav ? BOTTOM_NAV_HEIGHT : 0) + 16

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopAppBar mode={isPublic ? 'public' : 'auth'} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container
          maxWidth="xl"
          sx={{
            py: { xs: 2.5, md: 4 },
            pb: `${bottomPad}px`,
          }}
        >
          <Outlet />
        </Container>
      </Box>
      {showBottomNav && role && <BottomNav role={role} />}
      <DevSwitcher />
    </Box>
  )
}
