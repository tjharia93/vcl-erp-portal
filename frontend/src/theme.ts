import { createTheme } from '@mui/material/styles'

const VCL_NAVY = '#080C17'
const VCL_PAPER = '#0E1426'
const VCL_PAPER_HI = '#141B30'
const VCL_BORDER = 'rgba(255,255,255,0.08)'
const VCL_BORDER_HI = 'rgba(255,255,255,0.16)'
const VCL_BLUE = '#2B3990'
const VCL_BLUE_HI = '#3D4DB8'
const VCL_RED = '#ED1C24'
const VCL_AMBER = '#F2A83B'
const VCL_GREEN = '#3EB489'

export const FONT_DISPLAY = '"Barlow Condensed", "Barlow", system-ui, sans-serif'
export const FONT_BODY = '"Barlow", system-ui, -apple-system, sans-serif'
export const FONT_MONO = '"IBM Plex Mono", ui-monospace, monospace'

export const vclTokens = {
  navy: VCL_NAVY,
  paper: VCL_PAPER,
  paperHi: VCL_PAPER_HI,
  border: VCL_BORDER,
  borderHi: VCL_BORDER_HI,
  blue: VCL_BLUE,
  red: VCL_RED,
  amber: VCL_AMBER,
  green: VCL_GREEN,
} as const

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: VCL_BLUE, light: VCL_BLUE_HI, contrastText: '#fff' },
    error: { main: VCL_RED, contrastText: '#fff' },
    warning: { main: VCL_AMBER, contrastText: '#0B0F1A' },
    success: { main: VCL_GREEN, contrastText: '#0B0F1A' },
    background: { default: VCL_NAVY, paper: VCL_PAPER },
    text: {
      primary: '#E7EAF2',
      secondary: 'rgba(231,234,242,0.66)',
      disabled: 'rgba(231,234,242,0.36)',
    },
    divider: VCL_BORDER,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: FONT_BODY,
    h1: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '0.01em' },
    h2: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '0.01em' },
    h3: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '0.02em' },
    h4: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.02em' },
    h5: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.03em' },
    h6: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' },
    button: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' },
    overline: { fontFamily: FONT_MONO, fontWeight: 500, letterSpacing: '0.12em' },
    caption: { fontFamily: FONT_BODY },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: VCL_NAVY,
          backgroundImage:
            'radial-gradient(1200px 600px at 10% -10%, rgba(43,57,144,0.18), transparent 60%), radial-gradient(800px 500px at 90% 0%, rgba(237,28,36,0.06), transparent 70%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${VCL_BORDER}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(8,12,23,0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${VCL_BORDER}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontFamily: FONT_MONO, letterSpacing: '0.08em' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.06)',
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${VCL_BORDER}`,
        },
        head: {
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: '0.78rem',
          color: 'rgba(231,234,242,0.6)',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: 'rgba(231,234,242,0.55)',
          '&.Mui-selected': { color: '#fff' },
        },
        label: {
          fontFamily: FONT_DISPLAY,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
        },
      },
    },
  },
})

export default theme
