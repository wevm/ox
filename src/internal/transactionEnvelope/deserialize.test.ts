import { Blobs, Hex, Rlp, Secp256k1, TransactionEnvelope, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'
import { kzg } from '../../../test/kzg.js'

describe('legacy', () => {
  const transaction = TransactionEnvelope.fromLegacy({
    gasPrice: Value.fromGwei('2'),
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
  })

  test('default', () => {
    const serialized = TransactionEnvelope.serialize(transaction)
    const deserialized = TransactionEnvelope.deserializeLegacy(serialized)
    assertType<TransactionEnvelope.Legacy>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromLegacy({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('data', () => {
    const transaction_data = TransactionEnvelope.fromLegacy({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelope.serialize(transaction_data)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('chainId', () => {
    const transaction_chainId = TransactionEnvelope.fromLegacy({
      ...transaction,
      chainId: 69,
    })
    const serialized = TransactionEnvelope.serialize(transaction_chainId)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_chainId,
    )
  })

  test('signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, { signature })
    expect(TransactionEnvelope.deserialize(serialized)).toMatchInlineSnapshot(
      `
      {
        "gasPrice": 2000000000n,
        "nonce": 785n,
        "r": 49162359600332107255572924559512453493861388410495780496134469638986269765272n,
        "s": 23658591060807096482427659898336319664614845702773383989972841251496079269784n,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
        "v": 28,
        "value": 1000000000000000000n,
      }
    `,
    )
  })

  test('signature + chainId', async () => {
    const transaction_chainId = TransactionEnvelope.fromLegacy({
      ...transaction,
      chainId: 69,
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(transaction_chainId),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction_chainId, {
      signature,
    })
    expect(TransactionEnvelope.deserialize(serialized)).toMatchInlineSnapshot(
      `
      {
        "chainId": 69,
        "gasPrice": 2000000000n,
        "nonce": 785n,
        "r": 21377422632306986934234848369642217951872212572373694238667569216102361836592n,
        "s": 46566099151962357110521349825476283164605004096182178307881493582909309068838n,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
        "v": 173,
        "value": 1000000000000000000n,
      }
    `,
    )
  })

  describe('raw', () => {
    test('default', () => {
      const serialized = Rlp.fromHex([
        Hex.from(0), // nonce
        Hex.from(1), // gasPrice
        Hex.from(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.from(0), // value
        '0x', // data
      ])
      expect(
        TransactionEnvelope.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "gas": 1n,
          "gasPrice": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "legacy",
          "value": 0n,
        }
      `)
    })

    test('empty sig', () => {
      const serialized = Rlp.fromHex([
        Hex.from(0), // nonce
        Hex.from(1), // gasPrice
        Hex.from(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.from(0), // value
        '0x', // data
        '0x', // v
        '0x', // r
        '0x', // s
      ])
      expect(
        TransactionEnvelope.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "gas": 1n,
          "gasPrice": 1n,
          "nonce": 0n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "legacy",
          "value": 0n,
        }
      `)
    })

    test('low sig coords', () => {
      const serialized = Rlp.fromHex([
        Hex.from(0), // nonce
        Hex.from(1), // gasPrice
        Hex.from(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.from(0), // value
        '0x', // data
        '0x1b', // v
        Hex.from(69), // r
        Hex.from(420), // s
      ])
      expect(
        TransactionEnvelope.deserialize(serialized),
      ).toMatchInlineSnapshot(`
        {
          "gas": 1n,
          "gasPrice": 1n,
          "nonce": 0n,
          "r": 69n,
          "s": 420n,
          "to": "0x0000000000000000000000000000000000000000",
          "type": "legacy",
          "v": 27,
          "value": 0n,
        }
      `)
    })
  })

  describe('errors', () => {
    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(Rlp.fromHex([])),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "legacy" was provided.

        Serialized Transaction: "0xc0"
        Missing Attributes: nonce, gasPrice, gas, to, value, data]
      `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(Rlp.fromHex(['0x00', '0x01'])),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "legacy" was provided.

        Serialized Transaction: "0xc20001"
        Missing Attributes: gas, to, value, data]
      `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
          Rlp.fromHex(['0x', '0x', '0x', '0x', '0x', '0x', '0x']),
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "legacy" was provided.

        Serialized Transaction: "0xc780808080808080"
        Missing Attributes: r, s]
      `)
    })

    test('invalid transaction (attribute overload)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
          Rlp.fromHex([
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
          ]),
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "legacy" was provided.

        Serialized Transaction: "0xca80808080808080808080"]
      `)
    })

    test('invalid v', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
          Rlp.fromHex([
            Hex.from(0), // nonce
            Hex.from(1), // gasPrice
            Hex.from(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.from(0), // value
            '0x', // data
            '0x', // v
            Hex.from(69), // r
            Hex.from(420), // s
          ]),
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSignatureVError: Value \`0\` is an invalid v value. v must be 27, 28 or >=35.

        See: https://oxlib.sh/errors#invalidsignatureverror]
      `)

      expect(() =>
        TransactionEnvelope.deserialize(
          Rlp.fromHex([
            Hex.from(0), // nonce
            Hex.from(1), // gasPrice
            Hex.from(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.from(0), // value
            '0x', // data
            Hex.from(35), // v
            Hex.from(69), // r
            Hex.from(420), // s
          ]),
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSignatureVError: Value \`35\` is an invalid v value. v must be 27, 28 or >=35.

        See: https://oxlib.sh/errors#invalidsignatureverror]
      `)
    })
  })
})

describe('eip2930', () => {
  const transaction = TransactionEnvelope.fromEip2930({
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
    const serialized = TransactionEnvelope.serialize(transaction)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip2930>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TransactionEnvelope.fromEip2930({
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
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromEip2930({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('data', () => {
    const transaction_data = TransactionEnvelope.fromEip2930({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelope.serialize(transaction_data)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('data', () => {
    const transaction_data = TransactionEnvelope.fromEip2930({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelope.serialize(transaction_data)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, { signature })
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  describe('errors', () => {
    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(`0x01${Rlp.fromHex([]).slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip2930" was provided.

        Serialized Transaction: "0x01c0"
        Missing Attributes: chainId, nonce, gasPrice, gas, to, value, data, accessList]
      `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
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
        TransactionEnvelope.deserialize(
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
})

describe('eip1559', () => {
  const transaction = TransactionEnvelope.fromEip1559({
    to: accounts[1].address,
    nonce: 785n,
    value: Value.fromEther('1'),
    chainId: 1,
    maxFeePerGas: Value.fromGwei('2'),
    maxPriorityFeePerGas: Value.fromGwei('2'),
  })

  test('default', () => {
    const serialized = TransactionEnvelope.serialize(transaction)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip1559>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TransactionEnvelope.fromEip1559({
      chainId: 1,
      maxFeePerGas: 1n,
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromEip1559({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('accessList', () => {
    const transaction_accessList = TransactionEnvelope.fromEip1559({
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
    const serialized = TransactionEnvelope.serialize(transaction_accessList)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_accessList,
    )
  })

  test('data', () => {
    const transaction_data = TransactionEnvelope.fromEip1559({
      ...transaction,
      data: '0x1234',
    })
    const serialized = TransactionEnvelope.serialize(transaction_data)
    expect(TransactionEnvelope.deserialize(serialized)).toEqual(
      transaction_data,
    )
  })

  test('signature', () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, { signature })
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
    })
  })

  describe('raw', () => {
    test('default', () => {
      const serialized = `0x02${Rlp.fromHex([
        Hex.from(1), // chainId
        Hex.from(0), // nonce
        Hex.from(1), // maxPriorityFeePerGas
        Hex.from(1), // maxFeePerGas
        Hex.from(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.from(0), // value
        '0x', // data
        '0x', // accessList
      ]).slice(2)}` as const
      expect(
        TransactionEnvelope.deserialize(serialized),
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
        Hex.from(1), // chainId
        Hex.from(0), // nonce
        Hex.from(1), // maxPriorityFeePerGas
        Hex.from(1), // maxFeePerGas
        Hex.from(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.from(0), // value
        '0x', // data
        '0x', // accessList
        '0x', // r
        '0x', // v
        '0x', // s
      ]).slice(2)}` as const
      expect(
        TransactionEnvelope.deserialize(serialized),
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
        Hex.from(1), // chainId
        Hex.from(0), // nonce
        Hex.from(1), // maxPriorityFeePerGas
        Hex.from(1), // maxFeePerGas
        Hex.from(1), // gas
        '0x0000000000000000000000000000000000000000', // to
        Hex.from(0), // value
        '0x', // data
        '0x', // accessList
        '0x', // r
        Hex.from(69), // v
        Hex.from(420), // s
      ]).slice(2)}` as const
      expect(
        TransactionEnvelope.deserialize(serialized),
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
        TransactionEnvelope.deserialize(
          `0x02${Rlp.fromHex([
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
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidAddressError: Address "0x" is invalid.

        Details: Address is not a 20 byte (40 hexadecimal character) value.
        See: https://oxlib.sh/errors#invalidaddresserror]
      `)

      expect(() =>
        TransactionEnvelope.deserialize(
          `0x02${Rlp.fromHex([
            Hex.from(1), // chainId
            Hex.from(0), // nonce
            Hex.from(1), // maxPriorityFeePerGas
            Hex.from(1), // maxFeePerGas
            Hex.from(1), // gas
            '0x0000000000000000000000000000000000000000', // to
            Hex.from(0), // value
            '0x', // data
            [['0x123456', ['0x0']]], // accessList
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidHexLengthError: Hex value \`"0x0"\` is an odd length (1 nibbles).

        It must be an even length.

        See: https://oxlib.sh/errors#invalidhexlengtherror]
      `)
    })

    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(`0x02${Rlp.fromHex([]).slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip1559" was provided.

        Serialized Transaction: "0x02c0"
        Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
      `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
          `0x02${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip1559" was provided.

        Serialized Transaction: "0x02c20001"
        Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
      `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
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
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip1559" was provided.

        Serialized Transaction: "0x02ca80808080808080808080"
        Missing Attributes: r, s]
      `)
    })
  })
})

describe('eip4844', () => {
  const blobs = Blobs.from(Hex.from('abcd'))
  const sidecars = Blobs.toSidecars(blobs, { kzg })
  const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
  const transaction = TransactionEnvelope.fromEip4844({
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
    const serialized = TransactionEnvelope.serialize(transaction)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip4844>(deserialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TransactionEnvelope.fromEip4844({
      chainId: 1,
      blobVersionedHashes: [
        '0x01adbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      ],
    })
    const serialized = TransactionEnvelope.serialize(transaction)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    expect(deserialized).toEqual(transaction)
  })

  test('gas', () => {
    const transaction_gas = TransactionEnvelope.fromEip4844({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TransactionEnvelope.serialize(transaction_gas)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip4844>(deserialized)
    expect(deserialized).toEqual(transaction_gas)
  })

  test('accessList', () => {
    const transaction_accessList = TransactionEnvelope.fromEip4844({
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
    const serialized = TransactionEnvelope.serialize(transaction_accessList)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip4844>(deserialized)
    expect(deserialized).toEqual(transaction_accessList)
  })

  test('data', () => {
    const transaction_data = TransactionEnvelope.fromEip4844({
      ...transaction,
      data: '0xdeadbeef',
    })
    const serialized = TransactionEnvelope.serialize(transaction_data)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip4844>(deserialized)
    expect(deserialized).toEqual(transaction_data)
  })

  test('sidecars', () => {
    const transaction_sidecars = TransactionEnvelope.fromEip4844({
      ...transaction,
      sidecars,
    })
    const serialized = TransactionEnvelope.serialize(transaction_sidecars)
    const deserialized = TransactionEnvelope.deserialize(serialized)
    assertType<TransactionEnvelope.Eip4844>(deserialized)
    expect(deserialized).toEqual(transaction_sidecars)
  })

  test('signature', async () => {
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(transaction),
      privateKey: accounts[0].privateKey,
    })
    const serialized = TransactionEnvelope.serialize(transaction, {
      sidecars,
      signature,
    })
    expect(TransactionEnvelope.deserialize(serialized)).toEqual({
      ...transaction,
      ...signature,
      sidecars,
    })
  })

  describe('errors', () => {
    test('invalid access list (invalid address)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
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
        [InvalidAddressError: Address "0x" is invalid.

        Details: Address is not a 20 byte (40 hexadecimal character) value.
        See: https://oxlib.sh/errors#invalidaddresserror]
      `)

      expect(() =>
        TransactionEnvelope.deserialize(
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
        [InvalidHexLengthError: Hex value \`"0x0"\` is an odd length (1 nibbles).

        It must be an even length.

        See: https://oxlib.sh/errors#invalidhexlengtherror]
      `)
    })

    test('invalid transaction (all missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(`0x03${Rlp.fromHex([]).slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip4844" was provided.

        Serialized Transaction: "0x03c0"
        Missing Attributes: chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
      `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
          `0x03${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip4844" was provided.

        Serialized Transaction: "0x03c20001"
        Missing Attributes: maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList]
      `)
    })

    test('invalid transaction (missing signature)', () => {
      expect(() =>
        TransactionEnvelope.deserialize(
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
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "eip4844" was provided.

        Serialized Transaction: "0x03cc808080808080808080808080"
        Missing Attributes: r, s]
      `)
    })
  })
})
