import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type * as Kzg from '../../Kzg.js'
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
 * @param options - Options.
 * @returns The Blob proofs.
 */
export function Blobs_toProofs<
  const blobs extends readonly Bytes.Bytes[] | readonly Hex.Hex[],
  const commitments extends readonly Bytes.Bytes[] | readonly Hex.Hex[],
  as extends 'Hex' | 'Bytes' =
    | (blobs extends readonly Hex.Hex[] ? 'Hex' : never)
    | (blobs extends readonly Bytes.Bytes[] ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes.Bytes> | Blobs<Hex.Hex>,
  options: Blobs_toProofs.Options<blobs, commitments, as>,
): Blobs_toProofs.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')

  const blobs_ = (
    typeof blobs[0] === 'string'
      ? blobs.map((x) => Bytes.fromHex(x as any))
      : blobs
  ) as Bytes.Bytes[]
  const commitments = (
    typeof options.commitments[0] === 'string'
      ? options.commitments.map((x) => Bytes.fromHex(x as any))
      : options.commitments
  ) as Bytes.Bytes[]

  const proofs: Bytes.Bytes[] = []
  for (let i = 0; i < blobs_.length; i++) {
    const blob = blobs_[i]!
    const commitment = commitments[i]!
    proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)))
  }

  return (
    as === 'Bytes' ? proofs : proofs.map((x) => Hex.fromBytes(x))
  ) as never
}

export declare namespace Blobs_toProofs {
  type Options<
    blobs extends Blobs<Bytes.Bytes> | Blobs<Hex.Hex> =
      | Blobs<Bytes.Bytes>
      | Blobs<Hex.Hex>,
    commitments extends readonly Bytes.Bytes[] | readonly Hex.Hex[] =
      | readonly Bytes.Bytes[]
      | readonly Hex.Hex[],
    as extends 'Hex' | 'Bytes' =
      | (blobs extends Blobs<Hex.Hex> ? 'Hex' : never)
      | (blobs extends Blobs<Bytes.Bytes> ? 'Bytes' : never),
  > = {
    /** Commitments for the blobs. */
    commitments: (commitments | readonly Bytes.Bytes[] | readonly Hex.Hex[]) &
      (commitments extends blobs
        ? {}
        : `commitments must be the same type as blobs`)
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'computeBlobKzgProof'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? readonly Bytes.Bytes[] : never)
    | (as extends 'Hex' ? readonly Hex.Hex[] : never)

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Blobs_toProofs.parseError = (error: unknown) =>
  error as Blobs_toProofs.ErrorType
