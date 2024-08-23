import type { GlobalErrorType } from '../errors/error.js'
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Kzg } from '../types/kzg.js'
import type { Compute } from '../types/utils.js'
import { blobsToCommitments } from './blobsToCommitments.js'
import { commitmentsToVersionedHashes } from './commitmentsToVersionedHashes.js'

type As = 'Hex' | 'Bytes'

/**
 * Compute commitments from a list of blobs.
 *
 * @example
 * ```ts
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const versionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
 * ```
 */
export function blobsToVersionedHashes<
  const blobs extends Blobs<Bytes> | Blobs<Hex>,
  as extends As =
    | (blobs extends Blobs<Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: blobsToVersionedHashes.Options<as>,
): blobsToVersionedHashes.ReturnType<as> {
  const commitments = blobsToCommitments(blobs, options)
  return commitmentsToVersionedHashes(commitments, options)
}

export declare namespace blobsToVersionedHashes {
  type Options<as extends As = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg, 'blobToKzgCommitment'>
    /** Return type. */
    as?: as | As | undefined
  }

  type ReturnType<as extends As = As> = Compute<
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)
  >

  type ErrorType =
    | blobsToCommitments.ErrorType
    | commitmentsToVersionedHashes.ErrorType
    | GlobalErrorType
}

blobsToVersionedHashes.errorType = (error: unknown) =>
  error as blobsToVersionedHashes.ErrorType
