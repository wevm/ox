import { Address, Bytes, Hex, PublicKey, Secp256k1, Signature } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('getPublicKey', () => {
  test('default', () => {
    {
      const publicKey = Secp256k1.getPublicKey({
        privateKey: accounts[0].privateKey,
      })

      expect(publicKey).toMatchInlineSnapshot(
        `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
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
        `"0x048318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed753547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5"`,
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
    const publicKeyParts = PublicKey.toParts(keyPair.publicKey)

    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
    expect(typeof keyPair.privateKey).toBe('string')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(keyPair.privateKey.length).toBe(66)

    expect(publicKeyParts).toHaveProperty('prefix')
    expect(publicKeyParts).toHaveProperty('x')
    expect(publicKeyParts).toHaveProperty('y')
    expect(publicKeyParts.prefix).toBe(4)
    expect(typeof publicKeyParts.x).toBe('bigint')
    expect(typeof publicKeyParts.y).toBe('bigint')
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
    const publicKeyParts = PublicKey.toParts(keyPair.publicKey)

    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.privateKey.length).toBe(32)
    expect(publicKeyParts).toHaveProperty('prefix')
    expect(publicKeyParts.prefix).toBe(4)
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
        `"0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b1b"`,
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
        `"0xc4d8bcda762d35ea79d9542b23200f46c2c1899db15bf929bbacaf609581db0831538374a01206517edd934e474212a0f1e2d62e9a01cd64f1cf94ea2e0988491c"`,
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
      `"0x5dbae23786cd5e6400c475b88dd49ae003e28c28dd141943f9d242b028a05eae43398aa40015d03a771c8b036e4525d2bf5cc8fb2a3f372f3d6f402ae69677b21c"`,
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
    const { r, s } = Signature.toParts(Secp256k1.sign({ payload, privateKey }))
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    expect(Secp256k1.verify({ publicKey, payload, signature: { r, s } })).toBe(
      true,
    )
  })

  test('behavior: verify w/ compressed publicKey', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Signature.toParts(Secp256k1.sign({ payload, privateKey }))
    const publicKey = Secp256k1.getPublicKey({ privateKey })
    const compressed = PublicKey.compress(publicKey)
    expect(
      Secp256k1.verify({ publicKey: compressed, payload, signature: { r, s } }),
    ).toBe(true)
  })

  test('options: hash', () => {
    const payload = '0xdeadbeef'
    const { r, s } = Signature.toParts(
      Secp256k1.sign({ hash: true, payload, privateKey }),
    )
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

describe('as option', () => {
  test("sign + recoverPublicKey + getPublicKey: as 'Hex'", () => {
    const privateKey = accounts[0].privateKey
    const sigHex = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Hex',
    })
    expect(typeof sigHex).toBe('string')
    expect((sigHex as Hex.Hex).startsWith('0x')).toBe(true)

    const pkHex = Secp256k1.getPublicKey({ privateKey, as: 'Hex' })
    expect(typeof pkHex).toBe('string')

    const recoveredHex = Secp256k1.recoverPublicKey({
      payload: '0xdeadbeef',
      signature: sigHex,
      as: 'Hex',
    })
    expect(recoveredHex).toBe(pkHex)
  })

  test("sign + recoverPublicKey + getPublicKey: as 'Bytes'", () => {
    const privateKey = accounts[0].privateKey
    const sigBytes = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Bytes',
    })
    expect(sigBytes).toBeInstanceOf(Uint8Array)

    const pkBytes = Secp256k1.getPublicKey({ privateKey, as: 'Bytes' })
    expect(pkBytes).toBeInstanceOf(Uint8Array)

    const recoveredBytes = Secp256k1.recoverPublicKey({
      payload: '0xdeadbeef',
      signature: sigBytes,
      as: 'Bytes',
    })
    expect(recoveredBytes).toEqual(pkBytes)
  })

  test('default as remains Hex (no behavior regression)', () => {
    const sig = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey: accounts[0].privateKey,
    })
    expect(typeof sig).toBe('string')
    expect((sig as Hex.Hex).startsWith('0x')).toBe(true)
  })

  test('verify accepts Hex signature + Hex publicKey', () => {
    const privateKey = accounts[0].privateKey
    const sigHex = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Hex',
    })
    const pkHex = Secp256k1.getPublicKey({ privateKey, as: 'Hex' })
    expect(
      Secp256k1.verify({
        payload: '0xdeadbeef',
        publicKey: pkHex,
        signature: sigHex,
      }),
    ).toBe(true)
  })

  test('verify accepts Bytes signature + Bytes publicKey', () => {
    const privateKey = accounts[0].privateKey
    const sigBytes = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Bytes',
    })
    const pkBytes = Secp256k1.getPublicKey({ privateKey, as: 'Bytes' })
    expect(
      Secp256k1.verify({
        payload: '0xdeadbeef',
        publicKey: pkBytes,
        signature: sigBytes,
      }),
    ).toBe(true)
  })

  test('recoverAddress accepts Hex signature', () => {
    const privateKey = accounts[0].privateKey
    const sigHex = Secp256k1.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Hex',
    })
    expect(
      Secp256k1.recoverAddress({
        payload: '0xdeadbeef',
        signature: sigHex,
      }),
    ).toBe(Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey })))
  })

  test('getSharedSecret accepts Hex publicKey', () => {
    const a = Secp256k1.createKeyPair()
    const b = Secp256k1.createKeyPair()
    const bPubHex = PublicKey.toHex(b.publicKey)
    const ss1 = Secp256k1.getSharedSecret({
      privateKey: a.privateKey,
      publicKey: bPubHex,
    })
    const ss2 = Secp256k1.getSharedSecret({
      privateKey: a.privateKey,
      publicKey: b.publicKey,
    })
    expect(ss1).toBe(ss2)
  })
})
