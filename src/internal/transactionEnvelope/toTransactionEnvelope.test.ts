import { TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'

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
  }

  {
    const envelope = TransactionEnvelope.fromLegacy({})
    expect(envelope).toMatchInlineSnapshot(`
      {
        "type": "legacy",
      }
    `)
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
  }

  {
    const envelope = TransactionEnvelope.fromEip1559({
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
  }

  {
    const envelope = TransactionEnvelope.from({
      accessList: [],
      chainId: 1,
      gasPrice: 69420n,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "chainId": 1,
        "gasPrice": 69420n,
        "type": "eip2930",
      }
    `)
  }

  {
    const envelope = TransactionEnvelope.fromEip2930({
      accessList: [],
      chainId: 1,
      gasPrice: 69420n,
    })
    expect(envelope).toMatchInlineSnapshot(`
      {
        "accessList": [],
        "chainId": 1,
        "gasPrice": 69420n,
        "type": "eip2930",
      }
    `)
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
  }

  {
    const envelope = TransactionEnvelope.fromEip4844({
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
  }

  {
    const envelope = TransactionEnvelope.fromEip7702({
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
  }
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
