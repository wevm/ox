import * as Blobs from './Blobs.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import type { Compute } from './internal/types.js'
import type * as Kzg from './Kzg.js'

/** The number of field elements in a cell. */
export const fieldElementsPerCell = 64

/** The number of bytes in a cell (64 × 32). */
export const bytesPerCell = 2048

/** The number of cells per extended blob. */
export const cellsPerExtBlob = 128

/** Root type for a Cell. */
export type Cell<type extends Hex.Hex | Bytes.Bytes = Hex.Hex | Bytes.Bytes> =
  type

/** Root type for a cell KZG proof. */
export type CellProof<
  type extends Hex.Hex | Bytes.Bytes = Hex.Hex | Bytes.Bytes,
> = type

/** The 0-based index of a cell within an extended blob (0…127). */
export type CellIndex = number

/** The 0-based index of a column across all blobs in a block (0…127). */
export type ColumnIndex = number

/**
 * A PeerDAS data column for a single block: one cell + cell proof per blob,
 * plus the blob-level commitments needed to verify them.
 */
export type DataColumn<
  type extends Hex.Hex | Bytes.Bytes = Hex.Hex | Bytes.Bytes,
> = {
  /** Column index within the block (0…127). */
  index: ColumnIndex
  /** One cell per blob, at position `index` of each blob's extended form. */
  cells: readonly Cell<type>[]
  /** One cell KZG proof per blob, parallel to `cells`. */
  proofs: readonly CellProof<type>[]
  /** Blob commitments, parallel to `cells`. */
  commitments: readonly type[]
}

/**
 * Compute the cells and KZG proofs for a single blob (PeerDAS, EIP-7594).
 *
 * Returns 128 cells (each 2048 bytes) and 128 cell-level KZG proofs (each 48 bytes).
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { BlobCells, Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const [blob] = Blobs.from('0xdeadbeef')
 * const { cells, proofs } = BlobCells.fromBlob(blob, { kzg })
 * ```
 *
 * @param blob - The blob to convert.
 * @param options - Options.
 * @returns The cells and proofs.
 */
export function fromBlob<
  const blob extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (blob extends Hex.Hex ? 'Hex' : never)
    | (blob extends Bytes.Bytes ? 'Bytes' : never),
>(
  blob: blob | Hex.Hex | Bytes.Bytes,
  options: fromBlob.Options<as>,
): fromBlob.ReturnType<as> {
  const { kzg } = options

  const as = options.as ?? (typeof blob === 'string' ? 'Hex' : 'Bytes')
  const blob_ = (
    typeof blob === 'string' ? Bytes.fromHex(blob) : blob
  ) as Bytes.Bytes

  const { cells, proofs } = kzg.computeCellsAndKzgProofs(blob_)

  if (as === 'Bytes')
    return {
      cells: cells.map((c) => Uint8Array.from(c)),
      proofs: proofs.map((p) => Uint8Array.from(p)),
    } as never

  return {
    cells: cells.map((c) => Hex.fromBytes(c)),
    proofs: proofs.map((p) => Hex.fromBytes(p)),
  } as never
}

