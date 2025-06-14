import { Hex, PublicKey, WebCryptoP256 } from 'ox'
import { describe, expect, test } from 'vitest'

const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()

describe('createKeyPair', () => {
  test('default', async () => {
    const key = await WebCryptoP256.createKeyPair()
    expect(key.privateKey).toBeDefined()
    expect(key.publicKey.prefix).toBeDefined()
    expect(key.publicKey.x).toBeDefined()
    expect(key.publicKey.y).toBeDefined()
  })
})

describe('createKeyPairECDH', () => {
  test('default', async () => {
    const key = await WebCryptoP256.createKeyPairECDH()
    expect(key.privateKey).toBeDefined()
    expect(key.privateKey.algorithm.name).toBe('ECDH')
    expect((key.privateKey.algorithm as EcKeyAlgorithm).namedCurve).toBe(
      'P-256',
    )
    expect(key.privateKey.usages).toContain('deriveBits')
    expect(key.publicKey.prefix).toBeDefined()
    expect(key.publicKey.x).toBeDefined()
    expect(key.publicKey.y).toBeDefined()
  })

  test('options: extractable', async () => {
    const keyExtractable = await WebCryptoP256.createKeyPairECDH({
      extractable: true,
    })
    const keyNonExtractable = await WebCryptoP256.createKeyPairECDH({
      extractable: false,
    })

    expect(keyExtractable.privateKey.extractable).toBe(true)
    expect(keyNonExtractable.privateKey.extractable).toBe(false)
  })
})

describe('getSharedSecret', () => {
  test('default', async () => {
    const { privateKey: privateKeyA, publicKey: publicKeyA } =
      await WebCryptoP256.createKeyPairECDH()
    const { privateKey: privateKeyB, publicKey: publicKeyB } =
      await WebCryptoP256.createKeyPairECDH()

    const sharedSecretA = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecretB = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyB,
      publicKey: publicKeyA,
    })

    expect(sharedSecretA).toEqual(sharedSecretB)
  })

  test('behavior: same key pairs produce same secret', async () => {
    const { privateKey: privateKeyA } = await WebCryptoP256.createKeyPairECDH()
    const { publicKey: publicKeyB } = await WebCryptoP256.createKeyPairECDH()

    const sharedSecret1 = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecret2 = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Should be deterministic - same inputs produce same output
    expect(sharedSecret1).toEqual(sharedSecret2)
  })

  test('behavior: different key pairs produce different secrets', async () => {
    const { privateKey: privateKeyA } = await WebCryptoP256.createKeyPairECDH()
    const { publicKey: publicKeyB } = await WebCryptoP256.createKeyPairECDH()
    const { publicKey: publicKeyC } = await WebCryptoP256.createKeyPairECDH()

    const sharedSecretAB = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecretAC = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyC,
    })

    // Different key pairs should produce different shared secrets
    expect(sharedSecretAB).not.toEqual(sharedSecretAC)
  })

  test('options: as', async () => {
    const { privateKey: privateKeyA } = await WebCryptoP256.createKeyPairECDH()
    const { publicKey: publicKeyB } = await WebCryptoP256.createKeyPairECDH()

    // Test Hex output (default)
    const sharedSecretHex = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Test Bytes output
    const sharedSecretBytes = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
      as: 'Bytes',
    })

    // Verify formats
    expect(typeof sharedSecretHex).toBe('string')
    expect(sharedSecretHex).toMatch(/^0x[0-9a-f]{64}$/)
    expect(sharedSecretBytes).toBeInstanceOf(Uint8Array)
    expect(sharedSecretBytes.length).toBe(32) // 32 bytes for raw shared secret

    // Verify they represent the same data
    expect(Hex.fromBytes(sharedSecretBytes)).toEqual(sharedSecretHex)
  })

  test('behavior: compressed public key', async () => {
    const { privateKey: privateKeyA, ...A } =
      await WebCryptoP256.createKeyPairECDH()
    const { privateKey: privateKeyB, ...B } =
      await WebCryptoP256.createKeyPairECDH()

    const publicKeyA = PublicKey.compress(A.publicKey)
    const publicKeyB = PublicKey.compress(B.publicKey)

    const sharedSecret = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })
    const sharedSecret2 = await WebCryptoP256.getSharedSecret({
      privateKey: privateKeyB,
      publicKey: publicKeyA,
    })

    expect(sharedSecret).toEqual(sharedSecret2)
  })

  test('error: private key not for ECDH', async () => {
    const { privateKey: ecdsaPrivateKey } = await WebCryptoP256.createKeyPair() // ECDSA key
    const { publicKey: publicKeyB } = await WebCryptoP256.createKeyPairECDH()

    await expect(
      WebCryptoP256.getSharedSecret({
        privateKey: ecdsaPrivateKey,
        publicKey: publicKeyB,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Error: privateKey is not compatible with ECDH. please use `createKeyPairECDH` to create an ECDH key.]',
    )
  })

  test('error: invalid public key', async () => {
    const { privateKey: privateKeyA } = await WebCryptoP256.createKeyPairECDH()
    const invalidPublicKey = { prefix: 4, x: 0n, y: 0n } as const

    await expect(
      WebCryptoP256.getSharedSecret({
        privateKey: privateKeyA,
        publicKey: invalidPublicKey,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot('[DataError: Invalid keyData]')
  })
})

describe('sign', () => {
  test('default', async () => {
    const signature = await WebCryptoP256.sign({
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey,
    })
    expect(signature.r).toBeDefined()
    expect(signature.s).toBeDefined()
  })
})

describe('verify', () => {
  test('default', async () => {
    const payload = '0xdeadbeef'
    const { r, s } = await WebCryptoP256.sign({ payload, privateKey })
    expect(
      await WebCryptoP256.verify({ publicKey, payload, signature: { r, s } }),
    ).toBe(true)
  })
})

test('exports', () => {
  expect(Object.keys(WebCryptoP256)).toMatchInlineSnapshot(`
    [
      "createKeyPair",
      "createKeyPairECDH",
      "getSharedSecret",
      "sign",
      "verify",
    ]
  `)
})
