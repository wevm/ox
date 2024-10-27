import type * as Errors from '../../Errors.js'
import type { Bytes } from '../Bytes/types.js'
import type { Hex } from '../Hex/types.js'
import { Blobs_commitmentToVersionedHash } from './commitmentToVersionedHash.js'

/**
 * Transform a list of Commitments to Blob Versioned Hashes.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentsToVersionedHashes(commitments) // [!code focus]
 * // @log: ['0x...', '0x...']
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type for the Versioned Hashes with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentsToVersionedHashes(commitments, {
 *   as: 'Bytes', // [!code focus]
 * })
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ]]
 * ```
 *
 * @example
 * ### Versioning Hashes
 *
 * It is possible to configure the version for the Versioned Hashes with the `version` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentsToVersionedHashes(commitments, {
 *   version: 2, // [!code focus]
 * })
 * ```
 *
 * @param commitments - A list of commitments.
 * @param options - Options.
 * @returns A list of Blob Versioned Hashes.
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

  type ErrorType = Errors.GlobalErrorType
}

Blobs_commitmentsToVersionedHashes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_commitmentsToVersionedHashes.ErrorType
