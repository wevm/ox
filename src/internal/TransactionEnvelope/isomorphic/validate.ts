import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import type { GlobalErrorType } from '../../Errors/error.js'

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
export function validate(envelope: TransactionEnvelope.TransactionEnvelope) {
  try {
    TransactionEnvelope.assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = GlobalErrorType
}

validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as validate.ErrorType
