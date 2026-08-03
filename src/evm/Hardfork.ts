import * as Errors from '../core/Errors.js'
import type { Compute } from '../core/internal/types.js'

/** Root type — an execution-layer hardfork name. */
export type Hardfork = 'cancun' | 'prague' | 'osaka'

/** Hardforks in activation order, oldest first. */
export const hardforks = [
  'cancun',
  'prague',
  'osaka',
] as const satisfies readonly Hardfork[]

/**
 * The newest hardfork activated on mainnet, and what execution defaults to.
 * Osaka — Fusaka's execution-layer name — activated 2025-12-03.
 */
export const latest = 'osaka' satisfies Hardfork

/**
 * Non-opcode gas and rule constants for a hardfork.
 *
 * Opcode-level costs live in the instruction table; this schedule carries the
 * constants the transaction layer and journal need. Rules a fork does not have
 * are `undefined` (for example `floorTokenGas` before Prague).
 */
export type GasSchedule = Compute<{
  /** Per-address access list charge (EIP-2930). */
  accessListAddressGas: bigint
  /** Per-storage-key access list charge (EIP-2930). */
  accessListStorageKeyGas: bigint
  /** Per-authorization intrinsic charge (EIP-7702). `undefined` before Prague. */
  authorizationGas: bigint | undefined
  /** Refund for an authority that already exists (EIP-7702). `undefined` before Prague. */
  authorizationRefund: bigint | undefined
  /** Blob schedule (EIP-4844, EIP-7691, EIP-7594). */
  blob: {
    /** Blob base fee exponentiation denominator. */
    baseFeeUpdateFraction: bigint
    /** Gas units one blob consumes. */
    gasPerBlob: bigint
    /** Maximum blobs per block. */
    max: number
    /** Maximum blobs per transaction (EIP-7594 caps this below `max` from Osaka). */
    maxPerTransaction: number
    /** Minimum blob base fee. */
    minBaseFee: bigint
    /** Target blobs per block. */
    target: number
  }
  /** Cold account access charge (EIP-2929). */
  coldAccountAccessGas: bigint
  /** Cold storage slot access charge (EIP-2929). */
  coldSloadGas: bigint
  /** Per-token calldata floor price (EIP-7623). `undefined` before Prague. */
  floorTokenGas: bigint | undefined
  /** Per-32-byte-word initcode charge (EIP-3860). */
  initcodeWordGas: bigint
  /** Maximum deployed code size in bytes (EIP-170). */
  maxCodeSize: number
  /** Maximum initcode size in bytes (EIP-3860). */
  maxInitcodeSize: number
  /** Gas refund cap divisor (EIP-3529). */
  refundQuotient: bigint
  /** Base transaction charge. */
  txGas: bigint
  /** Additional charge for a create transaction. */
  txCreateGas: bigint
  /** Per-nonzero-calldata-byte charge (EIP-2028). */
  txDataNonzeroGas: bigint
  /** Per-zero-calldata-byte charge. */
  txDataZeroGas: bigint
  /** Transaction gas limit cap (EIP-7825). `undefined` before Osaka. */
  txGasLimitCap: bigint | undefined
  /** Warm state access charge (EIP-2929). */
  warmReadGas: bigint
}>

/**
 * Returns whether `hardfork` is at or after `min` in activation order.
 *
 * @example
 * ```ts twoslash
 * import { Hardfork } from 'ox/evm'
 *
 * Hardfork.atLeast('osaka', 'prague')
 * // @log: true
 *
 * Hardfork.atLeast('cancun', 'prague')
 * // @log: false
 * ```
 *
 * @param hardfork - Hardfork to test.
 * @param min - Hardfork it must be at or after.
 * @returns Whether `hardfork` is at or after `min`.
 */
export function atLeast(hardfork: Hardfork, min: Hardfork): boolean {
  return index(hardfork) >= index(min)
}

export declare namespace atLeast {
  type ErrorType = UnknownHardforkError | Errors.GlobalErrorType
}

/**
 * Returns the gas schedule for a hardfork.
 *
 * Named forks carry their activation-time blob schedule; blob-parameter-only
 * (BPO) forks are expressed by merging overrides over this schedule rather
 * than by new names.
 *
 * @example
 * ```ts twoslash
 * import { Hardfork } from 'ox/evm'
 *
 * const gas = Hardfork.gas('osaka')
 * gas.txGas
 * // @log: 21000n
 * gas.txGasLimitCap
 * // @log: 16777216n
 * ```
 *
 * @param hardfork - Hardfork whose schedule to return.
 * @returns The gas schedule.
 */
export function gas(hardfork: Hardfork): GasSchedule {
  index(hardfork)
  const prague = atLeast(hardfork, 'prague')
  const osaka = atLeast(hardfork, 'osaka')
  return {
    accessListAddressGas: 2400n,
    accessListStorageKeyGas: 1900n,
    authorizationGas: prague ? 25_000n : undefined,
    authorizationRefund: prague ? 12_500n : undefined,
    blob: {
      baseFeeUpdateFraction: prague ? 5_007_716n : 3_338_477n,
      gasPerBlob: 131_072n,
      max: prague ? 9 : 6,
      maxPerTransaction: osaka ? 6 : prague ? 9 : 6,
      minBaseFee: 1n,
      target: prague ? 6 : 3,
    },
    coldAccountAccessGas: 2600n,
    coldSloadGas: 2100n,
    floorTokenGas: prague ? 10n : undefined,
    initcodeWordGas: 2n,
    maxCodeSize: 24_576,
    maxInitcodeSize: 49_152,
    refundQuotient: 5n,
    txGas: 21_000n,
    txCreateGas: 32_000n,
    txDataNonzeroGas: 16n,
    txDataZeroGas: 4n,
    txGasLimitCap: osaka ? 16_777_216n : undefined,
    warmReadGas: 100n,
  }
}

export declare namespace gas {
  type ErrorType = UnknownHardforkError | Errors.GlobalErrorType
}

function index(hardfork: Hardfork): number {
  const position = (hardforks as readonly string[]).indexOf(hardfork)
  if (position === -1) throw new UnknownHardforkError({ hardfork })
  return position
}

/** Thrown when a hardfork name is not one the EVM implements. */
export class UnknownHardforkError extends Errors.BaseError {
  override readonly name = 'Hardfork.UnknownHardforkError'

  constructor({ hardfork }: { hardfork: string }) {
    super(`Unknown hardfork \`${hardfork}\`.`, {
      metaMessages: [`Known hardforks: ${hardforks.join(', ')}.`],
    })
  }
}
