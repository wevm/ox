import type { Errors } from '../../Errors.js'
import { Hex_fromNumber } from '../Hex/fromNumber.js'
import type { Withdrawal, Withdrawal_Rpc } from './types.js'

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
 *   validatorIndex: 1,
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
export function Withdrawal_toRpc(withdrawal: Withdrawal): Withdrawal_Rpc {
  return {
    address: withdrawal.address,
    amount: Hex_fromNumber(withdrawal.amount),
    index: Hex_fromNumber(withdrawal.index),
    validatorIndex: Hex_fromNumber(withdrawal.validatorIndex),
  }
}

export declare namespace Withdrawal_toRpc {
  export type ErrorType = Errors.GlobalErrorType
}

Withdrawal_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Withdrawal_toRpc.ErrorType
