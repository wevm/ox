import type { GlobalErrorType } from '../errors/error.js'
import type { BlobSidecars } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import { Blobs_commitmentToVersionedHash } from './commitmentToVersionedHash.js'

/**
 * Transforms a list of sidecars to their versioned hashes.
 *
 * @example
 * ```ts
 * import { Blobs } from 'ox'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const sidecars = Blobs.toSidecars(blobs, { kzg })
 * const versionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
 * ```
 */
export function Blobs_sidecarsToVersionedHashes<
  const sidecars extends BlobSidecars,
  as extends 'Hex' | 'Bytes' =
    | (sidecars extends BlobSidecars<Hex> ? 'Hex' : never)
    | (sidecars extends BlobSidecars<Bytes> ? 'Bytes' : never),
>(
  sidecars: sidecars | BlobSidecars,
  options: Blobs_sidecarsToVersionedHashes.Options<as> = {},
): Blobs_sidecarsToVersionedHashes.ReturnType<as> {
  const { version } = options

  const as =
    options.as ?? (typeof sidecars[0]!.blob === 'string' ? 'Hex' : 'Bytes')

  const hashes: Uint8Array[] | Hex[] = []
  for (const { commitment } of sidecars) {
    hashes.push(
      Blobs_commitmentToVersionedHash(commitment, {
        as,
        version,
      }) as any,
    )
  }
  return hashes as any
}

export declare namespace Blobs_sidecarsToVersionedHashes {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Version to tag onto the hashes. */
    version?: number | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)

  type ErrorType = Blobs_commitmentToVersionedHash.ErrorType | GlobalErrorType
}

Blobs_sidecarsToVersionedHashes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_sidecarsToVersionedHashes.ErrorType
