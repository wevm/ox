import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { trustedSetup as fastSetup } from '@paulmillr/trusted-setups/fast-kzg.js'
import { KZG } from 'micro-eth-signer/advanced/kzg.js'
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
    computeBlobKzgProof(
      blob: Uint8Array,
      commitment: Uint8Array,
    ): Uint8Array {
      return new Uint8Array([
        ...blob.slice(0, 1),
        ...commitment.slice(0, 1),
        ...this.suffix,
      ])
    }
  }
  const stateful = new StatefulKzg(new Uint8Array([0xab, 0xcd]))
  const kzg = Kzg.from(stateful)
  expect(() => kzg.blobToKzgCommitment(new Uint8Array([0x11]))).not.toThrow()
  expect(kzg.blobToKzgCommitment(new Uint8Array([0x11]))).toEqual(
    new Uint8Array([0x11, 0xab, 0xcd]),
  )
  expect(
    kzg.computeBlobKzgProof(new Uint8Array([0x11]), new Uint8Array([0x22])),
  ).toEqual(new Uint8Array([0x11, 0x22, 0xab, 0xcd]))
})
