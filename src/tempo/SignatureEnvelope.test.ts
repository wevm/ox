import {
  Address,
  Hash,
  Hex,
  P256,
  PublicKey,
  Rlp,
  Secp256k1,
  Signature,
  WebAuthnP256,
  WebCryptoP256,
} from 'ox'
import { describe, expect, test } from 'vitest'
import * as MultisigConfig from './MultisigConfig.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'

const publicKey = PublicKey.from({
  prefix: 4,
  x: 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
  y: 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
})

const p256Signature = Signature.from({
  r: 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
  s: 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
  yParity: 0,
})

const signature_secp256k1 = Secp256k1.sign({
  payload: '0xdeadbeef',
  privateKey: Secp256k1.randomPrivateKey(),
})

const signature_p256 = SignatureEnvelope.from({
  signature: p256Signature,
  publicKey,
  prehash: true,
})

const signature_webauthn = SignatureEnvelope.from({
  signature: p256Signature,
  publicKey,
  metadata: {
    authenticatorData: WebAuthnP256.getAuthenticatorData({ rpId: 'localhost' }),
    clientDataJSON: WebAuthnP256.getClientDataJSON({
      challenge: '0xdeadbeef',
      origin: 'http://localhost',
    }),
  },
})

// Keychain signatures with different inner types
const signature_keychain_secp256k1 = SignatureEnvelope.from({
  userAddress: '0x1234567890123456789012345678901234567890',
  inner: SignatureEnvelope.from(signature_secp256k1),
  version: 'v2',
})

const signature_keychain_p256 = SignatureEnvelope.from({
  userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  inner: signature_p256,
  version: 'v2',
})

const signature_keychain_webauthn = SignatureEnvelope.from({
  userAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
  inner: signature_webauthn,
  version: 'v2',
})

const signature_multisig_rpc =
  '0xf89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d6947e5f4552091a69125d5dfcb7b8c2659029395bdf01f843b841869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b' as const

describe('assert', () => {
  describe('secp256k1', () => {
    test('behavior: validates valid signature', () => {
      expect(() =>
        SignatureEnvelope.assert({
          signature: signature_secp256k1,
          type: 'secp256k1',
        }),
      ).not.toThrow()
    })

    test('behavior: validates signature without explicit type', () => {
      expect(() =>
        SignatureEnvelope.assert({ signature: signature_secp256k1 }),
      ).not.toThrow()
    })

    test('error: throws on invalid signature values', () => {
      expect(() =>
        SignatureEnvelope.assert({
          signature: {
            r: 0n,
            s: 0n,
            yParity: 2,
          },
          type: 'secp256k1',
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Signature.InvalidYParityError: Value \`2\` is an invalid y-parity value. Y-parity must be 0 or 1.]`,
      )
    })
  })

  describe('p256', () => {
    test('behavior: validates valid P256 signature', () => {
      expect(() => SignatureEnvelope.assert(signature_p256)).not.toThrow()
    })

    test('behavior: validates P256 signature without explicit type', () => {
      const { type: _, ...signatureWithoutType } = signature_p256
      expect(() => SignatureEnvelope.assert(signatureWithoutType)).not.toThrow()
    })

    test('error: throws on invalid prehash type', () => {
      expect(() =>
        SignatureEnvelope.assert({
          ...signature_p256,
          prehash: 'true' as any,
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`prehash\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"prehash":"true","type":"p256"}]
      `,
      )
    })

    test('error: throws on missing publicKey', () => {
      const { publicKey: _, ...withoutPublicKey } = signature_p256
      expect(() =>
        SignatureEnvelope.assert(withoutPublicKey as any),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`publicKey\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"prehash":true,"type":"p256"}]
      `,
      )
    })

    test('error: throws on missing signature.r', () => {
      const invalid = {
        signature: { s: 1n } as any,
        publicKey,
        prehash: true,
        type: 'p256' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`signature.r\`.

        Provided: {"signature":{"s":"1#__bigint"},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"prehash":true,"type":"p256"}]
      `,
      )
    })

    test('error: throws on missing signature.s', () => {
      const invalid = {
        signature: { r: 1n } as any,
        publicKey,
        prehash: true,
        type: 'p256' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`signature.s\`.

        Provided: {"signature":{"r":"1#__bigint"},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"prehash":true,"type":"p256"}]
      `,
      )
    })

    test('error: throws on missing publicKey.x', () => {
      const invalid = {
        signature: p256Signature,
        publicKey: { y: 1n } as any,
        prehash: true,
        type: 'p256' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`publicKey.x\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"y":"1#__bigint"},"prehash":true,"type":"p256"}]
      `,
      )
    })

    test('error: throws on missing publicKey.y', () => {
      const invalid = {
        signature: p256Signature,
        publicKey: { x: 1n } as any,
        prehash: true,
        type: 'p256' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`publicKey.y\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"x":"1#__bigint"},"prehash":true,"type":"p256"}]
      `,
      )
    })

    test('error: throws with all missing properties listed', () => {
      const invalid = {
        signature: {} as any,
        type: 'p256' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "p256" is missing required properties: \`signature.r\`, \`signature.s\`, \`prehash\`, \`publicKey\`.

        Provided: {"signature":{},"type":"p256"}]
      `,
      )
    })
  })

  describe('webAuthn', () => {
    test('behavior: validates valid WebAuthn signature', () => {
      expect(() => SignatureEnvelope.assert(signature_webauthn)).not.toThrow()
    })

    test('behavior: validates WebAuthn signature without explicit type', () => {
      const { type: _, ...signatureWithoutType } = signature_webauthn
      expect(() => SignatureEnvelope.assert(signatureWithoutType)).not.toThrow()
    })

    test('error: throws on missing metadata', () => {
      const { metadata: _, ...withoutMetadata } = signature_webauthn
      expect(() =>
        SignatureEnvelope.assert(withoutMetadata as any),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`metadata\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing publicKey', () => {
      const { publicKey: _, ...withoutPublicKey } = signature_webauthn
      expect(() =>
        SignatureEnvelope.assert(withoutPublicKey as any),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`publicKey\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"metadata":{"authenticatorData":"0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000","clientDataJSON":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"3q2-7w\\",\\"origin\\":\\"http://localhost\\",\\"crossOrigin\\":false}"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing signature.r', () => {
      const invalid = {
        signature: { s: 1n } as any,
        publicKey,
        metadata: {
          authenticatorData: WebAuthnP256.getAuthenticatorData({
            rpId: 'localhost',
          }),
          clientDataJSON: WebAuthnP256.getClientDataJSON({
            challenge: '0xdeadbeef',
            origin: 'http://localhost',
          }),
        },
        type: 'webAuthn' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`signature.r\`.

        Provided: {"signature":{"s":"1#__bigint"},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"metadata":{"authenticatorData":"0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000","clientDataJSON":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"3q2-7w\\",\\"origin\\":\\"http://localhost\\",\\"crossOrigin\\":false}"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing signature.s', () => {
      const invalid = {
        signature: { r: 1n } as any,
        publicKey,
        metadata: {
          authenticatorData: WebAuthnP256.getAuthenticatorData({
            rpId: 'localhost',
          }),
          clientDataJSON: WebAuthnP256.getClientDataJSON({
            challenge: '0xdeadbeef',
            origin: 'http://localhost',
          }),
        },
        type: 'webAuthn' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`signature.s\`.

        Provided: {"signature":{"r":"1#__bigint"},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"metadata":{"authenticatorData":"0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000","clientDataJSON":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"3q2-7w\\",\\"origin\\":\\"http://localhost\\",\\"crossOrigin\\":false}"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing metadata.authenticatorData', () => {
      const invalid = {
        signature: p256Signature,
        publicKey,
        metadata: {
          clientDataJSON: WebAuthnP256.getClientDataJSON({
            challenge: '0xdeadbeef',
            origin: 'http://localhost',
          }),
        } as any,
        type: 'webAuthn' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`metadata.authenticatorData\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"metadata":{"clientDataJSON":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"3q2-7w\\",\\"origin\\":\\"http://localhost\\",\\"crossOrigin\\":false}"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing metadata.clientDataJSON', () => {
      const invalid = {
        signature: p256Signature,
        publicKey,
        metadata: {
          authenticatorData: WebAuthnP256.getAuthenticatorData({
            rpId: 'localhost',
          }),
        } as any,
        type: 'webAuthn' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`metadata.clientDataJSON\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"prefix":4,"x":"78495282704852028275327922540131762143565388050940484317945369745559774511861#__bigint","y":"8109764566587999957624872393871720746996669263962991155166704261108473113504#__bigint"},"metadata":{"authenticatorData":"0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing publicKey.x', () => {
      const invalid = {
        signature: p256Signature,
        publicKey: { y: 1n } as any,
        metadata: {
          authenticatorData: WebAuthnP256.getAuthenticatorData({
            rpId: 'localhost',
          }),
          clientDataJSON: WebAuthnP256.getClientDataJSON({
            challenge: '0xdeadbeef',
            origin: 'http://localhost',
          }),
        },
        type: 'webAuthn' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`publicKey.x\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"y":"1#__bigint"},"metadata":{"authenticatorData":"0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000","clientDataJSON":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"3q2-7w\\",\\"origin\\":\\"http://localhost\\",\\"crossOrigin\\":false}"},"type":"webAuthn"}]
      `,
      )
    })

    test('error: throws on missing publicKey.y', () => {
      const invalid = {
        signature: p256Signature,
        publicKey: { x: 1n } as any,
        metadata: {
          authenticatorData: WebAuthnP256.getAuthenticatorData({
            rpId: 'localhost',
          }),
          clientDataJSON: WebAuthnP256.getClientDataJSON({
            challenge: '0xdeadbeef',
            origin: 'http://localhost',
          }),
        },
        type: 'webAuthn' as const,
      }
      expect(() =>
        SignatureEnvelope.assert(invalid),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.MissingPropertiesError: Signature envelope of type "webAuthn" is missing required properties: \`publicKey.y\`.

        Provided: {"signature":{"r":"92602584010956101470289867944347135737570451066466093224269890121909314569518#__bigint","s":"54171125190222965779385658110416711469231271457324878825831748147306957269813#__bigint","yParity":0},"publicKey":{"x":"1#__bigint"},"metadata":{"authenticatorData":"0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000","clientDataJSON":"{\\"type\\":\\"webauthn.get\\",\\"challenge\\":\\"3q2-7w\\",\\"origin\\":\\"http://localhost\\",\\"crossOrigin\\":false}"},"type":"webAuthn"}]
      `,
      )
    })
  })

  describe('keychain', () => {
    test('behavior: validates valid keychain with secp256k1 inner', () => {
      expect(() =>
        SignatureEnvelope.assert(signature_keychain_secp256k1),
      ).not.toThrow()
    })

    test('behavior: validates valid keychain with p256 inner', () => {
      expect(() =>
        SignatureEnvelope.assert(signature_keychain_p256),
      ).not.toThrow()
    })

    test('behavior: validates valid keychain with webAuthn inner', () => {
      expect(() =>
        SignatureEnvelope.assert(signature_keychain_webauthn),
      ).not.toThrow()
    })

    test('behavior: validates keychain without explicit type', () => {
      const { type: _, ...signatureWithoutType } = signature_keychain_secp256k1
      expect(() => SignatureEnvelope.assert(signatureWithoutType)).not.toThrow()
    })

    test('error: throws on invalid inner signature', () => {
      expect(() =>
        SignatureEnvelope.assert({
          userAddress: '0x1234567890123456789012345678901234567890',
          inner: SignatureEnvelope.from({
            r: 0n,
            s: 0n,
            yParity: 2,
          }),
          type: 'keychain',
        } as any),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Signature.InvalidYParityError: Value \`2\` is an invalid y-parity value. Y-parity must be 0 or 1.]`,
      )
    })
  })

  test('error: throws on invalid envelope', () => {
    expect(() =>
      SignatureEnvelope.assert({} as any),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.CoercionError: Unable to coerce value (\`{}\`) to a valid signature envelope.]`,
    )
  })

  test('error: throws on incomplete signature', () => {
    expect(() =>
      SignatureEnvelope.assert({
        r: 0n,
        s: 0n,
      } as any),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.CoercionError: Unable to coerce value (\`{"r":"0#__bigint","s":"0#__bigint"}\`) to a valid signature envelope.]`,
    )
  })
})

describe('deserialize', () => {
  describe('secp256k1', () => {
    test('behavior: deserializes valid signature', () => {
      const serialized = Signature.toHex(signature_secp256k1)

      const envelope = SignatureEnvelope.deserialize(serialized)

      expect(envelope).toMatchObject({
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
        type: 'secp256k1',
      })
    })

    test('behavior: deserializes signature with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(
        { signature: signature_secp256k1, type: 'secp256k1' },
        { magic: true },
      )

      const envelope = SignatureEnvelope.deserialize(serialized)

      expect(envelope).toMatchObject({
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
        type: 'secp256k1',
      })
    })

    test('error: throws on invalid size', () => {
      expect(() =>
        SignatureEnvelope.deserialize('0xdeadbeef'),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Unknown signature type identifier: 0xde. Expected 0x01 (P256), 0x02 (WebAuthn), 0x03 (Keychain V1), 0x04 (Keychain V2), or 0x05 (Multisig)

        Serialized: 0xdeadbeef]
      `,
      )
    })

    test('error: throws on invalid yParity', () => {
      // Signature with invalid yParity (must be 0 or 1)
      const invalidSig =
        '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000102'
      expect(() =>
        SignatureEnvelope.deserialize(invalidSig),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Signature.InvalidYParityError: Value \`2\` is an invalid y-parity value. Y-parity must be 0 or 1.]`,
      )
    })
  })

  describe('p256', () => {
    test('behavior: deserializes P256 signature', () => {
      const serialized = SignatureEnvelope.serialize(signature_p256)
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchObject({
        signature: {
          r: signature_p256.signature.r,
          s: signature_p256.signature.s,
        },
        publicKey: {
          x: signature_p256.publicKey.x,
          y: signature_p256.publicKey.y,
        },
        prehash: signature_p256.prehash,
        type: 'p256',
      })
    })

    test('behavior: deserializes P256 signature with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(signature_p256, {
        magic: true,
      })
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchObject({
        signature: {
          r: signature_p256.signature.r,
          s: signature_p256.signature.s,
        },
        publicKey: {
          x: signature_p256.publicKey.x,
          y: signature_p256.publicKey.y,
        },
        prehash: signature_p256.prehash,
        type: 'p256',
      })
    })

    test('error: throws on invalid P256 signature length', () => {
      // P256 signature with wrong length (should be 130 bytes total, but only 100)
      const invalidSig = `0x01${'00'.repeat(100)}` as `0x${string}`
      expect(() =>
        SignatureEnvelope.deserialize(invalidSig),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Invalid P256 signature envelope size: expected 129 bytes, got 100 bytes

        Serialized: 0x0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000]
      `,
      )
    })
  })

  describe('webAuthn', () => {
    test('behavior: deserializes WebAuthn signature', () => {
      const serialized = SignatureEnvelope.serialize(signature_webauthn)
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchObject({
        signature: {
          r: signature_webauthn.signature.r,
          s: signature_webauthn.signature.s,
        },
        publicKey: {
          x: signature_webauthn.publicKey.x,
          y: signature_webauthn.publicKey.y,
        },
        metadata: {
          authenticatorData: signature_webauthn.metadata.authenticatorData,
          clientDataJSON: signature_webauthn.metadata.clientDataJSON,
        },
        type: 'webAuthn',
      })
    })

    test('behavior: deserializes WebAuthn signature with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(signature_webauthn, {
        magic: true,
      })
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchObject({
        signature: {
          r: signature_webauthn.signature.r,
          s: signature_webauthn.signature.s,
        },
        publicKey: {
          x: signature_webauthn.publicKey.x,
          y: signature_webauthn.publicKey.y,
        },
        metadata: {
          authenticatorData: signature_webauthn.metadata.authenticatorData,
          clientDataJSON: signature_webauthn.metadata.clientDataJSON,
        },
        type: 'webAuthn',
      })
    })

    test('error: throws on invalid WebAuthn signature length', () => {
      // WebAuthn signature too short (must be at least 129 bytes: 1 type + 128 signature data)
      const invalidSig = `0x02${'00'.repeat(100)}` as const
      expect(() =>
        SignatureEnvelope.deserialize(invalidSig),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Invalid WebAuthn signature envelope size: expected at least 128 bytes, got 100 bytes

        Serialized: 0x0200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000]
      `,
      )
    })

    test('error: throws on invalid clientDataJSON', () => {
      // Create a signature with invalid JSON (not properly formatted)
      const invalidMetadata = {
        authenticatorData: `0x${'00'.repeat(37)}` as const,
        clientDataJSON: 'not-valid-json',
      }
      const serialized = SignatureEnvelope.serialize({
        ...signature_webauthn,
        metadata: invalidMetadata,
      })

      expect(() =>
        SignatureEnvelope.deserialize(serialized),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Unable to parse WebAuthn metadata: could not extract valid authenticatorData and clientDataJSON

        Serialized: 0x02000000000000000000000000000000000000000000000000000000000000000000000000006e6f742d76616c69642d6a736f6eccbb3485d4726235f13cb15ef394fb7158179fb7b1925eccec0147671090c52e77c3c53373cc1e3b05e7c23f609deb17cea8fe097300c45411237e9fe4166b35ad8ac16e167d6992c3e120d7f17d2376bc1cbcf30c46ba6dd00ce07303e742f511edf6ce1c32de66846f56afa7be1cbd729bc35750b6d0cdcf3ec9d75461aba0]
      `,
      )
    })

    test('error: throws on unknown type identifier', () => {
      const unknownType = `0xff${'00'.repeat(129)}` as const
      expect(() =>
        SignatureEnvelope.deserialize(unknownType),
      ).toThrowErrorMatchingInlineSnapshot(
        `
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Unknown signature type identifier: 0xff. Expected 0x01 (P256), 0x02 (WebAuthn), 0x03 (Keychain V1), 0x04 (Keychain V2), or 0x05 (Multisig)

        Serialized: 0xff000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000]
      `,
      )
    })
  })

  describe('keychain', () => {
    test('behavior: deserializes keychain signature with secp256k1 inner', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_secp256k1,
      )
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchObject({
        userAddress: signature_keychain_secp256k1.userAddress,
        inner: SignatureEnvelope.from(signature_secp256k1),
        type: 'keychain',
      })
    })

    test('behavior: deserializes keychain signature with p256 inner', () => {
      const serialized = SignatureEnvelope.serialize(signature_keychain_p256)
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchInlineSnapshot(`
        {
          "inner": {
            "prehash": true,
            "publicKey": {
              "prefix": 4,
              "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
              "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
            },
            "signature": {
              "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
              "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
            },
            "type": "p256",
          },
          "type": "keychain",
          "userAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          "version": "v2",
        }
      `)
    })

    test('behavior: deserializes keychain signature with webAuthn inner', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_webauthn,
      )
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchInlineSnapshot(`
        {
          "inner": {
            "metadata": {
              "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
              "clientDataJSON": "{"type":"webauthn.get","challenge":"3q2-7w","origin":"http://localhost","crossOrigin":false}",
            },
            "publicKey": {
              "prefix": 4,
              "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
              "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
            },
            "signature": {
              "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
              "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
            },
            "type": "webAuthn",
          },
          "type": "keychain",
          "userAddress": "0xfedcbafedcbafedcbafedcbafedcbafedcbafedc",
          "version": "v2",
        }
      `)
    })

    test('behavior: deserializes keychain signature with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_secp256k1,
        { magic: true },
      )
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized).toMatchObject({
        userAddress: signature_keychain_secp256k1.userAddress,
        inner: SignatureEnvelope.from(signature_secp256k1),
        type: 'keychain',
      })
    })

    test('error: throws on invalid keychain signature length', () => {
      // Keychain signature too short (must be at least 21 bytes: 1 type + 20 address)
      const invalidSig = `0x03${'00'.repeat(10)}` as const
      expect(() =>
        SignatureEnvelope.deserialize(invalidSig),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Hex.SliceOffsetOutOfBoundsError: Slice starting at offset \`20\` is out-of-bounds (size: \`10\`).]`,
      )
    })
  })
})

