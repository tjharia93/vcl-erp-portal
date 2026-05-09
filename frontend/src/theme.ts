import { createTheme } from '@mui/material/styles'

// VCL Brand Standards v1.0 — light surfaces, navy primary used sparingly,
// red restricted to true error / alert states. Tokens mirror the existing
// vcl_portal/public/css/vcl-website.css so portal-v2 visually aligns with
// /home and /uat (Avery-Dennison-style refinement).
const VCL_BG = '#F5F6FA'
const VCL_PAPER = '#FFFFFF'
const VCL_PAPER_ALT = '#FAFBFD'
const VCL_BORDER = '#D9DDE7'
const VCL_BORDER_HI = '#C4CADA'
const VCL_BLUE = '#2B3990'
const VCL_BLUE_DARK = '#1D2766'
const VCL_BLUE_PALE = '#F4F6FC'
const VCL_RED = '#ED1C24'
const VCL_RED_LIGHT = '#FBEAE7'
const VCL_AMBER = '#B86B00'
const VCL_AMBER_LIGHT = '#FCF3DF'
const VCL_GREEN = '#1B7A45'
const VCL_GREEN_LIGHT = '#E5F1EC'
const VCL_TEXT = '#1F2937'
const VCL_TEXT_MUTED = '#6B7280'

export const FONT_DISPLAY = '"Barlow Condensed", "Barlow", system-ui, sans-serif'
export const FONT_BODY = '"Barlow", system-ui, -apple-system, sans-serif'
export const FONT_MONO = '"IBM Plex Mono", ui-monospace, monospace'

export const vclTokens = {
  bg: VCL_BG,
  paper: VCL_PAPER,
  paperAlt: VCL_PAPER_ALT,
  border: VCL_BORDER,
  borderHi: VCL_BORDER_HI,
  blue: VCL_BLUE,
  blueDark: VCL_BLUE_DARK,
  bluePale: VCL_BLUE_PALE,
  red: VCL_RED,
  redLight: VCL_RED_LIGHT,
  amber: VCL_AMBER,
  amberLight: VCL_AMBER_LIGHT,
  green: VCL_GREEN,
  greenLight: VCL_GREEN_LIGHT,
  text: VCL_TEXT,
  textMuted: VCL_TEXT_MUTED,
} as const

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: VCL_BLUE, dark: VCL_BLUE_DARK, light: '#5C6DBE', contrastText: '#fff' },
    error: { main: VCL_RED, light: VCL_RED_LIGHT, contrastText: '#fff' },
    warning: { main: VCL_AMBER, light: VCL_AMBER_LIGHT, contrastText: '#fff' },
    success: { main: VCL_GREEN, light: VCL_GREEN_LIGHT, contrastText: '#fff' },
    background: { default: VCL_BG, paper: VCL_PAPER },
    text: { primary: VCL_TEXT, secondary: VCL_TEXT_MUTED },
    divider: VCL_BORDER,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: FONT_BODY,
    h1: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '0.005em', color: VCL_TEXT },
    h2: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '0.01em', color: VCL_TEXT },
    h3: { fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '0.02em', color: VCL_TEXT },
    h4: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.02em', color: VCL_TEXT },
    h5: { fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.03em', color: VCL_TEXT },
    h6: {
      fontFamily: FONT_DISPLAY,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      color: VCL_TEXT,
      fontSize: '0.95rem',
    },
    button: { fontFamily: FONT_BODY, fontWeight: 600, letterSpacing: '0.02em', textTransform: 'none' },
    overline: { fontFamily: FONT_MONO, fontWeight: 500, letterSpacing: '0.14em', color: VCL_TEXT_MUTED },
    caption: { fontFamily: FONT_BODY, color: VCL_TEXT_MUTED },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: VCL_BG, color: VCL_TEXT },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${VCL_BORDER}`,
          boxShadow: '0 1px 0 rgba(8,12,23,0.04)',
        },
        elevation0: { boxShadow: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: VCL_PAPER,
          color: VCL_TEXT,
          borderBottom: `1px solid ${VCL_BORDER}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6 },
        outlined: { borderColor: VCL_BORDER_HI },
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
          backgroundColor: '#EEF0F6',
        },
        bar: { borderRadius: 4 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${VCL_BORDER}` },
        head: {
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: '0.74rem',
          color: VCL_TEXT_MUTED,
          backgroundColor: VCL_PAPER_ALT,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: VCL_BLUE_PALE },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: VCL_TEXT_MUTED,
          '&.Mui-selected': { color: VCL_BLUE },
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