export declare namespace fromBlob {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'computeCellsAndKzgProofs'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes'
        ? {
            cells: readonly Cell<Bytes.Bytes>[]
            proofs: readonly CellProof<Bytes.Bytes>[]
          }
        : never)
    | (as extends 'Hex'
        ? {
            cells: readonly Cell<Hex.Hex>[]
            proofs: readonly CellProof<Hex.Hex>[]
          }
        : never)
  >

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Verify a batch of cell KZG proofs against their commitments (PeerDAS, EIP-7594).
 *
 * Each cell at index `cellIndices[i]` is checked against the commitment
 * `commitments[i]` using the proof `proofs[i]`.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { BlobCells, Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const [blob] = Blobs.from('0xdeadbeef')
 * const [commitment] = Blobs.toCommitments([blob], { kzg })
 * const { cells, proofs } = BlobCells.fromBlob(blob, { kzg })
 * const valid = BlobCells.verify({
 *   cells,
 *   cellIndices: cells.map((_, i) => i),
 *   commitments: cells.map(() => commitment),
 *   proofs,
 *   kzg
 * })
 * ```
 *
 * @param options - Verification options.
 * @returns Whether all (commitment, cell, proof) tuples verify.
 */
export function verify(options: verify.Options): boolean {
  const { kzg, commitments, cellIndices, cells, proofs } = options
  const toBytes = (x: Hex.Hex | Bytes.Bytes): Bytes.Bytes =>
    typeof x === 'string' ? Bytes.fromHex(x) : x
  return kzg.verifyCellKzgProofBatch(
    commitments.map(toBytes),
    [...cellIndices],
    cells.map(toBytes),
    proofs.map(toBytes),
  )
}

export declare namespace verify {
  type Options = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'verifyCellKzgProofBatch'>
    /** Commitments, one per cell (parallel to `cells`). */
    commitments: readonly (Hex.Hex | Bytes.Bytes)[]
    /** Cell indices within their respective extended blobs. */
    cellIndices: readonly CellIndex[]
    /** Cells to verify. */
    cells: readonly (Cell<Hex.Hex> | Cell<Bytes.Bytes>)[]
    /** Proofs, one per cell (parallel to `cells`). */
    proofs: readonly (CellProof<Hex.Hex> | CellProof<Bytes.Bytes>)[]
  }

  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/**
 * Reconstruct all 128 cells (and their KZG proofs) of an extended blob from
 * at least 64 known cells (PeerDAS, EIP-7594).
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { BlobCells } from 'ox'
 * import { kzg } from './kzg'
 *
 * // Reconstruct from 64 of 128 cells.
 * const { cells, proofs } = BlobCells.recover(
 *   knownIndices, // e.g. [0, 2, 4, …]
 *   knownCells,
 *   { kzg }
 * )
 * ```
 *
 * @param cellIndices - The indices of the known cells (must contain ≥ 64 distinct values).
 * @param cells - The known cells, parallel to `cellIndices`.
 * @param options - Options.
 * @returns The full set of 128 cells and 128 proofs.
 */
export function recover<
  const cells extends readonly (Hex.Hex | Bytes.Bytes)[],
  as extends 'Hex' | 'Bytes' =
    | (cells extends readonly Hex.Hex[] ? 'Hex' : never)
    | (cells extends readonly Bytes.Bytes[] ? 'Bytes' : never),
>(
  cellIndices: readonly CellIndex[],
  cells: cells | readonly (Hex.Hex | Bytes.Bytes)[],
  options: recover.Options<as>,
): recover.ReturnType<as> {
  const { kzg } = options

  if (cellIndices.length !== cells.length)
    throw new MismatchedLengthsError({
      label: 'cellIndices/cells',
      a: cellIndices.length,
      b: cells.length,
    })
  if (cells.length < cellsPerExtBlob / 2)
    throw new InsufficientCellsError({ count: cells.length })

  const as = options.as ?? (typeof cells[0] === 'string' ? 'Hex' : 'Bytes')
  const cells_ = cells.map((c) =>
    typeof c === 'string' ? Bytes.fromHex(c) : c,
  ) as Bytes.Bytes[]

  const { cells: recoveredCells, proofs } = kzg.recoverCellsAndKzgProofs(
    [...cellIndices],
    cells_,
  )

  if (as === 'Bytes')
    return {
      cells: recoveredCells.map((c) => Uint8Array.from(c)),
      proofs: proofs.map((p) => Uint8Array.from(p)),
    } as never

  return {
    cells: recoveredCells.map((c) => Hex.fromBytes(c)),
    proofs: proofs.map((p) => Hex.fromBytes(p)),
  } as never
}

export declare namespace recover {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'recoverCellsAndKzgProofs'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes'
        ? {
            cells: readonly Cell<Bytes.Bytes>[]
            proofs: readonly CellProof<Bytes.Bytes>[]
          }
        : never)
    | (as extends 'Hex'
        ? {
            cells: readonly Cell<Hex.Hex>[]
            proofs: readonly CellProof<Hex.Hex>[]
          }
        : never)
  >

  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Hex.fromBytes.ErrorType
    | InsufficientCellsError
    | MismatchedLengthsError
    | Errors.GlobalErrorType
}