describe('extractAddress', () => {
  describe('secp256k1', () => {
    test('default', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from(signature)

      expect(
        SignatureEnvelope.extractAddress({ payload, signature: envelope }),
      ).toBe(address)
    })
  })

  describe('p256', () => {
    test('default', () => {
      const privateKey = P256.randomPrivateKey()
      const pk = P256.getPublicKey({ privateKey })
      const address = Address.fromPublicKey(pk)
      const payload = '0xdeadbeef' as const

      const signature = P256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: false,
        publicKey: pk,
        signature,
      })

      expect(
        SignatureEnvelope.extractAddress({ payload, signature: envelope }),
      ).toBe(address)
    })
  })

  describe('webAuthn', () => {
    test('default', () => {
      const address = Address.fromPublicKey(publicKey)

      expect(
        SignatureEnvelope.extractAddress({
          payload: '0xdeadbeef',
          signature: signature_webauthn,
        }),
      ).toBe(address)
    })
  })

  describe('keychain', () => {
    test('default', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const address = Address.fromPublicKey(
        Secp256k1.getPublicKey({ privateKey }),
      )
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: SignatureEnvelope.from(signature),
      })

      expect(
        SignatureEnvelope.extractAddress({ payload, signature: envelope }),
      ).toBe(address)
    })

    test('behavior: root = true returns userAddress', () => {
      expect(
        SignatureEnvelope.extractAddress({
          payload: '0xdeadbeef',
          signature: signature_keychain_secp256k1,
          root: true,
        }),
      ).toBe('0x1234567890123456789012345678901234567890')
    })
  })
})

describe('extractPublicKey', () => {
  describe('secp256k1', () => {
    test('default', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const pk = Secp256k1.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from(signature)

      expect(
        SignatureEnvelope.extractPublicKey({ payload, signature: envelope }),
      ).toEqual(pk)
    })
  })

  describe('p256', () => {
    test('default', () => {
      const privateKey = P256.randomPrivateKey()
      const pk = P256.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = P256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: false,
        publicKey: pk,
        signature,
      })

      expect(
        SignatureEnvelope.extractPublicKey({ payload, signature: envelope }),
      ).toEqual(pk)
    })
  })

  describe('webAuthn', () => {
    test('default', () => {
      expect(
        SignatureEnvelope.extractPublicKey({
          payload: '0xdeadbeef',
          signature: signature_webauthn,
        }),
      ).toEqual(publicKey)
    })
  })

  describe('keychain', () => {
    test('default', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const pk = Secp256k1.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: SignatureEnvelope.from(signature),
      })

      expect(
        SignatureEnvelope.extractPublicKey({ payload, signature: envelope }),
      ).toEqual(pk)
    })
  })
})

