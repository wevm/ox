import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_sha256 } from '../Hash/sha256.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'

/**
 * Transform a Commitment to its Blob Versioned Hash.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHash = Blobs.commitmentToVersionedHash(commitment) // [!code focus]
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type for the Versioned Hash with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentToVersionedHash(commitment, {
 *   as: 'Bytes', // [!code focus]
 * })
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ]]
 * ```
 *
 * @example
 * ### Versioning Hashes
 *
 * It is possible to configure the version for the Versioned Hash with the `version` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHashes = Blobs.commitmentToVersionedHash(commitment, {
 *   version: 2, // [!code focus]
 * })
 * ```
 *
 * @param commitment - The commitment.
 * @param as - The return type.
 * @returns The Blob Versioned Hash.
 */
export function Blobs_commitmentToVersionedHash<
  const commitment extends Hex | Bytes,
  as extends 'Hex' | 'Bytes' =
    | (commitment extends Hex ? 'Hex' : never)
    | (commitment extends Bytes ? 'Bytes' : never),
>(
  commitment: commitment | Hex | Bytes,
  options: Blobs_commitmentToVersionedHash.Options<as> = {},
): Blobs_commitmentToVersionedHash.ReturnType<as> {
  const { version = 1 } = options
  const as = options.as ?? (typeof commitment === 'string' ? 'Hex' : 'Bytes')

  const versionedHash = Hash_sha256(commitment, { as: 'Bytes' })
  versionedHash.set([version], 0)
  return (
    as === 'Bytes' ? versionedHash : Hex_fromBytes(versionedHash)
  ) as Blobs_commitmentToVersionedHash.ReturnType<as>
}

export declare namespace Blobs_commitmentToVersionedHash {
  type Options<as extends 'Hex' | 'Bytes' | undefined = undefined> = {
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
    /** Version to tag onto the hash. */
    version?: number | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}

Blobs_commitmentToVersionedHash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_commitmentToVersionedHash.ErrorType
