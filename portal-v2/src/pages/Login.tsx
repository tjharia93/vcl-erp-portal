import {
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
import { FONT_MONO } from '../theme'

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

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 2, md: 6 } }}>
      <Paper
        elevation={0}
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 } }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: '#fff' }}>
              SIGN IN
            </Typography>
            <Typography
              sx={{
                fontFamily: FONT_MONO,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                color: 'rgba(231,234,242,0.5)',
                mt: 0.5,
              }}
            >
              VCL PORTAL · EMPLOYEE ACCESS
            </Typography>
          </Box>

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
                color: 'rgba(231,234,242,0.5)',
                mb: 1,
              }}
            >
              ROLE
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
                  color: 'rgba(231,234,242,0.78)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  fontWeight: 500,
                  px: 2,
                },
                '& .Mui-selected': {
                  backgroundColor: 'rgba(43,57,144,0.35) !important',
                  color: '#fff !important',
                  borderColor: 'rgba(61,77,184,0.6) !important',
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
            Sign in
          </Button>

          <Typography
            sx={{
              fontFamily: FONT_MONO,
              fontSize: '0.65rem',
              letterSpacing: '0.14em',
              color: 'rgba(231,234,242,0.4)',
              textAlign: 'center',
            }}
          >
            PROTOTYPE · NO REAL AUTH · ROLE STORED LOCALLY
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
