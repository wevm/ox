import type { GlobalErrorType } from '../../errors/error.js'
import { TransactionEnvelopeEip1559_assert } from '../eip1559/assert.js'
import { TransactionEnvelopeEip2930_assert } from '../eip2930/assert.js'
import { TransactionEnvelopeEip4844_assert } from '../eip4844/assert.js'
import { TransactionEnvelopeEip7702_assert } from '../eip7702/assert.js'
import { TransactionTypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_assert } from '../legacy/assert.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Asserts a {@link TransactionEnvelope#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
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
    throw new TransactionTypeNotImplementedError({
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
    | TransactionTypeNotImplementedError
    | GlobalErrorType
}

TransactionEnvelope_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assert.ErrorType
