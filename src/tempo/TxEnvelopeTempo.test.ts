import { Hex, P256, Rlp, Secp256k1, Value, WebAuthnP256 } from 'ox'
import { describe, expect, test } from 'vitest'
import * as AuthorizationTempo from './AuthorizationTempo.js'
import { SignatureEnvelope } from './index.js'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as TxEnvelopeTempo from './TxEnvelopeTempo.js'

const privateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

describe('assert', () => {
  test('empty calls list', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        calls: [],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeTempo.CallsEmptyError: Calls list cannot be empty.]`,
    )
  })

  test('missing calls', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        chainId: 1,
      } as any),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeTempo.CallsEmptyError: Calls list cannot be empty.]`,
    )
  })

  test('invalid validity window', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId: 1,
        validBefore: 100,
        validAfter: 200,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeTempo.InvalidValidityWindowError: validBefore (100) must be greater than validAfter (200).]`,
    )
  })

  test('invalid validity window (equal)', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId: 1,
        validBefore: 100,
        validAfter: 100,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TxEnvelopeTempo.InvalidValidityWindowError: validBefore (100) must be greater than validAfter (100).]`,
    )
  })

  test('invalid call address', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        calls: [{ to: '0x000000000000000000000000000000000000000z' }],
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
      TxEnvelopeTempo.assert({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        maxFeePerGas: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.FeeCapTooHighError: The fee cap (\`maxFeePerGas\`/\`maxPriorityFeePerGas\` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]`,
    )
  })

  test('tip above fee cap', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId: 1,
        maxFeePerGas: 10n,
        maxPriorityFeePerGas: 20n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.TipAboveFeeCapError: The provided tip (\`maxPriorityFeePerGas\` = 0.00000002 gwei) cannot be higher than the fee cap (\`maxFeePerGas\` = 0.00000001 gwei).]`,
    )
  })

  test('invalid chain id', () => {
    expect(() =>
      TxEnvelopeTempo.assert({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId: 0,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })
})

describe('deserialize', () => {
  const transaction = TxEnvelopeTempo.from({
    chainId: 1,
    calls: [
      {
        to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      },
    ],
    nonce: 785n,
    nonceKey: 0n,
    maxFeePerGas: Value.fromGwei('2'),
    maxPriorityFeePerGas: Value.fromGwei('2'),
  })

  test('default', () => {
    const serialized = TxEnvelopeTempo.serialize(transaction)
    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized).toEqual(transaction)
  })

  test('minimal', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{}],
      nonce: 0n,
      nonceKey: 0n,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(transaction)
  })

  test('multiple calls', () => {
    const transaction_multiCall = TxEnvelopeTempo.from({
      ...transaction,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
        {
          to: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
          value: Value.from('0.002', 6),
          data: '0x1234',
        },
      ],
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_multiCall)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_multiCall,
    )
  })

  test('gas', () => {
    const transaction_gas = TxEnvelopeTempo.from({
      ...transaction,
      gas: 21001n,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_gas)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(transaction_gas)
  })

  test('accessList', () => {
    const transaction_accessList = TxEnvelopeTempo.from({
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
    const serialized = TxEnvelopeTempo.serialize(transaction_accessList)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_accessList,
    )
  })

  test('nonce', () => {
    const transaction_nonce = TxEnvelopeTempo.from({
      ...transaction,
      nonce: 0n,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_nonce)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(transaction_nonce)
  })

  test('nonceKey', () => {
    const transaction_nonceKey = TxEnvelopeTempo.from({
      ...transaction,
      nonceKey: 0n,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_nonceKey)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_nonceKey,
    )
  })

  test('validBefore', () => {
    const transaction_validBefore = TxEnvelopeTempo.from({
      ...transaction,
      validBefore: 1000000,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_validBefore)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_validBefore,
    )
  })

  test('validAfter', () => {
    const transaction_validAfter = TxEnvelopeTempo.from({
      ...transaction,
      validAfter: 500000,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_validAfter)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_validAfter,
    )
  })

  test('validBefore and validAfter', () => {
    const transaction_validity = TxEnvelopeTempo.from({
      ...transaction,
      validBefore: 1000000,
      validAfter: 500000,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_validity)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_validity,
    )
  })

  test('feeToken', () => {
    const transaction_feeToken = TxEnvelopeTempo.from({
      ...transaction,
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_feeToken)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_feeToken,
    )
  })

  test('keyAuthorization', () => {
    const keyAuthorization = KeyAuthorization.from({
      expiry: 1234567890,
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      type: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from({
        r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        yParity: 0,
      }),
    })

    const transaction_keyAuthorization = TxEnvelopeTempo.from({
      ...transaction,
      keyAuthorization,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction_keyAuthorization)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_keyAuthorization,
    )
  })

  test('authorizationList', () => {
    const authorizationList = [
      AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
        signature: SignatureEnvelope.from({
          r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
          s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
          yParity: 0,
        }),
      }),
      AuthorizationTempo.from({
        address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        chainId: 1,
        nonce: 55n,
        signature: SignatureEnvelope.from({
          r: 12345678901234567890n,
          s: 98765432109876543210n,
          yParity: 1,
        }),
      }),
    ] as const

    const transaction_authorizationList = TxEnvelopeTempo.from({
      ...transaction,
      authorizationList,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction_authorizationList)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_authorizationList,
    )
  })

  test('authorizationList (empty)', () => {
    const transaction_authorizationList = TxEnvelopeTempo.from({
      ...transaction,
      authorizationList: [],
    })

    const serialized = TxEnvelopeTempo.serialize(transaction_authorizationList)
    const deserialized = TxEnvelopeTempo.deserialize(serialized)

    // Empty authorizationList should be undefined after deserialization
    expect(deserialized.authorizationList).toBeUndefined()
  })

  describe('signature', () => {
    test('secp256k1', () => {
      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        privateKey,
      })
      const serialized = TxEnvelopeTempo.serialize(transaction, {
        signature,
      })
      expect(TxEnvelopeTempo.deserialize(serialized)).toEqual({
        ...transaction,
        signature: { signature, type: 'secp256k1' },
      })
    })

    test('secp256k1', () => {
      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        privateKey,
      })
      const serialized = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from(signature),
      })
      expect(TxEnvelopeTempo.deserialize(serialized)).toEqual({
        ...transaction,
        signature: { signature, type: 'secp256k1' },
      })
    })

    test('p256', () => {
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const signature = P256.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        privateKey,
      })
      const serialized = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          signature,
          publicKey,
          prehash: true,
        }),
      })
      // biome-ignore lint/suspicious/noTsIgnore: _
      // @ts-ignore
      delete signature.yParity
      expect(TxEnvelopeTempo.deserialize(serialized)).toEqual({
        ...transaction,
        signature: { prehash: true, publicKey, signature, type: 'p256' },
      })
    })
  })

  test('feePayerSignature null', () => {
    const transaction_feePayer = TxEnvelopeTempo.from({
      ...transaction,
      feePayerSignature: null,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction_feePayer)
    expect(TxEnvelopeTempo.deserialize(serialized)).toEqual(
      transaction_feePayer,
    )
  })

  test('feePayerSignature with address', () => {
    const serialized = `0x76${Rlp.fromHex([
      Hex.fromNumber(1), // chainId
      Hex.fromNumber(1), // maxPriorityFeePerGas
      Hex.fromNumber(1), // maxFeePerGas
      Hex.fromNumber(1), // gas
      [
        [
          '0x0000000000000000000000000000000000000000', // to
          Hex.fromNumber(0), // value
          '0x', // data
        ],
      ], // calls
      '0x', // accessList
      Hex.fromNumber(0), // nonceKey
      Hex.fromNumber(0), // nonce
      '0x', // validBefore
      '0x', // validAfter
      '0x', // feeToken
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // feePayerSignatureOrSender (address)
      [], // authorizationList
    ]).slice(2)}` as const
    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.feePayerSignature).toBe(null)
  })

  test('feePayerSignature with signature tuple', () => {
    const serialized = `0x76${Rlp.fromHex([
      Hex.fromNumber(1), // chainId
      Hex.fromNumber(1), // maxPriorityFeePerGas
      Hex.fromNumber(1), // maxFeePerGas
      Hex.fromNumber(1), // gas
      [
        [
          '0x0000000000000000000000000000000000000000', // to
          Hex.fromNumber(0), // value
          '0x', // data
        ],
      ], // calls
      '0x', // accessList
      Hex.fromNumber(0), // nonceKey
      Hex.fromNumber(0), // nonce
      '0x', // validBefore
      '0x', // validAfter
      '0x', // feeToken
      [Hex.fromNumber(0), Hex.fromNumber(1), Hex.fromNumber(2)], // feePayerSignatureOrSender (signature tuple)
      [], // authorizationList
    ]).slice(2)}` as const
    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.feePayerSignature).toEqual({
      yParity: 0,
      r: 1n,
      s: 2n,
    })
  })

  describe('raw', () => {
    test('default', () => {
      const serialized = `0x76${Rlp.fromHex([
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        [
          [
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
          ],
        ], // calls
        '0x', // accessList
        Hex.fromNumber(0), // nonceKey
        Hex.fromNumber(0), // nonce
        '0x', // validBefore
        '0x', // validAfter
        '0x', // feeToken
        '0x', // feePayerSignature
        [], // authorizationList
      ]).slice(2)}` as const
      expect(TxEnvelopeTempo.deserialize(serialized)).toMatchInlineSnapshot(`
        {
          "calls": [
            {
              "to": "0x0000000000000000000000000000000000000000",
              "value": 0n,
            },
          ],
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "nonceKey": 0n,
          "type": "tempo",
        }
      `)
    })

    test('empty sig', () => {
      const serialized = `0x76${Rlp.fromHex([
        Hex.fromNumber(1), // chainId
        Hex.fromNumber(1), // maxPriorityFeePerGas
        Hex.fromNumber(1), // maxFeePerGas
        Hex.fromNumber(1), // gas
        [
          [
            '0x0000000000000000000000000000000000000000', // to
            Hex.fromNumber(0), // value
            '0x', // data
          ],
        ], // calls
        '0x', // accessList
        Hex.fromNumber(0), // nonceKey
        Hex.fromNumber(0), // nonce
        '0x', // validBefore
        '0x', // validAfter
        '0x', // feeToken
        '0x', // feePayerSignature
        [], // authorizationList
      ]).slice(2)}` as const
      expect(TxEnvelopeTempo.deserialize(serialized)).toMatchInlineSnapshot(`
        {
          "calls": [
            {
              "to": "0x0000000000000000000000000000000000000000",
              "value": 0n,
            },
          ],
          "chainId": 1,
          "gas": 1n,
          "maxFeePerGas": 1n,
          "maxPriorityFeePerGas": 1n,
          "nonce": 0n,
          "nonceKey": 0n,
          "type": "tempo",
        }
      `)
    })
  })

  describe('errors', () => {
    test('invalid transaction (all missing)', () => {
      expect(() =>
        TxEnvelopeTempo.deserialize(`0x76${Rlp.fromHex([]).slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
        [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "tempo" was provided.

        Serialized Transaction: "0x76c0"
        Missing Attributes: authorizationList, chainId, maxPriorityFeePerGas, maxFeePerGas, gas, calls, accessList, keyAuthorization, nonceKey, nonce, validBefore, validAfter, feeToken, feePayerSignatureOrSender]
      `)
    })

    test('invalid transaction (some missing)', () => {
      expect(() =>
        TxEnvelopeTempo.deserialize(
          `0x76${Rlp.fromHex(['0x00', '0x01']).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "tempo" was provided.

        Serialized Transaction: "0x76c20001"
        Missing Attributes: authorizationList, maxFeePerGas, gas, calls, accessList, keyAuthorization, nonceKey, nonce, validBefore, validAfter, feeToken, feePayerSignatureOrSender]
      `)
    })

    test('invalid transaction (empty calls)', () => {
      expect(() =>
        TxEnvelopeTempo.deserialize(
          `0x76${Rlp.fromHex([
            Hex.fromNumber(1), // chainId
            Hex.fromNumber(1), // maxPriorityFeePerGas
            Hex.fromNumber(1), // maxFeePerGas
            Hex.fromNumber(1), // gas
            [], // calls (empty)
            '0x', // accessList
            Hex.fromNumber(0), // nonceKey
            Hex.fromNumber(0), // nonce
            '0x', // validBefore
            '0x', // validAfter
            '0x', // feeToken
            '0x', // feePayerSignature
            [], // authorizationList
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        `[TxEnvelopeTempo.CallsEmptyError: Calls list cannot be empty.]`,
      )
    })

    test('invalid transaction (too many fields with signature)', () => {
      expect(() =>
        TxEnvelopeTempo.deserialize(
          `0x76${Rlp.fromHex([
            Hex.fromNumber(1), // chainId
            Hex.fromNumber(1), // maxPriorityFeePerGas
            Hex.fromNumber(1), // maxFeePerGas
            Hex.fromNumber(1), // gas
            [
              [
                '0x0000000000000000000000000000000000000000',
                Hex.fromNumber(0),
                '0x',
              ],
            ], // calls
            '0x', // accessList
            Hex.fromNumber(0), // nonceKey
            Hex.fromNumber(0), // nonce
            '0x', // validBefore
            '0x', // validAfter
            '0x', // feeToken
            '0x', // feePayerSignature
            [], // authorizationList
            [], // keyAuthorization
            '0x1234', // signature
            '0x5678', // extra field
          ]).slice(2)}`,
        ),
      ).toThrowErrorMatchingInlineSnapshot(`
        [TransactionEnvelope.InvalidSerializedError: Invalid serialized transaction of type "tempo" was provided.

        Serialized Transaction: "0x76ec01010101d8d7940000000000000000000000000000000000000000008080000080808080c0c0821234825678"]
      `)
    })
  })
})

describe('from', () => {
  test('default', () => {
    {
      const envelope = TxEnvelopeTempo.from({
        chainId: 1,
        calls: [{}],
        nonce: 0n,
        nonceKey: 0n,
      })
      expect(envelope).toMatchInlineSnapshot(`
        {
          "calls": [
            {},
          ],
          "chainId": 1,
          "nonce": 0n,
          "nonceKey": 0n,
          "type": "tempo",
        }
      `)
      const serialized = TxEnvelopeTempo.serialize(envelope)
      const envelope2 = TxEnvelopeTempo.from(serialized)
      expect(envelope2).toEqual(envelope)
    }

    {
      const envelope = TxEnvelopeTempo.from({
        chainId: 1,
        calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
        nonce: 0n,
        nonceKey: 0n,
        signature: SignatureEnvelope.from({
          r: 0n,
          s: 1n,
          yParity: 0,
        }),
      })
      expect(envelope).toMatchInlineSnapshot(`
        {
          "calls": [
            {
              "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
            },
          ],
          "chainId": 1,
          "nonce": 0n,
          "nonceKey": 0n,
          "signature": {
            "signature": {
              "r": 0n,
              "s": 1n,
              "yParity": 0,
            },
            "type": "secp256k1",
          },
          "type": "tempo",
        }
      `)
      const serialized = TxEnvelopeTempo.serialize(envelope)
      const envelope2 = TxEnvelopeTempo.from(serialized)
      expect(envelope2).toEqual({
        ...envelope,
        signature: { ...envelope.signature, type: 'secp256k1' },
      })
    }
  })

  test('options: signature', () => {
    const envelope = TxEnvelopeTempo.from(
      {
        chainId: 1,
        calls: [{}],
        nonce: 0n,
        nonceKey: 0n,
      },
      {
        signature: SignatureEnvelope.from({
          r: 0n,
          s: 1n,
          yParity: 0,
        }),
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "calls": [
          {},
        ],
        "chainId": 1,
        "nonce": 0n,
        "nonceKey": 0n,
        "signature": {
          "signature": {
            "r": 0n,
            "s": 1n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "type": "tempo",
      }
    `)
    const serialized = TxEnvelopeTempo.serialize(envelope)
    const envelope2 = TxEnvelopeTempo.from(serialized)
    expect(envelope2).toEqual(envelope)
  })

  test('options: signature', () => {
    const envelope = TxEnvelopeTempo.from(
      {
        chainId: 1,
        calls: [{}],
        nonce: 0n,
        nonceKey: 0n,
      },
      {
        signature: { r: 0n, s: 1n, yParity: 0 },
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "calls": [
          {},
        ],
        "chainId": 1,
        "nonce": 0n,
        "nonceKey": 0n,
        "signature": {
          "signature": {
            "r": 0n,
            "s": 1n,
            "yParity": 0,
          },
          "type": "secp256k1",
        },
        "type": "tempo",
      }
    `)
    const serialized = TxEnvelopeTempo.serialize(envelope)
    const envelope2 = TxEnvelopeTempo.from(serialized)
    expect(envelope2).toEqual(envelope)
  })

  test('options: feePayerSignature', () => {
    const envelope = TxEnvelopeTempo.from(
      {
        chainId: 1,
        calls: [{}],
        nonce: 0n,
        r: 1n,
        s: 2n,
        yParity: 0,
      },
      {
        feePayerSignature: {
          r: 0n,
          s: 1n,
          yParity: 0,
        },
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "calls": [
          {},
        ],
        "chainId": 1,
        "feePayerSignature": {
          "r": 0n,
          "s": 1n,
          "yParity": 0,
        },
        "nonce": 0n,
        "r": 1n,
        "s": 2n,
        "type": "tempo",
        "yParity": 0,
      }
    `)
  })

  test('options: feePayerSignature (null)', () => {
    const envelope = TxEnvelopeTempo.from(
      {
        chainId: 1,
        calls: [{}],
        nonce: 0n,
      },
      {
        feePayerSignature: null,
      },
    )
    expect(envelope).toMatchInlineSnapshot(`
      {
        "calls": [
          {},
        ],
        "chainId": 1,
        "nonce": 0n,
        "type": "tempo",
      }
    `)
  })
})

describe('serialize', () => {
  test('default', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
      ],
      nonce: 785n,
      maxFeePerGas: Value.fromGwei('2'),
      maxPriorityFeePerGas: Value.fromGwei('2'),
    })
    expect(TxEnvelopeTempo.serialize(transaction)).toMatchInlineSnapshot(
      `"0x76ef018477359400847735940080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c08082031180808080c0"`,
    )
  })

  test('minimal', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{}],
      nonce: 0n,
    })
    expect(TxEnvelopeTempo.serialize(transaction)).toMatchInlineSnapshot(
      `"0x76d101808080c4c3808080c0808080808080c0"`,
    )
  })

  test('undefined nonceKey', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{}],
      nonce: 0n,
      nonceKey: undefined,
    })
    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x76d101808080c4c3808080c0808080808080c0"`,
    )
  })

  test('multiple calls', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
        {
          to: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
          value: Value.from('0.002', 6),
          data: '0x1234',
        },
      ],
      nonce: 0n,
    })
    expect(TxEnvelopeTempo.serialize(transaction)).toMatchInlineSnapshot(
      `"0x76f84101808080f4d79470997970c51812dc3a010c7d01b50e0d17dc79c88080db943c44cdddb6a900fa2b585dd299e03d12fa4293bc8207d0821234c0808080808080c0"`,
    )
  })

  test('keyAuthorization (secp256k1)', () => {
    const keyAuthorization = KeyAuthorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      expiry: 1234567890,
      type: 'secp256k1',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from({
        r: 44944627813007772897391531230081695102703289123332187696115181104739239197517n,
        s: 36528503505192438307355164441104001310566505351980369085208178712678799181120n,
        yParity: 0,
      }),
    })

    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
      keyAuthorization,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x76f8a201808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808080c0f87bf7808094be95c3f554e9fc85ec51be69a3d807a0d55bcf2c84499602d2dad99420c000000000000000000000000000000000000183989680b841635dc2033e60185bb36709c29c75d64ea51dfbd91c32ef4be198e4ceb169fb4d50c2667ac4c771072746acfdcf1f1483336dcca8bd2df47cd83175dbe60f05401b"`,
    )

    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.keyAuthorization).toEqual(keyAuthorization)
  })

  test('keyAuthorization (p256)', () => {
    const keyAuthorization = KeyAuthorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      expiry: 1234567890,
      type: 'p256',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from({
        signature: {
          r: 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
          s: 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
        },
        publicKey: {
          prefix: 4,
          x: 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
          y: 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
        },
        prehash: true,
      }),
    })

    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
      keyAuthorization,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x76f8e301808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808080c0f8bcf7800194be95c3f554e9fc85ec51be69a3d807a0d55bcf2c84499602d2dad99420c000000000000000000000000000000000000183989680b88201ccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35ad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f511edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba001"`,
    )

    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.keyAuthorization).toEqual(keyAuthorization)
  })

  test('keyAuthorization (webAuthn)', () => {
    const metadata = {
      authenticatorData: WebAuthnP256.getAuthenticatorData({
        rpId: 'localhost',
      }),
      clientDataJSON: WebAuthnP256.getClientDataJSON({
        challenge: '0xdeadbeef',
        origin: 'http://localhost',
      }),
    }

    const keyAuthorization = KeyAuthorization.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      expiry: 1234567890,
      type: 'webAuthn',
      limits: [
        {
          token: '0x20c0000000000000000000000000000000000001',
          limit: Value.from('10', 6),
        },
      ],
      signature: SignatureEnvelope.from({
        signature: {
          r: 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
          s: 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
        },
        publicKey: {
          prefix: 4,
          x: 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
          y: 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
        },
        metadata,
      }),
    })

    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
      keyAuthorization,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x76f9016501808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808080c0f9013df7800294be95c3f554e9fc85ec51be69a3d807a0d55bcf2c84499602d2dad99420c000000000000000000000000000000000000183989680b901020249960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000007b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a223371322d3777222c226f726967696e223a22687474703a2f2f6c6f63616c686f7374222c2263726f73734f726967696e223a66616c73657dccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35ad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f511edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba0"`,
    )

    // Verify roundtrip
    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.keyAuthorization).toEqual(keyAuthorization)
  })

  test('authorizationList (secp256k1)', () => {
    const authorizationList = [
      AuthorizationTempo.from({
        address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        chainId: 1,
        nonce: 40n,
        signature: SignatureEnvelope.from({
          r: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
          s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
          yParity: 0,
        }),
      }),
      AuthorizationTempo.from({
        address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        chainId: 1,
        nonce: 55n,
        signature: SignatureEnvelope.from({
          r: 12345678901234567890n,
          s: 98765432109876543210n,
          yParity: 1,
        }),
      }),
    ] as const

    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
      authorizationList,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x76f8de01808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808080f8b8f85a0194be95c3f554e9fc85ec51be69a3d807a0d55bcf2c28b8416e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81bf85a019470997970c51812dc3a010c7d01b50e0d17dc79c837b841000000000000000000000000000000000000000000000000ab54a98ceb1f0ad20000000000000000000000000000000000000000000000055aa54d38e5267eea1c"`,
    )

    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.authorizationList).toEqual(authorizationList)
  })

  test('authorizationList (multiple types)', () => {
    const privateKey = P256.randomPrivateKey()
    const publicKey = P256.getPublicKey({ privateKey })

    const authorization1 = AuthorizationTempo.from({
      address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
      chainId: 1,
      nonce: 40n,
    })
    const secp256k1Signature = Secp256k1.sign({
      payload: AuthorizationTempo.getSignPayload(authorization1),
      privateKey,
    })

    const authorization2 = AuthorizationTempo.from({
      address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      chainId: 1,
      nonce: 55n,
    })
    const p256Signature = P256.sign({
      payload: AuthorizationTempo.getSignPayload(authorization2),
      privateKey,
    })

    const authorizationList = [
      AuthorizationTempo.from(authorization1, {
        signature: SignatureEnvelope.from({ signature: secp256k1Signature }),
      }),
      AuthorizationTempo.from(authorization2, {
        signature: SignatureEnvelope.from({
          signature: p256Signature,
          publicKey,
          prehash: true,
        }),
      }),
    ]

    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
      authorizationList,
    })

    const serialized = TxEnvelopeTempo.serialize(transaction)
    const deserialized = TxEnvelopeTempo.deserialize(serialized)

    expect(deserialized.authorizationList).toHaveLength(2)
    expect(deserialized.authorizationList?.[0]?.address).toBe(
      '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
    )
    expect(deserialized.authorizationList?.[0]?.signature?.type).toBe(
      'secp256k1',
    )
    expect(deserialized.authorizationList?.[1]?.address).toBe(
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    )
    expect(deserialized.authorizationList?.[1]?.signature?.type).toBe('p256')
  })

  test('authorizationList (empty)', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
      authorizationList: [],
    })

    const serialized = TxEnvelopeTempo.serialize(transaction)
    expect(serialized).toMatchInlineSnapshot(
      `"0x76e501808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808080c0"`,
    )

    const deserialized = TxEnvelopeTempo.deserialize(serialized)
    expect(deserialized.authorizationList).toBeUndefined()
  })

  describe('with signature', () => {
    test('secp256k1', () => {
      const transaction = TxEnvelopeTempo.from({
        chainId: 1,
        calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
        nonce: 0n,
      })
      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        privateKey,
      })
      expect(
        TxEnvelopeTempo.serialize(transaction, {
          signature: SignatureEnvelope.from(signature),
        }),
      ).toMatchInlineSnapshot(
        `"0x76f86801808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808080c0b8416b37e17bf41d92dfee5ffdce55431bf01dd7875b2229d6258350c5ee6fe6a54225b867dc1b19c9ec97833ebdccd830d2846c5b724b72dcd754d694d08b5e80ee1c"`,
      )
    })

    test('p256', () => {
      const transaction = TxEnvelopeTempo.from({
        chainId: 1,
        calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
        nonce: 0n,
      })
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const signature = P256.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        privateKey,
      })
      const serialized = TxEnvelopeTempo.serialize(transaction, {
        signature: SignatureEnvelope.from({
          signature,
          publicKey,
          prehash: true,
        }),
      })
      // biome-ignore lint/suspicious/noTsIgnore: _
      // @ts-ignore
      delete signature.yParity
      expect(TxEnvelopeTempo.deserialize(serialized)).toEqual({
        ...transaction,
        nonceKey: 0n,
        signature: { prehash: true, publicKey, signature, type: 'p256' },
      })
    })
  })

  test('with feePayerSignature', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
    })
    expect(
      TxEnvelopeTempo.serialize(transaction, {
        feePayerSignature: {
          r: 1n,
          s: 2n,
          yParity: 0,
        },
      }),
    ).toMatchInlineSnapshot(
      `"0x76e801808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c08080808080c3800102c0"`,
    )
  })

  test('with feePayerSignature (null)', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
    })
    expect(
      TxEnvelopeTempo.serialize(transaction, {
        feePayerSignature: null,
      }),
    ).toMatchInlineSnapshot(
      `"0x76e501808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808000c0"`,
    )
  })

  test('format: feePayer', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [{ to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8' }],
      nonce: 0n,
    })
    expect(
      TxEnvelopeTempo.serialize(transaction, {
        sender: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        format: 'feePayer',
      }),
    ).toMatchInlineSnapshot(
      `"0x78f83901808080d8d79470997970c51812dc3a010c7d01b50e0d17dc79c88080c0808080808094f39fd6e51aad88f6f4ce6ab8827279cfffb92266c0"`,
    )
  })
})

