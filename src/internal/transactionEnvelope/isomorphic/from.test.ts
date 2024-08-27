import { Secp256k1, TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "type": "legacy",
      }
    `)
    expect(
      TransactionEnvelope.from(TransactionEnvelope.serialize(envelope)),
    ).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      maxFeePerGas: 69420n,
      to: '0x0000000000000000000000000000000000000000',
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "maxFeePerGas": 69420n,
        "to": "0x0000000000000000000000000000000000000000",
        "type": "eip1559",
      }
    `)
    expect(
      TransactionEnvelope.from(TransactionEnvelope.serialize(envelope)),
    ).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelope.from({
      accessList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          storageKeys: [
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          ],
        },
      ],
      chainId: 1,
      gasPrice: 69420n,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "accessList": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "storageKeys": [
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            ],
          },
        ],
        "chainId": 1,
        "gasPrice": 69420n,
        "type": "eip2930",
      }
    `)
    expect(
      TransactionEnvelope.from(TransactionEnvelope.serialize(envelope)),
    ).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelope.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [
          "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        ],
        "chainId": 1,
        "type": "eip4844",
      }
    `)
    expect(
      TransactionEnvelope.from(TransactionEnvelope.serialize(envelope)),
    ).toEqual(envelope)
  }

  {
    const envelope = TransactionEnvelope.from({
      authorizationList: [],
      chainId: 1,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "authorizationList": [],
        "chainId": 1,
        "type": "eip7702",
      }
    `)
    expect(
      TransactionEnvelope.from(TransactionEnvelope.serialize(envelope)),
    ).toEqual(envelope)
  }
})

test('options: signature', () => {
  {
    const envelope = TransactionEnvelope.from({
      type: 'legacy',
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })
    const envelope_signed = TransactionEnvelope.from(envelope, { signature })
    expect(envelope_signed).toMatchInlineSnapshot(`
      {
        "r": 107222650244233557639947556263240329092451083289152541441560095697979875074784n,
        "s": 52218832312645255316251194227326652114454875196607829858361762060390595125606n,
        "type": "legacy",
        "v": 27,
      }
    `)
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip1559',
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })
    const envelope_signed = TransactionEnvelope.from(envelope, { signature })
    expect(envelope_signed).toMatchInlineSnapshot(`
    {
      "chainId": 1,
      "r": 99218249868392536448752273600463415079373675019795823914194417405750940344909n,
      "s": 47497791629324215926073930966254967707098107987071149504035179447698122362010n,
      "type": "eip1559",
      "yParity": 1,
    }
  `)
  }

  {
    const envelope = TransactionEnvelope.from({
      chainId: 1,
      type: 'eip2930',
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })
    const envelope_signed = TransactionEnvelope.from(envelope, { signature })
    expect(envelope_signed).toMatchInlineSnapshot(`
      {
        "chainId": 1,
        "r": 93932807904697745480564738706781134773885249688973106966562233485483170185824n,
        "s": 39379885715718316229876893921469404141615278557236272858117945335724417371484n,
        "type": "eip2930",
        "yParity": 0,
      }
    `)
  }

  {
    const envelope = TransactionEnvelope.from({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      type: 'eip4844',
    })
    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(envelope),
      privateKey: accounts[0].privateKey,
    })
    const envelope_signed = TransactionEnvelope.from(envelope, { signature })
    expect(envelope_signed).toMatchInlineSnapshot(`
      {
        "blobVersionedHashes": [
          "0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe",
        ],
        "chainId": 1,
        "r": 67923272537793781048040824344336982911155024419377826966440486783963040559397n,
        "s": 23792405293310588253138569775175587128791672763180337044231738029547592539540n,
        "type": "eip4844",
        "yParity": 1,
      }
    `)
  }

  const envelope = TransactionEnvelope.from({
    authorizationList: [],
    chainId: 1,
  })
  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })
  const envelope_signed = TransactionEnvelope.from(envelope, { signature })
  expect(envelope_signed).toMatchInlineSnapshot(`
    {
      "authorizationList": [],
      "chainId": 1,
      "r": 9111973892630256977933416390166213432113807172287443440256542569693513550245n,
      "s": 3349798045904029001541856968404927772754821946896353650604254327549634635176n,
      "type": "eip7702",
      "yParity": 0,
    }
  `)
})

test('error: invalid property', () => {
  expect(() =>
    TransactionEnvelope.from({ to: '0xz', type: 'legacy' }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [InvalidAddressError: Address "0xz" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})

test('error: cannot infer transaction type', () => {
  expect(() =>
    TransactionEnvelope.from({ chainId: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [CannotInferTransactionTypeError: Cannot infer a transaction type from provided transaction.

    Provided Transaction:
    {
      chainId:  1
    }

    To infer the type, either provide:
    - a \`type\` to the Transaction, or
    - an EIP-1559 Transaction with \`maxFeePerGas\`, or
    - an EIP-2930 Transaction with \`gasPrice\` & \`accessList\`, or
    - an EIP-4844 Transaction with \`blobs\`, \`blobVersionedHashes\`, \`sidecars\`, or
    - an EIP-7702 Transaction with \`authorizationList\`, or
    - a Legacy Transaction with \`gasPrice\`]
  `)
})

test('error: not implemented', () => {
  expect(() =>
    TransactionEnvelope.from({
      // @ts-expect-error
      type: 'unknown',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `unknown` is not implemented.]',
  )
})
