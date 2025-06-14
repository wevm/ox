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
