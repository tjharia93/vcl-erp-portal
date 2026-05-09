import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginIcon from '@mui/icons-material/Login'
import { roleHomePath, setRole } from '../auth'
import type { Role } from '../mock/types'
import { FONT_MONO, vclTokens } from '../theme'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRoleState] = useState<Role>('management')
  const [email, setEmail] = useState('rohan.mehta@vimit.com')
  const [password, setPassword] = useState('demo')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setRole(role)
    navigate(roleHomePath(role))
  }

  const frappeLoginHref =
    '/login?redirect-to=' + encodeURIComponent('/portal-v2' + roleHomePath(role))

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 2, md: 6 } }}>
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 4 } }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1">
              Sign in
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_MONO,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                color: vclTokens.textMuted,
                mt: 0.5,
              }}
            >
              VCL PORTAL · EMPLOYEE ACCESS
            </Typography>
          </Box>

          <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
            For live data, sign in to Frappe via{' '}
            <Box component="a" href={frappeLoginHref} sx={{ color: 'primary.main', fontWeight: 600 }}>
              /login
            </Box>
            . The form below is a role preview and does not authenticate.
          </Alert>

          <Stack spacing={2}>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoComplete="email"
              size="small"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
              size="small"
            />
          </Stack>

          <Box>
            <Typography
              sx={{
                fontFamily: FONT_MONO,
                fontSize: '0.68rem',
                letterSpacing: '0.16em',
                color: vclTokens.textMuted,
                mb: 1,
              }}
            >
              PREVIEW AS ROLE
            </Typography>
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(_, v) => v && setRoleState(v as Role)}
              fullWidth
              size="small"
              orientation="vertical"
              sx={{
                '& .MuiToggleButton-root': {
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  letterSpacing: 'normal',
                  fontWeight: 500,
                  px: 2,
                },
              }}
            >
              <ToggleButton value="management">Management</ToggleButton>
              <ToggleButton value="sales-manager">Sales Manager</ToggleButton>
              <ToggleButton value="sales-rep">Sales Rep</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            startIcon={<LoginIcon />}
          >
            Open preview
          </Button>

          <Typography
            sx={{
              fontFamily: FONT_MONO,
              fontSize: '0.65rem',
              letterSpacing: '0.14em',
              color: vclTokens.textMuted,
              textAlign: 'center',
            }}
          >
            ROLE STORED LOCALLY · LIVE DATA REQUIRES FRAPPE SESSION
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
