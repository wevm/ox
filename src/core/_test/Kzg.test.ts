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
      "blobToKzgCommitmentBatch": [Function],
      "computeBlobKzgProof": [Function],
      "computeBlobKzgProofBatch": [Function],
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
      "blobLength",
      "commitmentLength",
      "proofLength",
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
    computeBlobKzgProof(blob: Uint8Array, commitment: Uint8Array): Uint8Array {
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

test('from: synthesizes batch helpers when underlying implementation lacks them', () => {
  const calls: { kind: string; n: number }[] = []
  const kzg = Kzg.from({
    blobToKzgCommitment(blob) {
      calls.push({ kind: 'commitment', n: 1 })
      return new Uint8Array([blob[0]!, 0xaa])
    },
    computeBlobKzgProof(blob, commitment) {
      calls.push({ kind: 'proof', n: 1 })
      return new Uint8Array([blob[0]!, commitment[0]!, 0xbb])
    },
  })
  expect(typeof kzg.blobToKzgCommitmentBatch).toBe('function')
  expect(typeof kzg.computeBlobKzgProofBatch).toBe('function')

  const blobs = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])]
  const commitments = kzg.blobToKzgCommitmentBatch!(blobs)
  expect(commitments).toEqual([
    new Uint8Array([1, 0xaa]),
    new Uint8Array([2, 0xaa]),
    new Uint8Array([3, 0xaa]),
  ])

  const proofs = kzg.computeBlobKzgProofBatch!(blobs, commitments)
  expect(proofs).toEqual([
    new Uint8Array([1, 1, 0xbb]),
    new Uint8Array([2, 2, 0xbb]),
    new Uint8Array([3, 3, 0xbb]),
  ])
})

test('from: forwards native batch helpers when provided', () => {
  let nativeCalls = 0
  const kzg = Kzg.from({
    blobToKzgCommitment() {
      throw new Error('should not call single')
    },
    computeBlobKzgProof() {
      throw new Error('should not call single')
    },
    blobToKzgCommitmentBatch(blobs) {
      nativeCalls++
      return blobs.map((b) => new Uint8Array([b[0]!, 0xcc]))
    },
    computeBlobKzgProofBatch(blobs, commitments) {
      nativeCalls++
      return blobs.map(
        (b, i) => new Uint8Array([b[0]!, commitments[i]![0]!, 0xdd]),
      )
    },
  })
  const commitments = kzg.blobToKzgCommitmentBatch!([new Uint8Array([7])])
  expect(commitments).toEqual([new Uint8Array([7, 0xcc])])
  const proofs = kzg.computeBlobKzgProofBatch!(
    [new Uint8Array([7])],
    commitments,
  )
  expect(proofs).toEqual([new Uint8Array([7, 7, 0xdd])])
  expect(nativeCalls).toBe(2)
})

test('from: synthesized proof batch validates length parity', () => {
  const kzg = Kzg.from({
    blobToKzgCommitment: () => new Uint8Array(),
    computeBlobKzgProof: () => new Uint8Array(),
  })
  expect(() =>
    kzg.computeBlobKzgProofBatch!([new Uint8Array([1])], []),
  ).toThrowError('blobs.length')
})

test('exports fixed-size constants', () => {
  expect(Kzg.blobLength).toBe(131_072)
  expect(Kzg.commitmentLength).toBe(48)
  expect(Kzg.proofLength).toBe(48)
})
