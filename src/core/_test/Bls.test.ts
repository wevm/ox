import { Bls, Hex } from 'ox'
import { describe, expect, it, test } from 'vp/test'

const privateKey =
  '0x527f85c60ed7402247da21f1835cea651d0954fc15b7288f096d3608400cb6ac'

describe('aggregate', () => {
  test('default', () => {
    const payload = Hex.random(32)
    const privateKeys = Array.from({ length: 100 }, () =>
      Bls.randomPrivateKey(),
    )

    const signatures = privateKeys.map((privateKey) =>
      Bls.sign({ payload, privateKey }),
    )
    const signature = Bls.aggregate(signatures)

    const publicKeys = privateKeys.map((privateKey) =>
      Bls.getPublicKey({ privateKey }),
    )
    const publicKey = Bls.aggregate(publicKeys)

    const valid = Bls.verify({
      payload,
      publicKey,
      signature,
    })
    expect(valid).toBe(true)
  })

  test('size: "long-key:short-sig"', () => {
    const payload = Hex.random(32)
    const privateKeys = Array.from({ length: 100 }, () =>
      Bls.randomPrivateKey(),
    )

    const signatures = privateKeys.map((privateKey) =>
      Bls.sign({ payload, privateKey, size: 'long-key:short-sig' }),
    )
    const signature = Bls.aggregate(signatures)

    const publicKeys = privateKeys.map((privateKey) =>
      Bls.getPublicKey({ privateKey, size: 'long-key:short-sig' }),
    )
    const publicKey = Bls.aggregate(publicKeys)

    const valid = Bls.verify({
      payload,
      publicKey,
      signature,
    })
    expect(valid).toBe(true)
  })

  test('error: empty array', () => {
    expect(() => Bls.aggregate([])).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Bls.aggregate expects a non-empty array of points.]`,
    )
  })

  test('behavior: single-element array fast-returns the input', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    expect(Bls.aggregate([publicKey])).toBe(publicKey)
  })

  test('error: mixed groups', () => {
    const g1 = Bls.getPublicKey({ privateKey })
    const g2 = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    expect(() =>
      Bls.aggregate([g1, g2 as any]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Bls.aggregate expects all points to be from the same group (G1 or G2).]`,
    )
  })
})

describe('createKeyPair', () => {
  it('default', () => {
    const { privateKey, publicKey } = Bls.createKeyPair()
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(66)
    expect(publicKey).toBeDefined()
    expect(typeof publicKey.x).toBe('string')
    expect(typeof publicKey.y).toBe('string')
    expect(typeof publicKey.z).toBe('string')
  })

  it('as: bytes', () => {
    const { privateKey, publicKey } = Bls.createKeyPair({ as: 'Bytes' })
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(32)
    expect(publicKey).toBeDefined()
    expect(typeof publicKey.x).toBe('string')
    expect(typeof publicKey.y).toBe('string')
    expect(typeof publicKey.z).toBe('string')
  })

  it('size: "long-key:short-sig"', () => {
    const { privateKey, publicKey } = Bls.createKeyPair({
      size: 'long-key:short-sig',
    })
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(66)
    expect(publicKey).toBeDefined()
    expect(typeof publicKey.x).toBe('object')
    expect(typeof publicKey.y).toBe('object')
    expect(typeof publicKey.z).toBe('object')
  })

  it('should create functional key pair', () => {
    const { privateKey, publicKey } = Bls.createKeyPair()
    const payload = Hex.fromString('test message')

    const signature = Bls.sign({ payload, privateKey })
    const verified = Bls.verify({ payload, publicKey, signature })

    expect(verified).toBe(true)
  })

  it('should create functional key pair with long-key:short-sig', () => {
    const { privateKey, publicKey } = Bls.createKeyPair({
      size: 'long-key:short-sig',
    })
    const payload = Hex.fromString('test message')

    const signature = Bls.sign({
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })
    const verified = Bls.verify({ payload, publicKey, signature })

    expect(verified).toBe(true)
  })
})

describe('getPublicKey', () => {
  it('default', () => {
    const publicKey = Bls.getPublicKey({ privateKey })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "x": "0x0cafff52270773ad1728df2807c0f1b0b271fa6b37dfb8b2f75448573c76c81bcd6790328a60e40ef5a13343b32d9e66",
        "y": "0x160d458a5b862815046b66adad35c7fe0848d173219c011aa4d5e552f227c96889ecccafeb0bdba10d54f3713678dddd",
        "z": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
      }
    `)
  })

  it('size: "long-key:short-sig"', () => {
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "x": {
          "c0": "0x024f9fa9b67f716dfb74ae4efb7d9f1b7b43b4679abed6644cf476c12e79f309351ea8452487cd93f66e29e04ebe427c",
          "c1": "0x14698f7611999fba87033b9cf72312c76c683bbc48175e2d4cb275907d6a267ab9840a66e3051e5ed36fd13aa712f9a9",
        },
        "y": {
          "c0": "0x0d6d22d0d42bb58582c25a8e163ec6ebe866066149b339519a63154674d2299fcf810efa1426ecb4f197eb463b9f527d",
          "c1": "0x0d9c7848e42f8603207a492877ab9065bbd8f9b048ca0a51159676de3299358565b1a871bfdbd25539700cb4988bf03e",
        },
        "z": {
          "c0": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
          "c1": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        },
      }
    `)
  })
})

