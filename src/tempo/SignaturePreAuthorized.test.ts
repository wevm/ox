import { Address, Hash, Hex, P256, Rlp, Secp256k1 } from 'ox'
import { describe, expect, test } from 'vitest'
import * as KeyAuthorization from './KeyAuthorization.js'
import * as SignatureEnvelope from './SignatureEnvelope.js'
import * as SignaturePreAuthorized from './SignaturePreAuthorized.js'

// TIP-1165 example. Both keys are public test keys.
const rootKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
const accessKey =
  '0x59c6995e998f97a5a0044966f0945389dc9d86dae88c7a8412f4603b6b78690d' as const

const vector = {
  hash: '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
  keychainSignature:
    '0x04f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1c',
  signedKeyAuthorization:
    '0xf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b',
} as const
const vectorWrapped = Hex.concat(
  '0xf8fab856',
  vector.keychainSignature,
  vector.signedKeyAuthorization,
  '0x1165116511651165116511651165116511651165116511651165116511651165',
)

const account = Address.fromPublicKey(
  Secp256k1.getPublicKey({ privateKey: rootKey }),
)
const hash = Hash.keccak256(Hex.fromString('hello'))

const authorization = KeyAuthorization.from({
  address: Address.fromPublicKey(
    Secp256k1.getPublicKey({ privateKey: accessKey }),
  ),
  chainId: 4217n,
  expiry: 1_900_000_000,
  limits: [
    {
      limit: 10_000_000n,
      token: '0x20c0000000000000000000000000000000000001',
    },
  ],
  type: 'secp256k1',
  witness: '0xe55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5',
})

const keyAuthorization = KeyAuthorization.from(authorization, {
  signature: SignatureEnvelope.from(
    Secp256k1.sign({
      payload: KeyAuthorization.getSignPayload(authorization),
      privateKey: rootKey,
    }),
  ),
})

const inner = SignatureEnvelope.from(
  Secp256k1.sign({
    payload: Hash.keccak256(Hex.concat('0x04', hash, account)),
    privateKey: accessKey,
  }),
)

const signature: SignatureEnvelope.Keychain = {
  inner,
  type: 'keychain',
  userAddress: account,
}

const wrapped = SignaturePreAuthorized.wrap({ keyAuthorization, signature })

const signatureSerialized = SignatureEnvelope.serialize(signature)
const keyAuthorizationTuple = KeyAuthorization.toTuple(keyAuthorization)

function wrapRaw(body: Hex.Hex) {
  return Hex.concat(body, SignaturePreAuthorized.magicBytes)
}

describe('magicBytes', () => {
  test('default', () => {
    expect(SignaturePreAuthorized.magicBytes).toMatchInlineSnapshot(
      '"0x1165116511651165116511651165116511651165116511651165116511651165"',
    )
  })
})

