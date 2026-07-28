import { Bls, BlsPoint, Bytes, Engine, Hex } from 'ox'
import { describe, expect, it, test } from 'vp/test'

const privateKey =
  '0x527f85c60ed7402247da21f1835cea651d0954fc15b7288f096d3608400cb6ac'
const otherPrivateKey =
  '0x68f9b6c6e0a1f9e7a02e5a6eaae8aa5c4b6b9e1a8f5d8c7b6a5f4e3d2c1b0a9f'
const payload = '0xdeadbeef'

function offsetView(bytes: Bytes.Bytes) {
  const buffer = new Uint8Array(bytes.length + 4)
  buffer.set(bytes, 2)
  return buffer.subarray(2, -2)
}

function compressedBytes(length: number) {
  const bytes = new Uint8Array(length)
  bytes[0] = 0x80
  return bytes
}

const g1Infinity = new Uint8Array(48)
g1Infinity[0] = 0xc0
const g2Infinity = new Uint8Array(96)
g2Infinity[0] = 0xc0

const g1NonSubgroup = Hex.toBytes(
  '0x800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
)
const g2NonSubgroup = Hex.toBytes(
  '0x800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
)

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

  test('behavior: serialized single-element array returns an object without consulting the engine', () => {
    const publicKey = Bls.getPublicKey({ privateKey, as: 'Bytes' })
    let called = false
    const result = Engine.with(
      {
        Bls: {
          aggregate: () => {
            called = true
            return publicKey
          },
        },
      },
      () => Bls.aggregate([publicKey], { group: 'G1' }),
    )

    expect(called).toBe(false)
    expect(result).toEqual(BlsPoint.fromBytes(publicKey, 'G1'))
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

  test('error: mixed structured and serialized groups', () => {
    const g1 = Bls.getPublicKey({ privateKey })
    const g2 = Bls.getPublicKey({
      as: 'Bytes',
      privateKey,
      size: 'long-key:short-sig',
    })
    expect(() =>
      Bls.aggregate([g1, g2], { group: 'G2' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Bls.aggregate expects all points to be from the same group (G1 or G2).]`,
    )
  })

  test('error: malformed serialized input precedes mixed groups', () => {
    const g1 = Bls.getPublicKey({ privateKey })
    expect(() =>
      Bls.aggregate([g1, new Uint8Array(96)], { group: 'G2' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 192 bytes]`,
    )
  })

  test('error: malformed serialized input precedes structured serialization', () => {
    const malformedStructured = {
      x: '0x00',
      y: '0x00',
      z: '0x00',
    } as BlsPoint.G1
    expect(() =>
      Bls.aggregate([malformedStructured, new Uint8Array(48)], {
        group: 'G1',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G1 point: expected 96 bytes]`,
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
  test.each([
    {
      group: 'G1',
      size: 'short-key:long-sig',
    },
    {
      group: 'G2',
      size: 'long-key:short-sig',
    },
  ] as const)(
    'getPublicKey: $group is equivalent as Object, Bytes, and Hex',
    ({ group, size }) => {
      const object = Bls.getPublicKey({ privateKey, size })
      const bytes = Bls.getPublicKey({ as: 'Bytes', privateKey, size })
      const hex = Bls.getPublicKey({ as: 'Hex', privateKey, size })

      expect(bytes).toEqual(BlsPoint.toBytes(object))
      expect(hex).toBe(BlsPoint.toHex(object))
      expect(BlsPoint.fromBytes(bytes, group)).toEqual(object)
    },
  )

  test.each([
    {
      group: 'G2',
      size: 'short-key:long-sig',
    },
    {
      group: 'G1',
      size: 'long-key:short-sig',
    },
  ] as const)(
    'sign: $group is equivalent as Object, Bytes, and Hex',
    ({ group, size }) => {
      const object = Bls.sign({ payload, privateKey, size })
      const bytes = Bls.sign({ as: 'Bytes', payload, privateKey, size })
      const hex = Bls.sign({ as: 'Hex', payload, privateKey, size })

      expect(bytes).toEqual(BlsPoint.toBytes(object))
      expect(hex).toBe(BlsPoint.toHex(object))
      expect(BlsPoint.fromBytes(bytes, group)).toEqual(object)
    },
  )

  test.each([
    {
      size: 'short-key:long-sig',
    },
    {
      size: 'long-key:short-sig',
    },
  ] as const)(
    'verify accepts every public key and signature representation ($size)',
    ({ size }) => {
      const publicKeys = [
        Bls.getPublicKey({ privateKey, size }),
        Bls.getPublicKey({ as: 'Bytes', privateKey, size }),
        Bls.getPublicKey({ as: 'Hex', privateKey, size }),
      ] as const
      const signatures = [
        Bls.sign({ payload, privateKey, size }),
        Bls.sign({ as: 'Bytes', payload, privateKey, size }),
        Bls.sign({ as: 'Hex', payload, privateKey, size }),
      ] as const

      for (const publicKey of publicKeys)
        for (const signature of signatures)
          expect(
            Bls.verify({
              payload,
              publicKey: publicKey as never,
              signature: signature as never,
            }),
          ).toBe(true)
    },
  )

  test('aggregate accepts hex inputs with group hint', () => {
    const a = Bls.getPublicKey({ privateKey, as: 'Hex' })
    const b = Bls.getPublicKey({
      privateKey: otherPrivateKey,
      as: 'Hex',
    })
    const aggregated = Bls.aggregate([a, b], { group: 'G1' })
    // Should match aggregating from structured inputs.
    const aObj = Bls.getPublicKey({ privateKey })
    const bObj = Bls.getPublicKey({
      privateKey: otherPrivateKey,
    })
    const aggregatedObj = Bls.aggregate([aObj, bObj])
    expect(aggregated).toEqual(aggregatedObj)
  })

  test.each([
    {
      group: 'G1',
      size: 'short-key:long-sig',
    },
    {
      group: 'G2',
      size: 'long-key:short-sig',
    },
  ] as const)(
    'aggregate accepts mixed $group representations',
    ({ group, size }) => {
      const points = [
        Bls.getPublicKey({ privateKey, size }),
        Bls.getPublicKey({
          as: 'Bytes',
          privateKey: otherPrivateKey,
          size,
        }),
        Bls.getPublicKey({ as: 'Hex', privateKey, size }),
      ] as const
      const expected = Bls.aggregate(
        points.map((point) =>
          typeof point === 'string'
            ? BlsPoint.fromHex(point, group)
            : point instanceof Uint8Array
              ? BlsPoint.fromBytes(point, group)
              : point,
        ),
      )

      expect(Bls.aggregate(points, { group })).toEqual(expected)
    },
  )

  test('aggregate throws if serialized inputs without group hint', () => {
    const a = Bls.getPublicKey({ privateKey, as: 'Hex' })
    expect(() => Bls.aggregate([a])).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Bls.aggregate requires \`options.group\` (\`"G1"\` or \`"G2"\`) when passing serialized points.]`,
    )
  })
})

describe('serialized engine handoff', () => {
  test('getPublicKey and sign reject wrong-length custom-engine outputs', () => {
    Engine.with(
      {
        Bls: {
          getPublicKey: (_, group) => compressedBytes(group === 'G1' ? 47 : 95),
          sign: (_, __, { group }) => compressedBytes(group === 'G1' ? 47 : 95),
        },
      },
      () => {
        expect(() =>
          Bls.getPublicKey({ as: 'Bytes', privateKey }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[BaseError: Expected 48 bytes for a G1 point, received 47.]`,
        )
        expect(() =>
          Bls.getPublicKey({
            as: 'Bytes',
            privateKey,
            size: 'long-key:short-sig',
          }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[BaseError: Expected 96 bytes for a G2 point, received 95.]`,
        )
        expect(() =>
          Bls.sign({ as: 'Bytes', payload, privateKey }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[BaseError: Expected 96 bytes for a G2 point, received 95.]`,
        )
        expect(() =>
          Bls.sign({
            as: 'Bytes',
            payload,
            privateKey,
            size: 'long-key:short-sig',
          }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[BaseError: Expected 48 bytes for a G1 point, received 47.]`,
        )
      },
    )
  })

  test('getPublicKey and sign return serialized custom-engine outputs directly', () => {
    const g1 = new Uint8Array(48)
    const g2 = new Uint8Array(96)

    Engine.with(
      {
        Bls: {
          getPublicKey: (_, group) => (group === 'G1' ? g1 : g2),
          sign: (_, __, { group }) => (group === 'G1' ? g1 : g2),
        },
      },
      () => {
        expect(Bls.getPublicKey({ as: 'Bytes', privateKey })).toBe(g1)
        expect(Bls.getPublicKey({ as: 'Hex', privateKey })).toBe(
          Hex.fromBytes(g1),
        )
        expect(() =>
          Bls.getPublicKey({ privateKey }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: invalid G1 point: expected 96 bytes]`,
        )

        expect(
          Bls.getPublicKey({
            as: 'Bytes',
            privateKey,
            size: 'long-key:short-sig',
          }),
        ).toBe(g2)

        expect(Bls.sign({ as: 'Bytes', payload, privateKey })).toBe(g2)
        expect(Bls.sign({ as: 'Hex', payload, privateKey })).toBe(
          Hex.fromBytes(g2),
        )
        expect(() =>
          Bls.sign({ payload, privateKey }),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: invalid G2 point: expected 192 bytes]`,
        )
        expect(
          Bls.sign({
            as: 'Bytes',
            payload,
            privateKey,
            size: 'long-key:short-sig',
          }),
        ).toBe(g1)
      },
    )
  })

  test('aggregate forwards serialized byte views directly', () => {
    const first = offsetView(
      Bls.getPublicKey({ as: 'Bytes', privateKey }),
    ) as BlsPoint.G1Bytes
    const second = offsetView(
      Bls.getPublicKey({ as: 'Bytes', privateKey: otherPrivateKey }),
    ) as BlsPoint.G1Bytes
    const before = [first.slice(), second.slice()]
    const result = BlsPoint.toBytes(
      Bls.aggregate([
        BlsPoint.fromBytes(first, 'G1'),
        BlsPoint.fromBytes(second, 'G1'),
      ]),
    )
    let received: readonly Uint8Array[] | undefined

    Engine.with(
      {
        Bls: {
          aggregate: (points) => {
            received = points
            return result
          },
        },
      },
      () => Bls.aggregate([first, second], { group: 'G1' }),
    )

    expect(received?.[0]).toBe(first)
    expect(received?.[1]).toBe(second)
    expect(first).toEqual(before[0])
    expect(second).toEqual(before[1])
  })

  test('verify forwards serialized byte views directly', () => {
    const publicKey = offsetView(
      Bls.getPublicKey({ as: 'Bytes', privateKey }),
    ) as BlsPoint.G1Bytes
    const signature = offsetView(
      Bls.sign({ as: 'Bytes', payload, privateKey }),
    ) as BlsPoint.G2Bytes
    const publicKeyBefore = publicKey.slice()
    const signatureBefore = signature.slice()
    let received:
      | {
          publicKey: Uint8Array
          signature: Uint8Array
        }
      | undefined

    const verified = Engine.with(
      {
        Bls: {
          verify: (signature, _payload, publicKey) => {
            received = { publicKey, signature }
            return true
          },
        },
      },
      () => Bls.verify({ payload, publicKey, signature }),
    )

    expect(verified).toBe(true)
    expect(received?.publicKey).toBe(publicKey)
    expect(received?.signature).toBe(signature)
    expect(publicKey).toEqual(publicKeyBefore)
    expect(signature).toEqual(signatureBefore)
  })

  test('default serialized outputs are fresh and caller-owned', () => {
    const publicKeyA = Bls.getPublicKey({ as: 'Bytes', privateKey })
    const publicKeyB = Bls.getPublicKey({ as: 'Bytes', privateKey })
    const signatureA = Bls.sign({ as: 'Bytes', payload, privateKey })
    const signatureB = Bls.sign({ as: 'Bytes', payload, privateKey })
    const publicKeyB_ = publicKeyB.slice()
    const signatureB_ = signatureB.slice()

    publicKeyA.fill(0)
    signatureA.fill(0)

    expect(publicKeyA).not.toBe(publicKeyB)
    expect(signatureA).not.toBe(signatureB)
    expect(publicKeyB).toEqual(publicKeyB_)
    expect(signatureB).toEqual(signatureB_)
  })

  test('default operations do not mutate serialized input views', () => {
    const publicKeyA = offsetView(
      Bls.getPublicKey({ as: 'Bytes', privateKey }),
    ) as BlsPoint.G1Bytes
    const publicKeyB = offsetView(
      Bls.getPublicKey({ as: 'Bytes', privateKey: otherPrivateKey }),
    ) as BlsPoint.G1Bytes
    const signature = offsetView(
      Bls.sign({ as: 'Bytes', payload, privateKey }),
    ) as BlsPoint.G2Bytes
    const before = [publicKeyA.slice(), publicKeyB.slice(), signature.slice()]

    Bls.aggregate([publicKeyA, publicKeyB], { group: 'G1' })
    Bls.verify({ payload, publicKey: publicKeyA, signature })

    expect(publicKeyA).toEqual(before[0])
    expect(publicKeyB).toEqual(before[1])
    expect(signature).toEqual(before[2])
  })
})

describe('serialized validation', () => {
  test('aggregate: wrong lengths retain Ox errors for G1 and G2', () => {
    expect(() =>
      Bls.aggregate([compressedBytes(47), compressedBytes(47)], {
        group: 'G1',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Expected 48 bytes for a G1 point, received 47.]`,
    )
    expect(() =>
      Bls.aggregate([compressedBytes(95), compressedBytes(95)], {
        group: 'G2',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Expected 96 bytes for a G2 point, received 95.]`,
    )
  })

  test('aggregate: malformed points precede later wrong lengths', () => {
    expect(() =>
      Bls.aggregate([new Uint8Array(48), new Uint8Array(47)], {
        group: 'G1',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G1 point: expected 96 bytes]`,
    )
  })

  test('aggregate: malformed G1 is rejected by the default provider', () => {
    const malformed = new Uint8Array(48)
    expect(() =>
      Bls.aggregate([malformed, malformed], { group: 'G1' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G1 point: expected 96 bytes]`,
    )
  })

  test('aggregate: malformed G2 is rejected by the default provider', () => {
    const malformed = new Uint8Array(96)
    expect(() =>
      Bls.aggregate([malformed, malformed], { group: 'G2' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 192 bytes]`,
    )
  })

  test('aggregate: subgroup failures are rejected for G1 and G2', () => {
    expect(() =>
      Bls.aggregate([g1NonSubgroup, g1NonSubgroup], { group: 'G1' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: bad point: not in prime-order subgroup]`,
    )
    expect(() =>
      Bls.aggregate([g2NonSubgroup, g2NonSubgroup], { group: 'G2' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: bad point: not in prime-order subgroup]`,
    )
  })

  test('aggregate: canonical infinity remains accepted', () => {
    expect(
      BlsPoint.toBytes(
        Bls.aggregate([g1Infinity, g1Infinity], {
          group: 'G1',
        }) as BlsPoint.G1,
      ),
    ).toEqual(g1Infinity)
    expect(
      BlsPoint.toBytes(
        Bls.aggregate([g2Infinity, g2Infinity], {
          group: 'G2',
        }) as BlsPoint.G2,
      ),
    ).toEqual(g2Infinity)
  })

  test('verify: malformed points are rejected by the default provider', () => {
    const publicKey = Bls.getPublicKey({ as: 'Bytes', privateKey })
    const signature = Bls.sign({ as: 'Bytes', payload, privateKey })

    expect(() =>
      Bls.verify({
        payload,
        publicKey,
        signature: new Uint8Array(96),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 192 bytes]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: new Uint8Array(48),
        signature,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G1 point: expected 96 bytes]`,
    )
  })

  test('verify: wrong lengths are checked signature-first before the engine', () => {
    let called = false
    expect(() =>
      Engine.with(
        {
          Bls: {
            verify: () => {
              called = true
              return false
            },
          },
        },
        () =>
          Bls.verify({
            payload,
            publicKey: compressedBytes(47),
            signature: compressedBytes(95),
          }),
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `[BaseError: Expected 96 bytes for a G2 point, received 95.]`,
    )
    expect(called).toBe(false)
  })

  test('verify: malformed signatures precede public-key length errors', () => {
    expect(() =>
      Bls.verify({
        payload: new Uint8Array(32),
        publicKey: new Uint8Array(47),
        signature: new Uint8Array(96),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 192 bytes]`,
    )
  })

  test('verify: the default provider validates the signature first', () => {
    expect(() =>
      Bls.verify({
        payload,
        publicKey: new Uint8Array(48),
        signature: new Uint8Array(96),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 192 bytes]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: new Uint8Array(96),
        signature: new Uint8Array(48),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G1 point: expected 96 bytes]`,
    )
  })

  test('verify: serialized point errors precede invalid payloads', () => {
    expect(() =>
      Bls.verify({
        payload: '0x0',
        publicKey: Bls.getPublicKey({ as: 'Bytes', privateKey }),
        signature: new Uint8Array(96),
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 192 bytes]`,
    )
  })

  test('verify: mismatched structured groups retain provider errors', () => {
    const g1PublicKey = Bls.getPublicKey({ privateKey })
    const g2PublicKey = Bls.getPublicKey({
      privateKey,
      size: 'long-key:short-sig',
    })
    const g2Signature = Bls.sign({ payload, privateKey })
    const g1Signature = Bls.sign({
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })

    expect(() =>
      Bls.verify({
        payload,
        publicKey: g2PublicKey,
        signature: g2Signature,
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G1 point: expected 48 bytes]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: g1PublicKey,
        signature: g1Signature,
      } as never),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: invalid G2 point: expected 96 bytes]`,
    )
  })

  test('verify: subgroup failures are rejected for both group orientations', () => {
    const g1PublicKey = Bls.getPublicKey({ as: 'Bytes', privateKey })
    const g2Signature = Bls.sign({ as: 'Bytes', payload, privateKey })
    const g2PublicKey = Bls.getPublicKey({
      as: 'Bytes',
      privateKey,
      size: 'long-key:short-sig',
    })
    const g1Signature = Bls.sign({
      as: 'Bytes',
      payload,
      privateKey,
      size: 'long-key:short-sig',
    })

    expect(() =>
      Bls.verify({
        payload,
        publicKey: g1NonSubgroup,
        signature: g2Signature,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: bad point: not in prime-order subgroup]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: g2PublicKey,
        signature: g1NonSubgroup,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: bad point: not in prime-order subgroup]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: g1PublicKey,
        signature: g2NonSubgroup,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: bad point: not in prime-order subgroup]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: g2NonSubgroup,
        signature: g1Signature,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: bad point: not in prime-order subgroup]`,
    )
  })

  test('verify: canonical infinity retains the default ZERO error', () => {
    expect(() =>
      Bls.verify({
        payload,
        publicKey: g1Infinity,
        signature: g2Infinity,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: pairing is not available for ZERO point]`,
    )
    expect(() =>
      Bls.verify({
        payload,
        publicKey: g2Infinity,
        signature: g1Infinity,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: pairing is not available for ZERO point]`,
    )
  })

  test('custom engines own serialized validation', () => {
    const malformed = new Uint8Array(96)
    let received: Uint8Array | undefined

    const verified = Engine.with(
      {
        Bls: {
          verify: (signature) => {
            received = signature
            return false
          },
        },
      },
      () =>
        Bls.verify({
          payload,
          publicKey: Bls.getPublicKey({ as: 'Bytes', privateKey }),
          signature: malformed,
        }),
    )

    expect(verified).toBe(false)
    expect(received).toBe(malformed)
  })
})
