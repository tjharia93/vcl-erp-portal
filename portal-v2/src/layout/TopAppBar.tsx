import { AppBar, Box, Button, Stack, Toolbar } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LoginIcon from '@mui/icons-material/Login'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { getRole, roleHomePath } from '../auth'

interface Props {
  mode: 'public' | 'auth'
}

export default function TopAppBar({ mode }: Props) {
  const navigate = useNavigate()

  const handleBackToDesk = () => {
    const role = getRole()
    navigate(roleHomePath(role))
  }

  return (
    <AppBar position="sticky" color="transparent">
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 2, sm: 3 } }}>
        <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Logo />
        </RouterLink>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          {mode === 'public' ? (
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              color="primary"
              startIcon={<LoginIcon />}
              size="small"
            >
              Login
            </Button>
          ) : (
            <Button
              onClick={handleBackToDesk}
              variant="outlined"
              color="inherit"
              startIcon={<ArrowBackIcon />}
              size="small"
              sx={{ borderColor: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              Back to Desk
            </Button>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
