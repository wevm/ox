import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'
import type { Kzg } from '../../Kzg.js'
import type { Mutable, OneOf, UnionCompute } from '../types.js'
import { Blobs_toCommitments } from './toCommitments.js'
import { Blobs_toProofs } from './toProofs.js'
import type { BlobSidecars, Blobs } from './types.js'

/**
 * Transforms {@link ox#Blobs.Blobs} into a {@link ox#Blobs.BlobSidecars} array.
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
 * @param blobs - The {@link ox#Blobs.Blobs} to transform into {@link ox#Blobs.BlobSidecars}.
 * @param options - Options.
 * @returns The {@link ox#Blobs.BlobSidecars}.
 */
export function Blobs_toSidecars<
  const blobs extends Blobs<Hex.Hex> | Blobs<Bytes.Bytes>,
>(
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
    blobs extends Blobs<Hex.Hex> | Blobs<Bytes.Bytes> =
      | Blobs<Hex.Hex>
      | Blobs<Bytes.Bytes>,
  > = {
    kzg?: Kzg | undefined
  } & OneOf<
    | {}
    | {
        /** Commitment for each blob. */
        commitments: blobs | readonly Hex.Hex[] | readonly Bytes.Bytes[]
        /** Proof for each blob. */
        proofs: blobs | readonly Hex.Hex[] | readonly Bytes.Bytes[]
      }
  >

  type ReturnType<blobs extends Blobs<Hex.Hex> | Blobs<Bytes.Bytes>> =
    UnionCompute<
      | (blobs extends Blobs<Hex.Hex> ? BlobSidecars<Hex.Hex> : never)
      | (blobs extends Blobs<Bytes.Bytes> ? BlobSidecars<Bytes.Bytes> : never)
    >

  type ErrorType = Errors.GlobalErrorType
}

Blobs_toSidecars.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Blobs_toSidecars.ErrorType
