import {
  Blobs,
  Hex,
  Rlp,
  Secp256k1,
  TransactionEnvelopeEip4844,
  Value,
} from 'ox'
import { assertType, describe, expect, test } from 'vitest'

import { accounts } from '../../../../test/constants/accounts.js'
import { kzg } from '../../../../test/kzg.js'

const blobs = Blobs.from(Hex.from('abcd'))
const sidecars = Blobs.toSidecars(blobs, { kzg })
const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
const transaction = TransactionEnvelopeEip4844.from({
  to: accounts[1].address,
  nonce: 785n,
  value: Value.fromEther('1'),
  chainId: 1,
  maxFeePerGas: Value.fromGwei('20'),
  maxPriorityFeePerGas: Value.fromGwei('10'),
  maxFeePerBlobGas: Value.fromGwei('2'),
  blobVersionedHashes,
})

test('default', () => {
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  const deserialized = TransactionEnvelopeEip4844.deserialize(serialized)
  assertType<TransactionEnvelopeEip4844.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction)
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
    blobVersionedHashes: [
      '0x01adbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    ],
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  const deserialized = TransactionEnvelopeEip4844.deserialize(serialized)
  expect(deserialized).toEqual(transaction)
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip4844.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction_gas)
  const deserialized = TransactionEnvelopeEip4844.deserialize(serialized)
  assertType<TransactionEnvelopeEip4844.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction_gas)
})

test('accessList', () => {
  const transaction_accessList = TransactionEnvelopeEip4844.from({
    ...transaction,
    accessList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      },
    ],
  })
  const serialized = TransactionEnvelopeEip4844.serialize(
    transaction_accessList,
  )
  const deserialized = TransactionEnvelopeEip4844.deserialize(serialized)
  assertType<TransactionEnvelopeEip4844.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction_accessList)
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip4844.from({
    ...transaction,
    data: '0xdeadbeef',
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction_data)
  const deserialized = TransactionEnvelopeEip4844.deserialize(serialized)
  assertType<TransactionEnvelopeEip4844.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction_data)
})

test('sidecars', () => {
  const transaction_sidecars = TransactionEnvelopeEip4844.from({
    ...transaction,
    sidecars,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction_sidecars)
  const deserialized = TransactionEnvelopeEip4844.deserialize(serialized)
  assertType<TransactionEnvelopeEip4844.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction_sidecars)
})

test('signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip4844.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    sidecars,
    signature,
  })
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
    sidecars,
  })
})

describe('errors', () => {
  test('invalid access list (invalid address)', () => {
    expect(() =>
      TransactionEnvelopeEip4844.deserialize(
        `0x03${Rlp.fromHex([
          Hex.from(1), // chainId
          Hex.from(0), // nonce
          Hex.from(1), // maxPriorityFeePerGas
          Hex.from(1), // maxFeePerGas
          Hex.from(1), // gas
          '0x0000000000000000000000000000000000000000', // to
          Hex.from(0), // value
          '0x', // data
          [
            [
              '0x',
              [
                '0x0000000000000000000000000000000000000000000000000000000000000001',
              ],
            ],
          ], // accessList
          '0x', // maxFeePerBlobGas,
          ['0x'], // blobVersionedHashes
        ]).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
    `)

    expect(() =>
      TransactionEnvelopeEip4844.deserialize(
        `0x03${Rlp.fromHex([
          Hex.from(1), // chainId
          Hex.from(0), // nonce
          Hex.from(1), // maxPriorityFeePerGas
          Hex.from(1), // maxFeePerGas
          Hex.from(1), // gas
          '0x0000000000000000000000000000000000000000', // to
          Hex.from(0), // value
          '0x', // data
          [['0x123456', ['0x0']]], // accessList
          '0x', // maxFeePerBlobGas,
          ['0x'], // blobVersionedHashes
        ]).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.InvalidLengthError: Hex value \`"0x0"\` is an odd length (1 nibbles).

      It must be an even length.

      See: https://oxlib.sh/errors#bytesinvalidhexlengtherror]
    `)
  })

  test('invalid transaction (all missing)', () => {
    expect(() =>
      TransactionEnvelopeEip4844.deserialize(`0x03${Rlp.fromHex([]).slice(2)}`),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip4844" was provided.

      Serialized Transaction: "0x03c0"
      Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
  })

  test('invalid transaction (some missing)', () => {
    expect(() =>
      TransactionEnvelopeEip4844.deserialize(
        `0x03${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip4844" was provided.

      Serialized Transaction: "0x03c20001"
      Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
  })

  test('invalid transaction (missing signature)', () => {
    expect(() =>
      TransactionEnvelopeEip4844.deserialize(
        `0x03${Rlp.fromHex([
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
          '0x',
        ]).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip4844" was provided.

      Serialized Transaction: "0x03cc808080808080808080808080"
      Missing Attributes: r, s]
    `)
  })
})
