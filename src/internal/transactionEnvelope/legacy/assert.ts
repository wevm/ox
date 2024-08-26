import { Address_assert } from '../../address/assert.js'
import type { GlobalErrorType } from '../../errors/error.js'
import type { PartialBy } from '../../types.js'
import { GasPriceTooHighError, InvalidChainIdError } from '../errors.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Asserts a {@link TransactionEnvelopeLegacy#TransactionEnvelopeLegacy} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeLegacy_assert(
  envelope: PartialBy<TransactionEnvelopeLegacy, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (to) Address_assert(to, { strict: false })
  if (typeof chainId !== 'undefined' && chainId <= 0)
    throw new InvalidChainIdError({ chainId })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new GasPriceTooHighError({ gasPrice })
}

export declare namespace TransactionEnvelopeLegacy_assert {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | GasPriceTooHighError
    | GlobalErrorType
}

TransactionEnvelopeLegacy_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_assert.ErrorType
