import { Bytes, Hex, P256 } from 'ox'
import { describe, expect, test } from 'vitest'
import { accounts } from '../../../test/constants/accounts.js'

describe('getPublicKey', () => {
  const privateKey =
    '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'

  test('default', () => {
    {
      const publicKey = P256.getPublicKey({
        privateKey,
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
    {
      "prefix": 4,
      "x": 10551483369778534213743005046722587423472548496575383028418761641566343103239n,
      "y": 88295525029668593780823649128376935553570204792365777341876890493798599407244n,
    }
  `,
      )
    }

    {
      const publicKey = P256.getPublicKey({
        privateKey: Bytes.fromHex(accounts[0].privateKey),
      })

      expect(publicKey).toMatchInlineSnapshot(
        `
    {
      "prefix": 4,
      "x": 74284260781974828542656778781460620511024287575108245086657461940925169173577n,
      "y": 49004966777120461993240735637857463864712305111925716454339081891868780934195n,
    }
  `,
      )
    }
  })
})

describe('createKeyPair', () => {
  test('default', () => {
    const keyPair = P256.createKeyPair()

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
    const keyPair = P256.createKeyPair()
    const derivedPublicKey = P256.getPublicKey({
      privateKey: keyPair.privateKey,
    })

    expect(keyPair.publicKey).toEqual(derivedPublicKey)
  })

  test('behavior: unique key pairs', () => {
    const keyPair1 = P256.createKeyPair()
    const keyPair2 = P256.createKeyPair()

    expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey)
    expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey)
  })

  test('behavior: valid for signing and verification', () => {
    const keyPair = P256.createKeyPair()
    const payload = '0xdeadbeef'

    const signature = P256.sign({ payload, privateKey: keyPair.privateKey })
    const isValid = P256.verify({
      publicKey: keyPair.publicKey,
      payload,
      signature,
    })

    expect(isValid).toBe(true)
  })

  test('behavior: valid for ECDH key agreement', () => {
    const keyPairA = P256.createKeyPair()
    const keyPairB = P256.createKeyPair()

    const sharedSecretA = P256.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
    })

    const sharedSecretB = P256.getSharedSecret({
      privateKey: keyPairB.privateKey,
      publicKey: keyPairA.publicKey,
    })

    expect(sharedSecretA).toEqual(sharedSecretB)
    expect(typeof sharedSecretA).toBe('string')
    expect(sharedSecretA).toMatch(/^0x[0-9a-f]{66}$/)
  })

  test('options: as (Hex)', () => {
    const keyPair = P256.createKeyPair({ as: 'Hex' })

    expect(typeof keyPair.privateKey).toBe('string')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(keyPair.privateKey.length).toBe(66)
  })

  test('options: as (Bytes)', () => {
    const keyPair = P256.createKeyPair({ as: 'Bytes' })

    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.privateKey.length).toBe(32)
    expect(keyPair.publicKey).toHaveProperty('prefix')
    expect(keyPair.publicKey.prefix).toBe(4)
  })

  test('behavior: bytes format works with other functions', () => {
    const keyPair = P256.createKeyPair({ as: 'Bytes' })
    const derivedPublicKey = P256.getPublicKey({
      privateKey: keyPair.privateKey,
    })

    expect(keyPair.publicKey).toEqual(derivedPublicKey)
  })

  test('behavior: public key recovery', () => {
    const keyPair = P256.createKeyPair()
    const payload = '0xdeadbeef'
    const signature = P256.sign({ payload, privateKey: keyPair.privateKey })
    const recoveredPublicKey = P256.recoverPublicKey({ payload, signature })

    expect(recoveredPublicKey).toEqual(keyPair.publicKey)
  })
})

describe('getSharedSecret', () => {
  test('default', () => {
    const { privateKey: privateKeyA, publicKey: publicKeyA } =
      P256.createKeyPair()
    const { privateKey: privateKeyB, publicKey: publicKeyB } =
      P256.createKeyPair()

    // Compute shared secret from A's perspective
    const sharedSecretA = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Compute shared secret from B's perspective
    const sharedSecretB = P256.getSharedSecret({
      privateKey: privateKeyB,
      publicKey: publicKeyA,
    })

    // ECDH property: both should be equal
    expect(sharedSecretA).toEqual(sharedSecretB)
    expect(typeof sharedSecretA).toBe('string')
    expect(sharedSecretA).toMatch(/^0x[0-9a-f]{66}$/)
  })

  test('behavior: known test vectors', () => {
    // Use fixed keys for deterministic testing
    const privateKeyA =
      '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'
    const privateKeyB =
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const publicKeyA = P256.getPublicKey({ privateKey: privateKeyA })
    const publicKeyB = P256.getPublicKey({ privateKey: privateKeyB })

    const sharedSecretA = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecretB = P256.getSharedSecret({
      privateKey: privateKeyB,
      publicKey: publicKeyA,
    })

    expect(sharedSecretA).toEqual(sharedSecretB)
    expect(sharedSecretA).toMatchInlineSnapshot(
      '"0x02e0ad69b35f127c5d81d1aababa10ec6b3579ba9413d9b561203ddfa1df257af6"',
    )
  })

  test('behavior: different input types', () => {
    const { privateKey: privateKeyA } = P256.createKeyPair()
    const { publicKey: publicKeyB } = P256.createKeyPair()

    // Test with Hex private key
    const sharedSecret1 = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Test with Bytes private key
    const sharedSecret2 = P256.getSharedSecret({
      privateKey: Bytes.fromHex(privateKeyA),
      publicKey: publicKeyB,
    })

    expect(sharedSecret1).toEqual(sharedSecret2)
  })

  test('behavior: uncompressed public key', () => {
    const { privateKey: privateKeyA } = P256.createKeyPair()
    const { publicKey: publicKeyB } = P256.createKeyPair()

    // Ensure the public key is uncompressed (prefix 4)
    expect(publicKeyB.prefix).toBe(4)

    const sharedSecret = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    expect(typeof sharedSecret).toBe('string')
    expect(sharedSecret).toMatch(/^0x[0-9a-f]{66}$/)
  })

  test('options: as', () => {
    const { privateKey: privateKeyA } = P256.createKeyPair()
    const { publicKey: publicKeyB } = P256.createKeyPair()

    // Test Hex output (default)
    const sharedSecretHex = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Test Bytes output
    const sharedSecretBytes = P256.getSharedSecret({
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
    const privateKeyA = P256.randomPrivateKey()
    const privateKeyB = P256.randomPrivateKey()
    const publicKeyB = P256.getPublicKey({ privateKey: privateKeyB })

    const sharedSecret1 = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecret2 = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    // Should be deterministic - same inputs produce same output
    expect(sharedSecret1).toEqual(sharedSecret2)
  })

  test('behavior: different key pairs produce different secrets', () => {
    const privateKeyA = P256.randomPrivateKey()
    const privateKeyB = P256.randomPrivateKey()
    const privateKeyC = P256.randomPrivateKey()
    const publicKeyB = P256.getPublicKey({ privateKey: privateKeyB })
    const publicKeyC = P256.getPublicKey({ privateKey: privateKeyC })

    const sharedSecretAB = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    const sharedSecretAC = P256.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyC,
    })

    // Different key pairs should produce different shared secrets
    expect(sharedSecretAB).not.toEqual(sharedSecretAC)
  })

  test('error: invalid private key', () => {
    const publicKeyB = P256.getPublicKey({
      privateKey: P256.randomPrivateKey(),
    })

    expect(() =>
      P256.getSharedSecret({
        privateKey: '0x00',
        publicKey: publicKeyB,
      }),
    ).toThrow()
  })

  test('error: invalid public key', () => {
    const privateKeyA = P256.randomPrivateKey()
    const invalidPublicKey = { prefix: 4, x: 0n, y: 0n } as const

    expect(() =>
      P256.getSharedSecret({
        privateKey: privateKeyA,
        publicKey: invalidPublicKey,
      }),
    ).toThrow()
  })
})

describe('randomPrivateKey', () => {
  test('default', () => {
    const privateKey = P256.randomPrivateKey()
    expect(privateKey.length).toBe(66)
  })

  test('options: as', () => {
    const privateKey = P256.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey.length).toBe(32)
  })
})

describe('recoverPublicKey', () => {
  const privateKey = P256.randomPrivateKey()

  test('default', () => {
    const payload = '0xdeadbeef'
    const signature = P256.sign({ payload, privateKey })
    expect(P256.recoverPublicKey({ payload, signature })).toStrictEqual(
      P256.getPublicKey({ privateKey }),
    )
  })
})

describe('sign', () => {
  const privateKey =
    '0xdde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5'
  const publicKey = P256.getPublicKey({ privateKey })

  test('default', async () => {
    {
      const signature = P256.sign({
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
        {
          "r": 25696373395957984486324188498890325781005829812399813021478384321951480608605n,
          "s": 44320676628162932405815850946781131436023797452754174109610070201481442411520n,
          "yParity": 1,
        }
      `,
      )
      expect(
        P256.verify({
          publicKey,
          payload:
            '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
          signature,
        }),
      ).toBe(true)
      expect(
        P256.verify({
          publicKey,
          payload: '0xbeef',
          signature,
        }),
      ).toBe(false)
    }

    {
      const signature = P256.sign({
        payload: Bytes.fromHex(
          '0xdeadbeef1aaaa22111231241220000123aaaaabbccababab2211',
        ),
        privateKey,
      })
      expect(signature).toMatchInlineSnapshot(
        `
        {
          "r": 109093915289726021639001379260733771573757231672849462488223442695417941697300n,
          "s": 6698841733262193840826736319213924566905321252379319222891108166116990474980n,
          "yParity": 0,
        }
      `,
      )
      expect(
        P256.verify({
          publicKey,
          payload: '0xdeadbeef1aaaa22111231241220000123aaaaabbccababab2211',
          signature,
        }),
      ).toBe(true)
      expect(
        P256.verify({
          publicKey,
          payload: '0xbeef',
          signature,
        }),
      ).toBe(false)
    }
  })

  test('options: hash', () => {
    const signature = P256.sign({
      hash: true,
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey,
    })
    expect(signature).toMatchInlineSnapshot(
      `
  {
    "r": 38589374264307162948518251922729143918445204519165784874036137623135009958234n,
    "s": 201259577542353941908945259470130875727678910646252042669727980758229302244n,
    "yParity": 0,
  }
`,
    )
    expect(
      P256.verify({
        hash: true,
        publicKey,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        signature,
      }),
    ).toBe(true)
    expect(
      P256.verify({
        hash: true,
        publicKey,
        payload: '0xbeef',
        signature,
      }),
    ).toBe(false)
  })

  test('options: extraEntropy', () => {
    {
      const signature_1 = P256.sign({
        extraEntropy: false,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = P256.sign({
        extraEntropy: false,
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).toEqual(signature_2)
    }

    {
      const signature_1 = P256.sign({
        extraEntropy: Hex.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = P256.sign({
        extraEntropy: Hex.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).not.toEqual(signature_2)
    }

    {
      const signature_1 = P256.sign({
        extraEntropy: Bytes.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      const signature_2 = P256.sign({
        extraEntropy: Bytes.random(32),
        payload:
          '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
        privateKey: accounts[0].privateKey,
      })
      expect(signature_1).not.toEqual(signature_2)
    }
  })
})

describe('verify', () => {
  const privateKey = accounts[0].privateKey

  test('default', () => {
    const payload = '0xdeadbeef'
    const { r, s } = P256.sign({ payload, privateKey })
    const publicKey = P256.getPublicKey({ privateKey })
    expect(P256.verify({ publicKey, payload, signature: { r, s } })).toBe(true)
  })

  test('behavior: bytes payload', () => {
    const payload = '0xdeadbeef'
    const { r, s } = P256.sign({ payload, privateKey })
    const publicKey = P256.getPublicKey({ privateKey })
    expect(
      P256.verify({
        publicKey,
        payload: Bytes.fromHex(payload),
        signature: { r, s },
      }),
    ).toBe(true)
  })

  test('options: hash', () => {
    const payload = '0xdeadbeef'
    const { r, s } = P256.sign({ hash: true, payload, privateKey })
    const publicKey = P256.getPublicKey({ privateKey })
    expect(
      P256.verify({ hash: true, publicKey, payload, signature: { r, s } }),
    ).toBe(true)
  })
})

test('exports', () => {
  expect(Object.keys(P256)).toMatchInlineSnapshot(`
    [
      "noble",
      "createKeyPair",
      "getPublicKey",
      "getSharedSecret",
      "randomPrivateKey",
      "recoverPublicKey",
      "sign",
      "verify",
    ]
  `)
})