describe('wrap', () => {
  test('TIP-1165 example vector', () => {
    expect(hash).toBe(vector.hash)
    expect(signatureSerialized).toBe(vector.keychainSignature)
    expect(KeyAuthorization.serialize(keyAuthorization)).toBe(
      vector.signedKeyAuthorization,
    )
    expect(wrapped).toBe(vectorWrapped)
  })

  test('behavior: p256 inner signature', () => {
    const privateKey = P256.randomPrivateKey()
    const publicKey = P256.getPublicKey({ privateKey })
    const signature = SignatureEnvelope.from({
      inner: SignatureEnvelope.from({
        prehash: false,
        publicKey,
        signature: P256.sign({
          payload: Hash.keccak256(Hex.concat('0x04', hash, account)),
          privateKey,
        }),
      }),
      userAddress: account,
    }) as SignatureEnvelope.Keychain
    const wrapped = SignaturePreAuthorized.wrap({ keyAuthorization, signature })
    const unwrapped = SignaturePreAuthorized.unwrap(wrapped)
    expect(unwrapped.keyAuthorization).toEqual(keyAuthorization)
    expect(SignatureEnvelope.serialize(unwrapped.signature)).toBe(
      SignatureEnvelope.serialize(signature),
    )
    expect(SignaturePreAuthorized.wrap(unwrapped)).toBe(wrapped)
  })

  test('error: malformed constituents', () => {
    const { keyAuthorization, signature } =
      SignaturePreAuthorized.unwrap(vectorWrapped)
    expect(() =>
      SignaturePreAuthorized.assert({
        keyAuthorization: { signature: {} } as never,
        signature: { inner: { type: 'secp256k1' }, type: 'keychain' } as never,
      }),
    ).toThrowError(SignaturePreAuthorized.InvalidUnwrappedSignatureError)
    expect(() =>
      SignaturePreAuthorized.assert({
        keyAuthorization,
        signature: { ...signature, inner: { type: 'secp256k1' } } as never,
      }),
    ).toThrowError(/malformed keychain signature/)
    expect(() =>
      SignaturePreAuthorized.assert({
        keyAuthorization: { ...keyAuthorization, signature: {} } as never,
        signature,
      }),
    ).toThrowError(/malformed signed key authorization/)
  })

  test('error: keychain V1', () => {
    expect(() =>
      SignaturePreAuthorized.wrap({
        keyAuthorization,
        signature: { ...signature, version: 'v1' },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidUnwrappedSignatureError: Value is an invalid unwrapped pre-authorized signature: keychain V1 signatures are not supported.]`,
    )
  })

  test('error: non-keychain signature', () => {
    expect(() =>
      SignaturePreAuthorized.wrap({
        keyAuthorization,
        signature: inner as never,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidUnwrappedSignatureError: Value is an invalid unwrapped pre-authorized signature: expected a keychain signature, got \`secp256k1\`.]`,
    )
  })

  test('error: configurable inner signature', () => {
    expect(() =>
      SignaturePreAuthorized.wrap({
        keyAuthorization,
        signature: {
          ...signature,
          inner: {
            account,
            config: {} as never,
            signatures: [],
            type: 'configurable',
          },
        },
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidUnwrappedSignatureError: Value is an invalid unwrapped pre-authorized signature: expected a secp256k1, p256, or webAuthn inner signature, got \`configurable\`.]`,
    )
  })

  test('error: unsigned key authorization', () => {
    expect(() =>
      SignaturePreAuthorized.wrap({
        keyAuthorization: authorization as never,
        signature,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidUnwrappedSignatureError: Value is an invalid unwrapped pre-authorized signature: key authorization is not signed.]`,
    )
  })
})

describe('unwrap', () => {
  test('TIP-1165 example vector', () => {
    const unwrapped = SignaturePreAuthorized.unwrap(vectorWrapped)
    expect(unwrapped).toEqual({
      keyAuthorization,
      signature: { ...signature, version: 'v2' },
    })
    expect(SignaturePreAuthorized.wrap(unwrapped)).toBe(vectorWrapped)
  })

  test('error: missing magic', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(Hex.slice(vectorWrapped, 0, -32)),
    ).toThrowError(SignaturePreAuthorized.InvalidWrappedSignatureError)
    expect(() =>
      SignaturePreAuthorized.unwrap(SignaturePreAuthorized.magicBytes),
    ).toThrowError(SignaturePreAuthorized.InvalidWrappedSignatureError)
    expect(() =>
      SignaturePreAuthorized.unwrap('0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xdeadbeef\` is an invalid pre-authorized signature.]`,
    )
  })

  test('error: trailing bytes', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(Hex.concat(Hex.slice(vectorWrapped, 0, -32), '0x00')),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8fab85604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b001165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: unexpected bytes after the RLP list]
    `)
  })

  test('error: non-canonical list header', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        Hex.concat('0xf900fa', Hex.slice(vectorWrapped, 2)),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf900fab85604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b1165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: RLP payload is not canonically encoded: length \`250\` fits in fewer length-bytes and must not use a two-byte length prefix.]
    `)
  })

  test('error: three items', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([
            signatureSerialized,
            keyAuthorizationTuple as never,
            '0x',
          ]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8fbb85604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b801165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: expected an RLP list of exactly two items]
    `)
  })

  test('error: one item', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(Rlp.fromHex([signatureSerialized])),
      ),
    ).toThrowError(SignaturePreAuthorized.InvalidWrappedSignatureError)
  })

  test('error: wrong item shapes', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([[signatureSerialized], keyAuthorizationTuple as never]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8fcf858b85604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b1165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: keychain signature is not an RLP string]
    `)
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([
            signatureSerialized,
            KeyAuthorization.serialize(keyAuthorization),
          ]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8fcb85604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cb8a2f8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b1165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: signed key authorization is not an RLP list]
    `)
  })

  test('error: unsigned key authorization', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([
            signatureSerialized,
            KeyAuthorization.toTuple(authorization) as never,
          ]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8b7b85604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf85df85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c51165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: key authorization is not signed]
    `)
  })

  test('error: keychain V1', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([
            Hex.concat('0x03', Hex.slice(signatureSerialized, 1)),
            keyAuthorizationTuple as never,
          ]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8fab85603f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b1165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: keychain V1 signatures are not supported]
    `)
  })

  test('error: non-keychain signature', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([
            SignatureEnvelope.serialize(inner),
            keyAuthorizationTuple as never,
          ]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf8e5b8413dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1cf8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b1165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: expected a keychain signature, got \`secp256k1\`]
    `)
  })

  test('error: keychain signature with envelope magic', () => {
    expect(() =>
      SignaturePreAuthorized.unwrap(
        wrapRaw(
          Rlp.fromHex([
            SignatureEnvelope.serialize(signature, { magic: true }),
            keyAuthorizationTuple as never,
          ]),
        ),
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
      [SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xf9011ab87604f39fd6e51aad88f6f4ce6ab8827279cfffb922663dc3ccd3e78382806b81f811192a9afa9f38335c19a3897a2676008ab611d8a61c73da6988f81a2cc37c5c712f67280aeb732e45688c9347458092b772306c6c1c7777777777777777777777777777777777777777777777777777777777777777f8a0f85b821079809472989d24e6e1f0bbe29a5f304d0db21a318c012e84713fb300dad99420c00000000000000000000000000000000000018398968080a0e55f870744098e6baf2f15e0faa6f8f9de283280f26f416dee8dcf9189a553c5b841c026ad99f18042ef3ac0d7a88ffbcd910eb4ccaf435b1acf684f6eb63425909642b07095e6f94edbf489ac1909caa41b0e3eee6971862939e8403c1ab4e617ca1b1165116511651165116511651165116511651165116511651165116511651165\` is an invalid pre-authorized signature.

      Details: keychain signature is not canonical]
    `)
  })
})

