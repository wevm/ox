import type * as Errors from '../../../Errors.js'
import { TransactionEnvelopeEip1559_assert } from '../eip1559/assert.js'
import { TransactionEnvelopeEip2930_assert } from '../eip2930/assert.js'
import { TransactionEnvelopeEip4844_assert } from '../eip4844/assert.js'
import { TransactionEnvelopeEip7702_assert } from '../eip7702/assert.js'
import { TransactionEnvelope_TypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_assert } from '../legacy/assert.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Asserts a {@link ox#TransactionEnvelope.TransactionEnvelope} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * TransactionEnvelope.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   type: 'legacy',
 *   value: Value.fromEther('1'),
 * })
 * // @error: GasPriceTooHighError:
 * // @error: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913 gwei) cannot be
 * // @error: higher than the maximum allowed value (2^256-1).
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function TransactionEnvelope_assert(envelope: TransactionEnvelope) {
  if (envelope.type === 'legacy') TransactionEnvelopeLegacy_assert(envelope)
  else if (envelope.type === 'eip2930')
    TransactionEnvelopeEip2930_assert(envelope)
  else if (envelope.type === 'eip1559')
    TransactionEnvelopeEip1559_assert(envelope)
  else if (envelope.type === 'eip4844')
    TransactionEnvelopeEip4844_assert(envelope)
  else if (envelope.type === 'eip7702')
    TransactionEnvelopeEip7702_assert(envelope)
  else
    throw new TransactionEnvelope_TypeNotImplementedError({
      type: (envelope as any).type,
    })
}

export declare namespace TransactionEnvelope_assert {
  type ErrorType =
    | TransactionEnvelopeLegacy_assert.ErrorType
    | TransactionEnvelopeEip2930_assert.ErrorType
    | TransactionEnvelopeEip1559_assert.ErrorType
    | TransactionEnvelopeEip4844_assert.ErrorType
    | TransactionEnvelopeEip7702_assert.ErrorType
    | TransactionEnvelope_TypeNotImplementedError
    | Errors.GlobalErrorType
}

TransactionEnvelope_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assert.ErrorType