/**
 * Build the 128 PeerDAS data columns from a list of blobs (EIP-7594).
 *
 * For each column index `i ∈ [0, 128)`, produces a {@link ox#BlobCells.DataColumn}
 * containing one cell + one cell proof per blob (at column `i` of each blob's
 * extended form), alongside the blob-level commitments needed to verify them.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { BlobCells, Blobs } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const columns = BlobCells.toDataColumns(blobs, { kzg }) // 128 columns
 * ```
 *
 * @param blobs - The blobs to convert.
 * @param options - Options.
 * @returns 128 data columns.
 */
export function toDataColumns<
  const blobs extends Blobs.Blobs<Hex.Hex> | Blobs.Blobs<Bytes.Bytes>,
  as extends 'Hex' | 'Bytes' =
    | (blobs extends Blobs.Blobs<Hex.Hex> ? 'Hex' : never)
    | (blobs extends Blobs.Blobs<Bytes.Bytes> ? 'Bytes' : never),
>(
  blobs: blobs | Blobs.Blobs<Hex.Hex> | Blobs.Blobs<Bytes.Bytes>,
  options: toDataColumns.Options<as>,
): toDataColumns.ReturnType<as> {
  const { kzg } = options
  const as = options.as ?? (typeof blobs[0] === 'string' ? 'Hex' : 'Bytes')

  const commitments = Blobs.toCommitments(blobs, { kzg, as: 'Bytes' })
  const perBlob = blobs.map(
    (b) =>
      fromBlob(b as Hex.Hex | Bytes.Bytes, { kzg, as: 'Bytes' }) as {
        cells: readonly Bytes.Bytes[]
        proofs: readonly Bytes.Bytes[]
      },
  )

  const columns: DataColumn<Bytes.Bytes>[] = []
  for (let i = 0; i < cellsPerExtBlob; i++) {
    columns.push({
      index: i,
      cells: perBlob.map((b) => b.cells[i]!),
      proofs: perBlob.map((b) => b.proofs[i]!),
      commitments,
    })
  }

  if (as === 'Bytes') return columns as never

  return columns.map((c) => ({
    index: c.index,
    cells: c.cells.map((x) => Hex.fromBytes(x)),
    proofs: c.proofs.map((x) => Hex.fromBytes(x)),
    commitments: c.commitments.map((x) => Hex.fromBytes(x)),
  })) as never
}

export declare namespace toDataColumns {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** KZG implementation. */
    kzg: Pick<Kzg.Kzg, 'blobToKzgCommitment' | 'computeCellsAndKzgProofs'>
    /** Return type. */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = Compute<
    | (as extends 'Bytes' ? readonly DataColumn<Bytes.Bytes>[] : never)
    | (as extends 'Hex' ? readonly DataColumn<Hex.Hex>[] : never)
  >

  type ErrorType =
    | fromBlob.ErrorType
    | Blobs.toCommitments.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when fewer than {@link ox#BlobCells.cellsPerExtBlob}/2 cells are passed to {@link ox#BlobCells.recover}. */
export class InsufficientCellsError extends Errors.BaseError {
  override readonly name = 'BlobCells.InsufficientCellsError'

  constructor({ count }: { count: number }) {
    super(
      `\`BlobCells.recover\` requires at least ${cellsPerExtBlob / 2} cells; received ${count}.`,
    )
  }
}

/** Thrown when two parallel input arrays have different lengths. */
export class MismatchedLengthsError extends Errors.BaseError {
  override readonly name = 'BlobCells.MismatchedLengthsError'

  constructor({ label, a, b }: { label: string; a: number; b: number }) {
    super(`Length mismatch for ${label}: ${a} vs ${b}.`)
  }
}
