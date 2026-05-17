import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { trustedSetup as fastSetup } from '@paulmillr/trusted-setups/fast-peerdas.js'
import { KZG } from 'micro-eth-signer/advanced/kzg.js'
import { Bytes, Hex, Kzg } from 'ox'
import { describe, expect, test } from 'vitest'
import { blobData, kzg as peerdasKzg } from '../../../test/kzg.js'
import * as Blobs from '../Blobs.js'

describe('from', () => {
  const blobToKzgCommitmentCases = JSON.parse(
    readFileSync(
      resolve(__dirname, '../../../test/kzg/blob-to-kzg-commitment.json'),
      'utf8',
    ),
  )

  let kzg: Kzg.Kzg

  test('defineKzg', () => {
    const k = new KZG(fastSetup)
    const toHex = (b: Bytes.Bytes) => Bytes.toHex(b)
    const fromHex = (s: string) => Hex.toBytes(s as `0x${string}`)
    kzg = Kzg.from({
      blobToKzgCommitment(blob) {
        return fromHex(k.blobToKzgCommitment(toHex(blob)))
      },
      computeCells(blob) {
        return k.computeCells(toHex(blob)).map(fromHex)
      },
      computeCellsAndKzgProofs(blob) {
        const [cells, proofs] = k.computeCellsAndProofs(toHex(blob))
        return { cells: cells.map(fromHex), proofs: proofs.map(fromHex) }
      },
      recoverCellsAndKzgProofs(indices, cells) {
        const [recoveredCells, proofs] = k.recoverCellsAndProofs(
          [...indices],
          cells.map(toHex),
        )
        return {
          cells: recoveredCells.map(fromHex),
          proofs: proofs.map(fromHex),
        }
      },
      verifyCellKzgProofBatch(commitments, indices, cells, proofs) {
        return k.verifyCellKzgProofBatch(
          commitments.map(toHex),
          [...indices],
          cells.map(toHex),
          proofs.map(toHex),
        )
      },
    })

    expect(kzg).toMatchInlineSnapshot(`
    {
      "blobToKzgCommitment": [Function],
      "computeCells": [Function],
      "computeCellsAndKzgProofs": [Function],
      "recoverCellsAndKzgProofs": [Function],
      "verifyCellKzgProofBatch": [Function],
    }
  `)
  })

  describe('blobToKzgCommitment', () => {
    for (const data of blobToKzgCommitmentCases) {
      test(data.name, () => {
        if (data.output === null)
          expect(() =>
            Uint8Array.from(
              kzg.blobToKzgCommitment(Hex.toBytes(data.input.blob)),
            ),
          ).toThrowError()
        else
          expect(
            Uint8Array.from(
              kzg.blobToKzgCommitment(Hex.toBytes(data.input.blob)),
            ),
          ).toEqual(Hex.toBytes(data.output))
      })
    }
  })
})

test('exports', () => {
  expect(Object.keys(Kzg)).toMatchInlineSnapshot(`
    [
      "versionedHashVersion",
      "from",
    ]
  `)
})

