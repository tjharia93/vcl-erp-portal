import type { Role } from './mock/types'

const KEY = 'vcl.role'

export function getRole(): Role | null {
  const v = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null
  if (v === 'management' || v === 'sales-manager' || v === 'sales-rep') return v
  return null
}

export function setRole(role: Role): void {
  window.localStorage.setItem(KEY, role)
}

export function clearRole(): void {
  window.localStorage.removeItem(KEY)
}

export function roleHomePath(role: Role | null): string {
  switch (role) {
    case 'management':
      return '/management'
    case 'sales-manager':
      return '/sales-manager'
    case 'sales-rep':
      return '/sales-rep'
    default:
      return '/login'
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'management':
      return 'Management'
    case 'sales-manager':
      return 'Sales Manager'
    case 'sales-rep':
      return 'Sales Rep'
  }
}
