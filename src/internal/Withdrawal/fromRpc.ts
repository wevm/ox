import type { Errors } from '../../Errors.js'
import type { Withdrawal, Withdrawal_Rpc } from './types.js'

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
 *   validatorIndex: '0x1',
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
export function Withdrawal_fromRpc(withdrawal: Withdrawal_Rpc): Withdrawal {
  return {
    ...withdrawal,
    amount: BigInt(withdrawal.amount),
    index: Number(withdrawal.index),
    validatorIndex: Number(withdrawal.validatorIndex),
  }
}

export declare namespace Withdrawal_fromRpc {
  export type ErrorType = Errors.GlobalErrorType
}

Withdrawal_fromRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Withdrawal_fromRpc.ErrorType
