import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { Blobs_commitmentToVersionedHash } from './commitmentToVersionedHash.js'

/**
 * Transform a list of commitments to their versioned hashes.
 *
 * @example
 * ```ts
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentsToVersionedHashes(commitments)
 * ```
 */
export function Blobs_commitmentsToVersionedHashes<
  const commitments extends readonly Bytes[] | readonly Hex[],
  as extends 'Hex' | 'Bytes' =
    | (commitments extends readonly Hex[] ? 'Hex' : never)
    | (commitments extends readonly Bytes[] ? 'Bytes' : never),
>(
  commitments: commitments | readonly Bytes[] | readonly Hex[],
  options: Blobs_commitmentsToVersionedHashes.Options<as> = {},
): Blobs_commitmentsToVersionedHashes.ReturnType<as> {
  const { version } = options

  const as =
    options.as ?? (typeof commitments[0] === 'string' ? 'Hex' : 'Bytes')

  const hashes: Uint8Array[] | Hex[] = []
  for (const commitment of commitments) {
    hashes.push(
      Blobs_commitmentToVersionedHash(commitment, {
        as,
        version,
      }) as never,
    )
  }
  return hashes as never
}

export declare namespace Blobs_commitmentsToVersionedHashes {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Version to tag onto the hashes. */
    version?: number | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)

  type ErrorType = GlobalErrorType
}

Blobs_commitmentsToVersionedHashes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_commitmentsToVersionedHashes.ErrorType