describe('from', () => {
  describe('secp256k1', () => {
    test('behavior: coerces from hex string', () => {
      const serialized = Signature.toHex(signature_secp256k1)

      const envelope = SignatureEnvelope.from(serialized)

      expect(envelope).toMatchObject({
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
        type: 'secp256k1',
      })
    })

    test('behavior: returns object as-is', () => {
      const envelope: SignatureEnvelope.SignatureEnvelope = {
        signature: signature_secp256k1,
        type: 'secp256k1',
      }

      const result = SignatureEnvelope.from(envelope)

      expect(result).toEqual(envelope)
    })

    test('behavior: coerces from flat signature', () => {
      const result = SignatureEnvelope.from(signature_secp256k1)

      expect(result).toMatchObject({
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
        type: 'secp256k1',
      })
    })
  })

  describe('p256', () => {
    test('behavior: coerces from hex string', () => {
      const serialized = SignatureEnvelope.serialize(signature_p256)
      const envelope = SignatureEnvelope.from(serialized)

      expect(envelope).toMatchObject({
        signature: {
          r: signature_p256.signature.r,
          s: signature_p256.signature.s,
        },
        type: 'p256',
      })
    })

    test('behavior: adds type to object', () => {
      const { type: _, ...withoutType } = signature_p256
      const envelope = SignatureEnvelope.from(withoutType)

      expect(envelope.type).toBe('p256')
    })
  })

  describe('webAuthn', () => {
    test('behavior: coerces from hex string', () => {
      const serialized = SignatureEnvelope.serialize(signature_webauthn)
      const envelope = SignatureEnvelope.from(serialized)

      expect(envelope).toMatchObject({
        signature: {
          r: signature_webauthn.signature.r,
          s: signature_webauthn.signature.s,
        },
        type: 'webAuthn',
      })
    })

    test('behavior: adds type to object', () => {
      const { type: _, ...withoutType } = signature_webauthn
      const envelope = SignatureEnvelope.from(withoutType)

      expect(envelope.type).toBe('webAuthn')
    })
  })

  describe('keychain', () => {
    test('behavior: coerces from hex string with secp256k1 inner', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_secp256k1,
      )
      const envelope = SignatureEnvelope.from(serialized)

      expect(envelope).toMatchObject({
        userAddress: signature_keychain_secp256k1.userAddress,
        inner: SignatureEnvelope.from(signature_secp256k1),
        type: 'keychain',
      })
    })

    test('behavior: coerces from hex string with p256 inner', () => {
      const serialized = SignatureEnvelope.serialize(signature_keychain_p256)
      const envelope = SignatureEnvelope.from(serialized)

      expect(envelope).toMatchObject({
        userAddress: signature_keychain_p256.userAddress,
        type: 'keychain',
      })
    })

    test('behavior: adds type to object', () => {
      const { type: _, ...withoutType } = signature_keychain_secp256k1
      const envelope = SignatureEnvelope.from(withoutType)

      expect(envelope.type).toBe('keychain')
    })

    test('behavior: computes keyId from p256 inner publicKey', () => {
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: signature_p256,
      })

      expect(envelope.keyId).toBe(Address.fromPublicKey(publicKey))
    })

    test('behavior: computes keyId from webAuthn inner publicKey', () => {
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: signature_webauthn,
      })

      expect(envelope.keyId).toBe(Address.fromPublicKey(publicKey))
    })

    test('behavior: computes keyId from secp256k1 inner with payload', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const accessKeyPublicKey = Secp256k1.getPublicKey({ privateKey })
      const payload = '0xdeadbeef'
      const sig = Secp256k1.sign({ payload, privateKey })

      const envelope = SignatureEnvelope.from(
        {
          userAddress: '0x1234567890123456789012345678901234567890',
          inner: SignatureEnvelope.from(sig),
        },
        { payload },
      )

      expect(envelope.keyId).toBe(Address.fromPublicKey(accessKeyPublicKey))
    })

    test('behavior: does not compute keyId for secp256k1 without payload', () => {
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: SignatureEnvelope.from(signature_secp256k1),
      })

      expect(envelope.keyId).toBeUndefined()
    })

    test('behavior: preserves explicit keyId', () => {
      const explicitKeyId = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: signature_p256,
        keyId: explicitKeyId,
      })

      expect(envelope.keyId).toBe(explicitKeyId)
    })
  })

  describe('multisig', () => {
    const config = MultisigConfig.from({
      owners: [
        {
          owner: '0x1111111111111111111111111111111111111111',
          weight: 1,
        },
      ],
      threshold: 1,
    })

    test('behavior: derives an initial account from config', () => {
      const envelope = SignatureEnvelope.from({
        config,
        signatures: [SignatureEnvelope.from(signature_secp256k1)],
      })

      expect(envelope).toMatchInlineSnapshot(
        {
          signatures: [
            {
              signature: {
                r: expect.anything(),
                s: expect.anything(),
                yParity: expect.any(Number),
              },
            },
          ],
        },
        `
        {
          "account": "0xf4b916c5aea0fb199bd942389be00db0690c961f",
          "config": {
            "owners": [
              {
                "owner": "0x1111111111111111111111111111111111111111",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 1,
            "version": 0n,
          },
          "signatures": [
            {
              "signature": {
                "r": Anything,
                "s": Anything,
                "yParity": Any<Number>,
              },
              "type": "secp256k1",
            },
          ],
          "type": "multisig",
        }
      `,
      )
    })

    test('behavior: accepts an explicit account for a current config', () => {
      const envelope = SignatureEnvelope.from({
        account: '0x2222222222222222222222222222222222222222',
        config: { ...config, version: 1 },
        signatures: [SignatureEnvelope.from(signature_secp256k1)],
      })

      expect(envelope.account).toBe(
        '0x2222222222222222222222222222222222222222',
      )
      expect(envelope.config.version).toBe(1n)
    })

    test('error: requires an account for a current config', () => {
      expect(() =>
        SignatureEnvelope.from({
          config: { ...config, version: 1n },
          signatures: [SignatureEnvelope.from(signature_secp256k1)],
        } as never),
      ).toThrowErrorMatchingInlineSnapshot(
        `[MultisigConfig.InvalidConfigError: Invalid native multisig config: account address requires version zero.]`,
      )
    })
  })
})