describe('hash', () => {
  describe('default', () => {
    test('secp256k1', () => {
      const transaction = TxEnvelopeTempo.from({
        chainId: 1,
        calls: [
          {
            to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
          },
        ],
        nonce: 0n,
      })
      const signature = Secp256k1.sign({
        payload: TxEnvelopeTempo.getSignPayload(transaction),
        privateKey,
      })
      const signed = TxEnvelopeTempo.from(transaction, {
        signature: SignatureEnvelope.from(signature),
      })
      expect(TxEnvelopeTempo.hash(signed)).toMatchInlineSnapshot(
        `"0x04ad27d1607bc3fc37445724d8864b0843f88008bafd818814474e5ee94647eb"`,
      )
    })
  })

  test('presign', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
      ],
      nonce: 0n,
    })
    expect(
      TxEnvelopeTempo.hash(transaction, { presign: true }),
    ).toMatchInlineSnapshot(
      `"0xe1222a45806457acbe3a13940aae4c34f3180659fa16613b5a45dc183adae07c"`,
    )
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
      ],
      nonce: 0n,
    })
    expect(TxEnvelopeTempo.getSignPayload(transaction)).toMatchInlineSnapshot(
      `"0xe1222a45806457acbe3a13940aae4c34f3180659fa16613b5a45dc183adae07c"`,
    )
  })
})

