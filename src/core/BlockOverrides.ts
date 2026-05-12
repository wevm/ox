import type * as Address from './Address.js'
import type * as Hex from './Hex.js'
import * as Quantity from './internal/quantity.js'
import * as Withdrawal from './Withdrawal.js'

/**
 * Block overrides.
 */
export type BlockOverrides<bigintType = bigint, numberType = number> = {
  /** Base fee per gas. */
  baseFeePerGas?: bigintType | undefined
  /** Blob base fee. */
  blobBaseFee?: bigintType | undefined
  /** Fee recipient (also known as coinbase). */
  feeRecipient?: Address.Address | undefined
  /** Gas limit. */
  gasLimit?: bigintType | undefined
  /** Block number. */
  number?: bigintType | undefined
  /** The previous value of randomness beacon. */
  prevRandao?: bigintType | undefined
  /** Block timestamp. */
  time?: bigintType | undefined
  /** Withdrawals made by validators. */
  withdrawals?: Withdrawal.Withdrawal<bigintType, numberType>[] | undefined
}

/**
 * RPC block overrides.
 */
export type Rpc = BlockOverrides<Hex.Hex, Hex.Hex>

/**
 * Converts an {@link ox#BlockOverrides.Rpc} to an {@link ox#BlockOverrides.BlockOverrides}.
 *
 * @example
 * ```ts twoslash
 * import { BlockOverrides } from 'ox'
 *
 * const blockOverrides = BlockOverrides.fromRpc({
 *   baseFeePerGas: '0x1',
 *   blobBaseFee: '0x2',
 *   feeRecipient: '0x0000000000000000000000000000000000000000',
 *   gasLimit: '0x4',
 *   number: '0x5',
 *   prevRandao: '0x6',
 *   time: '0x1234567890',
 *   withdrawals: [
 *     {
 *       address: '0x0000000000000000000000000000000000000000',
 *       amount: '0x1',
 *       index: '0x0',
 *       validatorIndex: '0x1',
 *     },
 *   ],
 * })
 * ```
 *
 * @param rpcBlockOverrides - The RPC block overrides to convert.
 * @returns An instantiated {@link ox#BlockOverrides.BlockOverrides}.
 */
export function fromRpc(rpcBlockOverrides: Rpc): BlockOverrides {
  const overrides: BlockOverrides = {}
  if (rpcBlockOverrides.baseFeePerGas !== undefined)
    overrides.baseFeePerGas = Quantity.toBigInt(
      rpcBlockOverrides.baseFeePerGas,
    )
  if (rpcBlockOverrides.blobBaseFee !== undefined)
    overrides.blobBaseFee = Quantity.toBigInt(
      rpcBlockOverrides.blobBaseFee,
    )
  if (rpcBlockOverrides.feeRecipient !== undefined)
    overrides.feeRecipient = rpcBlockOverrides.feeRecipient
  if (rpcBlockOverrides.gasLimit !== undefined)
    overrides.gasLimit = Quantity.toBigInt(rpcBlockOverrides.gasLimit)
  if (rpcBlockOverrides.number !== undefined)
    overrides.number = Quantity.toBigInt(rpcBlockOverrides.number)
  if (rpcBlockOverrides.prevRandao !== undefined)
    overrides.prevRandao = Quantity.toBigInt(
      rpcBlockOverrides.prevRandao,
    )
  if (rpcBlockOverrides.time !== undefined)
    overrides.time = Quantity.toBigInt(rpcBlockOverrides.time)
  if (rpcBlockOverrides.withdrawals !== undefined)
    overrides.withdrawals = rpcBlockOverrides.withdrawals.map(
      Withdrawal.fromRpc,
    )
  return overrides
}

/**
 * Converts an {@link ox#BlockOverrides.BlockOverrides} to an {@link ox#BlockOverrides.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { BlockOverrides } from 'ox'
 *
 * const blockOverrides = BlockOverrides.toRpc({
 *   baseFeePerGas: 1n,
 *   blobBaseFee: 2n,
 *   feeRecipient: '0x0000000000000000000000000000000000000000',
 *   gasLimit: 4n,
 *   number: 5n,
 *   prevRandao: 6n,
 *   time: 78187493520n,
 *   withdrawals: [
 *     {
 *       address: '0x0000000000000000000000000000000000000000',
 *       amount: 1n,
 *       index: 0,
 *       validatorIndex: 1,
 *     },
 *   ],
 * })
 * ```
 *
 * @param blockOverrides - The block overrides to convert.
 * @returns An instantiated {@link ox#BlockOverrides.Rpc}.
 */
export function toRpc(blockOverrides: BlockOverrides): Rpc {
  const rpc: Rpc = {}
  if (typeof blockOverrides.baseFeePerGas === 'bigint')
    rpc.baseFeePerGas = Quantity.fromBigInt(blockOverrides.baseFeePerGas)
  if (typeof blockOverrides.blobBaseFee === 'bigint')
    rpc.blobBaseFee = Quantity.fromBigInt(blockOverrides.blobBaseFee)
  if (typeof blockOverrides.feeRecipient === 'string')
    rpc.feeRecipient = blockOverrides.feeRecipient
  if (typeof blockOverrides.gasLimit === 'bigint')
    rpc.gasLimit = Quantity.fromBigInt(blockOverrides.gasLimit)
  if (typeof blockOverrides.number === 'bigint')
    rpc.number = Quantity.fromBigInt(blockOverrides.number)
  if (typeof blockOverrides.prevRandao === 'bigint')
    rpc.prevRandao = Quantity.fromBigInt(blockOverrides.prevRandao)
  if (typeof blockOverrides.time === 'bigint')
    rpc.time = Quantity.fromBigInt(blockOverrides.time)
  if (blockOverrides.withdrawals !== undefined)
    rpc.withdrawals = blockOverrides.withdrawals.map(Withdrawal.toRpc)
  return rpc
}
