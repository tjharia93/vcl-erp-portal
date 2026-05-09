import { Alert } from '@mui/material'
import { isAuthError } from '../api/hooks'

interface Props {
  error: Error | null
  compact?: boolean
}

// Soft warning rendered on a card when the live Frappe call failed.
// On auth errors we hint the user toward Frappe login; on other errors we
// show a generic "live data unavailable" note. Either way the card still
// renders mock data behind the banner so the UI doesn't break.
export default function FallbackBanner({ error, compact }: Props) {
  if (!error) return null
  const auth = isAuthError(error)
  return (
    <Alert
      severity={auth ? 'info' : 'warning'}
      variant="outlined"
      sx={{
        mb: compact ? 1 : 2,
        py: 0.5,
        '& .MuiAlert-message': { fontSize: '0.78rem', lineHeight: 1.3 },
      }}
    >
      {auth ? (
        <>
          Showing sample data. Sign in to Frappe via{' '}
          <a href="/login" style={{ color: 'inherit', fontWeight: 600 }}>
            /login
          </a>{' '}
          to load live numbers.
        </>
      ) : (
        <>Live data unavailable; showing sample. ({error.message})</>
      )}
    </Alert>
  )
}
