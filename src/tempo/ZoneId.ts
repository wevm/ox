import * as Errors from '../core/Errors.js'

/**
 * Base offset for deriving zone chain IDs.
 *
 * Zone chain IDs are computed as `chainIdBase + zoneId`.
 */
export const chainIdBase = 421_700_000 as const

/**
 * Derives a zone ID from a zone chain ID.
 *
 * Zone chain IDs follow the formula `421_700_000 + zoneId`, so a chain ID
 * of `4217000026` corresponds to zone ID `26`.
 *
 * @example
 * ```ts twoslash
 * import { ZoneId } from 'ox/tempo'
 *
 * const zoneId = ZoneId.fromChainId(421_700_026)
 * // @log: 26
 * ```
 *
 * @param chainId - The zone chain ID.
 * @returns The zone ID.
 */
export function fromChainId(chainId: number): number {
  return chainId - chainIdBase
}

export declare namespace fromChainId {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Derives a zone chain ID from a zone ID.
 *
 * Zone chain IDs follow the formula `421_700_000 + zoneId`, so zone ID
 * `26` corresponds to chain ID `4217000026`.
 *
 * @example
 * ```ts twoslash
 * import { ZoneId } from 'ox/tempo'
 *
 * const chainId = ZoneId.toChainId(26)
 * // @log: 421700026
 * ```
 *
 * @param zoneId - The zone ID.
 * @returns The zone chain ID.
 */
export function toChainId(zoneId: number): number {
  return chainIdBase + zoneId
}

export declare namespace toChainId {
  type ErrorType = Errors.GlobalErrorType
}