describe('assert', () => {
  test('default', () => {
    SignaturePreAuthorized.assert(wrapped)
    SignaturePreAuthorized.assert({ keyAuthorization, signature })
    expect(() =>
      SignaturePreAuthorized.assert('0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidWrappedSignatureError: Value \`0xdeadbeef\` is an invalid pre-authorized signature.]`,
    )
    expect(() =>
      SignaturePreAuthorized.assert(null as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[SignaturePreAuthorized.InvalidUnwrappedSignatureError: Value is an invalid unwrapped pre-authorized signature: expected an object.]`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    const value = { keyAuthorization, signature }
    expect(SignaturePreAuthorized.from(value)).toBe(value)
  })

  test('behavior: hex', () => {
    expect(SignaturePreAuthorized.from(wrapped)).toEqual(
      SignaturePreAuthorized.unwrap(wrapped),
    )
  })
})

describe('validate', () => {
  test('default', () => {
    expect(SignaturePreAuthorized.validate(wrapped)).toBe(true)
    expect(SignaturePreAuthorized.validate('0xdeadbeef')).toBe(false)
    expect(
      SignaturePreAuthorized.validate(
        wrapRaw(Hex.concat(Hex.slice(wrapped, 0, -32), '0x00')),
      ),
    ).toBe(false)
    expect(SignaturePreAuthorized.validate(Hex.concat(wrapped, '0x00'))).toBe(
      false,
    )
  })
})
