import { Hex, Rlp, Secp256k1, TransactionEnvelopeLegacy, Value } from 'ox'
import { assertType, describe, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

const transaction = TransactionEnvelopeLegacy.from({
  gasPrice: Value.fromGwei('2'),
  to: accounts[1].address,
  nonce: 785n,
  value: Value.fromEther('1'),
})

test('default', () => {
  const serialized = TransactionEnvelopeLegacy.serialize(transaction)
  const deserialized = TransactionEnvelopeLegacy.deserialize(serialized)
  assertType<TransactionEnvelopeLegacy.TransactionEnvelope>(deserialized)
  expect(deserialized).toEqual(transaction)
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeLegacy.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeLegacy.serialize(transaction_gas)
  expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeLegacy.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeLegacy.serialize(transaction_data)
  expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('chainId', () => {
  const transaction_chainId = TransactionEnvelopeLegacy.from({
    ...transaction,
    chainId: 69,
  })
  const serialized = TransactionEnvelopeLegacy.serialize(transaction_chainId)
  expect(TransactionEnvelopeLegacy.deserialize(serialized)).toEqual(
    transaction_chainId,
  )
})

test('signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeLegacy.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
    signature,
  })
  expect(
    TransactionEnvelopeLegacy.deserialize(serialized),
  ).toMatchInlineSnapshot(
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
      "yParity": 1,
    }
  `,
  )
})

test('signature', async () => {
  {
    const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
      signature: {
        r: 1n,
        s: 0n,
        yParity: 0,
      },
    })
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
      {
        "gasPrice": 2000000000n,
        "nonce": 785n,
        "r": 1n,
        "s": 0n,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
        "v": 27,
        "value": 1000000000000000000n,
        "yParity": 0,
      }
    `,
    )
  }

  {
    const serialized = TransactionEnvelopeLegacy.serialize(transaction, {
      signature: {
        r: 0n,
        s: 1n,
        yParity: 0,
      },
    })
    expect(
      TransactionEnvelopeLegacy.deserialize(serialized),
    ).toMatchInlineSnapshot(
      `
      {
        "gasPrice": 2000000000n,
        "nonce": 785n,
        "r": 0n,
        "s": 1n,
        "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "type": "legacy",
        "v": 27,
        "value": 1000000000000000000n,
        "yParity": 0,
      }
    `,
    )
  }
})

test('signature + chainId', async () => {
  const transaction_chainId = TransactionEnvelopeLegacy.from({
    ...transaction,
    chainId: 69,
  })
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeLegacy.getSignPayload(transaction_chainId),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeLegacy.serialize(transaction_chainId, {
    signature,
  })
  expect(
    TransactionEnvelopeLegacy.deserialize(serialized),
  ).toMatchInlineSnapshot(
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
      "yParity": 0,
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
      TransactionEnvelopeLegacy.deserialize(serialized),
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
      TransactionEnvelopeLegacy.deserialize(serialized),
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
      TransactionEnvelopeLegacy.deserialize(serialized),
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
        "yParity": 0,
      }
    `)
  })
})

describe('errors', () => {
  test('invalid transaction (all missing)', () => {
    expect(() =>
      TransactionEnvelopeLegacy.deserialize(Rlp.fromHex([])),
    ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "legacy" was provided.

        Serialized Transaction: "0xc0"
        Missing Attributes: nonce, gasPrice, gas, to, value, data]
      `)
  })

  test('invalid transaction (some missing)', () => {
    expect(() =>
      TransactionEnvelopeLegacy.deserialize(Rlp.fromHex(['0x00', '0x01'])),
    ).toThrowErrorMatchingInlineSnapshot(`
        [InvalidSerializedTransactionError: Invalid serialized transaction of type "legacy" was provided.

        Serialized Transaction: "0xc20001"
        Missing Attributes: gas, to, value, data]
      `)
  })

  test('invalid transaction (missing signature)', () => {
    expect(() =>
      TransactionEnvelopeLegacy.deserialize(
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
      TransactionEnvelopeLegacy.deserialize(
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
      TransactionEnvelopeLegacy.deserialize(
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
      TransactionEnvelopeLegacy.deserialize(
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
