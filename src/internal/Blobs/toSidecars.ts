import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { Kzg } from '../Kzg/types.js'
import type { Mutable, OneOf, UnionCompute } from '../types.js'
import { Blobs_toCommitments } from './toCommitments.js'
import { Blobs_toProofs } from './toProofs.js'
import type { BlobSidecars, Blobs } from './types.js'

/**
 * Transforms {@link Blobs#Blobs} into a {@link Blobs#BlobSidecars} array.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const sidecars = Blobs.toSidecars(blobs, { kzg }) // [!code focus]
 * ```
 *
 * @example
 * You can also provide your own commitments and proofs if you do not want `toSidecars`
 * to compute them.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const proofs = Blobs.toProofs(blobs, { commitments, kzg })
 *
 * const sidecars = Blobs.toSidecars(blobs, { commitments, kzg, proofs }) // [!code focus]
 * ```
 *
 * @param blobs - The {@link Blobs#Blobs} to transform into {@link Blobs#BlobSidecars}.
 * @param options -
 * @returns The {@link Blobs#BlobSidecars}.
 */
export function Blobs_toSidecars<const blobs extends Blobs<Hex> | Blobs<Bytes>>(
  blobs: blobs,
  options: Blobs_toSidecars.Options<blobs>,
): Blobs_toSidecars.ReturnType<blobs> {
  const { kzg } = options

  const commitments =
    options.commitments ?? Blobs_toCommitments(blobs, { kzg: kzg! })
  const proofs =
    options.proofs ??
    Blobs_toProofs(blobs, { commitments: commitments as any, kzg: kzg! })

  const sidecars: Mutable<BlobSidecars> = []
  for (let i = 0; i < blobs.length; i++)
    sidecars.push({
      blob: blobs[i]!,
      commitment: commitments[i]!,
      proof: proofs[i]!,
    })

  return sidecars as never
}

export declare namespace Blobs_toSidecars {
  type Options<
    blobs extends Blobs<Hex> | Blobs<Bytes> = Blobs<Hex> | Blobs<Bytes>,
  > = {
    kzg?: Kzg | undefined
  } & OneOf<
    | {}
    | {
        /** Commitment for each blob. */
        commitments: blobs | readonly Hex[] | readonly Bytes[]
        /** Proof for each blob. */
        proofs: blobs | readonly Hex[] | readonly Bytes[]
      }
  >

  type ReturnType<blobs extends Blobs<Hex> | Blobs<Bytes>> = UnionCompute<
    | (blobs extends Blobs<Hex> ? BlobSidecars<Hex> : never)
    | (blobs extends Blobs<Bytes> ? BlobSidecars<Bytes> : never)
  >

  type ErrorType = GlobalErrorType
}

Blobs_toSidecars.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_toSidecars.ErrorType
