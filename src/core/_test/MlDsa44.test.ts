import { Bytes, Engine, Hash, Hex, MlDsa44 } from 'ox'
import { describe, expect, test } from 'vp/test'

const privateKey = Hex.fromBytes(new Uint8Array(32).fill(7))
const payload = '0xdeadbeef'

describe('createKeyPair', () => {
  test('default', () => {
    const keyPair = MlDsa44.createKeyPair()

    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/)
    expect(keyPair.publicKey).toMatch(/^0x[0-9a-f]{2624}$/)
  })

  test('behavior: as Bytes', () => {
    const keyPair = MlDsa44.createKeyPair({ as: 'Bytes' })

    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.privateKey).toHaveLength(MlDsa44.privateKeySize)
    expect(keyPair.publicKey).toHaveLength(MlDsa44.publicKeySize)
  })

  test('behavior: unique keys', () => {
    const keyPair1 = MlDsa44.createKeyPair()
    const keyPair2 = MlDsa44.createKeyPair()

    expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
    expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
  })

  test('behavior: public key is derivable from private key', () => {
    const { privateKey, publicKey } = MlDsa44.createKeyPair()

    expect(MlDsa44.getPublicKey({ privateKey })).toEqual(publicKey)
  })
})

describe('fromPrf', () => {
  test.each([
    {
      privateKey:
        '0x72bd14bc34a4c7ce64bd5dbfe0d432a1ab34cf1c364216c471d68a073d4fbb5b',
      prf: '0x0000000000000000000000000000000000000000000000000000000000000000',
    },
    {
      privateKey:
        '0xcc686ddfafe85330d7f270bf2fab31202b499a7e920ddbbd82cbb53759d4925c',
      prf: '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    },
  ] as const)('vector: $prf', ({ privateKey, prf }) => {
    expect(MlDsa44.fromPrf(prf)).toBe(privateKey)
  })

  test('value: Bytes', () => {
    const prf = Bytes.fromHex(
      '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    )
    expect(MlDsa44.fromPrf(prf)).toMatchInlineSnapshot(
      `"0xcc686ddfafe85330d7f270bf2fab31202b499a7e920ddbbd82cbb53759d4925c"`,
    )
  })

  test('options: as', () => {
    const privateKey = MlDsa44.fromPrf(
      '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      { as: 'Bytes' },
    )
    expect(privateKey).toEqual(
      Bytes.fromHex(
        '0xcc686ddfafe85330d7f270bf2fab31202b499a7e920ddbbd82cbb53759d4925c',
      ),
    )
  })

  test('behavior: `using` releases key material on scope exit', () => {
    const privateKey = MlDsa44.fromPrf(Bytes.random(32), { as: 'Bytes' })
    {
      using key = privateKey
      expect(key.some((byte) => byte !== 0)).toBe(true)
    }
    expect(privateKey.every((byte) => byte === 0)).toBe(true)
  })

  test('behavior: disposal is idempotent', () => {
    const privateKey = MlDsa44.fromPrf(Bytes.random(32), { as: 'Bytes' })
    privateKey[Symbol.dispose]()
    privateKey[Symbol.dispose]()
    expect(privateKey.every((byte) => byte === 0)).toBe(true)
  })

  test('behavior: output signs and verifies', () => {
    const privateKey = MlDsa44.fromPrf(Bytes.random(32))
    const publicKey = MlDsa44.getPublicKey({ privateKey })
    const signature = MlDsa44.sign({ payload, privateKey })

    expect(MlDsa44.verify({ payload, publicKey, signature })).toBe(true)
  })

  test('behavior: uses versioned label and zero counter', () => {
    const messages: Hex.Hex[] = []
    Engine.with(
      {
        Hash: {
          hmacSha256: (_key, message) => {
            messages.push(Hex.fromBytes(message))
            return new Uint8Array(32)
          },
        },
      },
      () =>
        MlDsa44.fromPrf(
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ),
    )

    expect(messages).toMatchInlineSnapshot(`
      [
        "0x6f782e6d6c64736134342e66726f6d5072662e763100000000",
      ]
    `)
  })

  test('behavior: zeroes intermediate key for Hex output', () => {
    const candidate = new Uint8Array(32).fill(1)
    Engine.with(
      {
        Hash: {
          hmacSha256: () => candidate,
        },
      },
      () =>
        MlDsa44.fromPrf(
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ),
    )

    expect(candidate).toEqual(new Uint8Array(32))
  })

  test('error: PRF output is too short', () => {
    expect(() => MlDsa44.fromPrf(new Uint8Array(31)))
      .toThrowErrorMatchingInlineSnapshot(`
        [MlDsa44.InvalidPrfSizeError: PRF output must be exactly 32 bytes. Received 31 bytes.]
      `)
  })

  test('error: PRF output is too long', () => {
    expect(() => MlDsa44.fromPrf(new Uint8Array(33)))
      .toThrowErrorMatchingInlineSnapshot(`
        [MlDsa44.InvalidPrfSizeError: PRF output must be exactly 32 bytes. Received 33 bytes.]
      `)
  })
})

describe('getPublicKey', () => {
  test('default', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })

    expect(Hex.size(publicKey)).toBe(MlDsa44.publicKeySize)
    expect(Hash.keccak256(publicKey)).toMatchInlineSnapshot(
      `"0xe7b0dd35ffdccafa66d393e2afa66e22f658b9b72cbe63a2f51f25f8b65db4ad"`,
    )
  })

  test('behavior: as Bytes', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey, as: 'Bytes' })

    expect(publicKey).toBeInstanceOf(Uint8Array)
    expect(publicKey).toHaveLength(MlDsa44.publicKeySize)
  })

  test('error: invalid private key size', () => {
    expect(() =>
      MlDsa44.getPublicKey({ privateKey: new Uint8Array(31) }),
    ).toThrowError()
  })
})

