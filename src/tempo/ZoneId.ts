import * as Errors from '../core/Errors.js'

const chainIdConfig = {
  4_217: {
    base: 421_700_000,
    range: 1_002_610_000,
  },
  42_431: {
    base: 1_424_310_000,
    range: 723_173_648,
  },
} as const

const defaultSourceId = 4_217

/**
 * Base offset for deriving Presto zone chain IDs.
 */
export const chainIdBase = chainIdConfig[defaultSourceId].base

/** Tempo source chain ID. */
export type SourceId = keyof typeof chainIdConfig

/**
 * Derives a zone ID from a zone chain ID.
 *
 * Zone chain IDs use the base assigned to their Tempo source chain.
 *
 * @example
 * ```ts twoslash
 * import { ZoneId } from 'ox/tempo'
 *
 * const zoneId = ZoneId.fromChainId(421_700_001)
 * // @log: 1
 * ```
 *
 * @param chainId - The zone chain ID.
 * @param sourceId - The Tempo source chain ID. Defaults to `4217` (Presto).
 * @returns The zone ID.
 */
export function fromChainId(
  chainId: number,
  sourceId: SourceId = defaultSourceId,
): number {
  return chainId - getChainIdConfig(sourceId).base
}

export declare namespace fromChainId {
  type ErrorType = typeof UnsupportedSourceIdError | Errors.GlobalErrorType
}

/**
 * Derives a zone chain ID from a zone ID.
 *
 * Zone chain IDs use the base and range assigned to their Tempo source chain.
 *
 * @example
 * ```ts twoslash
 * import { ZoneId } from 'ox/tempo'
 *
 * const chainId = ZoneId.toChainId(1)
 * // @log: 421700001
 * ```
 *
 * @param zoneId - The zone ID.
 * @param sourceId - The Tempo source chain ID. Defaults to `4217` (Presto).
 * @returns The zone chain ID.
 */
export function toChainId(
  zoneId: number,
  sourceId: SourceId = defaultSourceId,
): number {
  const { base, range } = getChainIdConfig(sourceId)
  return base + (zoneId % range)
}

export declare namespace toChainId {
  type ErrorType = typeof UnsupportedSourceIdError | Errors.GlobalErrorType
}

/** Thrown when a Tempo source chain ID is unsupported. */
export class UnsupportedSourceIdError extends Errors.BaseError {
  override readonly name = 'ZoneId.UnsupportedSourceIdError'
  constructor({ sourceId }: { sourceId: number }) {
    super(`Source chain ID "${sourceId}" is not supported.`, {
      metaMessages: ['Supported source chain IDs: 4217, 42431.'],
    })
  }
}

function getChainIdConfig(sourceId: number) {
  if (sourceId === 4_217 || sourceId === 42_431) return chainIdConfig[sourceId]
  throw new UnsupportedSourceIdError({ sourceId })
}