describe('getFeePayerSignPayload', () => {
  test('default', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
      ],
      nonce: 0n,
    })
    expect(
      TxEnvelopeTempo.getFeePayerSignPayload(transaction, {
        sender: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      }),
    ).toMatchInlineSnapshot(
      `"0xde7a88984d766d0f5aac705487b43e68261516d6e7c524698804d4970d39d77d"`,
    )
  })

  test('with feeToken', () => {
    const transaction = TxEnvelopeTempo.from({
      chainId: 1,
      calls: [
        {
          to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        },
      ],
      nonce: 0n,
      feeToken: '0x20c0000000000000000000000000000000000000',
    })
    const hash1 = TxEnvelopeTempo.getFeePayerSignPayload(transaction, {
      sender: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    })

    // Change feeToken - hash should be different
    const transaction2 = TxEnvelopeTempo.from({
      ...transaction,
      feeToken: '0x20c0000000000000000000000000000000000001',
    })
    const hash2 = TxEnvelopeTempo.getFeePayerSignPayload(transaction2, {
      sender: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    })

    expect(hash1).not.toBe(hash2)
  })
})

describe('validate', () => {
  test('valid', () => {
    expect(
      TxEnvelopeTempo.validate({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId: 1,
      }),
    ).toBe(true)
  })

  test('invalid (empty calls)', () => {
    expect(
      TxEnvelopeTempo.validate({
        calls: [],
        chainId: 1,
      }),
    ).toBe(false)
  })

  test('invalid (validity window)', () => {
    expect(
      TxEnvelopeTempo.validate({
        calls: [{ to: '0x0000000000000000000000000000000000000000' }],
        chainId: 1,
        validBefore: 100,
        validAfter: 200,
      }),
    ).toBe(false)
  })
})