describe('peerdas (EIP-7594)', () => {
  // Single blob for cell-level round-trip tests.
  const blob = Blobs.from(Hex.fromString(blobData), { as: 'Bytes' }).slice(
    0,
    1,
  )[0]!

  test('computeCellsAndKzgProofs returns 128 cells + 128 proofs', () => {
    const { cells, proofs } = peerdasKzg.computeCellsAndKzgProofs(blob)
    expect(cells.length).toBe(128)
    expect(proofs.length).toBe(128)
    for (const cell of cells) expect(cell.length).toBe(2048)
    for (const proof of proofs) expect(proof.length).toBe(48)
  })

  test('computeCells matches the cells from computeCellsAndKzgProofs', () => {
    const cellsOnly = peerdasKzg.computeCells(blob)
    const { cells } = peerdasKzg.computeCellsAndKzgProofs(blob)
    expect(cellsOnly.length).toBe(cells.length)
    for (let i = 0; i < cells.length; i++)
      expect(cellsOnly[i]).toEqual(cells[i])
  })

  test('verifyCellKzgProofBatch round-trips', () => {
    const commitment = peerdasKzg.blobToKzgCommitment(blob)
    const { cells, proofs } = peerdasKzg.computeCellsAndKzgProofs(blob)
    const indices = cells.map((_, i) => i)
    const commitments = cells.map(() => commitment)
    expect(
      peerdasKzg.verifyCellKzgProofBatch(commitments, indices, cells, proofs),
    ).toBe(true)
  })

  test('verifyCellKzgProofBatch detects a corrupted cell', () => {
    const commitment = peerdasKzg.blobToKzgCommitment(blob)
    const { cells, proofs } = peerdasKzg.computeCellsAndKzgProofs(blob)
    const tampered = cells.map((c, i) => {
      if (i !== 7) return c
      const copy = Uint8Array.from(c)
      copy[0] = copy[0]! ^ 0x01
      return copy
    })
    const indices = cells.map((_, i) => i)
    const commitments = cells.map(() => commitment)
    expect(
      peerdasKzg.verifyCellKzgProofBatch(
        commitments,
        indices,
        tampered,
        proofs,
      ),
    ).toBe(false)
  })

  test('recoverCellsAndKzgProofs reconstructs the full set from half the cells', () => {
    const { cells, proofs } = peerdasKzg.computeCellsAndKzgProofs(blob)
    // Erase every other cell (keep 64 of 128).
    const keptIndices: number[] = []
    const keptCells: Bytes.Bytes[] = []
    for (let i = 0; i < cells.length; i += 2) {
      keptIndices.push(i)
      keptCells.push(cells[i]!)
    }
    const recovered = peerdasKzg.recoverCellsAndKzgProofs(
      keptIndices,
      keptCells,
    )
    expect(recovered.cells.length).toBe(128)
    expect(recovered.proofs.length).toBe(128)
    for (let i = 0; i < cells.length; i++) {
      expect(recovered.cells[i]).toEqual(cells[i])
      expect(recovered.proofs[i]).toEqual(proofs[i])
    }
  })
})

test('from: preserves `this` binding for method-style implementations', () => {
  // Stateful implementation whose methods rely on `this` -- a destructured
  // wrapper would lose the binding and throw.
  class StatefulKzg {
    suffix: Uint8Array
    constructor(suffix: Uint8Array) {
      this.suffix = suffix
    }
    blobToKzgCommitment(blob: Uint8Array): Uint8Array {
      return new Uint8Array([...blob.slice(0, 1), ...this.suffix])
    }
    computeCells(blob: Uint8Array): readonly Uint8Array[] {
      return [new Uint8Array([...blob.slice(0, 1), ...this.suffix])]
    }
    computeCellsAndKzgProofs(blob: Uint8Array): {
      cells: readonly Uint8Array[]
      proofs: readonly Uint8Array[]
    } {
      const cell = new Uint8Array([...blob.slice(0, 1), ...this.suffix])
      return { cells: [cell], proofs: [cell] }
    }
    recoverCellsAndKzgProofs(
      _indices: readonly number[],
      cells: readonly Uint8Array[],
    ): {
      cells: readonly Uint8Array[]
      proofs: readonly Uint8Array[]
    } {
      return {
        cells: cells.map((c) => new Uint8Array([...c, ...this.suffix])),
        proofs: cells.map((c) => new Uint8Array([...c, ...this.suffix])),
      }
    }
    verifyCellKzgProofBatch(): boolean {
      return this.suffix.length > 0
    }
  }
  const stateful = new StatefulKzg(new Uint8Array([0xab, 0xcd]))
  const kzg = Kzg.from(stateful)
  expect(() => kzg.blobToKzgCommitment(new Uint8Array([0x11]))).not.toThrow()
  expect(kzg.blobToKzgCommitment(new Uint8Array([0x11]))).toEqual(
    new Uint8Array([0x11, 0xab, 0xcd]),
  )
  expect(kzg.computeCells(new Uint8Array([0x11]))).toEqual([
    new Uint8Array([0x11, 0xab, 0xcd]),
  ])
  expect(kzg.verifyCellKzgProofBatch([], [], [], [])).toBe(true)
})