describe('randomPrivateKey', () => {
  test('default', () => {
    const privateKey = MlDsa44.randomPrivateKey()

    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/)
  })

  test('behavior: as Bytes', () => {
    const privateKey = MlDsa44.randomPrivateKey({ as: 'Bytes' })

    expect(privateKey).toBeInstanceOf(Uint8Array)
    expect(privateKey).toHaveLength(MlDsa44.privateKeySize)
  })
})

describe('sign', () => {
  test('default', () => {
    const signature = MlDsa44.sign({ payload, privateKey })

    expect(Hex.size(signature)).toBe(MlDsa44.signatureSize)
    expect(Hash.keccak256(signature)).toMatchInlineSnapshot(
      `"0x74ab423fe51d6e0ea20262b692822fcc3acfb25d1999d51254bb495bd5937ee5"`,
    )
  })

  test('behavior: deterministic by default', () => {
    expect(MlDsa44.sign({ payload, privateKey })).toBe(
      MlDsa44.sign({ payload, privateKey }),
    )
  })

  test('behavior: as Bytes', () => {
    const signature = MlDsa44.sign({ payload, privateKey, as: 'Bytes' })

    expect(signature).toBeInstanceOf(Uint8Array)
    expect(signature).toHaveLength(MlDsa44.signatureSize)
  })

  test('behavior: Bytes payload and private key', () => {
    const signature = MlDsa44.sign({
      payload: Bytes.fromHex(payload),
      privateKey: Bytes.fromHex(privateKey),
    })

    expect(signature).toBe(MlDsa44.sign({ payload, privateKey }))
  })

  test('behavior: context changes the signature', () => {
    const signature = MlDsa44.sign({ payload, privateKey, context: '0x0102' })

    expect(Hash.keccak256(signature)).toMatchInlineSnapshot(
      `"0x3e071d2ce96153573364c0b698796534ca6b527c808dc7b0d67c7e95a5031191"`,
    )
    expect(signature).not.toBe(MlDsa44.sign({ payload, privateKey }))
  })

  test('behavior: extra entropy', () => {
    const entropy = Hex.fromBytes(new Uint8Array(32).fill(9))
    const signature = MlDsa44.sign({
      payload,
      privateKey,
      extraEntropy: entropy,
    })

    expect(Hash.keccak256(signature)).toMatchInlineSnapshot(
      `"0x10acdef5788ed190658943c03546af20df32064da4d0e795503440e37089d188"`,
    )

    const hedged1 = MlDsa44.sign({ payload, privateKey, extraEntropy: true })
    const hedged2 = MlDsa44.sign({ payload, privateKey, extraEntropy: true })
    expect(hedged1).not.toBe(hedged2)

    const publicKey = MlDsa44.getPublicKey({ privateKey })
    expect(MlDsa44.verify({ payload, publicKey, signature: hedged1 })).toBe(
      true,
    )
    expect(MlDsa44.verify({ payload, publicKey, signature: hedged2 })).toBe(
      true,
    )
  })

  test('error: context too large', () => {
    expect(() =>
      MlDsa44.sign({ payload, privateKey, context: new Uint8Array(256) }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MlDsa44.InvalidContextSizeError: Context must be at most 255 bytes. Received 256 bytes.]`,
    )
  })

  test('error: invalid private key size', () => {
    expect(() =>
      MlDsa44.sign({ payload, privateKey: new Uint8Array(33) }),
    ).toThrowError()
  })
})

describe('verify', () => {
  test('default', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })
    const signature = MlDsa44.sign({ payload, privateKey })

    expect(MlDsa44.verify({ payload, publicKey, signature })).toBe(true)
  })

  test('behavior: rejects wrong payload', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })
    const signature = MlDsa44.sign({ payload, privateKey })

    expect(
      MlDsa44.verify({ payload: '0xbeefdead', publicKey, signature }),
    ).toBe(false)
  })

  test('behavior: rejects corrupted signature', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })
    const signature = MlDsa44.sign({ payload, privateKey, as: 'Bytes' })
    signature[0]! ^= 1

    expect(MlDsa44.verify({ payload, publicKey, signature })).toBe(false)
  })

  test('behavior: rejects malformed signature', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })

    expect(
      MlDsa44.verify({ payload, publicKey, signature: '0xdeadbeef' }),
    ).toBe(false)
  })

  test('behavior: rejects wrong public key', () => {
    const signature = MlDsa44.sign({ payload, privateKey })
    const { publicKey } = MlDsa44.createKeyPair()

    expect(MlDsa44.verify({ payload, publicKey, signature })).toBe(false)
  })

  test('behavior: context must match', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })
    const signature = MlDsa44.sign({ payload, privateKey, context: '0x0102' })

    expect(
      MlDsa44.verify({ payload, publicKey, signature, context: '0x0102' }),
    ).toBe(true)
    expect(MlDsa44.verify({ payload, publicKey, signature })).toBe(false)
    expect(
      MlDsa44.verify({ payload, publicKey, signature, context: '0x0103' }),
    ).toBe(false)
  })

  test('error: context too large', () => {
    const publicKey = MlDsa44.getPublicKey({ privateKey })
    const signature = MlDsa44.sign({ payload, privateKey })

    expect(() =>
      MlDsa44.verify({
        payload,
        publicKey,
        signature,
        context: new Uint8Array(256),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[MlDsa44.InvalidContextSizeError: Context must be at most 255 bytes. Received 256 bytes.]`,
    )
  })
})

