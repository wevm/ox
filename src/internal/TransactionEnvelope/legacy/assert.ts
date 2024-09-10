import { Address_assert } from '../../Address/assert.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'
import {
  TransactionEnvelope_GasPriceTooHighError,
  TransactionEnvelope_InvalidChainIdError,
} from '../errors.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Asserts a {@link ox#TransactionEnvelopeLegacy.TransactionEnvelopeLegacy} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * TransactionEnvelopeLegacy.assert({
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
export function TransactionEnvelopeLegacy_assert(
  envelope: PartialBy<TransactionEnvelopeLegacy, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (to) Address_assert(to, { strict: false })
  if (typeof chainId !== 'undefined' && chainId <= 0)
    throw new TransactionEnvelope_InvalidChainIdError({ chainId })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new TransactionEnvelope_GasPriceTooHighError({ gasPrice })
}

export declare namespace TransactionEnvelopeLegacy_assert {
  type ErrorType =
    | Address_assert.ErrorType
    | TransactionEnvelope_InvalidChainIdError
    | TransactionEnvelope_GasPriceTooHighError
    | GlobalErrorType
}

TransactionEnvelopeLegacy_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_assert.ErrorType
