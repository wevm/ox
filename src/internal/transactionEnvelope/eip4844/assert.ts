import {
  EmptyBlobVersionedHashesError,
  InvalidVersionedHashSizeError,
  InvalidVersionedHashVersionError,
} from '../../blobs/errors.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_size } from '../../hex/size.js'
import { Hex_slice } from '../../hex/slice.js'
import { Hex_toNumber } from '../../hex/to.js'
import { Kzg_versionedHashVersion } from '../../kzg/constants.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip1559_assert } from '../eip1559/assert.js'
import type { TransactionEnvelopeEip1559 } from '../eip1559/types.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

/**
 * Asserts a {@link TransactionEnvelope#Eip4844} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip4844_assert(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
) {
  const { blobVersionedHashes } = envelope
  if (blobVersionedHashes) {
    if (blobVersionedHashes.length === 0)
      throw new EmptyBlobVersionedHashesError()
    for (const hash of blobVersionedHashes) {
      const size = Hex_size(hash)
      const version = Hex_toNumber(Hex_slice(hash, 0, 1))
      if (size !== 32) throw new InvalidVersionedHashSizeError({ hash, size })
      if (version !== Kzg_versionedHashVersion)
        throw new InvalidVersionedHashVersionError({
          hash,
          version,
        })
    }
  }
  TransactionEnvelopeEip1559_assert(
    envelope as {} as TransactionEnvelopeEip1559,
  )
}

export declare namespace TransactionEnvelopeEip4844_assert {
  type ErrorType =
    | TransactionEnvelopeEip1559_assert.ErrorType
    | Hex_size.ErrorType
    | Hex_toNumber.ErrorType
    | Hex_slice.ErrorType
    | EmptyBlobVersionedHashesError
    | InvalidVersionedHashSizeError
    | InvalidVersionedHashVersionError
    | GlobalErrorType
}

TransactionEnvelopeEip4844_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_assert.ErrorType
