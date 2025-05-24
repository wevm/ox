import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { trustedSetup as fastSetup } from '@paulmillr/trusted-setups/fast-kzg.js'
import { KZG } from 'micro-eth-signer/kzg.js'
import { Bytes, Hex, Kzg } from 'ox'
import { describe, expect, test } from 'vitest'

describe('from', () => {
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
    const k = new KZG(fastSetup)
    kzg = Kzg.from({
      blobToKzgCommitment(blob) {
        return Hex.toBytes(
          k.blobToKzgCommitment(Bytes.toHex(blob)) as `0x${string}`,
        )
      },
      computeBlobKzgProof(blob, commitment) {
        return Hex.toBytes(
          k.computeBlobProof(
            Bytes.toHex(blob),
            Bytes.toHex(commitment),
          ) as `0x${string}`,
        )
      },
    })

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
})

test('exports', () => {
  expect(Object.keys(Kzg)).toMatchInlineSnapshot(`
    [
      "versionedHashVersion",
      "from",
    ]
  `)
})
