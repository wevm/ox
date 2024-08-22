import type { BlobSidecars } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import { commitmentToVersionedHash } from './commitmentToVersionedHash.js'

type As = 'hex' | 'bytes'

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
export function sidecarsToVersionedHashes<
  const sidecars extends BlobSidecars,
  as extends As =
    | (sidecars extends BlobSidecars<Hex> ? 'hex' : never)
    | (sidecars extends BlobSidecars<Bytes> ? 'bytes' : never),
>(
  sidecars: sidecars | BlobSidecars,
  options: sidecarsToVersionedHashes.Options<as> = {},
): sidecarsToVersionedHashes.ReturnType<as> {
  const { version } = options

  const as =
    options.as ?? (typeof sidecars[0]!.blob === 'string' ? 'hex' : 'bytes')

  const hashes: Uint8Array[] | Hex[] = []
  for (const { commitment } of sidecars) {
    hashes.push(
      commitmentToVersionedHash(commitment, {
        as,
        version,
      }) as any,
    )
  }
  return hashes as any
}

export declare namespace sidecarsToVersionedHashes {
  type Options<as extends As | undefined = undefined> = {
    /** Return type. */
    as?: as | As | undefined
    /** Version to tag onto the hashes. */
    version?: number | undefined
  }

  type ReturnType<as extends As> =
    | (as extends 'bytes' ? readonly Bytes[] : never)
    | (as extends 'hex' ? readonly Hex[] : never)
}
