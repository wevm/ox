import type * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'

/** @see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-4844.md#parameters */
export const versionedHashVersion = 1

/** Root type for a KZG interface. */
export type Kzg = {
  /**
   * Convert a blob to a KZG commitment.
   */
  blobToKzgCommitment(blob: Bytes.Bytes): Bytes.Bytes
  /**
   * Compute only the cells for a blob (PeerDAS, EIP-7594). Returns 128 cells.
   */
  computeCells(blob: Bytes.Bytes): readonly Bytes.Bytes[]
  /**
   * Compute the cells and KZG proofs for a blob (PeerDAS, EIP-7594).
   * Returns 128 cells and 128 proofs.
   */
  computeCellsAndKzgProofs(blob: Bytes.Bytes): {
    cells: readonly Bytes.Bytes[]
    proofs: readonly Bytes.Bytes[]
  }
  /**
   * Given at least 64 known cells of an extended blob, recover the full set
   * of 128 cells and 128 proofs (PeerDAS, EIP-7594).
   */
  recoverCellsAndKzgProofs(
    cellIndices: readonly number[],
    cells: readonly Bytes.Bytes[],
  ): {
    cells: readonly Bytes.Bytes[]
    proofs: readonly Bytes.Bytes[]
  }
  /**
   * Verify a batch of cell KZG proofs against their commitments (PeerDAS,
   * EIP-7594).
   */
  verifyCellKzgProofBatch(
    commitments: readonly Bytes.Bytes[],
    cellIndices: readonly number[],
    cells: readonly Bytes.Bytes[],
    proofs: readonly Bytes.Bytes[],
  ): boolean
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
  return {
    blobToKzgCommitment: (blob) => value.blobToKzgCommitment(blob),
    computeCells: (blob) => value.computeCells(blob),
    computeCellsAndKzgProofs: (blob) => value.computeCellsAndKzgProofs(blob),
    recoverCellsAndKzgProofs: (indices, cells) =>
      value.recoverCellsAndKzgProofs(indices, cells),
    verifyCellKzgProofBatch: (commitments, indices, cells, proofs) =>
      value.verifyCellKzgProofBatch(commitments, indices, cells, proofs),
  }
}

export declare namespace from {
  type ErrorType = Errors.GlobalErrorType
}
