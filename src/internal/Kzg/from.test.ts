import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as cKzg from 'c-kzg'
import { Hex, Kzg } from 'ox'
import { Path } from 'ox/node'
import { describe, expect, test } from 'vitest'

const blobToKzgCommitmentCases = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../test/kzg/blob-to-kzg-commitment.json'),
    'utf8',
  ),
)
const computeBlobKzgProofCases = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../test/kzg/compute-blob-kzg-proof.json'),
    'utf8',
  ),
)

let kzg: Kzg.Kzg

test('defineKzg', () => {
  kzg = Kzg.from(cKzg)
  try {
    cKzg.loadTrustedSetup(Path.mainnetTrustedSetup)
  } catch {}

  expect(kzg).toMatchInlineSnapshot(`
    {
      "blobToKzgCommitment": [Function],
      "computeBlobKzgProof": [Function],
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

describe('computeBlobKzgProof', () => {
  for (const data of computeBlobKzgProofCases) {
    test(data.name, () => {
      if (data.output === null)
        expect(() =>
          Uint8Array.from(
            kzg.computeBlobKzgProof(
              Hex.toBytes(data.input.blob),
              Hex.toBytes(data.input.commitment),
            ),
          ),
        ).toThrowError()
      else
        expect(
          Uint8Array.from(
            kzg.computeBlobKzgProof(
              Hex.toBytes(data.input.blob),
              Hex.toBytes(data.input.commitment),
            ),
          ),
        ).toEqual(Hex.toBytes(data.output))
    })
  }
})
