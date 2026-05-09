import type { MachineStatus } from './types'

export const production: MachineStatus[] = [
  { id: 'CI-FLEXO-1', name: 'CI Flexo 8-colour #1', oee: 84, status: 'RUNNING' },
  { id: 'ROTO-2', name: 'Rotogravure #2', oee: 71, status: 'RUNNING' },
  { id: 'LAM-1', name: 'Solventless Lam #1', oee: 0, status: 'DOWN' },
  { id: 'SLITTER-3', name: 'Slitter Rewinder #3', oee: 58, status: 'IDLE' },
  { id: 'POUCH-1', name: 'Pouch Maker #1', oee: 92, status: 'RUNNING' },
]
