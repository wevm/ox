import { Blobs, TransactionEnvelopeEip4844 } from 'ox'
import { expect, test } from 'vitest'
import { kzg } from '../../../../test/kzg.js'

const blobs = Blobs.from('0xdeadbeef')
const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })

test('default', () => {
  const transaction = TransactionEnvelopeEip4844.toRpc({
    blobVersionedHashes,
    chainId: 1,
    nonce: 0n,
    maxFeePerGas: 1000000000n,
    gas: 21000n,
    maxPriorityFeePerGas: 100000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    value: 1000000000000000000n,
    r: 1n,
    s: 2n,
    yParity: 0,
  })
  expect(transaction).toMatchInlineSnapshot(`
    {
      "blobVersionedHashes": [
        "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
      ],
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x05f5e100",
      "nonce": "0x00",
      "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x3",
      "value": "0x0de0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
})

test('behavior: nullish', () => {
  const transaction = TransactionEnvelopeEip4844.toRpc({
    blobVersionedHashes,
    chainId: 1,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  })
  expect(transaction).toMatchInlineSnapshot(`
    {
      "blobVersionedHashes": [
        "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
      ],
      "chainId": "0x01",
      "data": undefined,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x3",
    }
  `)
})
