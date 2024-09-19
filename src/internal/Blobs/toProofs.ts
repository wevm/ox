import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'
import type { Kzg } from '../Kzg/types.js'
import type { Blobs } from './types.js'

/**
 * Compute the proofs for a list of {@link ox#Blobs.Blobs} and their commitments.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const proofs = Blobs.toProofs(blobs, { commitments, kzg }) // [!code focus]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to compute proofs for.
 * @param options -
 * @returns The Blob proofs.
 */
export function Blobs_toProofs<
  const blobs extends readonly Bytes[] | readonly Hex[],
  const commitments extends readonly Bytes[] | readonly Hex[],
  as extends 'Hex' | 'Bytes' =
    | (blobs extends readonly Hex[] ? 'Hex' : never)
    | (blobs extends readonly Bytes[] ? 'Bytes' : never),
>(
  blobs_: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: Blobs_toProofs.Options<blobs, commitments, as>,
): Blobs_toProofs.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs_[0] === 'string' ? 'Hex' : 'Bytes')

  const blobs = (
    typeof blobs_[0] === 'string'
      ? blobs_.map((x) => Bytes_fromHex(x as any))
      : blobs_
  ) as Bytes[]
  const commitments = (
    typeof options.commitments[0] === 'string'
      ? options.commitments.map((x) => Bytes_fromHex(x as any))
      : options.commitments
  ) as Bytes[]

  const proofs: Bytes[] = []
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i]!
    const commitment = commitments[i]!
    proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)))
  }

  return (
    as === 'Bytes' ? proofs : proofs.map((x) => Hex_fromBytes(x))
  ) as never
}

export declare namespace Blobs_toProofs {
  type Options<
    blobs extends Blobs<Bytes> | Blobs<Hex> = Blobs<Bytes> | Blobs<Hex>,
    commitments extends readonly Bytes[] | readonly Hex[] =
      | readonly Bytes[]
      | readonly Hex[],
    as extends 'Hex' | 'Bytes' =
      | (blobs extends Blobs<Hex> ? 'Hex' : never)
      | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
  > = {
    /** Commitments for the blobs. */
    commitments: (commitments | readonly Bytes[] | readonly Hex[]) &
      (commitments extends blobs
        ? {}
        : `commitments must be the same type as blobs`)
    /** KZG implementation. */
    kzg: Pick<Kzg, 'computeBlobKzgProof'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex[] : never)

  type ErrorType =
    | Hex_fromBytes.ErrorType
    | Bytes_fromHex.ErrorType
    | GlobalErrorType
}

/* v8 ignore next */
Blobs_toProofs.parseError = (error: unknown) =>
  error as Blobs_toProofs.ErrorType
