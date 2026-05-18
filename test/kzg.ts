import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { trustedSetup as fastSetup } from '@paulmillr/trusted-setups/fast-peerdas.js'
import { KZG } from 'micro-eth-signer/advanced/kzg.js'
import { Bytes, Hex, Kzg } from 'ox'

const k = new KZG(fastSetup)
const toHex = (b: Bytes.Bytes) => Bytes.toHex(b)
const fromHex = (s: string) => Hex.toBytes(s as `0x${string}`)

export const kzg = Kzg.from({
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

export const blobData = readFileSync(
  resolve(__dirname, './kzg/lorem-ipsum.txt'),
  'utf-8',
)
