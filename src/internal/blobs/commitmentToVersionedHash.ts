import type { GlobalErrorType } from '../errors/error.js'
import { sha256 } from '../hash/sha256.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type As = 'Hex' | 'Bytes'

/**
 * Transform a commitment to it's versioned hash.
 *
 * @example
 * ```ts
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments(blobs, { kzg })
 * const versionedHash = Blobs.commitmentToVersionedHash(commitment)
 * ```
 */
export function commitmentToVersionedHash<
  const commitment extends Hex | Bytes,
  as extends As =
    | (commitment extends Hex ? 'Hex' : never)
    | (commitment extends Bytes ? 'Bytes' : never),
>(
  commitment: commitment | Hex | Bytes,
  options: commitmentToVersionedHash.Options<as> = {},
): commitmentToVersionedHash.ReturnType<as> {
  const { version = 1 } = options
  const as = options.as ?? (typeof commitment === 'string' ? 'Hex' : 'Bytes')

  const versionedHash = sha256(commitment, 'Bytes')
  versionedHash.set([version], 0)
  return (
    as === 'Bytes' ? versionedHash : bytesToHex(versionedHash)
  ) as commitmentToVersionedHash.ReturnType<as>
}

export declare namespace commitmentToVersionedHash {
  type Options<as extends As | undefined = undefined> = {
    /** Return type. */
    as?: as | As | undefined
    /** Version to tag onto the hash. */
    version?: number | undefined
  }

  type ReturnType<as extends As = As> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}

commitmentToVersionedHash.parseError = (error: unknown) =>
  error as commitmentToVersionedHash.ErrorType
