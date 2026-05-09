import { Box, Button, Stack, Typography } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import FactoryIcon from '@mui/icons-material/Factory'
import InsightsIcon from '@mui/icons-material/Insights'
import VerifiedIcon from '@mui/icons-material/Verified'
import { Link as RouterLink } from 'react-router-dom'
import Logo from '../layout/Logo'
import { FONT_DISPLAY, FONT_MONO, vclTokens } from '../theme'

export default function Landing() {
  return (
    <Stack spacing={6}>
      <Box
        sx={{
          position: 'relative',
          py: { xs: 6, md: 9 },
          px: { xs: 2, md: 4 },
          borderRadius: 2,
          border: `1px solid ${vclTokens.border}`,
          backgroundColor: vclTokens.paper,
          overflow: 'hidden',
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(43,57,144,0.04) 0%, rgba(255,255,255,0) 50%), radial-gradient(700px 280px at 100% 0%, rgba(43,57,144,0.06), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ mb: 3 }}>
            <Logo size="md" />
          </Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.2rem', sm: '3rem', md: '3.8rem' },
              lineHeight: 1.05,
              color: vclTokens.text,
              maxWidth: 920,
            }}
          >
            Manufacturing &amp; distribution,
            <br />
            operated from one desk.
          </Typography>
          <Typography
            sx={{
              mt: 2.5,
              maxWidth: 640,
              fontFamily: FONT_DISPLAY,
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: vclTokens.textMuted,
              fontSize: { xs: '1rem', md: '1.15rem' },
            }}
          >
            Vimit Converters Limited &mdash; printing, packaging and supply, run on
            ERPNext and QuickBooks. Role-aware dashboards for management, sales and
            the shop floor.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
            >
              Open the Portal
            </Button>
            <Button
              component={RouterLink}
              to="/management"
              variant="outlined"
              color="primary"
              size="large"
            >
              Preview Management Desk
            </Button>
          </Stack>
          <Typography
            sx={{
              mt: 4,
              fontFamily: FONT_MONO,
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              color: vclTokens.textMuted,
            }}
          >
            LIVE FRAPPE DATA WHEN SIGNED IN · MOCK FALLBACK OTHERWISE
          </Typography>
        </Box>
      </Box>

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        sx={{ alignItems: 'stretch' }}
      >
        <FeatureBlock
          icon={<InsightsIcon />}
          title="Live KPIs"
          body="Revenue, cash, AR and margin from ERPNext + QBO, reconciled and surfaced where decisions happen."
        />
        <FeatureBlock
          icon={<FactoryIcon />}
          title="Floor visibility"
          body="OEE per machine, shift-by-shift. RUNNING / IDLE / DOWN at a glance."
        />
        <FeatureBlock
          icon={<VerifiedIcon />}
          title="Role-aware"
          body="Management, Sales Manager and Sales Rep each get the desk they need — nothing more."
        />
      </Stack>
    </Stack>
  )
}

interface FeatureBlockProps {
  icon: React.ReactNode
  title: string
  body: string
}

function FeatureBlock({ icon, title, body }: FeatureBlockProps) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 3,
        borderRadius: 2,
        border: `1px solid ${vclTokens.border}`,
        backgroundColor: vclTokens.paper,
      }}
    >
      <Box sx={{ color: vclTokens.blue, mb: 1.5 }}>{icon}</Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: vclTokens.textMuted, fontSize: '0.95rem' }}>
        {body}
      </Typography>
    </Box>
  )
}