describe('getType', () => {
  describe('secp256k1', () => {
    test('behavior: returns explicit type', () => {
      const envelope: SignatureEnvelope.SignatureEnvelope = {
        signature: { r: 0n, s: 0n, yParity: 0 },
        type: 'secp256k1',
      }

      expect(SignatureEnvelope.getType(envelope)).toBe('secp256k1')
    })

    test('behavior: infers type from properties', () => {
      expect(
        SignatureEnvelope.getType({ signature: signature_secp256k1 }),
      ).toBe('secp256k1')
    })

    test('behavior: infers type from flat signature', () => {
      const signature = { r: 0n, s: 0n, yParity: 0 }
      expect(SignatureEnvelope.getType(signature)).toBe('secp256k1')
    })
  })

  describe('p256', () => {
    test('behavior: returns explicit type', () => {
      expect(SignatureEnvelope.getType(signature_p256)).toBe('p256')
    })

    test('behavior: infers type from properties', () => {
      const { type: _, ...signatureWithoutType } = signature_p256
      expect(SignatureEnvelope.getType(signatureWithoutType)).toBe('p256')
    })
  })

  describe('webAuthn', () => {
    test('behavior: returns explicit type', () => {
      expect(SignatureEnvelope.getType(signature_webauthn)).toBe('webAuthn')
    })

    test('behavior: infers type from properties', () => {
      const { type: _, ...signatureWithoutType } = signature_webauthn
      expect(SignatureEnvelope.getType(signatureWithoutType)).toBe('webAuthn')
    })
  })

  describe('keychain', () => {
    test('behavior: returns explicit type', () => {
      expect(SignatureEnvelope.getType(signature_keychain_secp256k1)).toBe(
        'keychain',
      )
    })

    test('behavior: infers type from properties', () => {
      const { type: _, ...signatureWithoutType } = signature_keychain_secp256k1
      expect(SignatureEnvelope.getType(signatureWithoutType)).toBe('keychain')
    })

    test('behavior: infers type for keychain with p256 inner', () => {
      const { type: _, ...signatureWithoutType } = signature_keychain_p256
      expect(SignatureEnvelope.getType(signatureWithoutType)).toBe('keychain')
    })

    test('behavior: infers type for keychain with webAuthn inner', () => {
      const { type: _, ...signatureWithoutType } = signature_keychain_webauthn
      expect(SignatureEnvelope.getType(signatureWithoutType)).toBe('keychain')
    })
  })

  test('error: throws on invalid envelope', () => {
    expect(() =>
      SignatureEnvelope.getType({} as any),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.CoercionError: Unable to coerce value (\`{}\`) to a valid signature envelope.]`,
    )
  })

  test('error: throws on incomplete signature', () => {
    expect(() =>
      SignatureEnvelope.getType({
        r: 0n,
        s: 0n,
      } as any),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.CoercionError: Unable to coerce value (\`{"r":"0#__bigint","s":"0#__bigint"}\`) to a valid signature envelope.]`,
    )
  })
})

describe('serialize', () => {
  describe('secp256k1', () => {
    test('behavior: serializes with explicit type', () => {
      const envelope: SignatureEnvelope.SignatureEnvelope = {
        signature: signature_secp256k1,
        type: 'secp256k1',
      }

      const serialized = SignatureEnvelope.serialize(envelope)

      expect(serialized).toBe(Signature.toHex(signature_secp256k1))
    })

    test('behavior: serializes without explicit type', () => {
      const serialized = SignatureEnvelope.serialize({
        signature: signature_secp256k1,
        type: 'secp256k1',
      })

      expect(serialized).toBe(Signature.toHex(signature_secp256k1))
    })

    test('behavior: serializes with magic identifier', () => {
      const envelope: SignatureEnvelope.SignatureEnvelope = {
        signature: signature_secp256k1,
        type: 'secp256k1',
      }

      const serialized = SignatureEnvelope.serialize(envelope, { magic: true })

      expect(serialized.endsWith(SignatureEnvelope.magicBytes.slice(2))).toBe(
        true,
      )
      expect(Hex.size(serialized)).toBe(65 + 32) // signature + magic identifier
    })
  })

  describe('p256', () => {
    test('behavior: serializes P256 signature with type identifier', () => {
      const serialized = SignatureEnvelope.serialize(signature_p256)

      // Should be 130 bytes: 1 (type) + 32 (r) + 32 (s) + 32 (pubKeyX) + 32 (pubKeyY) + 1 (prehash)
      expect(serialized.length).toBe(2 + 130 * 2) // 2 for '0x' prefix + 130 bytes * 2 hex chars

      // First byte should be P256 type identifier (0x01)
      expect(serialized.slice(0, 4)).toBe('0x01')
    })

    test('behavior: serializes prehash flag correctly', () => {
      const withPreHashFalse = { ...signature_p256, prehash: false }
      const serialized = SignatureEnvelope.serialize(withPreHashFalse)

      // Last byte should be 0x00 for false
      expect(serialized.slice(-2)).toBe('00')
    })

    test('behavior: serializes with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(signature_p256, {
        magic: true,
      })

      expect(serialized.endsWith(SignatureEnvelope.magicBytes.slice(2))).toBe(
        true,
      )
      expect(Hex.size(serialized)).toBe(130 + 32) // signature + magic identifier
    })
  })

  describe('webAuthn', () => {
    test('behavior: serializes WebAuthn signature with type identifier', () => {
      const serialized = SignatureEnvelope.serialize(signature_webauthn)

      // Should be: 1 (type) + authenticatorData.length + clientDataJSON.length + 128 (signature components)
      const authDataLength =
        (signature_webauthn.metadata.authenticatorData.length - 2) / 2
      const clientDataLength = signature_webauthn.metadata.clientDataJSON.length
      const expectedLength =
        2 + (1 + authDataLength + clientDataLength + 128) * 2

      expect(serialized.length).toBe(expectedLength)

      // First byte should be WebAuthn type identifier (0x02)
      expect(serialized.slice(0, 4)).toBe('0x02')
    })

    test('behavior: preserves metadata', () => {
      const serialized = SignatureEnvelope.serialize(signature_webauthn)
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized.metadata?.authenticatorData).toBe(
        signature_webauthn.metadata.authenticatorData,
      )
      expect(deserialized.metadata?.clientDataJSON).toBe(
        signature_webauthn.metadata.clientDataJSON,
      )
    })

    test('behavior: serializes with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(signature_webauthn, {
        magic: true,
      })

      expect(serialized.endsWith(SignatureEnvelope.magicBytes.slice(2))).toBe(
        true,
      )

      const authDataLength =
        (signature_webauthn.metadata.authenticatorData.length - 2) / 2
      const clientDataLength = signature_webauthn.metadata.clientDataJSON.length
      const expectedSize = 1 + authDataLength + clientDataLength + 128 + 32 // type + data + signature components + magic

      expect(Hex.size(serialized)).toBe(expectedSize)
    })
  })

  describe('keychain', () => {
    test('behavior: serializes keychain signature with secp256k1 inner and type identifier', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_secp256k1,
      )

      // Should be: 1 (type) + 20 (address) + 65 (secp256k1 signature)
      expect(Hex.size(serialized)).toBe(1 + 20 + 65)

      // First byte should be Keychain V2 type identifier (0x04)
      expect(Hex.slice(serialized, 0, 1)).toBe('0x04')

      // Next 20 bytes should be the user address (without '0x')
      expect(Hex.slice(serialized, 1, 21)).toBe(
        signature_keychain_secp256k1.userAddress,
      )
    })

    test('behavior: serializes keychain signature with p256 inner', () => {
      const serialized = SignatureEnvelope.serialize(signature_keychain_p256)

      // Should be: 1 (type) + 20 (address) + 130 (p256 signature with type)
      expect(Hex.size(serialized)).toBe(1 + 20 + 130)

      // First byte should be Keychain V2 type identifier (0x04)
      expect(Hex.slice(serialized, 0, 1)).toBe('0x04')

      // Next 20 bytes should be the user address (without '0x')
      expect(Hex.slice(serialized, 1, 21)).toBe(
        signature_keychain_p256.userAddress,
      )

      // Next 130 bytes should be the p256 signature
      expect(Hex.slice(serialized, 21, 151)).toBe(
        SignatureEnvelope.serialize(signature_p256),
      )
    })

    test('behavior: serializes keychain signature with webAuthn inner', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_webauthn,
      )

      // First byte should be Keychain V2 type identifier (0x04)
      expect(Hex.slice(serialized, 0, 1)).toBe('0x04')

      // Should contain the user address
      expect(Hex.slice(serialized, 1, 21)).toBe(
        signature_keychain_webauthn.userAddress,
      )

      // Next N bytes should be the webAuthn signature
      expect(Hex.slice(serialized, 21)).toBe(
        SignatureEnvelope.serialize(signature_webauthn),
      )
    })

    test('behavior: preserves userAddress and inner signature', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_secp256k1,
      )
      const deserialized = SignatureEnvelope.deserialize(serialized)

      expect(deserialized.userAddress).toBe(
        signature_keychain_secp256k1.userAddress,
      )
      expect(deserialized.inner).toMatchObject({
        type: 'secp256k1',
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
      })
    })

    test('behavior: serializes with magic identifier', () => {
      const serialized = SignatureEnvelope.serialize(
        signature_keychain_secp256k1,
        { magic: true },
      )

      expect(serialized.endsWith(SignatureEnvelope.magicBytes.slice(2))).toBe(
        true,
      )
      expect(Hex.size(serialized)).toBe(1 + 20 + 65 + 32) // type + address + secp256k1 + magic
    })
  })

  describe('roundtrip', () => {
    describe('secp256k1', () => {
      test('behavior: roundtrips serialize -> deserialize', () => {
        const envelope: SignatureEnvelope.Secp256k1 = {
          signature: signature_secp256k1,
          type: 'secp256k1',
        }

        const serialized = SignatureEnvelope.serialize(envelope)
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          signature: {
            r: signature_secp256k1.r,
            s: signature_secp256k1.s,
            yParity: signature_secp256k1.yParity,
          },
          type: 'secp256k1',
        })
      })

      test('behavior: roundtrips serialize with magic -> deserialize', () => {
        const envelope: SignatureEnvelope.Secp256k1 = {
          signature: signature_secp256k1,
          type: 'secp256k1',
        }

        const serialized = SignatureEnvelope.serialize(envelope, {
          magic: true,
        })
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          signature: {
            r: signature_secp256k1.r,
            s: signature_secp256k1.s,
            yParity: signature_secp256k1.yParity,
          },
          type: 'secp256k1',
        })
      })
    })

    describe('p256', () => {
      test('behavior: roundtrips serialize -> deserialize', () => {
        const serialized = SignatureEnvelope.serialize(signature_p256)
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          signature: {
            r: signature_p256.signature.r,
            s: signature_p256.signature.s,
          },
          publicKey: {
            x: signature_p256.publicKey.x,
            y: signature_p256.publicKey.y,
          },
          prehash: signature_p256.prehash,
          type: 'p256',
        })
      })

      test('behavior: handles prehash=false', () => {
        const signature = { ...signature_p256, prehash: false }
        const serialized = SignatureEnvelope.serialize(signature)
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized.prehash).toBe(false)
      })

      test('behavior: roundtrips serialize with magic -> deserialize', () => {
        const serialized = SignatureEnvelope.serialize(signature_p256, {
          magic: true,
        })
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          signature: {
            r: signature_p256.signature.r,
            s: signature_p256.signature.s,
          },
          publicKey: {
            x: signature_p256.publicKey.x,
            y: signature_p256.publicKey.y,
          },
          prehash: signature_p256.prehash,
          type: 'p256',
        })
      })
    })

    describe('webAuthn', () => {
      test('behavior: roundtrips serialize -> deserialize', () => {
        const serialized = SignatureEnvelope.serialize(signature_webauthn)
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          signature: {
            r: signature_webauthn.signature.r,
            s: signature_webauthn.signature.s,
          },
          publicKey: {
            x: signature_webauthn.publicKey.x,
            y: signature_webauthn.publicKey.y,
          },
          metadata: {
            authenticatorData: signature_webauthn.metadata.authenticatorData,
            clientDataJSON: signature_webauthn.metadata.clientDataJSON,
          },
          type: 'webAuthn',
        })
      })

      test('behavior: handles variable-length clientDataJSON', () => {
        const longClientData = JSON.stringify({
          type: 'webAuthn.get',
          challenge: 'a'.repeat(100),
          origin: 'https://example.com',
        })

        const signatureWithLongData = {
          ...signature_webauthn,
          metadata: {
            ...signature_webauthn.metadata,
            clientDataJSON: longClientData,
          },
        }

        const serialized = SignatureEnvelope.serialize(signatureWithLongData)
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized.metadata?.clientDataJSON).toBe(longClientData)
      })

      test('behavior: roundtrips serialize with magic -> deserialize', () => {
        const serialized = SignatureEnvelope.serialize(signature_webauthn, {
          magic: true,
        })
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          signature: {
            r: signature_webauthn.signature.r,
            s: signature_webauthn.signature.s,
          },
          publicKey: {
            x: signature_webauthn.publicKey.x,
            y: signature_webauthn.publicKey.y,
          },
          metadata: {
            authenticatorData: signature_webauthn.metadata.authenticatorData,
            clientDataJSON: signature_webauthn.metadata.clientDataJSON,
          },
          type: 'webAuthn',
        })
      })
    })

    describe('keychain', () => {
      test('behavior: roundtrips serialize -> deserialize with secp256k1 inner', () => {
        const serialized = SignatureEnvelope.serialize(
          signature_keychain_secp256k1,
        )
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject(signature_keychain_secp256k1)
      })

      test('behavior: roundtrips serialize -> deserialize with p256 inner', () => {
        const serialized = SignatureEnvelope.serialize(signature_keychain_p256)
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchInlineSnapshot(`
          {
            "inner": {
              "prehash": true,
              "publicKey": {
                "prefix": 4,
                "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
                "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
              },
              "signature": {
                "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
                "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
              },
              "type": "p256",
            },
            "type": "keychain",
            "userAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
            "version": "v2",
          }
        `)
      })

      test('behavior: roundtrips serialize -> deserialize with webAuthn inner', () => {
        const serialized = SignatureEnvelope.serialize(
          signature_keychain_webauthn,
        )
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchInlineSnapshot(`
          {
            "inner": {
              "metadata": {
                "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
                "clientDataJSON": "{"type":"webauthn.get","challenge":"3q2-7w","origin":"http://localhost","crossOrigin":false}",
              },
              "publicKey": {
                "prefix": 4,
                "x": 78495282704852028275327922540131762143565388050940484317945369745559774511861n,
                "y": 8109764566587999957624872393871720746996669263962991155166704261108473113504n,
              },
              "signature": {
                "r": 92602584010956101470289867944347135737570451066466093224269890121909314569518n,
                "s": 54171125190222965779385658110416711469231271457324878825831748147306957269813n,
              },
              "type": "webAuthn",
            },
            "type": "keychain",
            "userAddress": "0xfedcbafedcbafedcbafedcbafedcbafedcbafedc",
            "version": "v2",
          }
        `)
      })

      test('behavior: roundtrips serialize with magic -> deserialize with secp256k1 inner', () => {
        const serialized = SignatureEnvelope.serialize(
          signature_keychain_secp256k1,
          { magic: true },
        )
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject(signature_keychain_secp256k1)
      })

      test('behavior: roundtrips serialize with magic -> deserialize with p256 inner', () => {
        const serialized = SignatureEnvelope.serialize(
          signature_keychain_p256,
          { magic: true },
        )
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          type: 'keychain',
          userAddress: signature_keychain_p256.userAddress,
          inner: {
            type: 'p256',
            prehash: signature_p256.prehash,
            publicKey: {
              x: signature_p256.publicKey.x,
              y: signature_p256.publicKey.y,
            },
            signature: {
              r: signature_p256.signature.r,
              s: signature_p256.signature.s,
            },
          },
        })
      })

      test('behavior: roundtrips serialize with magic -> deserialize with webAuthn inner', () => {
        const serialized = SignatureEnvelope.serialize(
          signature_keychain_webauthn,
          { magic: true },
        )
        const deserialized = SignatureEnvelope.deserialize(serialized)

        expect(deserialized).toMatchObject({
          type: 'keychain',
          userAddress: signature_keychain_webauthn.userAddress,
          inner: {
            type: 'webAuthn',
            metadata: {
              authenticatorData: signature_webauthn.metadata.authenticatorData,
              clientDataJSON: signature_webauthn.metadata.clientDataJSON,
            },
            publicKey: {
              x: signature_webauthn.publicKey.x,
              y: signature_webauthn.publicKey.y,
            },
            signature: {
              r: signature_webauthn.signature.r,
              s: signature_webauthn.signature.s,
            },
          },
        })
      })
    })
  })

  test('error: throws on invalid envelope', () => {
    const error = (() => {
      try {
        SignatureEnvelope.serialize({} as any)
        return
      } catch (e) {
        return e
      }
    })() as SignatureEnvelope.CoercionError
    expect(error).toBeInstanceOf(SignatureEnvelope.CoercionError)
    expect(error.message).toMatchInlineSnapshot(
      `"Unable to coerce value (\`{}\`) to a valid signature envelope."`,
    )
  })
})

