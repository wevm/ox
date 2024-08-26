import type { GlobalErrorType } from '../errors/error.js'
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Kzg } from '../types/kzg.js'
import type { Compute } from '../types/utils.js'
import { Blobs_commitmentsToVersionedHashes } from './commitmentsToVersionedHashes.js'
import { Blobs_toCommitments } from './toCommitments.js'

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
export function Blobs_toVersionedHashes<
  const blobs extends Blobs<Bytes> | Blobs<Hex>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: Blobs_toVersionedHashes.Options<as>,
): Blobs_toVersionedHashes.ReturnType<as> {
  const commitments = Blobs_toCommitments(blobs, options)
  return Blobs_commitmentsToVersionedHashes(commitments, options)
}

export declare namespace Blobs_toVersionedHashes {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg, 'blobToKzgCommitment'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)
  >

  type ErrorType =
    | Blobs_toCommitments.ErrorType
    | Blobs_commitmentsToVersionedHashes.ErrorType
    | GlobalErrorType
}

Blobs_toVersionedHashes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_toVersionedHashes.ErrorType
