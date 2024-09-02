import { Blobs, Hex, TransactionEnvelope, Value } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'
import { kzg } from '../../../../test/kzg.js'

test('legacy', () => {
  const transaction = TransactionEnvelope.from({
    gasPrice: Value.fromGwei('2'),
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
    type: 'legacy',
  })
  const serialized = TransactionEnvelope.serialize(transaction)
  const deserialized = TransactionEnvelope.deserialize(serialized)
  expect(deserialized).toEqual(transaction)
})

test('eip1559', () => {
  const transaction = TransactionEnvelope.from({
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
    chainId: 1,
    maxFeePerGas: Value.fromGwei('2'),
    maxPriorityFeePerGas: Value.fromGwei('2'),
    type: 'eip1559',
  })
  const serialized = TransactionEnvelope.serialize(transaction)
  const deserialized = TransactionEnvelope.deserialize(serialized)
  expect(deserialized).toEqual(transaction)
})

test('eip2930', () => {
  const transaction = TransactionEnvelope.from({
    chainId: 1,
    accessList: [
      {
        address: '0x1234512345123451234512345123451234512345',
        storageKeys: [
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      },
    ],
    gasPrice: Value.fromGwei('2'),
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
  })
  const serialized = TransactionEnvelope.serialize(transaction)
  const deserialized = TransactionEnvelope.deserialize(serialized)
  expect(deserialized).toEqual(transaction)
})

test('eip4844', () => {
  const blobs = Blobs.from(Hex.from('abcd'))
  const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
  const transaction = TransactionEnvelope.from({
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
    chainId: 1,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
    maxFeePerBlobGas: Value.fromGwei('2'),
    blobVersionedHashes,
    type: 'eip4844',
  })
  const serialized = TransactionEnvelope.serialize(transaction)
  const deserialized = TransactionEnvelope.deserialize(serialized)
  expect(deserialized).toEqual(transaction)
})

test('eip7702', () => {
  const transaction = TransactionEnvelope.from({
    chainId: 1,
    authorizationList: [],
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
  })
  const serialized = TransactionEnvelope.serialize(transaction)
  const deserialized = TransactionEnvelope.deserialize(serialized)
  expect(deserialized).toEqual(transaction)
})

test('error: unknown type', () => {
  expect(() =>
    // @ts-ignore
    TransactionEnvelope.deserialize(
      '0x05f858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261',
    ),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `0x05` is not implemented.]',
  )
})
