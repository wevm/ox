import { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
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
 * @param options - Options.
 * @returns The Blob proofs.
 */
export function Blobs_toProofs<
  const blobs extends readonly Bytes[] | readonly Hex[],
  const commitments extends readonly Bytes[] | readonly Hex[],
  as extends 'Hex' | 'Bytes' =
    | (blobs extends readonly Hex[] ? 'Hex' : never)
    | (blobs extends readonly Bytes[] ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: Blobs_toProofs.Options<blobs, commitments, as>,
): Blobs_toProofs.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')

  const blobs_ = (
    typeof blobs[0] === 'string'
      ? blobs.map((x) => Bytes.fromHex(x as any))
      : blobs
  ) as Bytes[]
  const commitments = (
    typeof options.commitments[0] === 'string'
      ? options.commitments.map((x) => Bytes.fromHex(x as any))
      : options.commitments
  ) as Bytes[]

  const proofs: Bytes[] = []
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
    | Hex.fromBytes.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Blobs_toProofs.parseError = (error: unknown) =>
  error as Blobs_toProofs.ErrorType
