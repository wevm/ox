import type { Bytes } from '../Bytes/types.js'

export type Kzg = {
  /**
   * Convert a blob to a KZG commitment.
   */
  blobToKzgCommitment(blob: Bytes): Bytes
  /**
   * Given a blob, return the KZG proof that is used to verify it against the
   * commitment.
   */
  computeBlobKzgProof(blob: Bytes, commitment: Bytes): Bytes
}
