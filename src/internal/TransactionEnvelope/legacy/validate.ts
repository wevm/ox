import type { Errors } from '../../../Errors.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeLegacy_assert } from './assert.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Validates a {@link ox#TransactionEnvelopeLegacy.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * const valid = TransactionEnvelopeLegacy.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * // @log: false
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 */
export function TransactionEnvelopeLegacy_validate(
  envelope: PartialBy<TransactionEnvelopeLegacy, 'type'>,
) {
  try {
    TransactionEnvelopeLegacy_assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace TransactionEnvelopeLegacy_validate {
  type ErrorType = Errors.GlobalErrorType
}

TransactionEnvelopeLegacy_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_validate.ErrorType
