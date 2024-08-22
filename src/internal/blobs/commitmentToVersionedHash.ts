import { bytesToHex } from '../hex/toHex.js'
import type { GlobalErrorType } from '../errors/error.js'
import { sha256 } from '../hash/sha256.js'
import type { Bytes, Hex } from '../types/data.js'

type As = 'hex' | 'bytes'

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
    | (commitment extends Hex ? 'hex' : never)
    | (commitment extends Bytes ? 'bytes' : never),
>(
  commitment: commitment | Hex | Bytes,
  options: commitmentToVersionedHash.Options<as> = {},
): commitmentToVersionedHash.ReturnType<as> {
  const { version = 1 } = options
  const as = options.as ?? (typeof commitment === 'string' ? 'hex' : 'bytes')

  const versionedHash = sha256(commitment, 'bytes')
  versionedHash.set([version], 0)
  return (
    as === 'bytes' ? versionedHash : bytesToHex(versionedHash)
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
    | (as extends 'bytes' ? Bytes : never)
    | (as extends 'hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}

commitmentToVersionedHash.parseError = (error: unknown) =>
  error as commitmentToVersionedHash.ErrorType
