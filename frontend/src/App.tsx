import { CssBaseline, ThemeProvider } from '@mui/material'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import theme from './theme'
import AppShell from './layout/AppShell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Management from './pages/Management'
import SalesManager from './pages/SalesManager'
import SalesRep from './pages/SalesRep'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename="/portal-v2">
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="management" element={<Management />} />
            <Route path="sales-manager" element={<SalesManager />} />
            <Route path="sales-rep" element={<SalesRep />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
