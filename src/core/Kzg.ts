import type * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import type { Branded } from './internal/types.js'

/** @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-4844.md#parameters */
export const versionedHashVersion = 1

/** EIP-4844 fixed blob size in bytes (4096 field elements * 32 bytes). */
export const blobLength = 131_072
/** EIP-4844 fixed KZG commitment size in bytes. */
export const commitmentLength = 48
/** EIP-4844 fixed KZG proof size in bytes. */
export const proofLength = 48

/** Branded fixed-size type for a 131072-byte EIP-4844 blob. */
export type Blob = Branded<Bytes.Bytes, 'Kzg.Blob'>
/** Branded fixed-size type for a 48-byte KZG commitment. */
export type Commitment = Branded<Bytes.Bytes, 'Kzg.Commitment'>
/** Branded fixed-size type for a 48-byte KZG proof. */
export type Proof = Branded<Bytes.Bytes, 'Kzg.Proof'>

/** Root type for a KZG interface. */
export type Kzg = {
  /**
   * Convert a blob to a KZG commitment.
   */
  blobToKzgCommitment(blob: Bytes.Bytes): Bytes.Bytes
  /**
   * Given a blob, return the KZG proof that is used to verify it against the
   * commitment.
   */
  computeBlobKzgProof(blob: Bytes.Bytes, commitment: Bytes.Bytes): Bytes.Bytes
  /**
   * Optionally compute a batch of KZG commitments. Implementations that do
   * not provide a native batch entry point can omit this; {@link ox#Kzg.(from:function)}
   * synthesises a per-blob fallback in that case.
   */
  blobToKzgCommitmentBatch?: ((blobs: readonly Bytes.Bytes[]) => Bytes.Bytes[]) | undefined
  /**
   * Optionally compute a batch of KZG proofs. Implementations that do
   * not provide a native batch entry point can omit this; {@link ox#Kzg.(from:function)}
   * synthesises a per-blob fallback in that case.
   */
  computeBlobKzgProofBatch?:
    | ((
        blobs: readonly Bytes.Bytes[],
        commitments: readonly Bytes.Bytes[],
      ) => Bytes.Bytes[])
    | undefined
}

/**
 * Defines a KZG interface.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import * as cKzg from 'c-kzg'
 * import { Kzg } from 'ox'
 * import { Paths } from 'ox/trusted-setups'
 *
 * cKzg.loadTrustedSetup(Paths.mainnet)
 *
 * const kzg = Kzg.from(cKzg)
 * ```
 *
 * @param value - The KZG object to convert.
 * @returns The KZG interface object.
 */
export function from(value: Kzg): Kzg {
  const blobToKzgCommitmentBatch =
    value.blobToKzgCommitmentBatch?.bind(value) ??
    ((blobs: readonly Bytes.Bytes[]) =>
      blobs.map((blob) => value.blobToKzgCommitment(blob)))
  const computeBlobKzgProofBatch =
    value.computeBlobKzgProofBatch?.bind(value) ??
    ((blobs: readonly Bytes.Bytes[], commitments: readonly Bytes.Bytes[]) => {
      if (blobs.length !== commitments.length)
        throw new Error(
          `computeBlobKzgProofBatch: blobs.length (${blobs.length}) !== commitments.length (${commitments.length})`,
        )
      const out: Bytes.Bytes[] = new Array(blobs.length)
      for (let i = 0; i < blobs.length; i++)
        out[i] = value.computeBlobKzgProof(blobs[i]!, commitments[i]!)
      return out
    })
  return {
    blobToKzgCommitment: (blob) => value.blobToKzgCommitment(blob),
    computeBlobKzgProof: (blob, commitment) =>
      value.computeBlobKzgProof(blob, commitment),
    blobToKzgCommitmentBatch,
    computeBlobKzgProofBatch,
  }
}

export declare namespace from {
  type ErrorType = Errors.GlobalErrorType
}
