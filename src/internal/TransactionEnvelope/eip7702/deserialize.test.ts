import {
  Authorization,
  Hex,
  Rlp,
  Secp256k1,
  TransactionEnvelopeEip7702,
  Value,
} from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { wagmiContractConfig } from '../../../../test/constants/abis.js'
import { accounts } from '../../../../test/constants/accounts.js'

const authorization_1 = Authorization.from({
  chainId: 1,
  contractAddress: wagmiContractConfig.address,
  nonce: 785n,
})
const signature_1 = Secp256k1.sign({
  payload: Authorization.getSignPayload(authorization_1),
  privateKey: accounts[0].privateKey,
})

const authorization_2 = Authorization.from({
  chainId: 10,
  contractAddress: wagmiContractConfig.address,
  nonce: 786n,
})
const signature_2 = Secp256k1.sign({
  payload: Authorization.getSignPayload(authorization_2),
  privateKey: accounts[0].privateKey,
})

const transaction = TransactionEnvelopeEip7702.from({
  authorizationList: [
    Authorization.from(authorization_1, { signature: signature_1 }),
    Authorization.from(authorization_2, { signature: signature_2 }),
  ],
  chainId: 1,
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  maxFeePerGas: Value.fromGwei('2'),
  maxPriorityFeePerGas: Value.fromGwei('2'),
})

test('default', () => {
  const serialized = TransactionEnvelopeEip7702.serialize(transaction)
  const deserialized = TransactionEnvelopeEip7702.deserialize(serialized)
  assertType<TransactionEnvelopeEip7702.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction)
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip7702.from({
    authorizationList: [],
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction)
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip7702.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction_gas)
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('accessList', () => {
  const transaction_accessList = TransactionEnvelopeEip7702.from({
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
  const serialized = TransactionEnvelopeEip7702.serialize(
    transaction_accessList,
  )
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction_accessList,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip7702.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction_data)
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('signature', () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip7702.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction, {
    signature,
  })
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

describe('raw', () => {
  test('default', () => {
    const serialized = `0x04${Rlp.fromHex([
      Hex.from(1), // chainId
      Hex.from(0), // nonce
      Hex.from(1), // maxPriorityFeePerGas
      Hex.from(1), // maxFeePerGas
      Hex.from(1), // gas
      '0x0000000000000000000000000000000000000000', // to
      Hex.from(0), // value
      '0x', // data
      '0x', // accessList
      '0x', // authorizationList
    ]).slice(2)}` as const
    expect(
      TransactionEnvelopeEip7702.deserialize(serialized),
    ).toMatchInlineSnapshot(`
        {
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "eip7702",
          "value": 0n,
        }
      `)
  })

  test('empty sig', () => {
    const serialized = `0x04${Rlp.fromHex([
      Hex.from(1), // chainId
      Hex.from(0), // nonce
      Hex.from(1), // maxPriorityFeePerGas
      Hex.from(1), // maxFeePerGas
      Hex.from(1), // gas
      '0x0000000000000000000000000000000000000000', // to
      Hex.from(0), // value
      '0x', // data
      '0x', // accessList
      '0x', // authorizationList
      '0x', // r
      '0x', // v
      '0x', // s
    ]).slice(2)}` as const
    expect(
      TransactionEnvelopeEip7702.deserialize(serialized),
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
          "type": "eip7702",
          "value": 0n,
          "yParity": 0,
        }
      `)
  })

  test('low sig coords', () => {
    const serialized = `0x04${Rlp.fromHex([
      Hex.from(1), // chainId
      Hex.from(0), // nonce
      Hex.from(1), // maxPriorityFeePerGas
      Hex.from(1), // maxFeePerGas
      Hex.from(1), // gas
      '0x0000000000000000000000000000000000000000', // to
      Hex.from(0), // value
      '0x', // data
      '0x', // accessList
      '0x', // authorizationList
      '0x', // r
      Hex.from(69), // v
      Hex.from(420), // s
    ]).slice(2)}` as const
    expect(
      TransactionEnvelopeEip7702.deserialize(serialized),
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
          "type": "eip7702",
          "value": 0n,
          "yParity": 0,
        }
      `)
  })
})

describe('errors', () => {
  test('invalid access list (invalid address)', () => {
    expect(() =>
      TransactionEnvelopeEip7702.deserialize(
        `0x04${Rlp.fromHex([
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
          '0x', // authorizationList
        ]).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
    `)

    expect(() =>
      TransactionEnvelopeEip7702.deserialize(
        `0x04${Rlp.fromHex([
          Hex.from(1), // chainId
          Hex.from(0), // nonce
          Hex.from(1), // maxPriorityFeePerGas
          Hex.from(1), // maxFeePerGas
          Hex.from(1), // gas
          '0x0000000000000000000000000000000000000000', // to
          Hex.from(0), // value
          '0x', // data
          [['0x123456', ['0x0']]], // accessList
          '0x', // authorizationList
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
      TransactionEnvelopeEip7702.deserialize(`0x04${Rlp.fromHex([]).slice(2)}`),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip7702" was provided.

      Serialized Transaction: "0x04c0"
      Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, authorizationList]
    `)
  })

  test('invalid transaction (some missing)', () => {
    expect(() =>
      TransactionEnvelopeEip7702.deserialize(
        `0x04${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip7702" was provided.

      Serialized Transaction: "0x04c20001"
      Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, authorizationList]
    `)
  })

  test('invalid transaction (missing signature)', () => {
    expect(() =>
      TransactionEnvelopeEip7702.deserialize(
        `0x04${Rlp.fromHex([
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
      [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "eip7702" was provided.

      Serialized Transaction: "0x04cb8080808080808080808080"
      Missing Attributes: r, s]
    `)
  })
})