describe('randomPrivateKey', () => {
  it('default', () => {
    const privateKey = Bls.randomPrivateKey()
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(66)
  })

  it('as: bytes', () => {
    const privateKey = Bls.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey).toBeDefined()
    expect(privateKey.length).toBe(32)
  })
})

describe('sign', () => {
  test('default', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({ payload, privateKey })

    expect(signature).toMatchInlineSnapshot(`
      {
        "x": {
          "c0": "0x1856bcc293208adcf1dfe12b752470c7910e8919071b2f03249d0da78ec8f3ad5b01c0b2a675cf0d0b658580616c70fb",
          "c1": "0x1554be670320ec850f81f6197dc2b42a4586dd11e439b0779bdbb4fbf324d68190b781ee049b685b39c8cfa7387dc92b",
        },
        "y": {
          "c0": "0x11202c22b26cc40874bff43f3be3980eef19f19f8eeddb075c11d2c994d5e86fa3f8d701e56163f07c35e8c45124ae9d",
          "c1": "0x14787e145ea32f2543c31f187337d4e98dcc2152252d0bd90578fb852d4a4461d18f449deaf47ac837e1887d031cae1e",
        },
        "z": {
          "c0": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
          "c1": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        },
      }
    `)
  })

  test('size: "long-key:short-sig"', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })

    expect(signature).toMatchInlineSnapshot(`
      {
        "x": "0x1865b546866aa341024c0470d6500272c8bc368f0ae835ba957397b34f0df9896cc410e7314acd1c3260520d541f8ef6",
        "y": "0x0c99f061f3bc3fe58b13e44f1e8576773a93a95c5a105438aca913350b0088bbf16c808839166f068f49619ab083e5a7",
        "z": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001",
      }
    `)
  })
})

describe('verify', () => {
  test('default', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({ payload, privateKey })
    const publicKey = Bls.getPublicKey({ privateKey })
    const verified = Bls.verify({ payload, publicKey, signature })
    expect(verified).toBe(true)
  })

  test('size: "long-key:short-sig"', () => {
    const payload = Hex.fromString('hello world')
    const signature = Bls.sign({
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })
    const publicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const verified = Bls.verify({ payload, publicKey, signature })
    expect(verified).toBe(true)
  })
})

describe('as option / serialized inputs', () => {
  const privateKey =
    '0x527f85c60ed7402247da21f1835cea651d0954fc15b7288f096d3608400cb6ac'

  test("getPublicKey: as 'Hex' returns hex string", () => {
    const pkHex = Bls.getPublicKey({ privateKey, as: 'Hex' })
    expect(typeof pkHex).toBe('string')
    expect((pkHex as Hex.Hex).startsWith('0x')).toBe(true)
  })

  test("getPublicKey: as 'Bytes' returns Uint8Array", () => {
    const pkBytes = Bls.getPublicKey({ privateKey, as: 'Bytes' })
    expect(pkBytes).toBeInstanceOf(Uint8Array)
  })

  test('getPublicKey default as remains Object', () => {
    const pk = Bls.getPublicKey({ privateKey })
    expect(typeof pk).toBe('object')
    expect('z' in pk).toBe(true)
  })

  test("sign: as 'Hex' returns hex string", () => {
    const sigHex = Bls.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Hex',
    })
    expect(typeof sigHex).toBe('string')
  })

  test("sign: as 'Bytes' returns Uint8Array", () => {
    const sigBytes = Bls.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Bytes',
    })
    expect(sigBytes).toBeInstanceOf(Uint8Array)
  })

  test('verify accepts Hex publicKey + Hex signature', () => {
    const pkHex = Bls.getPublicKey({ privateKey, as: 'Hex' })
    const sigHex = Bls.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Hex',
    })
    expect(
      Bls.verify({
        payload: '0xdeadbeef',
        publicKey: pkHex,
        signature: sigHex,
      }),
    ).toBe(true)
  })

  test('verify accepts Bytes publicKey + Bytes signature', () => {
    const pkBytes = Bls.getPublicKey({ privateKey, as: 'Bytes' })
    const sigBytes = Bls.sign({
      payload: '0xdeadbeef',
      privateKey,
      as: 'Bytes',
    })
    expect(
      Bls.verify({
        payload: '0xdeadbeef',
        publicKey: pkBytes,
        signature: sigBytes,
      }),
    ).toBe(true)
  })

  test('aggregate accepts hex inputs with group hint', () => {
    const a = Bls.getPublicKey({ privateKey, as: 'Hex' })
    const b = Bls.getPublicKey({
      privateKey:
        '0x68f9b6c6e0a1f9e7a02e5a6eaae8aa5c4b6b9e1a8f5d8c7b6a5f4e3d2c1b0a9f',
      as: 'Hex',
    })
    const aggregated = Bls.aggregate([a, b], { group: 'G1' })
    // Should match aggregating from structured inputs.
    const aObj = Bls.getPublicKey({ privateKey })
    const bObj = Bls.getPublicKey({
      privateKey:
        '0x68f9b6c6e0a1f9e7a02e5a6eaae8aa5c4b6b9e1a8f5d8c7b6a5f4e3d2c1b0a9f',
    })
    const aggregatedObj = Bls.aggregate([aObj, bObj])
    expect(aggregated).toEqual(aggregatedObj)
  })

  test('aggregate throws if serialized inputs without group hint', () => {
    const a = Bls.getPublicKey({ privateKey, as: 'Hex' })
    expect(() => Bls.aggregate([a])).toThrow()
  })
})
