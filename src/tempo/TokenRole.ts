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

/**
 * Serializes a token role to its keccak256 hash representation.
 *
 * TIP-20 includes a built-in RBAC system with roles like `ISSUER_ROLE` (mint/burn),
 * `PAUSE_ROLE`/`UNPAUSE_ROLE` (emergency controls), and `BURN_BLOCKED_ROLE` (compliance).
 *
 * [TIP-20 RBAC](https://docs.tempo.xyz/protocol/tip20/overview#role-based-access-control-rbac)
 *
 * @example
 * ```ts twoslash
 * import { TokenRole } from 'ox/tempo'
 *
 * const hash = TokenRole.serialize('issuer')
 * ```
 *
 * @param role - The token role to serialize.
 * @returns The keccak256 hash of the role.
 */
export function serialize(role: TokenRole) {
  if (role === 'defaultAdmin')
    return '0x0000000000000000000000000000000000000000000000000000000000000000'
  return Hash.keccak256(
    Hex.fromString(toPreHashed[role as keyof typeof toPreHashed] ?? role),
  )
}
