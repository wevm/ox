import type { Errors } from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import type { Bytes } from '../Bytes/types.js'
import type { Kzg } from '../Kzg/types.js'
import type { Compute } from '../types.js'
import { Blobs_commitmentsToVersionedHashes } from './commitmentsToVersionedHashes.js'
import { Blobs_toCommitments } from './toCommitments.js'
import type { Blobs } from './types.js'

/**
 * Compute Blob Versioned Hashes from a list of {@link ox#Blobs.Blobs}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const versionedHashes = Blobs.toVersionedHashes(blobs, { kzg }) // [!code focus]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform into Blob Versioned Hashes.
 * @param options - Options.
 * @returns The Blob Versioned Hashes.
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
    | Errors.GlobalErrorType
}

Blobs_toVersionedHashes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_toVersionedHashes.ErrorType
