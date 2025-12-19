import {
  Address,
  Hex,
  P256,
  PublicKey,
  Secp256k1,
  Signature,
  WebAuthnP256,
  WebCryptoP256,
} from 'ox'
import { describe, expect, test } from 'vitest'
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
})

const signature_keychain_p256 = SignatureEnvelope.from({
  userAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  inner: signature_p256,
})

const signature_keychain_webauthn = SignatureEnvelope.from({
  userAddress: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
  inner: signature_webauthn,
})

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
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Unknown signature type identifier: 0xde. Expected 0x01 (P256) or 0x02 (WebAuthn)

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
        [SignatureEnvelope.InvalidSerializedError: Unable to deserialize signature envelope: Unknown signature type identifier: 0xff. Expected 0x01 (P256) or 0x02 (WebAuthn)

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

      // First byte should be Keychain type identifier (0x03)
      expect(Hex.slice(serialized, 0, 1)).toBe('0x03')

      // Next 20 bytes should be the user address (without '0x')
      expect(Hex.slice(serialized, 1, 21)).toBe(
        signature_keychain_secp256k1.userAddress,
      )
    })

    test('behavior: serializes keychain signature with p256 inner', () => {
      const serialized = SignatureEnvelope.serialize(signature_keychain_p256)

      // Should be: 1 (type) + 20 (address) + 130 (p256 signature with type)
      expect(Hex.size(serialized)).toBe(1 + 20 + 130)

      // First byte should be Keychain type identifier (0x03)
      expect(Hex.slice(serialized, 0, 1)).toBe('0x03')

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

      // First byte should be Keychain type identifier (0x03)
      expect(Hex.slice(serialized, 0, 1)).toBe('0x03')

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

      expect(rpc.type).toBe('keychain')
      expect(rpc.userAddress).toBe(signature_keychain_webauthn.userAddress)
      expect(rpc.signature.type).toBe('webAuthn')
      expect(typeof rpc.signature.pubKeyX).toBe('string')
      expect(typeof rpc.signature.webauthnData).toBe('string')
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
