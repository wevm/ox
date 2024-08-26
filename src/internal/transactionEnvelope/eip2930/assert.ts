import { Address_assert } from '../../address/assert.js'
import type { GlobalErrorType } from '../../errors/error.js'
import type { PartialBy } from '../../types.js'
import { GasPriceTooHighError, InvalidChainIdError } from '../errors.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Asserts a {@link TransactionEnvelope#Eip2930} is valid.
 *
 * @example
 * // TODO
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
