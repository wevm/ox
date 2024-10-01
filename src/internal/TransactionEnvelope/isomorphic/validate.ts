import type { GlobalErrorType } from '../../Errors/error.js'
import { TransactionEnvelope_assert } from './assert.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Validates a {@link ox#TransactionEnvelope.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const valid = TransactionEnvelope.assert({
 *   maxFeePerGas: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   type: 'eip1559',
 *   value: Value.fromEther('1'),
 * })
 * // @log: false
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 */
export function TransactionEnvelope_validate(envelope: TransactionEnvelope) {
  try {
    TransactionEnvelope_assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace TransactionEnvelope_validate {
  type ErrorType = GlobalErrorType
}

TransactionEnvelope_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_validate.ErrorType
