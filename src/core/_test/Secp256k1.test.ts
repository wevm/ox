import { Address, Bytes, Hex, Mnemonic, PublicKey, Secp256k1 } from 'ox'
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

describe('fromMnemonic', () => {
  const mnemonic = 'test test test test test test test test test test test junk'

  test('default', () => {
    const privateKey = Secp256k1.fromMnemonic(mnemonic)

    expect(privateKey).toBe(Mnemonic.toPrivateKey(mnemonic, { as: 'Hex' }))
    expect(privateKey).toMatchInlineSnapshot(
      `"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"`,
    )
  })

  test('options: passphrase', () => {
    expect(
      Secp256k1.fromMnemonic(mnemonic, { passphrase: 'qwerty' }),
    ).toMatchInlineSnapshot(
      `"0x0bef893b1cc27e9ce726d5f12f75d61a07d4df87c02106083463cd712ac5c478"`,
    )
  })

  test('options: as', () => {
    const privateKey = Secp256k1.fromMnemonic(mnemonic, { as: 'Bytes' })

    expect(privateKey).toBeInstanceOf(Uint8Array)
    expect(privateKey).toHaveLength(32)
  })

  test('options: path', () => {
    const path = "m/44'/60'/0'/0/1"

    expect(Secp256k1.fromMnemonic(mnemonic, { path })).toBe(
      Mnemonic.toPrivateKey(mnemonic, { as: 'Hex', path }),
    )
  })
})

describe('fromSeed', () => {
  const seed =
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

  test('vector', () => {
    expect(Secp256k1.fromSeed(seed)).toMatchInlineSnapshot(
      `"0x5f7dcbba41adaafa378861d78b144f7b2827e79fa994a341628f5470d5bfbdd4"`,
    )
  })

  test('value: Bytes', () => {
    expect(Secp256k1.fromSeed(Bytes.fromHex(seed))).toMatchInlineSnapshot(
      `"0x5f7dcbba41adaafa378861d78b144f7b2827e79fa994a341628f5470d5bfbdd4"`,
    )
  })

  test('options: as', () => {
    expect(Secp256k1.fromSeed(seed, { as: 'Bytes' })).toEqual(
      Bytes.fromHex(
        '0x5f7dcbba41adaafa378861d78b144f7b2827e79fa994a341628f5470d5bfbdd4',
      ),
    )
  })

  test('behavior: accepts seeds longer than 32 bytes', () => {
    const privateKey = Secp256k1.fromSeed(new Uint8Array(64), { as: 'Bytes' })

    expect(Secp256k1.noble.utils.isValidPrivateKey(privateKey)).toBe(true)
  })

  test('error: seed is too short', () => {
    expect(() =>
      Secp256k1.fromSeed(new Uint8Array(31)),
    ).toThrowErrorMatchingInlineSnapshot(`
        [Secp256k1.InvalidSeedSizeError: Seed must contain at least 32 bytes. Received 31 bytes.]
      `)
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
        "r": 74352382517807082440778846078252240710763999160569457624520311883943391062769n,
        "s": 43375188480015931414505591342117068151247353833881461609019650667261881302875n,
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
        "r": 89036260706339362183898531363310683680162157132496689422406521430939707497224n,
        "s": 22310885159939283473640002814069314990500333570711854513358211093549688653897n,
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
      "r": 42395289763960325836777315020270385161624044426039905118158393530872007515822n,
      "s": 30406628000207299947338207254203930276142590474479134670945489721527570429874n,
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
      "fromMnemonic",
      "fromSeed",
      "getPublicKey",
      "getSharedSecret",
      "randomPrivateKey",
      "recoverAddress",
      "recoverPublicKey",
      "sign",
      "verify",
      "InvalidSeedSizeError",
    ]
  `)
})