describe('sortMultisigApprovals', () => {
  const ownerKeys = Array.from({ length: 3 }, () => {
    const privateKey = Secp256k1.randomPrivateKey()
    const address = Address.fromPublicKey(
      Secp256k1.getPublicKey({ privateKey }),
    )
    return { address, privateKey } as const
  })
  const ascendingOwners = [...ownerKeys].sort((a, b) =>
    Hex.toBigInt(a.address) < Hex.toBigInt(b.address) ? -1 : 1,
  )

  const config = MultisigConfig.from({
    owners: ascendingOwners.map((o) => ({ owner: o.address, weight: 1 })),
    threshold: 2,
  })
  const account = MultisigConfig.getAddress(config)
  const payload = `0x${'42'.repeat(32)}` as const
  const digest = MultisigConfig.getSignPayload({
    account,
    config,
    payload,
  })

  const owners = ownerKeys.map((owner) => ({
    address: owner.address,
    signature: SignatureEnvelope.from(
      Secp256k1.sign({ payload: digest, privateKey: owner.privateKey }),
    ),
  }))
  const ascending = ascendingOwners.map((o) => ({
    address: o.address,
    signature: owners.find((x) => x.address === o.address)!.signature,
  }))

  test('behavior: orders approvals ascending by recovered owner address', () => {
    const ordered = SignatureEnvelope.sortMultisigApprovals({
      account,
      config,
      payload,
      // Provide approvals in reverse of the canonical order.
      signatures: [...ascending].reverse().map((owner) => owner.signature),
    })
    expect(ordered).toEqual(ascending.map((owner) => owner.signature))
  })

  test('behavior: already-sorted input is unchanged', () => {
    const signatures = ascending.map((owner) => owner.signature)
    expect(
      SignatureEnvelope.sortMultisigApprovals({
        account,
        config,
        payload,
        signatures,
      }),
    ).toEqual(signatures)
  })

  test('behavior: recovered order matches the config owner order', () => {
    const ordered = SignatureEnvelope.sortMultisigApprovals({
      account,
      config,
      payload,
      signatures: owners.map((owner) => owner.signature),
    })
    const recovered = ordered.map((signature) =>
      SignatureEnvelope.extractAddress({ payload: digest, signature }),
    )
    expect(recovered).toEqual(ascending.map((owner) => owner.address))
  })
})

describe('validate', () => {
  describe('secp256k1', () => {
    test('behavior: returns true for valid signature', () => {
      expect(
        SignatureEnvelope.validate({
          signature: signature_secp256k1,
          type: 'secp256k1',
        }),
      ).toBe(true)
    })

    test('behavior: returns true for signature without explicit type', () => {
      expect(
        SignatureEnvelope.validate({ signature: signature_secp256k1 }),
      ).toBe(true)
    })

    test('behavior: returns false for invalid signature values', () => {
      expect(
        SignatureEnvelope.validate({
          signature: {
            r: 0n,
            s: 0n,
            yParity: 2,
          },
          type: 'secp256k1',
        }),
      ).toBe(false)
    })
  })

  describe('p256', () => {
    test('behavior: returns true for valid P256 signature', () => {
      expect(SignatureEnvelope.validate(signature_p256)).toBe(true)
    })

    test('behavior: returns false for invalid P256 signature', () => {
      expect(
        SignatureEnvelope.validate({
          ...signature_p256,
          prehash: 'invalid' as any,
        }),
      ).toBe(false)
    })
  })

  describe('webAuthn', () => {
    test('behavior: returns true for valid WebAuthn signature', () => {
      expect(SignatureEnvelope.validate(signature_webauthn)).toBe(true)
    })

    test('behavior: returns false for invalid WebAuthn signature', () => {
      const { metadata: _, ...withoutMetadata } = signature_webauthn
      expect(SignatureEnvelope.validate(withoutMetadata as any)).toBe(false)
    })
  })

  describe('keychain', () => {
    test('behavior: returns true for valid keychain with secp256k1 inner', () => {
      expect(SignatureEnvelope.validate(signature_keychain_secp256k1)).toBe(
        true,
      )
    })

    test('behavior: returns true for valid keychain with p256 inner', () => {
      expect(SignatureEnvelope.validate(signature_keychain_p256)).toBe(true)
    })

    test('behavior: returns true for valid keychain with webAuthn inner', () => {
      expect(SignatureEnvelope.validate(signature_keychain_webauthn)).toBe(true)
    })

    test('behavior: returns false for invalid keychain signature', () => {
      expect(
        SignatureEnvelope.validate({
          userAddress: '0x1234567890123456789012345678901234567890',
          inner: {
            signature: {
              r: 0n,
              s: 0n,
              yParity: 2,
            },
            type: 'secp256k1',
          },
          type: 'keychain',
        } as any),
      ).toBe(false)
    })
  })

  test('behavior: returns false for invalid envelope', () => {
    expect(SignatureEnvelope.validate({} as any)).toBe(false)
  })

  test('behavior: returns false for incomplete signature', () => {
    expect(
      SignatureEnvelope.validate({
        r: 0n,
        s: 0n,
      } as any),
    ).toBe(false)
  })
})

describe('verify', () => {
  describe('secp256k1', () => {
    test('behavior: verifies valid signature with publicKey', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const publicKey = Secp256k1.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from(signature)

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey,
        }),
      ).toBe(true)
    })

    test('behavior: verifies valid signature with address', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const publicKey = Secp256k1.getPublicKey({ privateKey })
      const address = Address.fromPublicKey(publicKey)
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from(signature)

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          address,
        }),
      ).toBe(true)
    })

    test('behavior: returns false for wrong publicKey', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const wrongPrivateKey = Secp256k1.randomPrivateKey()
      const wrongPublicKey = Secp256k1.getPublicKey({
        privateKey: wrongPrivateKey,
      })
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from(signature)

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey: wrongPublicKey,
        }),
      ).toBe(false)
    })

    test('behavior: returns false for wrong payload', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const publicKey = Secp256k1.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from(signature)

      expect(
        SignatureEnvelope.verify(envelope, {
          payload: '0xcafebabe',
          publicKey,
        }),
      ).toBe(false)
    })
  })

  describe('p256', () => {
    test('behavior: verifies valid signature with publicKey', () => {
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = P256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: false,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey,
        }),
      ).toBe(true)
    })

    test('behavior: verifies valid signature with address', () => {
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const address = Address.fromPublicKey(publicKey)
      const payload = '0xdeadbeef' as const

      const signature = P256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: false,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          address,
        }),
      ).toBe(true)
    })

    test('behavior: returns false for mismatched publicKey', () => {
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const wrongPrivateKey = P256.randomPrivateKey()
      const wrongPublicKey = P256.getPublicKey({ privateKey: wrongPrivateKey })
      const payload = '0xdeadbeef' as const

      const signature = P256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: false,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey: wrongPublicKey,
        }),
      ).toBe(false)
    })

    test('behavior: returns false for wrong payload', () => {
      const privateKey = P256.randomPrivateKey()
      const publicKey = P256.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = P256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: false,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload: '0xcafebabe',
          publicKey,
        }),
      ).toBe(false)
    })
  })

  describe('webCryptoP256', () => {
    test('behavior: verifies valid signature with publicKey', async () => {
      const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
      const payload = '0xdeadbeef' as const

      const signature = await WebCryptoP256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: true,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey,
        }),
      ).toBe(true)
    })

    test('behavior: verifies valid signature with address', async () => {
      const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
      const address = Address.fromPublicKey(publicKey)
      const payload = '0xdeadbeef' as const

      const signature = await WebCryptoP256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: true,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          address,
        }),
      ).toBe(true)
    })

    test('behavior: returns false for mismatched publicKey', async () => {
      const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
      const { publicKey: wrongPublicKey } = await WebCryptoP256.createKeyPair()
      const payload = '0xdeadbeef' as const

      const signature = await WebCryptoP256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: true,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey: wrongPublicKey,
        }),
      ).toBe(false)
    })

    test('behavior: returns false for wrong payload', async () => {
      const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
      const payload = '0xdeadbeef' as const

      const signature = await WebCryptoP256.sign({ payload, privateKey })
      const envelope = SignatureEnvelope.from({
        prehash: true,
        publicKey,
        signature,
      })

      expect(
        SignatureEnvelope.verify(envelope, {
          payload: '0xcafebabe',
          publicKey,
        }),
      ).toBe(false)
    })
  })

  describe('webAuthn', () => {
    test('behavior: returns false for mismatched publicKey', () => {
      const wrongPrivateKey = P256.randomPrivateKey()
      const wrongPublicKey = P256.getPublicKey({ privateKey: wrongPrivateKey })
      const payload = '0xdeadbeef' as const

      expect(
        SignatureEnvelope.verify(signature_webauthn, {
          payload,
          publicKey: wrongPublicKey,
        }),
      ).toBe(false)
    })

    test('behavior: returns false for mismatched address', () => {
      const wrongPrivateKey = P256.randomPrivateKey()
      const wrongPublicKey = P256.getPublicKey({ privateKey: wrongPrivateKey })
      const wrongAddress = Address.fromPublicKey(wrongPublicKey)
      const payload = '0xdeadbeef' as const

      expect(
        SignatureEnvelope.verify(signature_webauthn, {
          payload,
          address: wrongAddress,
        }),
      ).toBe(false)
    })
  })

  describe('keychain', () => {
    test('error: throws for keychain signatures', () => {
      const privateKey = Secp256k1.randomPrivateKey()
      const secp256k1PublicKey = Secp256k1.getPublicKey({ privateKey })
      const payload = '0xdeadbeef' as const

      const signature = Secp256k1.sign({ payload, privateKey })
      const innerEnvelope = SignatureEnvelope.from(signature)
      const envelope = SignatureEnvelope.from({
        userAddress: '0x1234567890123456789012345678901234567890',
        inner: innerEnvelope,
      })

      expect(() =>
        SignatureEnvelope.verify(envelope, {
          payload,
          publicKey: secp256k1PublicKey,
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `[SignatureEnvelope.VerificationError: Unable to verify signature envelope of type "keychain".]`,
      )
    })
  })
})

