import { afterAll, bench, describe } from 'vp/test'
import { mainnet as trustedSetup } from '../trusted-setups/Setups.js'
import { create } from './Kzg.js'

const once = {
  iterations: 1,
  time: 0,
  warmupIterations: 0,
  warmupTime: 0,
} as const

describe('create', () => {
  bench(
    'precompute 0',
    async () => {
      const kzg = await create({ trustedSetup })
      kzg.dispose()
    },
    once,
  )

  bench(
    'precompute 8',
    async () => {
      const kzg = await create({ precompute: 8, trustedSetup })
      kzg.dispose()
    },
    once,
  )
})

const kzg = await create({ trustedSetup })
const blob = new Uint8Array(131_072)
const commitment = kzg.blobToKzgCommitment(blob)
const { cells, proofs } = kzg.computeCellsAndKzgProofs(blob)
const indices = cells.map((_, index) => index)
const commitments = cells.map(() => commitment)
const partialIndices = indices.filter((index) => index % 2 === 0)
const partialCells = cells.filter((_, index) => index % 2 === 0)

afterAll(() => kzg.dispose())

describe('operations', () => {
  bench('blobToKzgCommitment', () => {
    kzg.blobToKzgCommitment(blob)
  })

  bench('computeCells', () => {
    kzg.computeCells(blob)
  })

  bench('computeCellsAndKzgProofs', () => {
    kzg.computeCellsAndKzgProofs(blob)
  })

  bench('recoverCellsAndKzgProofs', () => {
    kzg.recoverCellsAndKzgProofs(partialIndices, partialCells)
  })

  bench('verifyCellKzgProofBatch', () => {
    kzg.verifyCellKzgProofBatch(commitments, indices, cells, proofs)
  })
})
