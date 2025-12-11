import { Address, Bytes, Hex, PublicKey, Secp256k1 } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('getPublicKey', () => {
  test('default', () => {
    {
      const publicKey = Secp256k1.getPublicKey({
        privateKey: accounts[0].privateKey,
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
      {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      }
    `,
      )
      expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
        accounts[0].address,
      )
    }

    {
      const publicKey = Secp256k1.getPublicKey({
        privateKey: Bytes.fromHex(accounts[0].privateKey),
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
      {
        "prefix": 4,
        "x": 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
        "y": 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
      }
    `,
      )
      expect(Address.fromPublicKey(publicKey).toLowerCase()).toEqual(
        accounts[0].address,
      )
    }
  })
})

describe('createKeyPair', () => {
  test('default', () => {
    const keyPair = Secp256k1.createKeyPair()

    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
    expect(typeof keyPair.privateKey).toBe('string')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(keyPair.privateKey.length).toBe(66)

    expect(keyPair.publicKey).toHaveProperty('prefix')
    expect(keyPair.publicKey).toHaveProperty('x')
    expect(keyPair.publicKey).toHaveProperty('y')
    expect(keyPair.publicKey.prefix).toBe(4)
    expect(typeof keyPair.publicKey.x).toBe('bigint')
    expect(typeof keyPair.publicKey.y).toBe('bigint')
  })

  test('behavior: deterministic public key derivation', () => {
    const keyPair = Secp256k1.createKeyPair()
    const derivedPublicKey = Secp256k1.getPublicKey({
      privateKey: keyPair.privateKey,
    })

    expect(keyPair.publicKey).toEqual(derivedPublicKey)
  })

  test('behavior: unique key pairs', () => {
    const keyPair1 = Secp256k1.createKeyPair()
    const keyPair2 = Secp256k1.createKeyPair()

    expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey)
    expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey)
  })

  test('behavior: valid for signing and verification', () => {
    const keyPair = Secp256k1.createKeyPair()
    const payload = '0xdeadbeef'

    const signature = Secp256k1.sign({
      payload,
      privateKey: keyPair.privateKey,
    })
    const isValid = Secp256k1.verify({
      publicKey: keyPair.publicKey,
      payload,
      signature,
    })

    expect(isValid).toBe(true)
  })

  test('options: as (Hex)', () => {
    const keyPair = Secp256k1.createKeyPair({ as: 'Hex' })

    expect(typeof keyPair.privateKey).toBe('string')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(keyPair.privateKey.length).toBe(66)
  })

  test('options: as (Bytes)', () => {
    const keyPair = Secp256k1.createKeyPair({ as: 'Bytes' })

    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.privateKey.length).toBe(32)
    expect(keyPair.publicKey).toHaveProperty('prefix')
    expect(keyPair.publicKey.prefix).toBe(4)
  })

  test('behavior: bytes format works with other functions', () => {
    const keyPair = Secp256k1.createKeyPair({ as: 'Bytes' })
    const derivedPublicKey = Secp256k1.getPublicKey({
      privateKey: keyPair.privateKey,
    })

    expect(keyPair.publicKey).toEqual(derivedPublicKey)
  })
})

