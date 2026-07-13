import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute, OneOf } from './internal/types.js'

export type FeeHistory<bigintType = bigint> = Compute<{
  /**
   * An array of block base fees per gas (in wei). This includes the next block after
   * the newest of the returned range, because this value can be derived from the newest block.
   * Zeroes are returned for pre-EIP-1559 blocks. */
  baseFeePerGas: bigintType[]
  /** An array of block gas used ratios. These are calculated as the ratio of gasUsed and gasLimit. */
  gasUsedRatio: number[]
  /** Lowest number block of the returned range. */
  oldestBlock: bigintType
  /** An array of effective priority fees (in wei) per gas data points from a single block. All zeroes are returned if the block is empty. */
  reward?: bigintType[][] | undefined
}>

export type FeeHistoryRpc = FeeHistory<Hex.Hex>

export type FeeValuesLegacy<bigintType = bigint> = {
  /** Base fee per gas. */
  gasPrice: bigintType
}

export type FeeValuesLegacyRpc = FeeValuesLegacy<Hex.Hex>

export type FeeValuesEip1559<bigintType = bigint> = {
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas: bigintType
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas: bigintType
}

export type FeeValuesEip1559Rpc = FeeValuesEip1559<Hex.Hex>

export type FeeValuesEip4844<bigintType = bigint> = {
  /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
  maxFeePerBlobGas: bigintType
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas: bigintType
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas: bigintType
}

export type FeeValuesEip4844Rpc = FeeValuesEip4844<Hex.Hex>

export type FeeValues<bigintType = bigint> = OneOf<
  | FeeValuesLegacy<bigintType>
  | FeeValuesEip1559<bigintType>
  | FeeValuesEip4844<bigintType>
>

export type FeeValuesRpc = OneOf<
  FeeValuesLegacyRpc | FeeValuesEip1559Rpc | FeeValuesEip4844Rpc
>

export type FeeValuesType = 'legacy' | 'eip1559' | 'eip4844'

/**
 * Converts a {@link ox#Fee.FeeHistoryRpc} to a {@link ox#Fee.FeeHistory}.
 *
 * @example
 * ```ts twoslash
 * import { Fee } from 'ox'
 *
 * const history = Fee.fromHistoryRpc({
 *   baseFeePerGas: ['0x01', '0x02'],
 *   gasUsedRatio: [0.5, 0.6],
 *   oldestBlock: '0x10',
 *   reward: [['0x01']]
 * })
 * // @log: { baseFeePerGas: [1n, 2n], gasUsedRatio: [0.5, 0.6], oldestBlock: 16n, reward: [[1n]] }
 * ```
 *
 * @param history - The RPC fee history to convert.
 * @returns An instantiated {@link ox#Fee.FeeHistory}.
 */
export function fromHistoryRpc(history: FeeHistoryRpc): FeeHistory {
  return {
    baseFeePerGas: history.baseFeePerGas.map((value) => BigInt(value)),
    gasUsedRatio: history.gasUsedRatio,
    oldestBlock: BigInt(history.oldestBlock),
    ...(history.reward
      ? {
          reward: history.reward.map((row) =>
            row.map((value) => BigInt(value)),
          ),
        }
      : {}),
  }
}