describe('engine', () => {
  test('behavior: routes through installed overrides', () => {
    const calls: string[] = []
    const signature = new Uint8Array(MlDsa44.signatureSize).fill(1)

    const result = Engine.with(
      {
        MlDsa44: {
          sign: (payload, privateKey) => {
            calls.push(`sign:${payload.length}:${privateKey.length}`)
            return signature
          },
          verify: () => {
            calls.push('verify')
            return true
          },
        },
      },
      () => {
        const signed = MlDsa44.sign({ payload, privateKey, as: 'Bytes' })
        const verified = MlDsa44.verify({
          payload,
          publicKey: new Uint8Array(MlDsa44.publicKeySize),
          signature: signed,
        })
        return { signed, verified }
      },
    )

    expect(calls).toEqual(['sign:4:32', 'verify'])
    expect(result.signed).toEqual(signature)
    expect(result.verified).toBe(true)
  })

  test('behavior: overrides clear on reset', () => {
    Engine.set({ MlDsa44: { getPublicKey: () => new Uint8Array(1312) } })
    try {
      expect(MlDsa44.getPublicKey({ privateKey })).toBe(
        Hex.fromBytes(new Uint8Array(1312)),
      )
    } finally {
      Engine.reset('MlDsa44')
    }
    expect(Hash.keccak256(MlDsa44.getPublicKey({ privateKey }))).toBe(
      '0xe7b0dd35ffdccafa66d393e2afa66e22f658b9b72cbe63a2f51f25f8b65db4ad',
    )
  })
})

describe('constants', () => {
  test('sizes', () => {
    expect(MlDsa44.privateKeySize).toBe(32)
    expect(MlDsa44.publicKeySize).toBe(1312)
    expect(MlDsa44.signatureSize).toBe(2420)
    expect(MlDsa44.noble.lengths).toMatchObject({
      publicKey: 1312,
      secretKey: 2560,
      seed: 32,
      signature: 2420,
    })
  })
})