describe('getSharedSecret', () => {
  test('default', () => {
    const privateKeyA = accounts[0].privateKey
    const privateKeyB = accounts[1].privateKey
    const publicKeyA = Secp256k1.getPublicKey({ privateKey: privateKeyA })
    const publicKeyB = Secp256k1.getPublicKey({ privateKey: privateKeyB })

    // Compute shared secret from A's perspective
    const sharedSecretA = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Compute shared secret from B's perspective
    const sharedSecretB = Secp256k1.getSharedSecret({
      privateKey: privateKeyB,
      publicKey: publicKeyA,
    })

    // ECDH property: both should be equal
    expect(sharedSecretA).toEqual(sharedSecretB)
    expect(typeof sharedSecretA).toBe('string')
    expect(sharedSecretA).toMatch(/^0x[0-9a-f]{66}$/)
  })

  test('behavior: different input types', () => {
    const privateKeyA = accounts[0].privateKey
    const privateKeyB = accounts[1].privateKey
    const publicKeyB = Secp256k1.getPublicKey({ privateKey: privateKeyB })

    // Test with Hex private key
    const sharedSecret1 = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Test with Bytes private key
    const sharedSecret2 = Secp256k1.getSharedSecret({
      privateKey: Bytes.fromHex(privateKeyA),
      publicKey: publicKeyB,
    })

    expect(sharedSecret1).toEqual(sharedSecret2)
  })

  test('behavior: compressed public key', () => {
    const privateKeyA = accounts[0].privateKey
    const privateKeyB = accounts[1].privateKey
    const publicKeyB = Secp256k1.getPublicKey({ privateKey: privateKeyB })
    const compressedPublicKeyB = PublicKey.compress(publicKeyB)

    const sharedSecret1 = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecret2 = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: compressedPublicKeyB,
    })

    expect(sharedSecret1).toEqual(sharedSecret2)
  })

  test('options: as', () => {
    const privateKeyA = accounts[0].privateKey
    const privateKeyB = accounts[1].privateKey
    const publicKeyB = Secp256k1.getPublicKey({ privateKey: privateKeyB })

    // Test Hex output (default)
    const sharedSecretHex = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Test Bytes output
    const sharedSecretBytes = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
      as: 'Bytes',
    })

    // Verify formats
    expect(typeof sharedSecretHex).toBe('string')
    expect(sharedSecretHex).toMatch(/^0x[0-9a-f]{66}$/)
    expect(sharedSecretBytes).toBeInstanceOf(Uint8Array)
    expect(sharedSecretBytes.length).toBe(33) // 33 bytes for compressed point

    // Verify they represent the same data
    expect(Hex.fromBytes(sharedSecretBytes)).toEqual(sharedSecretHex)
  })

  test('behavior: deterministic', () => {
    const privateKeyA = accounts[0].privateKey
    const privateKeyB = accounts[1].privateKey
    const publicKeyB = Secp256k1.getPublicKey({ privateKey: privateKeyB })

    const sharedSecret1 = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecret2 = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Should be deterministic - same inputs produce same output
    expect(sharedSecret1).toEqual(sharedSecret2)
  })

  test('behavior: different key pairs produce different secrets', () => {
    const privateKeyA = accounts[0].privateKey
    const privateKeyB = accounts[1].privateKey
    // Generate a third private key for testing
    const privateKeyC = Secp256k1.randomPrivateKey()
    const publicKeyB = Secp256k1.getPublicKey({ privateKey: privateKeyB })
    const publicKeyC = Secp256k1.getPublicKey({ privateKey: privateKeyC })

    const sharedSecretAB = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecretAC = Secp256k1.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyC,
    })

    // Different key pairs should produce different shared secrets
    expect(sharedSecretAB).not.toEqual(sharedSecretAC)
  })
})

describe('randomPrivateKey', () => {
  test('default', () => {
    const privateKey = Secp256k1.randomPrivateKey()
    expect(privateKey.length).toBe(66)
  })

  test('options: as', () => {
    const privateKey = Secp256k1.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey.length).toBe(32)
  })
})

describe('recoverAddress', () => {
  const address = accounts[0].address
  const privateKey = accounts[0].privateKey

  test('default', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(Secp256k1.recoverAddress({ payload, signature })).toBe(
      Address.from(address),
    )
  })
})

describe('recoverPublicKey', () => {
  const privateKey = accounts[0].privateKey

  test('default', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(Secp256k1.recoverPublicKey({ payload, signature })).toStrictEqual(
      Secp256k1.getPublicKey({ privateKey }),
    )
  })
})

