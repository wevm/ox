import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'
import type { Kzg } from '../Kzg/types.js'
import type { Compute } from '../types.js'
import type { Blobs } from './types.js'

/**
 * Compute commitments from a list of {@link ox#Blobs.Blobs}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg }) // [!code focus]
 * ```
 *
 * @example
 * ### Configuring Return Type
 *
 * It is possible to configure the return type with the `as` option.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, {
 *   as: 'Bytes', // [!code focus]
 *   kzg,
 * })
 * // @log: [Uint8Array [ ... ], Uint8Array [ ... ]]
 * ```
 *
 * @param blobs - The {@link ox#Blobs.Blobs} to transform to commitments.
 * @param options - Options.
 * @returns The commitments.
 */
export function Blobs_toCommitments<
  const blobs extends Blobs<Bytes> | Blobs<Hex>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs<Hex> ? 'Hex' : never)
    | (blobs extends Blobs<Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs<Bytes> | Blobs<Hex>,
  options: Blobs_toCommitments.Options<as>,
): Blobs_toCommitments.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')
  const blobs_ = (
    typeof blobs[0] === 'string'
      ? blobs.map((x) => Bytes_fromHex(x as any))
      : blobs
  ) as Bytes[]

  const commitments: Bytes[] = []
  for (const blob of blobs_)
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
