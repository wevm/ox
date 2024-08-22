import { hexToBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Kzg } from '../types/kzg.js'
import type { Compute } from '../types/utils.js'

type As = 'hex' | 'bytes'

/**
 * Compute commitments from a list of blobs.
 *
 * @example
 * ```ts
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * ```
 */
export function blobsToCommitments<
  const blobs extends Blobs<Bytes> | Blobs<Hex>,
  as extends As =
    | (blobs extends Blobs<Hex> ? 'hex' : never)
    | (blobs extends Blobs<Bytes> ? 'bytes' : never),
>(
  blobs_: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: blobsToCommitments.Options<as>,
): blobsToCommitments.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs_[0] === 'string' ? 'hex' : 'bytes')
  const blobs = (
    typeof blobs_[0] === 'string'
      ? blobs_.map((x) => hexToBytes(x as any))
      : blobs_
  ) as Bytes[]

  const commitments: Bytes[] = []
  for (const blob of blobs)
    commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)))

  return (
    as === 'bytes' ? commitments : commitments.map((x) => bytesToHex(x))
  ) as never
}

export declare namespace blobsToCommitments {
  type Options<as extends As = 'hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg, 'blobToKzgCommitment'>
    /** Return type. */
    as?: as | As | undefined
  }

  type ReturnType<as extends As = As> = Compute<
    | (as extends 'bytes' ? readonly Bytes[] : never)
    | (as extends 'hex' ? readonly Hex[] : never)
  >

  type ErrorType = hexToBytes.ErrorType | bytesToHex.ErrorType | GlobalErrorType
}

blobsToCommitments.errorType = (error: unknown) =>
  error as blobsToCommitments.ErrorType