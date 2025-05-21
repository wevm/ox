import {
  Authorization,
  Hex,
  Rlp,
  Secp256k1,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip7702,
  Value,
} from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'
import { wagmiContractConfig } from '../../../test/constants/abis.js'
import { accounts } from '../../../test/constants/accounts.js'

describe('assert', () => {
  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelopeEip7702.assert({
        authorizationList: [
          {
            address: '0x0000000000000000000000000000000000000000',
            chainId: -1,
            nonce: 0n,
            r: 0n,
            s: 0n,
            yParity: 0,
          },
        ],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.InvalidChainIdError: Chain ID "-1" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelopeEip7702.assert({
        authorizationList: [
          {
            address: '0x000000000000000000000000000000000000000z',
            chainId: 0,
            nonce: 0n,
            r: 0n,
            s: 0n,
            yParity: 0,
          },
        ],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [Address.InvalidAddressError: Address "0x000000000000000000000000000000000000000z" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `,
    )
  })

  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelopeEip7702.assert({
        authorizationList: [
          {
            address: '0x0000000000000000000000000000000000000000',
            chainId: 1,
            nonce: 0n,
            r: 0n,
            s: 0n,
            yParity: 0,
          },
        ],
        maxFeePerGas: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })
})

describe('deserialize', () => {
  const authorization_1 = Authorization.from({
    address: wagmiContractConfig.address,
    chainId: 1,
    nonce: 785n,
  })
  const signature_1 = Secp256k1.sign({
    payload: Authorization.getSignPayload(authorization_1),
    privateKey: accounts[0].privateKey,
  })

  const authorization_2 = Authorization.from({
    address: wagmiContractConfig.address,
    chainId: 10,
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
    assertType<TransactionEnvelopeEip7702.TransactionEnvelopeEip7702>(
      deserialized,
    )
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      nonce: 0n,
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
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
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
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
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
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(0), // nonce
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.fromNumber(0), // value
        '0x', // data
        '0x', // accessList
        '0x', // authorizationList
        '0x', // r
        Hex.fromNumber(69), // v
        Hex.fromNumber(420), // s
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
            '0x', // authorizationList
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
      [Address.InvalidAddressError: Address "0x" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.]
    `)

      expect(() =>
        TransactionEnvelopeEip7702.deserialize(
          `0x04${Rlp.fromHex([
            Hex.fromNumber(1), // chainId
            Hex.fromNumber(0), // nonce
            Hex.fromNumber(1), // maxPriorityFeePerGas
            Hex.fromNumber(1), // maxFeePerGas
            Hex.fromNumber(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
            [['0x123456', ['0x0']]], // accessList
            '0x', // authorizationList
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [Address.InvalidAddressError: Address "0x123456" is invalid.

        Details: Address is not a 20 byte (40 hexadecimal character) value.]
      `)
    })

    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelopeEip7702.deserialize(
          `0x04${Rlp.fromHex([]).slice(2)}`,
        ),
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
})

describe('from', () => {
  test('default', () => {
    {
      const envelope = TransactionEnvelopeEip7702.from({
        authorizationList: [],
        chainId: 1,
        nonce: 0n,
      })
      expect(envelope).toMatchInlineSnapshot(`
        {
          "authorizationList": [],
          "chainId": 1,
          "nonce": 0n,
          "type": "eip7702",
        }
      `)
      const serialized = TransactionEnvelopeEip7702.serialize(envelope)
      const envelope2 = TransactionEnvelopeEip7702.from(serialized)
      expect(envelope2).toEqual(envelope)
    }

    {
      const envelope = TransactionEnvelopeEip7702.from({
        authorizationList: [],
        chainId: 1,
        nonce: 0n,
        r: 0n,
        s: 1n,
        yParity: 0,
      })
      expect(envelope).toMatchInlineSnapshot(`
        {
          "authorizationList": [],
          "chainId": 1,
          "nonce": 0n,
          "r": 0n,
          "s": 1n,
          "type": "eip7702",
          "yParity": 0,
        }
      `)
      const serialized = TransactionEnvelopeEip7702.serialize(envelope)
      const envelope2 = TransactionEnvelopeEip7702.from(serialized)
      expect(envelope2).toEqual(envelope)
    }
  })

  test('options: signature', () => {
    const envelope = TransactionEnvelopeEip7702.from(
      {
        authorizationList: [],
        chainId: 1,
        nonce: 0n,
      },
      {
        signature: {
          r: 0n,
          s: 1n,
          yParity: 0,
        },
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "authorizationList": [],
        "chainId": 1,
        "nonce": 0n,
        "r": 0n,
        "s": 1n,
        "type": "eip7702",
        "yParity": 0,
      }
    `)
    const serialized = TransactionEnvelopeEip7702.serialize(envelope)
    const envelope2 = TransactionEnvelopeEip7702.from(serialized)
    expect(envelope2).toEqual(envelope)
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const authorization = Authorization.from({
      address: wagmiContractConfig.address,
      chainId: 1,
      nonce: 785n,
    })
    const signature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: accounts[0].privateKey,
    })

    const envelope = TransactionEnvelopeEip7702.from({
      authorizationList: [Authorization.from(authorization, { signature })],
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 13000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    })

    const hash = TransactionEnvelopeEip7702.hash(envelope, { presign: true })
    expect(hash).toMatchInlineSnapshot(
      `"0x6458c62f981287bcbf1c85861e69de9c7344793116dc9388d90274ab153da8d8"`,
    )

    const signature_tx = Secp256k1.sign({
      payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })

    const envelope_signed = TransactionEnvelopeEip7702.from(envelope, {
      signature: signature_tx,
    })

    {
      const hash = TransactionEnvelopeEip7702.hash(envelope_signed)
      expect(hash).toMatchInlineSnapshot(
        `"0x9714058a95376ce5963b33200dce2fb3afc6ebbefd47a65d9d137c0f66a5e7bf"`,
      )
    }
    {
      const hash_presign =
        TransactionEnvelopeEip7702.getSignPayload(envelope_signed)
      expect(hash_presign).toEqual(hash)
    }
  })
})

describe('hash', () => {
  test('default', () => {
    const envelope = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      gas: 21000n,
      maxFeePerGas: 13000000000n,
      maxPriorityFeePerGas: 1000000000n,
      nonce: 665n,
      value: 1000000000000000000n,
      to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      r: BigInt(
        '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
      ),
      s: BigInt(
        '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
      ),
      yParity: 0,
    })

    const hash = TransactionEnvelopeEip7702.hash(envelope)
    expect(hash).toMatchInlineSnapshot(
      `"0xa5ccd813e459b9154917af19270091cf3312bd759af08e0e18cd2560ef586cf4"`,
    )
  })
})

describe('serialize', () => {
  const authorization_1 = Authorization.from({
    address: wagmiContractConfig.address,
    chainId: 1,
    nonce: 785n,
  })
  const signature_1 = Secp256k1.sign({
    payload: Authorization.getSignPayload(authorization_1),
    privateKey: accounts[0].privateKey,
  })

  const authorization_2 = Authorization.from({
    address: wagmiContractConfig.address,
    chainId: 10,
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
    assertType<TransactionEnvelopeEip7702.Serialized>(serialized)
    expect(serialized).toEqual(
      '0x04f8ed0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
    )
    expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('default (all zeros)', () => {
    const transaction = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      to: undefined,
      nonce: 0n,
      chainId: 1,
      maxFeePerGas: 0n,
      maxPriorityFeePerGas: 0n,
      value: 0n,
    })

    const serialized = TransactionEnvelopeEip7702.serialize(transaction)

    expect(serialized).toEqual('0x04ca0180808080808080c0c0')
    expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual({
      authorizationList: [],
      chainId: 1,
      nonce: 0n,
      type: 'eip7702',
    })
  })

  test('minimal (w/ type)', () => {
    const transaction = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      nonce: 0n,
    })
    const serialized = TransactionEnvelopeEip7702.serialize(transaction)
    expect(serialized).toEqual('0x04ca0180808080808080c0c0')
    expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
      transaction,
    )
  })

  test('minimal (w/ maxFeePerGas)', () => {
    const transaction = TransactionEnvelopeEip7702.from({
      authorizationList: [],
      chainId: 1,
      maxFeePerGas: 1n,
      nonce: 0n,
    })
    const serialized = TransactionEnvelopeEip7702.serialize(transaction)
    expect(serialized).toEqual('0x04ca0180800180808080c0c0')
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
    expect(serialized).toEqual(
      '0x04f8ef01820311847735940084773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
    )
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
    expect(serialized).toEqual(
      '0x04f901490182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f85bf859940000000000000000000000000000000000000000f842a00000000000000000000000000000000000000000000000000000000000000001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fef8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
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
    expect(serialized).toEqual(
      '0x04f8ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
    )
    expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('options: signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeEip7702.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelopeEip7702.serialize(transaction, {
      signature,
    })
    expect(serialized).toEqual(
      '0x04f901300182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc958280a0c6e17df66749225c040251e51ab7c732b7c92d7844ed731c80ee5ff3b15baf42a03b4fb995198301b08f630d1aecfa4a567a722e184eda6e3789481091a0cd1dd5',
    )
    expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  test('options: signature', () => {
    expect(
      TransactionEnvelopeEip7702.serialize(transaction, {
        signature: {
          r: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          s: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          yParity: 1,
        },
      }),
    ).toEqual(
      '0x04f901300182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc958201a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )

    expect(
      TransactionEnvelopeEip7702.serialize(transaction, {
        signature: {
          r: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          s: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          yParity: 0,
        },
      }),
    ).toEqual(
      '0x04f901300182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc958280a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
    )

    expect(
      TransactionEnvelopeEip7702.serialize(transaction, {
        signature: {
          r: 0n,
          s: 0n,
          yParity: 0,
        },
      }),
    ).toEqual(
      '0x04f8f00182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582808080',
    )
  })

  test('behavior: network', async () => {
    const authority = accounts[0]
    const delegate = accounts[1]

    // Deploy delegate contract
    const contractAddress = await (async () => {
      const nonce = await anvilMainnet.request({
        method: 'eth_getTransactionCount',
        params: [delegate.address, 'pending'],
      })

      const envelope = TransactionEnvelopeEip1559.from({
        chainId: 1,
        nonce: BigInt(nonce),
        gas: 3_000_000n,
        data: '0x66365f5f37365fa05f5260076019f3',
        maxFeePerGas: Value.fromGwei('20'),
        maxPriorityFeePerGas: Value.fromGwei('10'),
      })

      const signature = Secp256k1.sign({
        payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
        privateKey: delegate.privateKey,
      })

      const serialized = TransactionEnvelopeEip1559.serialize(envelope, {
        signature,
      })

      const hash = await anvilMainnet.request({
        method: 'eth_sendRawTransaction',
        params: [serialized],
      })

      await anvilMainnet.request({
        method: 'anvil_mine',
        params: ['0x1', '0x0'],
      })

      const receipt = await anvilMainnet.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      })
      return receipt!.contractAddress
    })()

    // Authorize injection of delegation contract onto authority
    const authorization = await (async () => {
      const nonce = await anvilMainnet.request({
        method: 'eth_getTransactionCount',
        params: [authority.address, 'pending'],
      })

      const authorization = Authorization.from({
        address: contractAddress!,
        chainId: 1,
        nonce: BigInt(nonce),
      })

      const signature = Secp256k1.sign({
        payload: Authorization.getSignPayload(authorization),
        privateKey: authority.privateKey,
      })

      return Authorization.from(authorization, { signature })
    })()

    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [delegate.address, 'pending'],
    })

    const envelope = TransactionEnvelopeEip7702.from({
      chainId: 1,
      authorizationList: [authorization],
      data: '0xdeadbeef',
      nonce: BigInt(nonce),
      gas: 1_000_000n,
      to: authority.address,
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
      privateKey: delegate.privateKey,
    })

    const serialized = TransactionEnvelopeEip7702.serialize(envelope, {
      signature,
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendRawTransaction',
      params: [serialized],
    })

    const tx = await anvilMainnet.request({
      method: 'eth_getTransactionByHash',
      params: [hash],
    })

    expect({ ...tx, blockHash: null }).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "authorizationList": [
        {
          "address": "0x1d1aee6d5dc35f3c15e2d11083d0e59c026b64c4",
          "chainId": "0x1",
          "nonce": "0x297",
          "r": "0x63a17c5bd4689e0a20cd66babbbc21f3036c93341c390f75b8f575c19e4f358b",
          "s": "0x4ba15577764447dca6c0eab652914e6cdf889cd88d2c3afcc7bee281f1be57b4",
          "yParity": "0x1",
        },
      ],
      "blockHash": null,
      "blockNumber": "0x12f2977",
      "chainId": "0x1",
      "from": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "gas": "0xf4240",
      "gasPrice": "0x3df788e0a",
      "hash": "0x457e23cafba3c0d5b061724b98c5da1c0a2bd87d30a25cfc2824dc3ce9fc770b",
      "input": "0xdeadbeef",
      "maxFeePerGas": "0x4a817c800",
      "maxPriorityFeePerGas": "0x2540be400",
      "nonce": "0x71",
      "r": "0x674cf928a35d4fe579eec27d9a6a13af24f6a1d47d178a24e96173762c784cf5",
      "s": "0x7feecdc37bd9fc83deddc3e985c015099a1e4e51f79ebd50b262a4bf9afe3d8f",
      "to": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "transactionIndex": "0x0",
      "type": "0x4",
      "v": "0x0",
      "value": "0x0",
      "yParity": "0x0",
    }
  `)

    const receipt = await anvilMainnet.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    })

    expect({
      ...receipt,
      blockHash: null,
      cumulativeGasUsed: null,
      gasUsed: null,
      logs: receipt!.logs.map((log) => ({
        ...log,
        blockHash: null,
        blockTimestamp: null,
      })),
    }).toMatchInlineSnapshot(`
      {
        "blobGasPrice": "0x1",
        "blockHash": null,
        "blockNumber": "0x12f2977",
        "contractAddress": null,
        "cumulativeGasUsed": null,
        "effectiveGasPrice": "0x3df788e0a",
        "from": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "gasUsed": null,
        "logs": [
          {
            "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            "blockHash": null,
            "blockNumber": "0x12f2977",
            "blockTimestamp": null,
            "data": "0xdeadbeef",
            "logIndex": "0x0",
            "removed": false,
            "topics": [],
            "transactionHash": "0x457e23cafba3c0d5b061724b98c5da1c0a2bd87d30a25cfc2824dc3ce9fc770b",
            "transactionIndex": "0x0",
          },
        ],
        "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "status": "0x1",
        "to": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "transactionHash": "0x457e23cafba3c0d5b061724b98c5da1c0a2bd87d30a25cfc2824dc3ce9fc770b",
        "transactionIndex": "0x0",
        "type": "0x4",
      }
    `)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      TransactionEnvelopeEip7702.validate({
        authorizationList: [],
        chainId: 1,
      }),
    ).toBe(true)
    expect(
      TransactionEnvelopeEip7702.validate({
        authorizationList: [],
        maxFeePerGas: 2n ** 257n,
        chainId: 1,
      }),
    ).toBe(false)
  })
})

test('exports', () => {
  expect(Object.keys(TransactionEnvelopeEip7702)).toMatchInlineSnapshot(`
    [
      "serializedType",
      "type",
      "assert",
      "deserialize",
      "from",
      "getSignPayload",
      "hash",
      "serialize",
      "validate",
    ]
  `)
})