describe('fromRpc', () => {
  describe('secp256k1', () => {
    test('behavior: converts RPC secp256k1 signature', () => {
      const rpc: SignatureEnvelope.Secp256k1Rpc = {
        r: Signature.toRpc(signature_secp256k1).r,
        s: Signature.toRpc(signature_secp256k1).s,
        yParity: Signature.toRpc(signature_secp256k1).yParity,
        type: 'secp256k1',
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope).toMatchObject({
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
        type: 'secp256k1',
      })
    })
  })

  describe('p256', () => {
    test('behavior: converts RPC P256 signature', () => {
      const rpc: SignatureEnvelope.P256Rpc = {
        preHash: true,
        pubKeyX: Hex.fromNumber(publicKey.x, { size: 32 }),
        pubKeyY: Hex.fromNumber(publicKey.y, { size: 32 }),
        r: Hex.fromNumber(p256Signature.r, { size: 32 }),
        s: Hex.fromNumber(p256Signature.s, { size: 32 }),
        type: 'p256',
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope).toMatchObject({
        prehash: true,
        publicKey: {
          x: publicKey.x,
          y: publicKey.y,
        },
        signature: {
          r: p256Signature.r,
          s: p256Signature.s,
        },
        type: 'p256',
      })
    })
  })

  describe('webAuthn', () => {
    test('behavior: converts RPC WebAuthn signature', () => {
      const webauthnData = WebAuthnP256.getAuthenticatorData({
        rpId: 'localhost',
      })
      const clientDataJSON = WebAuthnP256.getClientDataJSON({
        challenge: '0xdeadbeef',
        origin: 'http://localhost',
      })

      const rpc: SignatureEnvelope.WebAuthnRpc = {
        pubKeyX: Hex.fromNumber(publicKey.x, { size: 32 }),
        pubKeyY: Hex.fromNumber(publicKey.y, { size: 32 }),
        r: Hex.fromNumber(p256Signature.r, { size: 32 }),
        s: Hex.fromNumber(p256Signature.s, { size: 32 }),
        type: 'webAuthn',
        webauthnData: Hex.concat(webauthnData, Hex.fromString(clientDataJSON)),
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope).toMatchObject({
        metadata: {
          authenticatorData: webauthnData,
          clientDataJSON,
        },
        publicKey: {
          x: publicKey.x,
          y: publicKey.y,
        },
        signature: {
          r: p256Signature.r,
          s: p256Signature.s,
        },
        type: 'webAuthn',
      })
    })
  })

  describe('keychain', () => {
    test('behavior: converts RPC keychain signature with secp256k1 inner', () => {
      const rpc: SignatureEnvelope.KeychainRpc = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        signature: {
          type: 'secp256k1',
          r: '0xa2bb71146c20ce932456c043ebb2973ed205e07cd32c35a60bdefca1285fd132',
          s: '0x7cba10692bccdbfba9a215418443c2903dbee6fe5cb55c91172e47efc607840e',
          yParity: '0x1',
        },
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope).toMatchObject({
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        inner: {
          type: 'secp256k1',
          signature: {
            r: 0xa2bb71146c20ce932456c043ebb2973ed205e07cd32c35a60bdefca1285fd132n,
            s: 0x7cba10692bccdbfba9a215418443c2903dbee6fe5cb55c91172e47efc607840en,
            yParity: 1,
          },
        },
      })
    })

    test('behavior: converts RPC keychain signature with p256 inner', () => {
      const rpc: SignatureEnvelope.KeychainRpc = {
        type: 'keychain',
        userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        signature: {
          preHash: true,
          pubKeyX: Hex.fromNumber(publicKey.x, { size: 32 }),
          pubKeyY: Hex.fromNumber(publicKey.y, { size: 32 }),
          r: Hex.fromNumber(p256Signature.r, { size: 32 }),
          s: Hex.fromNumber(p256Signature.s, { size: 32 }),
          type: 'p256',
        },
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope).toMatchObject({
        type: 'keychain',
        userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        inner: {
          type: 'p256',
          prehash: true,
          publicKey: {
            x: publicKey.x,
            y: publicKey.y,
          },
          signature: {
            r: p256Signature.r,
            s: p256Signature.s,
          },
        },
      })
    })

    test('behavior: converts RPC keychain signature with webAuthn inner', () => {
      const webauthnData = WebAuthnP256.getAuthenticatorData({
        rpId: 'localhost',
      })
      const clientDataJSON = WebAuthnP256.getClientDataJSON({
        challenge: '0xdeadbeef',
        origin: 'http://localhost',
      })

      const rpc: SignatureEnvelope.KeychainRpc = {
        type: 'keychain',
        userAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
        signature: {
          pubKeyX: Hex.fromNumber(publicKey.x, { size: 32 }),
          pubKeyY: Hex.fromNumber(publicKey.y, { size: 32 }),
          r: Hex.fromNumber(p256Signature.r, { size: 32 }),
          s: Hex.fromNumber(p256Signature.s, { size: 32 }),
          type: 'webAuthn',
          webauthnData: Hex.concat(
            webauthnData,
            Hex.fromString(clientDataJSON),
          ),
        },
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope).toMatchObject({
        type: 'keychain',
        userAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
        inner: {
          type: 'webAuthn',
          metadata: {
            authenticatorData: webauthnData,
            clientDataJSON,
          },
          publicKey: {
            x: publicKey.x,
            y: publicKey.y,
          },
          signature: {
            r: p256Signature.r,
            s: p256Signature.s,
          },
        },
      })
    })

    test('behavior: preserves keyId from RPC', () => {
      const rpc: SignatureEnvelope.KeychainRpc = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        keyId: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        signature: {
          type: 'secp256k1',
          r: '0xa2bb71146c20ce932456c043ebb2973ed205e07cd32c35a60bdefca1285fd132',
          s: '0x7cba10692bccdbfba9a215418443c2903dbee6fe5cb55c91172e47efc607840e',
          yParity: '0x1',
        },
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)

      expect(envelope.keyId).toBe('0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c')
    })
  })

  describe('multisig', () => {
    test('behavior: converts an untagged serialized multisig signature', () => {
      expect(
        SignatureEnvelope.fromRpc(signature_multisig_rpc),
      ).toMatchInlineSnapshot(`
        {
          "account": "0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b",
          "config": {
            "owners": [
              {
                "owner": "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
                "weight": 1,
              },
            ],
            "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
            "threshold": 1,
            "version": 0n,
          },
          "signatures": [
            {
              "signature": {
                "r": 60871800714128149016591846789173983752390955456021923556141688418770269698437n,
                "s": 24367763726302312398084372528434045669788111037623467391175388828437596076276n,
                "yParity": 0,
              },
              "type": "secp256k1",
            },
          ],
          "type": "multisig",
        }
      `)
    })

    test('error: rejects a payload with the transaction type byte', () => {
      expect(() =>
        SignatureEnvelope.fromRpc(`0x05${signature_multisig_rpc.slice(2)}`),
      ).toThrowErrorMatchingInlineSnapshot(`
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: invalid multisig wire shape: expected exactly three fields

        Serialized: 0x0505f89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d6947e5f4552091a69125d5dfcb7b8c2659029395bdf01f843b841869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b]
      `)
    })

    test('error: rejects trailing bytes', () => {
      expect(() =>
        SignatureEnvelope.fromRpc(`${signature_multisig_rpc}00`),
      ).toThrowErrorMatchingInlineSnapshot(`
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: invalid multisig RPC signature

        Serialized: 0xf89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d6947e5f4552091a69125d5dfcb7b8c2659029395bdf01f843b841869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b00]
      `)
    })

    test('error: rejects a structured multisig signature', () => {
      expect(() =>
        SignatureEnvelope.fromRpc({
          account: '0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b',
          config: {},
          signatures: [],
        } as never),
      ).toThrowErrorMatchingInlineSnapshot(
        `[SignatureEnvelope.CoercionError: Unable to coerce value (\`{"account":"0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b","config":{},"signatures":[]}\`) to a valid signature envelope.]`,
      )
    })
  })
})

describe('toRpc', () => {
  describe('secp256k1', () => {
    test('behavior: converts secp256k1 signature to RPC', () => {
      const envelope: SignatureEnvelope.Secp256k1 = {
        signature: signature_secp256k1,
        type: 'secp256k1',
      }

      const rpc = SignatureEnvelope.toRpc(envelope)

      expect(rpc).toMatchObject({
        r: Signature.toRpc(signature_secp256k1).r,
        s: Signature.toRpc(signature_secp256k1).s,
        yParity: Signature.toRpc(signature_secp256k1).yParity,
        type: 'secp256k1',
      })
    })
  })

  describe('p256', () => {
    test('behavior: converts P256 signature to RPC', () => {
      const rpc = SignatureEnvelope.toRpc(signature_p256)

      expect(rpc.type).toBe('p256')
      expect(rpc.preHash).toBe(true)
      expect(typeof rpc.pubKeyX).toBe('string')
      expect(typeof rpc.pubKeyY).toBe('string')
      expect(typeof rpc.r).toBe('string')
      expect(typeof rpc.s).toBe('string')
    })

    test('behavior: converts prehash=false correctly', () => {
      const withPrehashFalse = { ...signature_p256, prehash: false }
      const rpc = SignatureEnvelope.toRpc(withPrehashFalse)

      expect(rpc.preHash).toBe(false)
    })
  })

  describe('webAuthn', () => {
    test('behavior: converts WebAuthn signature to RPC', () => {
      const rpc = SignatureEnvelope.toRpc(
        signature_webauthn,
      ) as SignatureEnvelope.WebAuthnRpc

      expect(rpc.type).toBe('webAuthn')
      expect(typeof rpc.pubKeyX).toBe('string')
      expect(typeof rpc.pubKeyY).toBe('string')
      expect(typeof rpc.r).toBe('string')
      expect(typeof rpc.s).toBe('string')
      expect(typeof rpc.webauthnData).toBe('string')
      expect(rpc.webauthnData.startsWith('0x')).toBe(true)
    })

    test('behavior: webauthnData contains authenticatorData and clientDataJSON', () => {
      const rpc = SignatureEnvelope.toRpc(
        signature_webauthn,
      ) as SignatureEnvelope.WebAuthnRpc

      // webauthnData should contain the concatenation of authenticatorData and clientDataJSON (as hex)
      expect(rpc.webauthnData).toContain(
        signature_webauthn.metadata.authenticatorData.slice(2),
      )
    })
  })

  describe('keychain', () => {
    test('behavior: converts keychain signature with secp256k1 inner to RPC', () => {
      const envelope: SignatureEnvelope.Keychain = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        inner: {
          signature: signature_secp256k1,
          type: 'secp256k1',
        },
      }

      const rpc = SignatureEnvelope.toRpc(
        envelope,
      ) as SignatureEnvelope.KeychainRpc

      expect(rpc.type).toBe('keychain')
      expect(rpc.userAddress).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
      expect(rpc.signature).toMatchObject({
        r: Signature.toRpc(signature_secp256k1).r,
        s: Signature.toRpc(signature_secp256k1).s,
        yParity: Signature.toRpc(signature_secp256k1).yParity,
        type: 'secp256k1',
      })
    })

    test('behavior: converts keychain signature with p256 inner to RPC', () => {
      const rpc = SignatureEnvelope.toRpc(
        signature_keychain_p256,
      ) as SignatureEnvelope.KeychainRpc
      if (typeof rpc.signature === 'string') throw new Error('unreachable')

      expect(rpc.type).toBe('keychain')
      expect(rpc.userAddress).toBe(signature_keychain_p256.userAddress)
      expect(rpc.signature.type).toBe('p256')
      expect(typeof rpc.signature.pubKeyX).toBe('string')
      expect(typeof rpc.signature.pubKeyY).toBe('string')
    })

    test('behavior: converts keychain signature with webAuthn inner to RPC', () => {
      const rpc = SignatureEnvelope.toRpc(
        signature_keychain_webauthn,
      ) as SignatureEnvelope.KeychainRpc
      if (typeof rpc.signature === 'string') throw new Error('unreachable')

      expect(rpc.type).toBe('keychain')
      expect(rpc.userAddress).toBe(signature_keychain_webauthn.userAddress)
      expect(rpc.signature.type).toBe('webAuthn')
      expect(typeof rpc.signature.pubKeyX).toBe('string')
      expect(typeof rpc.signature.webauthnData).toBe('string')
    })

    test('behavior: preserves keyId in toRpc', () => {
      const envelope: SignatureEnvelope.Keychain = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        keyId: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
        inner: {
          signature: signature_secp256k1,
          type: 'secp256k1',
        },
      }

      const rpc = SignatureEnvelope.toRpc(
        envelope,
      ) as SignatureEnvelope.KeychainRpc

      expect(rpc.keyId).toBe('0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c')
    })

    test('behavior: omits keyId in toRpc when not set', () => {
      const envelope: SignatureEnvelope.Keychain = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        inner: {
          signature: signature_secp256k1,
          type: 'secp256k1',
        },
      }

      const rpc = SignatureEnvelope.toRpc(
        envelope,
      ) as SignatureEnvelope.KeychainRpc

      expect(rpc.keyId).toBeUndefined()
    })
  })

  describe('multisig', () => {
    test('behavior: removes the transaction type byte', () => {
      const envelope = SignatureEnvelope.deserialize(
        `0x05${signature_multisig_rpc.slice(2)}`,
      )

      expect(SignatureEnvelope.toRpc(envelope)).toMatchInlineSnapshot(
        `"${signature_multisig_rpc}"`,
      )
    })
  })
})

