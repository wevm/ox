import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'

export const roles = [
  'defaultAdmin',
  'pause',
  'unpause',
  'issuer',
  'burnBlocked',
] as const
export type TokenRole = (typeof roles)[number]

export const toPreHashed = {
  defaultAdmin: 'DEFAULT_ADMIN_ROLE',
  pause: 'PAUSE_ROLE',
  unpause: 'UNPAUSE_ROLE',
  issuer: 'ISSUER_ROLE',
  burnBlocked: 'BURN_BLOCKED_ROLE',
} as const satisfies Record<TokenRole, string>

export function serialize(role: TokenRole) {
  if (role === 'defaultAdmin')
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  return Hash.keccak256(
    Hex.fromString(toPreHashed[role as keyof typeof toPreHashed] ?? role),
  )
}
