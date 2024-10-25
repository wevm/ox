import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import type * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import {
  Blobs_EmptyBlobVersionedHashesError,
  Blobs_InvalidVersionedHashSizeError,
  Blobs_InvalidVersionedHashVersionError,
} from '../../Blobs/errors.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_size } from '../../Hex/size.js'
import { Hex_slice } from '../../Hex/slice.js'
import { Hex_toNumber } from '../../Hex/toNumber.js'
import { Kzg_versionedHashVersion } from '../../Kzg/constants.js'
import type { PartialBy } from '../../types.js'

/**
 * Asserts a {@link ox#TransactionEnvelope.Eip4844} is valid.
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
export function assert(
  envelope: PartialBy<TransactionEnvelopeEip4844.TransactionEnvelope, 'type'>,
) {
  const { blobVersionedHashes } = envelope
  if (blobVersionedHashes) {
    if (blobVersionedHashes.length === 0)
      throw new Blobs_EmptyBlobVersionedHashesError()
    for (const hash of blobVersionedHashes) {
      const size = Hex_size(hash)
      const version = Hex_toNumber(Hex_slice(hash, 0, 1))
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
    envelope as {} as TransactionEnvelopeEip1559.TransactionEnvelope,
  )
}

export declare namespace assert {
  type ErrorType =
    | TransactionEnvelopeEip1559.assert.ErrorType
    | Hex_size.ErrorType
    | Hex_toNumber.ErrorType
    | Hex_slice.ErrorType
    | Blobs_EmptyBlobVersionedHashesError
    | Blobs_InvalidVersionedHashSizeError
    | Blobs_InvalidVersionedHashVersionError
    | GlobalErrorType
}

assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assert.ErrorType
