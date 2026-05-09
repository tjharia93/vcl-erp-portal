import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material'
import DashboardIcon from '@mui/icons-material/SpaceDashboard'
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceWallet'
import InventoryIcon from '@mui/icons-material/Inventory2'
import FactoryIcon from '@mui/icons-material/Factory'
import GroupsIcon from '@mui/icons-material/Groups'
import TimelineIcon from '@mui/icons-material/Timeline'
import FlagIcon from '@mui/icons-material/Flag'
import ReceiptIcon from '@mui/icons-material/ReceiptLong'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import { useState } from 'react'
import type { Role } from '../mock/types'
import { DEV_SWITCHER_HEIGHT } from './DevSwitcher'

interface Item {
  label: string
  anchor: string
  icon: React.ReactNode
}

export const BOTTOM_NAV_HEIGHT = 60

const itemsByRole: Record<Role, Item[]> = {
  management: [
    { label: 'Overview', anchor: 'kpis', icon: <DashboardIcon /> },
    { label: 'Cash', anchor: 'cash', icon: <AccountBalanceIcon /> },
    { label: 'Stock', anchor: 'stock', icon: <InventoryIcon /> },
    { label: 'Floor', anchor: 'production', icon: <FactoryIcon /> },
  ],
  'sales-manager': [
    { label: 'Team', anchor: 'team', icon: <GroupsIcon /> },
    { label: 'Pipeline', anchor: 'pipeline', icon: <TimelineIcon /> },
    { label: 'Progress', anchor: 'progress', icon: <FlagIcon /> },
  ],
  'sales-rep': [
    { label: 'Target', anchor: 'target', icon: <FlagIcon /> },
    { label: 'Orders', anchor: 'orders', icon: <ReceiptIcon /> },
    { label: 'AR', anchor: 'ar', icon: <RequestQuoteIcon /> },
  ],
}

interface Props {
  role: Role
}

export default function BottomNav({ role }: Props) {
  const items = itemsByRole[role]
  const [value, setValue] = useState(0)

  const handleChange = (_: unknown, newValue: number) => {
    setValue(newValue)
    const target = document.getElementById(items[newValue].anchor)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: DEV_SWITCHER_HEIGHT,
        zIndex: (t) => t.zIndex.appBar,
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255,255,255,0.96)',
        display: { xs: 'block', md: 'none' },
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{ height: BOTTOM_NAV_HEIGHT, backgroundColor: 'transparent' }}
      >
        {items.map((it) => (
          <BottomNavigationAction key={it.anchor} label={it.label} icon={it.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
