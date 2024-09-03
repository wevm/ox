import { Address_assert } from '../../Address/assert.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'
import { GasPriceTooHighError, InvalidChainIdError } from '../errors.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Asserts a {@link TransactionEnvelope#Eip2930} is valid.
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
export function TransactionEnvelopeEip2930_assert(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (chainId <= 0) throw new InvalidChainIdError({ chainId })
  if (to) Address_assert(to, { strict: false })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new GasPriceTooHighError({ gasPrice })
}

export declare namespace TransactionEnvelopeEip2930_assert {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | GasPriceTooHighError
    | GlobalErrorType
}

TransactionEnvelopeEip2930_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_assert.ErrorType
