import type * as Errors from './Errors.js'
import type * as Hex from './Hex.js'
import * as Quantity from './internal/quantity.js'

/** A Withdrawal as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/withdrawal.yaml). */
export type Withdrawal<bigintType = bigint, numberType = number> = {
  address: Hex.Hex
  amount: bigintType
  index: numberType
  validatorIndex: numberType
}

/** An RPC Withdrawal as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/withdrawal.yaml). */
export type Rpc = Withdrawal<Hex.Hex, Hex.Hex>

/**
 * Converts a {@link ox#Withdrawal.Rpc} to an {@link ox#Withdrawal.Withdrawal}.
 *
 * @example
 * ```ts twoslash
 * import { Withdrawal } from 'ox'
 *
 * const withdrawal = Withdrawal.fromRpc({
 *   address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
 *   amount: '0x620323',
 *   index: '0x0',
 *   validatorIndex: '0x1'
 * })
 * // @log: {
 * // @log:   address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
 * // @log:   amount: 6423331n,
 * // @log:   index: 0,
 * // @log:   validatorIndex: 1
 * // @log: }
 * ```
 *
 * @param withdrawal - The RPC withdrawal to convert.
 * @returns An instantiated {@link ox#Withdrawal.Withdrawal}.
 */
export function fromRpc(withdrawal: Rpc): Withdrawal {
  return {
    ...withdrawal,
    amount: BigInt(withdrawal.amount),
    index: Number(withdrawal.index),
    validatorIndex: Number(withdrawal.validatorIndex),
  }
}

export declare namespace fromRpc {
  export type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts a {@link ox#Withdrawal.Withdrawal} to an {@link ox#Withdrawal.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { Withdrawal } from 'ox'
 *
 * const withdrawal = Withdrawal.toRpc({
 *   address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
 *   amount: 6423331n,
 *   index: 0,
 *   validatorIndex: 1
 * })
 * // @log: {
 * // @log:   address: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
 * // @log:   amount: '0x620323',
 * // @log:   index: '0x0',
 * // @log:   validatorIndex: '0x1',
 * // @log: }
 * ```
 *
 * @param withdrawal - The Withdrawal to convert.
 * @returns An RPC Withdrawal.
 */
export function toRpc(withdrawal: toRpc.Input): Rpc {
  return {
    address: withdrawal.address,
    amount: Quantity.fromNumberish(withdrawal.amount),
    index: Quantity.fromNumberish(withdrawal.index),
    validatorIndex: Quantity.fromNumberish(withdrawal.validatorIndex),
  }
}

export declare namespace toRpc {
  /** Numberish input accepted by {@link ox#Withdrawal.(toRpc:function)}. */
  export type Input = Withdrawal<Hex.Hex | bigint | number, Hex.Hex | number>

  export type ErrorType = Errors.GlobalErrorType
}
