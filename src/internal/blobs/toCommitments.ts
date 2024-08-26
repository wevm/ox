import { Bytes_fromHex } from '../bytes/from.js'
import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hex_fromBytes } from '../hex/from.js'
import type { Hex } from '../hex/types.js'
import type { Kzg } from '../kzg/types.js'
import type { Compute } from '../types.js'
import type { Blobs } from './types.js'

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
export function Blobs_toCommitments<
  const blobs extends Blobs<Bytes> | Blobs<Hex>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
>(
  blobs_: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: Blobs_toCommitments.Options<as>,
): Blobs_toCommitments.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs_[0] === 'string' ? 'Hex' : 'Bytes')
  const blobs = (
    typeof blobs_[0] === 'string'
      ? blobs_.map((x) => Bytes_fromHex(x as any))
      : blobs_
  ) as Bytes[]

  const commitments: Bytes[] = []
  for (const blob of blobs)
    commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)))

  return (
    as === 'Bytes' ? commitments : commitments.map((x) => Hex_fromBytes(x))
  ) as never
}

export declare namespace Blobs_toCommitments {
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
    | Bytes_fromHex.ErrorType
    | Hex_fromBytes.ErrorType
    | GlobalErrorType
}

Blobs_toCommitments.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_toCommitments.ErrorType
