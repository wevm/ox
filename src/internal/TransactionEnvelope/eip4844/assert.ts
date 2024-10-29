import type * as Errors from '../../../Errors.js'
import * as Hex from '../../../Hex.js'
import { TransactionEnvelopeEip1559 } from '../../../TransactionEnvelopeEip1559.js'
import {
  Blobs_EmptyBlobVersionedHashesError,
  Blobs_InvalidVersionedHashSizeError,
  Blobs_InvalidVersionedHashVersionError,
} from '../../Blobs/errors.js'
import { Kzg_versionedHashVersion } from '../../Kzg/constants.js'
import type { PartialBy } from '../../types.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

/**
 * Asserts a {@link ox#TransactionEnvelopeEip4844.TransactionEnvelope} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip4844, Value } from 'ox'
 *
 * TransactionEnvelopeEip4844.assert({
 *   blobVersionedHashes: [],
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * // @error: EmptyBlobVersionedHashesError: Blob versioned hashes must not be empty.
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function TransactionEnvelopeEip4844_assert(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
) {
  const { blobVersionedHashes } = envelope
  if (blobVersionedHashes) {
    if (blobVersionedHashes.length === 0)
      throw new Blobs_EmptyBlobVersionedHashesError()
    for (const hash of blobVersionedHashes) {
      const size = Hex.size(hash)
      const version = Hex.toNumber(Hex.slice(hash, 0, 1))
      if (size !== 32)
        throw new Blobs_InvalidVersionedHashSizeError({ hash, size })
      if (version !== Kzg_versionedHashVersion)
        throw new Blobs_InvalidVersionedHashVersionError({
          hash,
          version,
        })
    }
  }
  TransactionEnvelopeEip1559.assert(
    envelope as {} as TransactionEnvelopeEip1559,
  )
}

export declare namespace TransactionEnvelopeEip4844_assert {
  type ErrorType =
    | TransactionEnvelopeEip1559.assert.ErrorType
    | Hex.size.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.slice.ErrorType
    | Blobs_EmptyBlobVersionedHashesError
    | Blobs_InvalidVersionedHashSizeError
    | Blobs_InvalidVersionedHashVersionError
    | Errors.GlobalErrorType
}

TransactionEnvelopeEip4844_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_assert.ErrorType
