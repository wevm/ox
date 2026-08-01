import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js'
import { Engine } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as MlDsa44 from '../MlDsa44.js'

const seed = new Uint8Array(32).fill(7)
const keys = ml_dsa44.keygen(seed)
const payload = Uint8Array.of(0xde, 0xad, 0xbe, 0xef)

function nobleSign(
  payload: Uint8Array,
  options: { context?: Uint8Array; extraEntropy?: Uint8Array | false } = {},
) {
  return ml_dsa44.sign(payload, keys.secretKey, {
    extraEntropy: false,
    ...options,
  })
}

describe('engine', () => {
  test('behavior: exposes only deterministic primitives', async () => {
    const engine = await MlDsa44.engine()

    expect(Object.keys(engine).sort()).toMatchInlineSnapshot(`
      [
        "getPublicKey",
        "sign",
        "verify",
      ]
    `)
  })

  test('behavior: matches noble public keys', async () => {
    const engine = await MlDsa44.engine()

    expect(engine.getPublicKey(seed)).toEqual(keys.publicKey)
  })

  test('behavior: matches noble signing across payload boundaries', async () => {
    const engine = await MlDsa44.engine()

    for (const size of [0, 1, 31, 32, 33, 64, 1024, 100_000]) {
      const payload = new Uint8Array(size).fill(size % 256)
      const signature = engine.sign(payload, seed, { extraEntropy: false })

      expect(signature).toEqual(nobleSign(payload))
      expect(engine.verify(signature, payload, keys.publicKey, {})).toBe(true)
      expect(ml_dsa44.verify(signature, payload, keys.publicKey)).toBe(true)
    }
  })

  test('behavior: matches noble signing with context and entropy', async () => {
    const engine = await MlDsa44.engine()
    const context = Uint8Array.of(1, 2, 3)
    const entropy = new Uint8Array(32).fill(9)

    for (const options of [
      { context },
      { extraEntropy: entropy },
      { context, extraEntropy: entropy },
      { context: new Uint8Array(255).fill(5) },
    ] as const) {
      const signature = engine.sign(payload, seed, {
        extraEntropy: false,
        ...options,
      })

      expect(signature).toEqual(nobleSign(payload, options))
      expect(
        engine.verify(signature, payload, keys.publicKey, {
          context: options.context,
        }),
      ).toBe(true)
    }
  })

  test('behavior: context binds verification', async () => {
    const engine = await MlDsa44.engine()
    const context = Uint8Array.of(1)
    const signature = engine.sign(payload, seed, {
      context,
      extraEntropy: false,
    })

    expect(engine.verify(signature, payload, keys.publicKey, { context })).toBe(
      true,
    )
    expect(engine.verify(signature, payload, keys.publicKey, {})).toBe(false)
    expect(
      engine.verify(signature, payload, keys.publicKey, {
        context: Uint8Array.of(2),
      }),
    ).toBe(false)
  })

  test('behavior: generates host entropy for hedged signing', async () => {
    const engine = await MlDsa44.engine()
    const signatureA = engine.sign(payload, seed, { extraEntropy: true })
    const signatureB = engine.sign(payload, seed, { extraEntropy: true })

    expect(signatureA).not.toEqual(signatureB)
    expect(engine.verify(signatureA, payload, keys.publicKey, {})).toBe(true)
    expect(engine.verify(signatureB, payload, keys.publicKey, {})).toBe(true)
    expect(ml_dsa44.verify(signatureA, payload, keys.publicKey)).toBe(true)
  })

  test('behavior: rejects corrupted and truncated signatures', async () => {
    const engine = await MlDsa44.engine()
    const signature = engine.sign(payload, seed, { extraEntropy: false })

    for (const corrupt of [0, 1, 100, 2419]) {
      const bad = signature.slice()
      bad[corrupt]! ^= 1
      expect(engine.verify(bad, payload, keys.publicKey, {})).toBe(false)
    }
    expect(engine.verify(signature.slice(1), payload, keys.publicKey, {})).toBe(
      false,
    )
    expect(engine.verify(new Uint8Array(0), payload, keys.publicKey, {})).toBe(
      false,
    )
    expect(engine.verify(signature, payload.slice(1), keys.publicKey, {})).toBe(
      false,
    )
  })

  test('behavior: rejects noble signatures made with other keys', async () => {
    const engine = await MlDsa44.engine()
    const other = ml_dsa44.keygen(new Uint8Array(32).fill(8))
    const signature = engine.sign(payload, seed, { extraEntropy: false })

    expect(engine.verify(signature, payload, other.publicKey, {})).toBe(false)
  })

  test('behavior: installs into the Engine registry', async () => {
    await Engine.install({ MlDsa44: MlDsa44.engine() })
    try {
      expect(Engine.get().MlDsa44).toBeDefined()

      const signature = MlDsa44.sign({
        payload: '0xdeadbeef',
        privateKey: seed,
        as: 'Bytes',
      })
      expect(signature).toEqual(nobleSign(payload))
      expect(
        MlDsa44.verify({
          payload: '0xdeadbeef',
          publicKey: keys.publicKey,
          signature,
        }),
      ).toBe(true)
    } finally {
      Engine.reset('MlDsa44')
    }
  })

  test('error: rejects malformed inputs', async () => {
    const engine = await MlDsa44.engine()

    for (const size of [0, 31, 33, 2560]) {
      expect(() => engine.getPublicKey(new Uint8Array(size))).toThrowError(
        `ML-DSA-44 private key must be 32 bytes, got ${size}`,
      )
      expect(() =>
        engine.sign(payload, new Uint8Array(size), { extraEntropy: false }),
      ).toThrowError(`ML-DSA-44 private key must be 32 bytes, got ${size}`)
    }
    expect(() =>
      engine.sign(payload, seed, { extraEntropy: new Uint8Array(31) }),
    ).toThrowError('ML-DSA-44 extra entropy must be 32 bytes, got 31')
    expect(() =>
      engine.sign(payload, seed, {
        context: new Uint8Array(256),
        extraEntropy: false,
      }),
    ).toThrowError('ML-DSA-44 context must be at most 255 bytes, got 256')
    expect(() =>
      engine.verify(
        new Uint8Array(2420),
        payload,
        keys.publicKey.slice(0, 100),
        {},
      ),
    ).toThrowError('ML-DSA-44 public key must be 1312 bytes, got 100')
    expect(() =>
      engine.verify(new Uint8Array(2420), payload, keys.publicKey, {
        context: new Uint8Array(256),
      }),
    ).toThrowError('ML-DSA-44 context must be at most 255 bytes, got 256')
  })
})
