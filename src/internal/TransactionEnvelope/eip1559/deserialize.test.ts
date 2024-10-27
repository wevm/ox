import { Hex, Rlp, Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

const transaction = TransactionEnvelopeEip1559.from({
  to: accounts[1].address,
  nonce: 785n,
  value: Value.fromEther('1'),
  chainId: 1,
  maxFeePerGas: Value.fromGwei('2'),
  maxPriorityFeePerGas: Value.fromGwei('2'),
})

test('default', () => {
  const serialized = TransactionEnvelopeEip1559.serialize(transaction)
  const deserialized = TransactionEnvelopeEip1559.deserialize(serialized)
  assertType<TransactionEnvelopeEip1559.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction)
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip1559.from({
    chainId: 1,
    maxFeePerGas: 1n,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction)
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip1559.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction_gas)
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('accessList', () => {
  const transaction_accessList = TransactionEnvelopeEip1559.from({
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
  const serialized = TransactionEnvelopeEip1559.serialize(
    transaction_accessList,
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction_accessList,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip1559.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction_data)
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('signature', () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip1559.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction, {
    signature,
  })
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

describe('raw', () => {
  test('default', () => {
    const serialized = `0x02${Rlp.fromHex([
      Hex.fromNumber(1), // chainId
      Hex.fromNumber(0), // nonce
      Hex.fromNumber(1), // maxPriorityFeePerGas
      Hex.fromNumber(1), // maxFeePerGas
      Hex.fromNumber(1), // gas
      '0x0000000000000000000000000000000000000000', // to
      Hex.fromNumber(0), // value
      '0x', // data
      '0x', // accessList
    ]).slice(2)}` as const
    expect(
      TransactionEnvelopeEip1559.deserialize(serialized),
    ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip1559",
          "value": 0n,
        }
      `)
  })

  test('empty sig', () => {
    const serialized = `0x02${Rlp.fromHex([
      Hex.fromNumber(1), // chainId
      Hex.fromNumber(0), // nonce
      Hex.fromNumber(1), // maxPriorityFeePerGas
      Hex.fromNumber(1), // maxFeePerGas
      Hex.fromNumber(1), // gas
      '0x0000000000000000000000000000000000000000', // to
      Hex.fromNumber(0), // value
      '0x', // data
      '0x', // accessList
      '0x', // r
      '0x', // v
      '0x', // s
    ]).slice(2)}` as const
    expect(
      TransactionEnvelopeEip1559.deserialize(serialized),
    ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "r": 0n,
          "s": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip1559",
          "value": 0n,
          "yParity": 0,
        }
      `)
  })

  test('low sig coords', () => {
    const serialized = `0x02${Rlp.fromHex([
      Hex.fromNumber(1), // chainId
      Hex.fromNumber(0), // nonce
      Hex.fromNumber(1), // maxPriorityFeePerGas
      Hex.fromNumber(1), // maxFeePerGas
      Hex.fromNumber(1), // gas
      '0x0000000000000000000000000000000000000000', // to
      Hex.fromNumber(0), // value
      '0x', // data
      '0x', // accessList
      '0x', // r
      Hex.fromNumber(69), // v
      Hex.fromNumber(420), // s
    ]).slice(2)}` as const
    expect(
      TransactionEnvelopeEip1559.deserialize(serialized),
    ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "r": 69n,
          "s": 420n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip1559",
          "value": 0n,
          "yParity": 0,
        }
      `)
  })
})

describe('errors', () => {
  test('invalid access list (invalid address)', () => {
    expect(() =>
      TransactionEnvelopeEip1559.deserialize(
        `0x02${Rlp.fromHex([
          Hex.fromNumber(1), // chainId
          Hex.fromNumber(0), // nonce
          Hex.fromNumber(1), // maxPriorityFeePerGas
          Hex.fromNumber(1), // maxFeePerGas
          Hex.fromNumber(1), // gas
          '0x0000000000000000000000000000000000000000', // to
          Hex.fromNumber(0), // value
          '0x', // data
          [
            [
              '0x',
              [
                '0x0000000000000000000000000000000000000000000000000000000000000001',
              ],
            ],
          ], // accessList
        ]).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)

    expect(() =>
      TransactionEnvelopeEip1559.deserialize(
        `0x02${Rlp.fromHex([
          Hex.fromNumber(1), // chainId
          Hex.fromNumber(0), // nonce
          Hex.fromNumber(1), // maxPriorityFeePerGas
          Hex.fromNumber(1), // maxFeePerGas
          Hex.fromNumber(1), // gas
          '0x0000000000000000000000000000000000000000', // to
          Hex.fromNumber(0), // value
          '0x', // data
          [['0x123456', ['0x0']]], // accessList
        ]).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Hex.InvalidLengthError: Hex value \`"0x0"\` is an odd length (1 nibbles).

      It must be an even length.]
    `)
  })

  test('invalid transaction (all missing)', () => {
    expect(() =>
      TransactionEnvelopeEip1559.deserialize(`0x02${Rlp.fromHex([]).slice(2)}`),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.

      Serialized Transaction: "0x02c0"
      Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
  })

  test('invalid transaction (some missing)', () => {
    expect(() =>
      TransactionEnvelopeEip1559.deserialize(
        `0x02${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.

      Serialized Transaction: "0x02c20001"
      Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
    `)
  })

  test('invalid transaction (missing signature)', () => {
    expect(() =>
      TransactionEnvelopeEip1559.deserialize(
        `0x02${Rlp.fromHex([
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
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip1559" was provided.

      Serialized Transaction: "0x02ca80808080808080808080"
      Missing Attributes: r, s]
    `)
  })
})
