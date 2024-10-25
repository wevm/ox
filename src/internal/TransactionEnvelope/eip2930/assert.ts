import * as Address from '../../../Address.js'
import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import type * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'

/**
 * Asserts a {@link ox#TransactionEnvelope.Eip2930} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930, Value } from 'ox'
 *
 * TransactionEnvelopeEip2930.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * // @error: GasPriceTooHighError:
 * // @error: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913 gwei) cannot be
 * // @error: higher than the maximum allowed value (2^256-1).
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function assert(
  envelope: PartialBy<TransactionEnvelopeEip2930.TransactionEnvelope, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (chainId <= 0)
    throw new TransactionEnvelope.InvalidChainIdError({ chainId })
  if (to) Address.assert(to, { strict: false })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new TransactionEnvelope.GasPriceTooHighError({ gasPrice })
}

export declare namespace assert {
  type ErrorType =
    | Address.assert.ErrorType
    | TransactionEnvelope.InvalidChainIdError
    | TransactionEnvelope.GasPriceTooHighError
    | GlobalErrorType
}

assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assert.ErrorType
