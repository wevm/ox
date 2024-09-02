import { Rlp, Secp256k1, TransactionEnvelopeEip2930, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

const transaction = TransactionEnvelopeEip2930.from({
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

test('default', () => {
  const serialized = TransactionEnvelopeEip2930.serialize(transaction)
  const deserialized = TransactionEnvelopeEip2930.deserialize(serialized)
  assertType<TransactionEnvelopeEip2930.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction)
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip2930.from({
    chainId: 1,
    gasPrice: 1n,
    accessList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ],
      },
    ],
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction)
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip2930.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction_gas)
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip2930.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction_data)
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip2930.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction_data)
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip2930.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction, {
    signature,
  })
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

describe('errors', () => {
  test('invalid transaction (all missing)', () => {
    expect(() =>
      TransactionEnvelopeEip2930.deserialize(`0x01${Rlp.fromHex([]).slice(2)}`),
    ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip2930" was provided.

        Serialized Transaction: "0x01c0"
        Missing Attributes: chainId, nonce, gasPrice, gas, to, value, data, accessList]
      `)
  })

  test('invalid transaction (some missing)', () => {
    expect(() =>
      TransactionEnvelopeEip2930.deserialize(
        `0x01${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip2930" was provided.

        Serialized Transaction: "0x01c20001"
        Missing Attributes: gasPrice, gas, to, value, data, accessList]
      `)
  })

  test('invalid transaction (missing signature)', () => {
    expect(() =>
      TransactionEnvelopeEip2930.deserialize(
        `0x01${Rlp.fromHex([
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
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip2930" was provided.

        Serialized Transaction: "0x01c9808080808080808080"
        Missing Attributes: r, s]
      `)
  })
})
