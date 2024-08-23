import { hexToBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Blobs } from '../types/blob.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Kzg } from '../types/kzg.js'

/**
 * Compute the proofs for a list of blobs and their commitments.
 *
 * @example
 * ```ts
 * import { Blobs } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const commitments = Blobs.toCommitments(blobs, { kzg })
 * const proofs = Blobs.toProofs(blobs, { commitments, kzg })
 * ```
 *
 * @alias ox!Blobs.blobsToProofs:function(1)
 */
export function blobsToProofs<
  const blobs extends readonly Bytes[] | readonly Hex[],
  const commitments extends readonly Bytes[] | readonly Hex[],
  as extends 'Hex' | 'Bytes' =
    | (blobs extends readonly Hex[] ? 'Hex' : never)
    | (blobs extends readonly Bytes[] ? 'Bytes' : never),
>(
  blobs_: blobs | Blobs<Bytes> | Blobs<Hex>,
  parameters: blobsToProofs.Parameters<blobs, commitments, as>,
): blobsToProofs.ReturnType<as> {
  const { kzg } = parameters

  const as = parameters.as ?? (typeof blobs_[0] === 'string' ? 'Hex' : 'Bytes')

  const blobs = (
    typeof blobs_[0] === 'string'
      ? blobs_.map((x) => hexToBytes(x as any))
      : blobs_
  ) as Bytes[]
  const commitments = (
    typeof parameters.commitments[0] === 'string'
      ? parameters.commitments.map((x) => hexToBytes(x as any))
      : parameters.commitments
  ) as Bytes[]

  const proofs: Bytes[] = []
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i]!
    const commitment = commitments[i]!
    proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)))
  }

  return (as === 'Bytes' ? proofs : proofs.map((x) => bytesToHex(x))) as never
}

export declare namespace blobsToProofs {
  type Parameters<
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

  type ErrorType = bytesToHex.ErrorType | hexToBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
blobsToProofs.parseError = (error: unknown) => error as blobsToProofs.ErrorType