describe('roundtrip: toRpc <-> fromRpc', () => {
  describe('secp256k1', () => {
    test('behavior: roundtrips toRpc -> fromRpc', () => {
      const envelope: SignatureEnvelope.Secp256k1 = {
        signature: signature_secp256k1,
        type: 'secp256k1',
      }

      const rpc = SignatureEnvelope.toRpc(envelope)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped).toMatchObject({
        signature: {
          r: signature_secp256k1.r,
          s: signature_secp256k1.s,
          yParity: signature_secp256k1.yParity,
        },
        type: 'secp256k1',
      })
    })

    test('behavior: roundtrips fromRpc -> toRpc', () => {
      const rpc: SignatureEnvelope.Secp256k1Rpc = {
        r: Signature.toRpc(signature_secp256k1).r,
        s: Signature.toRpc(signature_secp256k1).s,
        yParity: Signature.toRpc(signature_secp256k1).yParity,
        type: 'secp256k1',
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)
      const roundtripped = SignatureEnvelope.toRpc(envelope)

      expect(roundtripped).toMatchObject(rpc)
    })
  })

  describe('p256', () => {
    test('behavior: roundtrips toRpc -> fromRpc', () => {
      const rpc = SignatureEnvelope.toRpc(signature_p256)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped).toMatchObject({
        prehash: signature_p256.prehash,
        publicKey: {
          x: signature_p256.publicKey.x,
          y: signature_p256.publicKey.y,
        },
        signature: {
          r: signature_p256.signature.r,
          s: signature_p256.signature.s,
        },
        type: 'p256',
      })
    })

    test('behavior: handles prehash=false in roundtrip', () => {
      const withPrehashFalse = { ...signature_p256, prehash: false }
      const rpc = SignatureEnvelope.toRpc(withPrehashFalse)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped.prehash).toBe(false)
    })
  })

  describe('webAuthn', () => {
    test('behavior: roundtrips toRpc -> fromRpc', () => {
      const rpc = SignatureEnvelope.toRpc(signature_webauthn)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped).toMatchObject({
        metadata: {
          authenticatorData: signature_webauthn.metadata.authenticatorData,
          clientDataJSON: signature_webauthn.metadata.clientDataJSON,
        },
        publicKey: {
          x: signature_webauthn.publicKey.x,
          y: signature_webauthn.publicKey.y,
        },
        signature: {
          r: signature_webauthn.signature.r,
          s: signature_webauthn.signature.s,
        },
        type: 'webAuthn',
      })
    })

    test('behavior: handles variable-length clientDataJSON in roundtrip', () => {
      const longClientData = JSON.stringify({
        type: 'webAuthn.get',
        challenge: 'a'.repeat(100),
        origin: 'https://example.com',
        crossOrigin: false,
      })

      const signatureWithLongData = {
        ...signature_webauthn,
        metadata: {
          ...signature_webauthn.metadata,
          clientDataJSON: longClientData,
        },
      }

      const rpc = SignatureEnvelope.toRpc(signatureWithLongData)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped.metadata?.clientDataJSON).toBe(longClientData)
    })
  })

  describe('keychain', () => {
    test('behavior: roundtrips toRpc -> fromRpc with secp256k1 inner', () => {
      const envelope: SignatureEnvelope.Keychain = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        inner: {
          signature: signature_secp256k1,
          type: 'secp256k1',
        },
      }

      const rpc = SignatureEnvelope.toRpc(envelope)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped).toMatchObject({
        type: 'keychain',
        userAddress: envelope.userAddress,
        inner: {
          type: 'secp256k1',
          signature: {
            r: signature_secp256k1.r,
            s: signature_secp256k1.s,
            yParity: signature_secp256k1.yParity,
          },
        },
      })
    })

    test('behavior: roundtrips toRpc -> fromRpc with p256 inner', () => {
      const rpc = SignatureEnvelope.toRpc(signature_keychain_p256)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped).toMatchObject({
        type: 'keychain',
        userAddress: signature_keychain_p256.userAddress,
        inner: {
          type: 'p256',
          prehash: signature_p256.prehash,
          publicKey: {
            x: signature_p256.publicKey.x,
            y: signature_p256.publicKey.y,
          },
          signature: {
            r: signature_p256.signature.r,
            s: signature_p256.signature.s,
          },
        },
      })
    })

    test('behavior: roundtrips toRpc -> fromRpc with webAuthn inner', () => {
      const rpc = SignatureEnvelope.toRpc(signature_keychain_webauthn)
      const roundtripped = SignatureEnvelope.fromRpc(rpc)

      expect(roundtripped).toMatchObject({
        type: 'keychain',
        userAddress: signature_keychain_webauthn.userAddress,
        inner: {
          type: 'webAuthn',
          metadata: {
            authenticatorData: signature_webauthn.metadata.authenticatorData,
            clientDataJSON: signature_webauthn.metadata.clientDataJSON,
          },
          publicKey: {
            x: signature_webauthn.publicKey.x,
            y: signature_webauthn.publicKey.y,
          },
          signature: {
            r: signature_webauthn.signature.r,
            s: signature_webauthn.signature.s,
          },
        },
      })
    })

    test('behavior: roundtrips fromRpc -> toRpc with secp256k1 inner', () => {
      const rpc: SignatureEnvelope.KeychainRpc = {
        type: 'keychain',
        userAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        signature: {
          type: 'secp256k1',
          r: '0xa2bb71146c20ce932456c043ebb2973ed205e07cd32c35a60bdefca1285fd132',
          s: '0x7cba10692bccdbfba9a215418443c2903dbee6fe5cb55c91172e47efc607840e',
          yParity: '0x1',
        },
      }

      const envelope = SignatureEnvelope.fromRpc(rpc)
      const roundtripped = SignatureEnvelope.toRpc(envelope)

      expect(roundtripped).toMatchObject(rpc)
    })
  })
})

describe('types', () => {
  test('behavior: contains all signature types', () => {
    expect(SignatureEnvelope.types).toEqual(['secp256k1', 'p256', 'webAuthn'])
  })
})

describe('CoercionError', () => {
  test('behavior: formats error message with hex string', () => {
    const error = new SignatureEnvelope.CoercionError({
      envelope: '0xdeadbeef',
    })
    expect(error).toMatchInlineSnapshot(
      `[SignatureEnvelope.CoercionError: Unable to coerce value (\`"0xdeadbeef"\`) to a valid signature envelope.]`,
    )
  })

  test('behavior: formats error message with object', () => {
    const error = new SignatureEnvelope.CoercionError({
      envelope: { r: 0n, s: 0n, yParity: 0 },
    })
    expect(error).toMatchInlineSnapshot(
      `[SignatureEnvelope.CoercionError: Unable to coerce value (\`{"r":"0#__bigint","s":"0#__bigint","yParity":0}\`) to a valid signature envelope.]`,
    )
  })
})

