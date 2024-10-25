import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'

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
export function assert(envelope: TransactionEnvelope.TransactionEnvelope) {
  if (envelope.type === 'legacy') TransactionEnvelopeLegacy.assert(envelope)
  else if (envelope.type === 'eip2930')
    TransactionEnvelopeEip2930.assert(envelope)
  else if (envelope.type === 'eip1559')
    TransactionEnvelopeEip1559.assert(envelope)
  else if (envelope.type === 'eip4844')
    TransactionEnvelopeEip4844.assert(envelope)
  else if (envelope.type === 'eip7702')
    TransactionEnvelopeEip7702.assert(envelope)
  else
    throw new TransactionEnvelope.TypeNotImplementedError({
      type: (envelope as any).type,
    })
}

export declare namespace assert {
  type ErrorType =
    | TransactionEnvelopeLegacy.assert.ErrorType
    | TransactionEnvelopeEip2930.assert.ErrorType
    | TransactionEnvelopeEip1559.assert.ErrorType
    | TransactionEnvelopeEip4844.assert.ErrorType
    | TransactionEnvelopeEip7702.assert.ErrorType
    | TransactionEnvelope.TypeNotImplementedError
    | GlobalErrorType
}

assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assert.ErrorType
