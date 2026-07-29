import { afterAll, beforeAll, describe, expect, test } from 'vp/test'
import { kzg as reference } from '../../../test/kzg.js'
import type * as Bytes from '../../core/Bytes.js'
import type * as CoreKzg from '../../core/Kzg.js'
import { mainnet as trustedSetup } from '../../trusted-setups/Setups.js'
import * as Kzg from '../Kzg.js'

const blob = Uint8Array.from({ length: 131_072 }, (_, index) =>
  index % 32 === 31 ? index % 251 : 0,
)

let instance: Kzg.create.ReturnType
let commitment: Bytes.Bytes
let cells: readonly Bytes.Bytes[]
let proofs: readonly Bytes.Bytes[]

beforeAll(async () => {
  instance = await Kzg.create({ trustedSetup })
  commitment = instance.blobToKzgCommitment(blob)
  ;({ cells, proofs } = instance.computeCellsAndKzgProofs(blob))
}, 120_000)

afterAll(() => {
  instance.dispose()
})

describe('create', () => {
  test('returns the injected Kzg.Kzg boundary', () => {
    expect(instance satisfies CoreKzg.Kzg).toMatchInlineSnapshot(`
      {
        "blobToKzgCommitment": [Function],
        "computeCells": [Function],
        "computeCellsAndKzgProofs": [Function],
        "dispose": [Function],
        "recoverCellsAndKzgProofs": [Function],
        "verifyCellKzgProofBatch": [Function],
      }
    `)
  })

  test('compiles concurrently into independently owned instances', async () => {
    const [first, second] = await Promise.all([
      Kzg.create({ trustedSetup }),
      Kzg.create({ trustedSetup }),
    ])

    first.dispose()
    expect(() => first.blobToKzgCommitment(blob)).toThrow(Kzg.DisposedError)
    expect(second.blobToKzgCommitment(blob)).toEqual(commitment)
    second.dispose()
    second.dispose()
    expect(() => second.computeCells(blob)).toThrowErrorMatchingInlineSnapshot(
      `[Kzg.DisposedError: KZG instance has been disposed.]`,
    )
  }, 120_000)

  test('rejects precomputation beyond the memory bound', async () => {
    await expect(
      Kzg.create({ precompute: 9, trustedSetup }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Kzg.InvalidPrecomputeError: \`precompute\` must be an integer from 0 through 8. Got 9.]`,
    )
  })

  test('rejects malformed trusted setup points', async () => {
    await expect(
      Kzg.create({
        trustedSetup: {
          ...trustedSetup,
          g2_monomial: trustedSetup.g2_monomial.slice(1),
        },
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Kzg.InvalidTrustedSetupError: \`g2_monomial\` must contain exactly 6240 bytes.]`,
    )
  })

  test('rejects invalid trusted setup points', async () => {
    const g1Lagrange = trustedSetup.g1_lagrange.slice()
    g1Lagrange.fill(0, 0, 48)
    await expect(
      Kzg.create({
        trustedSetup: {
          ...trustedSetup,
          g1_lagrange: g1Lagrange,
        },
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Kzg.InvalidTrustedSetupError: c-kzg rejected the trusted setup.]`,
    )
  }, 120_000)
})

describe('blobToKzgCommitment', () => {
  test('conformance: matches the independent reference implementation', () => {
    expect(commitment).toEqual(reference.blobToKzgCommitment(blob))
  })

  test('rejects a malformed blob', () => {
    expect(() =>
      instance.blobToKzgCommitment(new Uint8Array(31)),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Kzg.InvalidInputError: \`blob\` must contain exactly 131072 bytes.]`,
    )
  })

  test('reuses setup and scratch state', () => {
    for (let i = 0; i < 100; i++)
      expect(instance.blobToKzgCommitment(blob)).toEqual(commitment)
  })
})

describe('computeCells', () => {
  test('conformance: matches the independent reference implementation', () => {
    expect(instance.computeCells(blob)).toEqual(reference.computeCells(blob))
  }, 120_000)
})

describe('computeCellsAndKzgProofs', () => {
  test('conformance: matches the independent reference implementation', () => {
    const expected = reference.computeCellsAndKzgProofs(blob)
    expect(cells).toEqual(expected.cells)
    expect(proofs).toEqual(expected.proofs)
  }, 120_000)
})

describe('recoverCellsAndKzgProofs', () => {
  test('conformance: matches the independent reference implementation', () => {
    const indices = cells.map((_, index) => index).filter((index) => index % 2)
    const partial = cells.filter((_, index) => index % 2)
    const expected = reference.recoverCellsAndKzgProofs(indices, partial)

    expect(instance.recoverCellsAndKzgProofs(indices, partial)).toEqual(
      expected,
    )
  }, 120_000)

  test('rejects duplicate indices', () => {
    expect(() =>
      instance.recoverCellsAndKzgProofs(
        Array.from({ length: 64 }, () => 0),
        cells.slice(0, 64),
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Kzg.InvalidInputError: \`cellIndices\` must not contain duplicate indices.]`,
    )
  })
})

describe('verifyCellKzgProofBatch', () => {
  const indices = Array.from({ length: 128 }, (_, index) => index)

  test('conformance: matches the independent reference implementation', () => {
    const commitments = cells.map(() => commitment)
    expect(
      instance.verifyCellKzgProofBatch(commitments, indices, cells, proofs),
    ).toBe(
      reference.verifyCellKzgProofBatch(commitments, indices, cells, proofs),
    )
  }, 120_000)

  test('returns false for a corrupted cell', () => {
    const corrupted = cells.map((cell, index) => {
      if (index !== 7) return cell
      const value = Uint8Array.from(cell)
      value[0] = value[0]! ^ 1
      return value
    })
    expect(
      instance.verifyCellKzgProofBatch(
        cells.map(() => commitment),
        indices,
        corrupted,
        proofs,
      ),
    ).toMatchInlineSnapshot('false')
  })

  test('rejects mismatched input lengths', () => {
    expect(() =>
      instance.verifyCellKzgProofBatch(
        [commitment],
        [],
        [cells[0]!],
        [proofs[0]!],
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Kzg.InvalidInputError: \`commitments\`, \`cellIndices\`, \`cells\`, and \`proofs\` must have the same non-zero length.]`,
    )
  })
})

test('exports', () => {
  expect(Object.keys(Kzg)).toMatchInlineSnapshot(`
    [
      "create",
      "DisposedError",
      "InvalidInputError",
      "InvalidPrecomputeError",
      "InvalidTrustedSetupError",
      "MemoryError",
      "WasmError",
      "versionedHashVersion",
      "from",
    ]
  `)
})