describe('multisig', () => {
  const initial =
    '0x05f89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d6947e5f4552091a69125d5dfcb7b8c2659029395bdf01f843b841869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b' as const
  const current =
    '0x05f89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000000101d7d6942b5ad5c4795c026514f8317c7a215e218dccd6cf01f843b8414a0e5b5b4a90f08e6e8d676a73a22dc2cf022ffdcc9299512b5d9a6daf66e0504a395a2ef6f6c0f173910b875c45d01aa66d928e56ba6f49bbc8186f80268bf51b' as const
  const nested =
    '0x05f8f0945f0287385ec182f906c238bec5f87692d48b23f2f83ba033333333333333333333333333333333333333333333333333333333333333338001d7d69470845f2897b639686cb383799d605c52315d785501f89cb89a05f8979470845f2897b639686cb383799d605c52315d7855f83ba022222222222222222222222222222222222222222222222222222222222222228001d7d6946813eb9362372eef6200f3b1dbc3f819671cba6901f843b841032aa6f3ea7b0b7069720d0f3891983c493d149326c5c957d864ed7371b8475e3e95325079b24491f4b6d68920e4b3bacd7c6094df6ed88b8674864ab559c8fb1b' as const

  test('example: decodes and re-encodes the frozen initial signature', () => {
    const envelope = SignatureEnvelope.deserialize(initial)

    expect(envelope).toMatchInlineSnapshot(`
      {
        "account": "0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b",
        "config": {
          "owners": [
            {
              "owner": "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 1,
          "version": 0n,
        },
        "signatures": [
          {
            "signature": {
              "r": 60871800714128149016591846789173983752390955456021923556141688418770269698437n,
              "s": 24367763726302312398084372528434045669788111037623467391175388828437596076276n,
              "yParity": 0,
            },
            "type": "secp256k1",
          },
        ],
        "type": "multisig",
      }
    `)
    expect(SignatureEnvelope.serialize(envelope)).toBe(initial)
  })

  test('example: decodes and re-encodes the frozen current signature', () => {
    const envelope = SignatureEnvelope.deserialize(current)

    expect(envelope).toMatchInlineSnapshot(`
      {
        "account": "0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b",
        "config": {
          "owners": [
            {
              "owner": "0x2b5ad5c4795c026514f8317c7a215e218dccd6cf",
              "weight": 1,
            },
          ],
          "salt": "0x0000000000000000000000000000000000000000000000000000000000000000",
          "threshold": 1,
          "version": 1n,
        },
        "signatures": [
          {
            "signature": {
              "r": 33496517174194049078979631673636743206216482049680398378774155205635729711184n,
              "s": 33572483501191170814542557897380275621900207658854593170435098846326627404789n,
              "yParity": 0,
            },
            "type": "secp256k1",
          },
        ],
        "type": "multisig",
      }
    `)
    expect(SignatureEnvelope.serialize(envelope)).toBe(current)
  })

  test('example: decodes and re-encodes the frozen nested signature', () => {
    const envelope = SignatureEnvelope.deserialize(nested)

    expect(envelope).toMatchInlineSnapshot(`
      {
        "account": "0x5f0287385ec182f906c238bec5f87692d48b23f2",
        "config": {
          "owners": [
            {
              "owner": "0x70845f2897b639686cb383799d605c52315d7855",
              "weight": 1,
            },
          ],
          "salt": "0x3333333333333333333333333333333333333333333333333333333333333333",
          "threshold": 1,
          "version": 0n,
        },
        "signatures": [
          {
            "account": "0x70845f2897b639686cb383799d605c52315d7855",
            "config": {
              "owners": [
                {
                  "owner": "0x6813eb9362372eef6200f3b1dbc3f819671cba69",
                  "weight": 1,
                },
              ],
              "salt": "0x2222222222222222222222222222222222222222222222222222222222222222",
              "threshold": 1,
              "version": 0n,
            },
            "signatures": [
              {
                "signature": {
                  "r": 1432298388324792555676061659976215111517531547814803085200940835913455912798n,
                  "s": 28307004081743690677157914067925034813425317008577473150162358055484664695035n,
                  "yParity": 0,
                },
                "type": "secp256k1",
              },
            ],
            "type": "multisig",
          },
        ],
        "type": "multisig",
      }
    `)
    expect(SignatureEnvelope.serialize(envelope)).toBe(nested)
  })

  test('behavior: preserves exact 65-byte secp256k1 precedence', () => {
    const serialized = ('0x05' +
      '00'.repeat(31) +
      '00'.repeat(31) +
      '01' +
      '00') as Hex.Hex

    expect(Hex.size(serialized)).toBe(65)
    expect(SignatureEnvelope.deserialize(serialized).type).toBe('secp256k1')
  })

  test('behavior: serializes account, config, and approvals in wire order', () => {
    const envelope = SignatureEnvelope.deserialize(initial)
    if (envelope.type !== 'multisig') throw new Error('unreachable')
    const serialized = SignatureEnvelope.serialize(envelope)
    const decoded = Rlp.toHex(Hex.slice(serialized, 1))

    expect(decoded).toMatchInlineSnapshot(`
      [
        "0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b",
        [
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x",
          "0x01",
          [
            [
              "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
              "0x01",
            ],
          ],
        ],
        [
          "0x869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b",
        ],
      ]
    `)
  })

  test('behavior: round trips initial and current RPC signatures', () => {
    const initialEnvelope = SignatureEnvelope.deserialize(initial)
    const currentEnvelope = SignatureEnvelope.deserialize(current)
    const rpc = {
      current: SignatureEnvelope.toRpc(currentEnvelope),
      initial: SignatureEnvelope.toRpc(initialEnvelope),
    }

    expect(rpc).toMatchInlineSnapshot(`
      {
        "current": "0xf89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000000101d7d6942b5ad5c4795c026514f8317c7a215e218dccd6cf01f843b8414a0e5b5b4a90f08e6e8d676a73a22dc2cf022ffdcc9299512b5d9a6daf66e0504a395a2ef6f6c0f173910b875c45d01aa66d928e56ba6f49bbc8186f80268bf51b",
        "initial": "0xf89794c4a590afa7337e5cd5eb3aa60cacf91c5400044bf83ba000000000000000000000000000000000000000000000000000000000000000008001d7d6947e5f4552091a69125d5dfcb7b8c2659029395bdf01f843b841869437e01f64bebeb78a8a6b30bfd3a993819c8cad82c807515d9b9e9b36f98535dfaa5eebc597715d05f6ce4927747f14fa4cd2acc717fdcd3877146437f8f41b",
      }
    `)
    expect(SignatureEnvelope.fromRpc(rpc.initial)).toStrictEqual(
      initialEnvelope,
    )
    expect(SignatureEnvelope.fromRpc(rpc.current)).toStrictEqual(
      currentEnvelope,
    )
  })

  test('behavior: derives the account only for an initial config', () => {
    const initialEnvelope = SignatureEnvelope.deserialize(initial)
    if (initialEnvelope.type !== 'multisig') throw new Error('unreachable')
    if (initialEnvelope.config.version !== 0n) throw new Error('unreachable')
    const derived = SignatureEnvelope.from({
      config: initialEnvelope.config as MultisigConfig.Config<0n>,
      signatures: initialEnvelope.signatures,
    })
    const currentEnvelope = SignatureEnvelope.deserialize(current)
    if (currentEnvelope.type !== 'multisig') throw new Error('unreachable')

    expect(derived.account).toBe(initialEnvelope.account)
    expect(() =>
      SignatureEnvelope.from({
        config: currentEnvelope.config,
        signatures: currentEnvelope.signatures,
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MultisigConfig.InvalidConfigError: Invalid native multisig config: account address requires version zero.]`,
    )
  })

  test('behavior: extracts the multisig account', () => {
    const envelope = SignatureEnvelope.deserialize(initial)
    if (envelope.type !== 'multisig') throw new Error('unreachable')

    expect(
      SignatureEnvelope.extractAddress({
        payload: '0xdeadbeef',
        signature: envelope,
      }),
    ).toBe(envelope.account)
  })

  test('example: matches the frozen eight-approval boundary vector', () => {
    const config = MultisigConfig.from({
      owners: Array.from({ length: 8 }, (_, index) => ({
        owner:
          `0x${(index + 1).toString(16).padStart(40, '0')}` as `0x${string}`,
        weight: 1,
      })),
      salt: `0x${'66'.repeat(32)}`,
      threshold: 8,
    })
    const approval = SignatureEnvelope.from({
      r: 0x840cfc572845f5786e702984c2a582528cad4b49b2a10b9db1be7fca90058565n,
      s: 0x25e7109ceb98168d95b09b18bbf6b685130e0562f233877d492b94eee0c5b6d1n,
      yParity: 0,
    })
    const envelope = SignatureEnvelope.from({
      config,
      signatures: Array.from(
        { length: MultisigConfig.maxSignatures },
        () => approval,
      ),
    })
    const serialized = SignatureEnvelope.serialize(envelope)

    expect({
      hash: Hash.keccak256(serialized),
      length: Hex.size(serialized),
      signatureCount: envelope.signatures.length,
    }).toMatchInlineSnapshot(`
      {
        "hash": "0x507fa2d2bc6cf5e7753d4d7cb92fe3d199f64c6eaa9a0bd1d14bfb366028a379",
        "length": 787,
        "signatureCount": 8,
      }
    `)
  })

  test('behavior: accepts initial and current nested signatures', () => {
    const initialEnvelope = SignatureEnvelope.deserialize(initial)
    const currentEnvelope = SignatureEnvelope.deserialize(current)
    if (
      initialEnvelope.type !== 'multisig' ||
      currentEnvelope.type !== 'multisig'
    )
      throw new Error('unreachable')

    for (const signature of [initialEnvelope, currentEnvelope]) {
      const config = MultisigConfig.from({
        owners: [{ owner: signature.account, weight: 1 }],
        salt: ('0x' + 'ff'.repeat(32)) as Hex.Hex,
        threshold: 1,
        version: 1n,
      })
      const envelope = SignatureEnvelope.from({
        account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        config,
        signatures: [signature],
      })

      expect(
        SignatureEnvelope.deserialize(SignatureEnvelope.serialize(envelope)),
      ).toStrictEqual(envelope)
    }
  })

  test('error: rejects an initial account mismatch', () => {
    const envelope = SignatureEnvelope.deserialize(initial)
    if (envelope.type !== 'multisig') throw new Error('unreachable')

    expect(() =>
      SignatureEnvelope.assert({
        ...envelope,
        account: '0x1111111111111111111111111111111111111111',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: initial multisig config does not derive account.]`,
    )
  })

  test('error: rejects a self-owned current signature', () => {
    const envelope = SignatureEnvelope.deserialize(current)
    if (envelope.type !== 'multisig') throw new Error('unreachable')
    const account = envelope.config.owners[0]!.owner

    expect(() =>
      SignatureEnvelope.assert({ ...envelope, account }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: multisig account cannot be an owner.]`,
    )
  })

  test('error: rejects empty and excess approvals', () => {
    const envelope = SignatureEnvelope.deserialize(current)
    if (envelope.type !== 'multisig') throw new Error('unreachable')

    expect(() =>
      SignatureEnvelope.assert({ ...envelope, signatures: [] }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: multisig signatures cannot be empty.]`,
    )
    expect(() =>
      SignatureEnvelope.assert({
        ...envelope,
        signatures: Array.from(
          { length: MultisigConfig.maxSignatures + 1 },
          () => envelope.signatures[0]!,
        ),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: multisig signatures exceed 8.]`,
    )
  })

  test('error: rejects keychain owner approvals', () => {
    const envelope = SignatureEnvelope.deserialize(current)
    if (envelope.type !== 'multisig') throw new Error('unreachable')

    expect(() =>
      SignatureEnvelope.assert({
        ...envelope,
        signatures: [signature_keychain_secp256k1],
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: keychain owner approvals are not allowed.]`,
    )
  })

  test('error: rejects oversized primitive approvals', () => {
    const envelope = SignatureEnvelope.deserialize(current)
    if (envelope.type !== 'multisig') throw new Error('unreachable')
    const oversized = {
      ...signature_webauthn,
      metadata: {
        ...signature_webauthn.metadata,
        clientDataJSON: JSON.stringify({ value: 'x'.repeat(2048) }),
      },
    }

    expect(() =>
      SignatureEnvelope.assert({
        ...envelope,
        signatures: [oversized],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: multisig owner signature exceeds 2049 bytes.]`,
    )
  })

  test('error: rejects nesting deeper than two nodes', () => {
    const envelope = SignatureEnvelope.deserialize(initial)
    if (envelope.type !== 'multisig') throw new Error('unreachable')
    const depth2 = SignatureEnvelope.from({
      ...envelope,
      signatures: [envelope],
    })

    expect(() =>
      SignatureEnvelope.assert({
        ...envelope,
        signatures: [depth2],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignatureEnvelope.InvalidMultisigApprovalError: Invalid native multisig owner approval: multisig nesting depth exceeds 2.]`,
    )
  })

  test.each([
    {
      name: 'two fields',
      value: Rlp.fromHex([
        '0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b',
        [Hex.slice(initial, -65)],
      ]),
    },
    {
      name: 'trailing field',
      value: Rlp.fromHex([
        '0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b',
        MultisigConfig.toTuple(
          MultisigConfig.from({
            owners: [
              {
                owner: '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf',
                weight: 1,
              },
            ],
            threshold: 1,
          }),
        ),
        [Hex.slice(initial, -65)],
        '0x',
      ]),
    },
  ])('error: rejects malformed $name wire shape', ({ value }) => {
    expect(() =>
      SignatureEnvelope.deserialize(Hex.concat('0x05', value)),
    ).toThrowError(SignatureEnvelope.InvalidSerializedError)
  })

  test.each([
    {
      field: 'salt',
      value: [
        ('0x' + '00'.repeat(31)) as Hex.Hex,
        '0x',
        '0x01',
        [['0x7e5f4552091a69125d5dfcb7b8c2659029395bdf', '0x01']],
      ],
    },
    {
      field: 'oversized version',
      value: [
        ('0x' + '00'.repeat(32)) as Hex.Hex,
        ('0x' + '01'.repeat(9)) as Hex.Hex,
        '0x01',
        [['0x7e5f4552091a69125d5dfcb7b8c2659029395bdf', '0x01']],
      ],
    },
    {
      field: 'zero version',
      value: [
        ('0x' + '00'.repeat(32)) as Hex.Hex,
        '0x00',
        '0x01',
        [['0x7e5f4552091a69125d5dfcb7b8c2659029395bdf', '0x01']],
      ],
    },
    {
      field: 'zero-prefixed version',
      value: [
        ('0x' + '00'.repeat(32)) as Hex.Hex,
        '0x0001',
        '0x01',
        [['0x7e5f4552091a69125d5dfcb7b8c2659029395bdf', '0x01']],
      ],
    },
    {
      field: 'threshold',
      value: [
        ('0x' + '00'.repeat(32)) as Hex.Hex,
        '0x',
        '0x0001',
        [['0x7e5f4552091a69125d5dfcb7b8c2659029395bdf', '0x01']],
      ],
    },
    {
      field: 'weight',
      value: [
        ('0x' + '00'.repeat(32)) as Hex.Hex,
        '0x',
        '0x01',
        [['0x7e5f4552091a69125d5dfcb7b8c2659029395bdf', '0x0001']],
      ],
    },
  ])('error: rejects a noncanonical $field', ({ value }) => {
    const malformed = Hex.concat(
      '0x05',
      Rlp.fromHex([
        '0xc4a590afa7337e5cd5eb3aa60cacf91c5400044b',
        value as never,
        [Hex.slice(initial, -65)],
      ]),
    )

    expect(() => SignatureEnvelope.deserialize(malformed)).toThrowError(
      SignatureEnvelope.InvalidSerializedError,
    )
  })
})
