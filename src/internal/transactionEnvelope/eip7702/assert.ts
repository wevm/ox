import { Address_assert } from '../../address/assert.js'
import type { GlobalErrorType } from '../../errors/error.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip1559_assert } from '../eip1559/assert.js'
import type { TransactionEnvelopeEip1559 } from '../eip1559/types.js'
import { InvalidChainIdError } from '../errors.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Asserts a {@link TransactionEnvelope#Eip7702} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip7702_assert(
  envelope: PartialBy<TransactionEnvelopeEip7702, 'type'>,
) {
  const { authorizationList } = envelope
  if (authorizationList) {
    for (const authorization of authorizationList) {
      const { contractAddress, chainId } = authorization
      if (contractAddress) Address_assert(contractAddress, { strict: false })
      if (Number(chainId) <= 0) throw new InvalidChainIdError({ chainId })
    }
  }
  TransactionEnvelopeEip1559_assert(
    envelope as {} as TransactionEnvelopeEip1559,
  )
}

export declare namespace TransactionEnvelopeEip7702_assert {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | GlobalErrorType
}

TransactionEnvelopeEip7702_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_assert.ErrorType