describe('sign', () => {
  test('default', async () => {
    {
      const signature = Secp256k1.sign({
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
        {
          "r": "0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf1",
          "s": "0x5fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b",
          "yParity": 0,
        }
      `,
      )
      expect(
        Secp256k1.verify({
          address: accounts[0].address,
          payload:
            '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
          signature,
        }),
      ).toBe(true)
    }

    {
      const signature = Secp256k1.sign({
        payload: Bytes.fromHex(
          '0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae',
        ),
        privateKey: accounts[0].privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
        {
          "r": "0xc4d8bcda762d35ea79d9542b23200f46c2c1899db15bf929bbacaf609581db08",
          "s": "0x31538374a01206517edd934e474212a0f1e2d62e9a01cd64f1cf94ea2e098849",
          "yParity": 1,
        }
      `,
      )
      expect(
        Secp256k1.verify({
          address: accounts[0].address,
          payload:
            '0x9a74cb859ad30835ffb2da406423233c212cf6dd78e6c2c98b0c9289568954ae',
          signature,
        }),
      ).toBe(true)
    }
  })

  test('options: extraEntropy', () => {
    {
      const signature_1 = Secp256k1.sign({
        extraEntropy: false,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = Secp256k1.sign({
        extraEntropy: false,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).toEqual(signature_2)
    }

    {
      const signature_1 = Secp256k1.sign({
        extraEntropy: Hex.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = Secp256k1.sign({
        extraEntropy: Hex.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).not.toEqual(signature_2)
    }

    {
      const signature_1 = Secp256k1.sign({
        extraEntropy: Bytes.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = Secp256k1.sign({
        extraEntropy: Bytes.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).not.toEqual(signature_2)
    }
  })

  test('options: hash', () => {
    const signature = Secp256k1.sign({
      hash: true,
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey: accounts[0].privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
      {
        "r": "0x5dbae23786cd5e6400c475b88dd49ae003e28c28dd141943f9d242b028a05eae",
        "s": "0x43398aa40015d03a771c8b036e4525d2bf5cc8fb2a3f372f3d6f402ae69677b2",
        "yParity": 1,
      }
    `,
    )

    const publicKey = Secp256k1.getPublicKey({
      privateKey: accounts[0].privateKey,
    })

    expect(
      Secp256k1.verify({
        publicKey,
        hash: true,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        signature,
      }),
    ).toBe(true)
  })
})

describe('verify', () => {
  const address = accounts[0].address
  const privateKey = accounts[0].privateKey

  test('behavior: verify w/ address', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(Secp256k1.verify({ address, payload, signature })).toBe(true)
  })

  test('behavior: bytes payload', () => {
    const payload = '0xdeadbeef'
    const signature = Secp256k1.sign({ payload, privateKey })
    expect(
      Secp256k1.verify({ address, payload: Bytes.fromHex(payload), signature }),
    ).toBe(true)
  })

  test('behavior: verify w/ publicKey', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Secp256k1.sign({ payload, privateKey })
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    expect(Secp256k1.verify({ publicKey, payload, signature: { r, s } })).toBe(
      true,
    )
  })

  test('behavior: verify w/ compressed publicKey', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Secp256k1.sign({ payload, privateKey })
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const compressed = PublicKey.compress(publicKey)
    expect(
      Secp256k1.verify({ publicKey: compressed, payload, signature: { r, s } }),
    ).toBe(true)
  })

  test('options: hash', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Secp256k1.sign({ hash: true, payload, privateKey })
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    expect(
      Secp256k1.verify({ hash: true, publicKey, payload, signature: { r, s } }),
    ).toBe(true)
  })
})

test('exports', () => {
  expect(Object.keys(Secp256k1)).toMatchInlineSnapshot(`
    [
      "noble",
      "createKeyPair",
      "getPublicKey",
      "getSharedSecret",
      "randomPrivateKey",
      "recoverAddress",
      "recoverPublicKey",
      "sign",
      "verify",
    ]
  `)
})