export declare namespace fromHistoryRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Fee.FeeHistory} to a {@link ox#Fee.FeeHistoryRpc}.
 *
 * @example
 * ```ts twoslash
 * import { Fee } from 'ox'
 *
 * const rpc = Fee.toHistoryRpc({
 *   baseFeePerGas: [1n, 2n],
 *   gasUsedRatio: [0.5, 0.6],
 *   oldestBlock: 16n,
 *   reward: [[1n]]
 * })
 * ```
 *
 * @param history - The fee history to convert.
 * @returns An RPC fee history.
 */
export function toHistoryRpc(history: FeeHistory): FeeHistoryRpc {
  return {
    baseFeePerGas: history.baseFeePerGas.map((value) => Hex.fromNumber(value)),
    gasUsedRatio: history.gasUsedRatio,
    oldestBlock: Hex.fromNumber(history.oldestBlock),
    ...(history.reward
      ? {
          reward: history.reward.map((row) =>
            row.map((value) => Hex.fromNumber(value)),
          ),
        }
      : {}),
  }
}

export declare namespace toHistoryRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Estimates a `maxFeePerGas` from a base fee, a priority tip, and a multiplier
 * applied to the base fee:
 *
 * ```
 * maxFeePerGas = baseFeePerGas * multiplier + maxPriorityFeePerGas
 * ```
 *
 * The multiplier is supplied as `multiplierNumerator / multiplierDenominator`
 * to keep the math in `bigint`. The default is `2 / 1` (i.e. 2x), matching the
 * common wallet/relay heuristic for headroom against base-fee bumps.
 *
 * @example
 * ```ts twoslash
 * import { Fee } from 'ox'
 *
 * Fee.estimateMaxFeePerGas({
 *   baseFeePerGas: 100n,
 *   maxPriorityFeePerGas: 5n
 * })
 * // @log: 205n
 *
 * Fee.estimateMaxFeePerGas({
 *   baseFeePerGas: 100n,
 *   maxPriorityFeePerGas: 5n,
 *   multiplierNumerator: 3n,
 *   multiplierDenominator: 2n
 * })
 * // @log: 155n  (= 100n * 3n / 2n + 5n)
 * ```
 *
 * @param args.baseFeePerGas - Block base fee per gas.
 * @param args.maxPriorityFeePerGas - Tip per gas.
 * @param args.multiplierNumerator - Numerator of the base-fee multiplier (default `2n`).
 * @param args.multiplierDenominator - Denominator of the base-fee multiplier (default `1n`).
 * @returns Suggested `maxFeePerGas`.
 */
export function estimateMaxFeePerGas(args: {
  baseFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  multiplierNumerator?: bigint | undefined
  multiplierDenominator?: bigint | undefined
}): bigint {
  const {
    baseFeePerGas,
    maxPriorityFeePerGas,
    multiplierNumerator = 2n,
    multiplierDenominator = 1n,
  } = args
  return (
    (baseFeePerGas * multiplierNumerator) / multiplierDenominator +
    maxPriorityFeePerGas
  )
}

export declare namespace estimateMaxFeePerGas {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Computes the effective gas price an EIP-1559 transaction will pay:
 *
 * ```
 * effective = min(maxFeePerGas, baseFeePerGas + maxPriorityFeePerGas)
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Fee } from 'ox'
 *
 * Fee.effectiveGasPrice({
 *   baseFeePerGas: 100n,
 *   maxFeePerGas: 200n,
 *   maxPriorityFeePerGas: 50n
 * })
 * // @log: 150n  (= 100n + 50n)
 *
 * Fee.effectiveGasPrice({
 *   baseFeePerGas: 100n,
 *   maxFeePerGas: 120n,
 *   maxPriorityFeePerGas: 50n
 * })
 * // @log: 120n  (capped at maxFeePerGas)
 * ```
 *
 * @param args.baseFeePerGas - Block base fee per gas.
 * @param args.maxFeePerGas - Sender-supplied `maxFeePerGas`.
 * @param args.maxPriorityFeePerGas - Sender-supplied tip.
 * @returns Effective gas price (in wei).
 */
export function effectiveGasPrice(args: {
  baseFeePerGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}): bigint {
  const { baseFeePerGas, maxFeePerGas, maxPriorityFeePerGas } = args
  const ceiling = baseFeePerGas + maxPriorityFeePerGas
  return ceiling < maxFeePerGas ? ceiling : maxFeePerGas
}

export declare namespace effectiveGasPrice {
  type ErrorType = Errors.GlobalErrorType
}
