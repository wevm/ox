import { TransactionEnvelope, Value } from 'ox'
import { expect, test } from 'vitest'

test('legacy', () => {
  const transaction = TransactionEnvelope.toRpc(
    TransactionEnvelope.from({
      chainId: 1,
      gas: 21000n,
      gasPrice: Value.fromGwei('10'),
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 1000000000000000000n,
    }),
  )
  expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "gasPrice": "0x02540be400",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x0",
      "value": "0x0de0b6b3a7640000",
    }
  `)
})

test('eip1559', () => {
  const transaction = TransactionEnvelope.toRpc(
    TransactionEnvelope.from({
      chainId: 1,
      nonce: 0n,
      maxFeePerGas: 1000000000n,
      gas: 21000n,
      maxPriorityFeePerGas: 100000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 1000000000000000000n,
    }),
  )
  expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x05f5e100",
      "nonce": "0x00",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x2",
      "value": "0x0de0b6b3a7640000",
    }
  `)
})

test('eip2930', () => {
  const transaction = TransactionEnvelope.toRpc(
    TransactionEnvelope.from({
      accessList: [],
      chainId: 1,
      nonce: 0n,
      gas: 21000n,
      gasPrice: Value.fromGwei('10'),
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 1000000000000000000n,
    }),
  )
  expect(transaction).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "gasPrice": "0x02540be400",
      "nonce": "0x00",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x1",
      "value": "0x0de0b6b3a7640000",
    }
  `)
})

test('eip4844', () => {
  const transaction = TransactionEnvelope.toRpc(
    TransactionEnvelope.from({
      accessList: [],
      blobVersionedHashes: [
        '0x0100000000000000000000000000000000000000000000000000000000000000',
      ],
      chainId: 1,
      nonce: 0n,
      gas: 21000n,
      maxFeePerBlobGas: Value.fromGwei('10'),
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      value: 1000000000000000000n,
    }),
  )
  expect(transaction).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "blobVersionedHashes": [
        "0x0100000000000000000000000000000000000000000000000000000000000000",
      ],
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "maxFeePerBlobGas": "0x02540be400",
      "nonce": "0x00",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x3",
      "value": "0x0de0b6b3a7640000",
    }
  `)
})

test('error: not implemented', () => {
  expect(() =>
    TransactionEnvelope.toRpc(
      TransactionEnvelope.from({
        accessList: [],
        authorizationList: [],
        chainId: 1,
        nonce: 0n,
        gas: 21000n,
        to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        value: 1000000000000000000n,
      }),
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.TypeNotImplementedError: The provided transaction type `eip7702` is not implemented.]',
  )
})
