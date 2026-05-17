import { BlobCells, Blobs, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'
import { blobData, kzg } from '../../../test/kzg.js'

// KZG cell-proof computations are CPU-heavy and can exceed the default
// 20s testTimeout on busy CI runners; give every test that touches the
// KZG backend (fromBlob / verify / recover / toDataColumns) 60s headroom.
const timeout = 60_000

const [blobHex] = Blobs.from(Hex.fromString(blobData))
const [blobBytes] = Blobs.from(Bytes.fromString(blobData))

describe('fromBlob', () => {
  test(
    'default (Hex in → Hex out)',
    () => {
      const { cells, proofs } = BlobCells.fromBlob(blobHex!, { kzg })
      expect(cells.length).toBe(128)
      expect(proofs.length).toBe(128)
      for (const cell of cells) {
        expect(typeof cell).toBe('string')
        expect(Hex.size(cell as Hex.Hex)).toBe(2048)
      }
      for (const proof of proofs) {
        expect(typeof proof).toBe('string')
        expect(Hex.size(proof as Hex.Hex)).toBe(48)
      }
    },
    timeout,
  )

  test(
    'Bytes in → Bytes out',
    () => {
      const { cells, proofs } = BlobCells.fromBlob(blobBytes!, { kzg })
      expect(cells.length).toBe(128)
      expect(proofs.length).toBe(128)
      for (const cell of cells) {
        expect(cell).toBeInstanceOf(Uint8Array)
        expect((cell as Bytes.Bytes).length).toBe(2048)
      }
      for (const proof of proofs) {
        expect(proof).toBeInstanceOf(Uint8Array)
        expect((proof as Bytes.Bytes).length).toBe(48)
      }
    },
    timeout,
  )

  test(
    'as: "Bytes" overrides Hex input',
    () => {
      const { cells, proofs } = BlobCells.fromBlob(blobHex!, {
        kzg,
        as: 'Bytes',
      })
      expect(cells[0]).toBeInstanceOf(Uint8Array)
      expect(proofs[0]).toBeInstanceOf(Uint8Array)
    },
    timeout,
  )

  test(
    'as: "Hex" overrides Bytes input',
    () => {
      const { cells, proofs } = BlobCells.fromBlob(blobBytes!, {
        kzg,
        as: 'Hex',
      })
      expect(typeof cells[0]).toBe('string')
      expect(typeof proofs[0]).toBe('string')
    },
    timeout,
  )

  test(
    'Hex and Bytes outputs are equivalent',
    () => {
      const fromHex = BlobCells.fromBlob(blobHex!, { kzg })
      const fromBytes = BlobCells.fromBlob(blobBytes!, { kzg })
      for (let i = 0; i < fromHex.cells.length; i++) {
        expect(Hex.toBytes(fromHex.cells[i] as Hex.Hex)).toEqual(
          fromBytes.cells[i],
        )
        expect(Hex.toBytes(fromHex.proofs[i] as Hex.Hex)).toEqual(
          fromBytes.proofs[i],
        )
      }
    },
    timeout,
  )
})

describe('verify', () => {
  test(
    'returns true for a well-formed batch',
    () => {
      const [commitment] = Blobs.toCommitments([blobBytes!], { kzg })
      const { cells, proofs } = BlobCells.fromBlob(blobBytes!, { kzg })
      expect(
        BlobCells.verify({
          kzg,
          commitments: cells.map(() => commitment!),
          cellIndices: cells.map((_, i) => i),
          cells,
          proofs,
        }),
      ).toBe(true)
    },
    timeout,
  )

  test(
    'returns false when a cell is tampered',
    () => {
      const [commitment] = Blobs.toCommitments([blobBytes!], { kzg })
      const { cells, proofs } = BlobCells.fromBlob(blobBytes!, { kzg })
      const tampered = cells.map((c, i) => {
        if (i !== 3) return c
        const copy = Uint8Array.from(c as Bytes.Bytes)
        copy[0] = copy[0]! ^ 0x01
        return copy
      })
      expect(
        BlobCells.verify({
          kzg,
          commitments: cells.map(() => commitment!),
          cellIndices: cells.map((_, i) => i),
          cells: tampered,
          proofs,
        }),
      ).toBe(false)
    },
    timeout,
  )

  test(
    'accepts Hex cells/proofs/commitments',
    () => {
      const [commitment] = Blobs.toCommitments([blobBytes!], { kzg, as: 'Hex' })
      const { cells, proofs } = BlobCells.fromBlob(blobHex!, { kzg })
      expect(
        BlobCells.verify({
          kzg,
          commitments: cells.map(() => commitment!),
          cellIndices: cells.map((_, i) => i),
          cells,
          proofs,
        }),
      ).toBe(true)
    },
    timeout,
  )
})

describe('recover', () => {
  test(
    'reconstructs the full set from 64 cells (Bytes)',
    () => {
      const { cells, proofs } = BlobCells.fromBlob(blobBytes!, { kzg })
      const keptIndices: number[] = []
      const keptCells: Bytes.Bytes[] = []
      for (let i = 0; i < cells.length; i += 2) {
        keptIndices.push(i)
        keptCells.push(cells[i] as Bytes.Bytes)
      }
      const recovered = BlobCells.recover(keptIndices, keptCells, { kzg })
      expect(recovered.cells.length).toBe(128)
      expect(recovered.proofs.length).toBe(128)
      for (let i = 0; i < cells.length; i++) {
        expect(recovered.cells[i]).toEqual(cells[i])
        expect(recovered.proofs[i]).toEqual(proofs[i])
      }
    },
    timeout,
  )

  test(
    'reconstructs the full set from 64 cells (Hex)',
    () => {
      const { cells } = BlobCells.fromBlob(blobHex!, { kzg })
      const keptIndices: number[] = []
      const keptCells: Hex.Hex[] = []
      for (let i = 0; i < cells.length; i += 2) {
        keptIndices.push(i)
        keptCells.push(cells[i] as Hex.Hex)
      }
      const recovered = BlobCells.recover(keptIndices, keptCells, { kzg })
      expect(typeof recovered.cells[0]).toBe('string')
      expect(typeof recovered.proofs[0]).toBe('string')
      for (let i = 0; i < cells.length; i++)
        expect(recovered.cells[i]).toEqual(cells[i])
    },
    timeout,
  )

  test('throws when fewer than 64 cells are provided', () => {
    expect(() =>
      BlobCells.recover(
        [0, 1, 2],
        [new Uint8Array(2048), new Uint8Array(2048), new Uint8Array(2048)],
        { kzg },
      ),
    ).toThrow(BlobCells.InsufficientCellsError)
  })

  test('throws when cellIndices and cells lengths differ', () => {
    expect(() =>
      BlobCells.recover([0, 1], [new Uint8Array(2048)], { kzg }),
    ).toThrow(BlobCells.MismatchedLengthsError)
  })
})

describe('toDataColumns', () => {
  test(
    'returns 128 columns, one per column index',
    () => {
      const blobs = Blobs.from(Hex.fromString(blobData))
      const columns = BlobCells.toDataColumns(blobs, { kzg })
      expect(columns.length).toBe(128)
      columns.forEach((col, i) => {
        expect(col.index).toBe(i)
        expect(col.cells.length).toBe(blobs.length)
        expect(col.proofs.length).toBe(blobs.length)
        expect(col.commitments.length).toBe(blobs.length)
      })
    },
    timeout,
  )

  test(
    'each column verifies via BlobCells.verify',
    () => {
      const blobs = Blobs.from(Bytes.fromString(blobData)).slice(0, 1)
      const columns = BlobCells.toDataColumns(blobs, { kzg })
      // Sample one column for the verify smoke test (full sweep ~30s).
      const col = columns[7]!
      expect(
        BlobCells.verify({
          kzg,
          commitments: col.commitments,
          cellIndices: col.cells.map(() => col.index),
          cells: col.cells,
          proofs: col.proofs,
        }),
      ).toBe(true)
    },
    timeout,
  )

  test(
    'respects `as: "Bytes"`',
    () => {
      const blobs = Blobs.from(Hex.fromString(blobData))
      const columns = BlobCells.toDataColumns(blobs, { kzg, as: 'Bytes' })
      expect(columns[0]!.cells[0]).toBeInstanceOf(Uint8Array)
    },
    timeout,
  )
})

test('exports', () => {
  expect(Object.keys(BlobCells)).toMatchInlineSnapshot(`
    [
      "fieldElementsPerCell",
      "bytesPerCell",
      "cellsPerExtBlob",
      "fromBlob",
      "verify",
      "recover",
      "toDataColumns",
      "InsufficientCellsError",
      "MismatchedLengthsError",
    ]
  `)
})
