import { secp256k1 } from '@noble/curves/secp256k1.js'
import { describe, expect, test } from 'vp/test'
import * as Secp256k1 from '../Secp256k1.js'
import * as secp256k1_internal from '../internal/secp256k1.js'

const privateKey = fromHex(
  'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
)
const privateKeyB = fromHex(
  '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
)
const curveOrder = BigInt(
  '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
)

describe('engine', () => {
  test('behavior: exposes only deterministic primitives', async () => {
    const engine = await Secp256k1.engine()

    expect(Object.keys(engine).sort()).toMatchInlineSnapshot(`
      [
        "getPublicKey",
        "getSharedSecret",
        "recoverPublicKey",
        "sign",
        "verify",
      ]
    `)
  })

  test('behavior: matches public keys and compressed shared points', async () => {
    const engine = await Secp256k1.engine()
    const publicKey = secp256k1.getPublicKey(privateKey, false)
    const publicKeyB = secp256k1.getPublicKey(privateKeyB, false)
    const compressedPublicKeyB = secp256k1.getPublicKey(privateKeyB, true)
    const expected = secp256k1.getSharedSecret(privateKey, publicKeyB, true)

    expect(engine.getPublicKey(privateKey)).toEqual(publicKey)
    expect(engine.getSharedSecret(privateKey, publicKeyB)).toEqual(expected)
    expect(engine.getSharedSecret(privateKey, compressedPublicKeyB)).toEqual(
      expected,
    )
    expect(engine.getSharedSecret(privateKeyB, publicKey)).toEqual(expected)
    expect(expected).toHaveLength(33)
  })

  test('behavior: matches signing across payload and entropy boundaries', async () => {
    const engine = await Secp256k1.engine()
    const publicKey = secp256k1.getPublicKey(privateKey, false)

    for (const size of [0, 1, 31, 32, 33, 63, 64, 65, 127, 1024, 8192])
      for (const prehash of [false, true])
        for (const extraEntropy of [
          false,
          new Uint8Array(),
          Uint8Array.of(1),
          new Uint8Array(32).fill(7),
          new Uint8Array(100).fill(9),
        ] as const) {
          const payload = bytes(size)
          const signature = engine.sign(payload, privateKey, {
            extraEntropy,
            prehash,
          })
          const expected = secp256k1.sign(payload, privateKey, {
            extraEntropy,
            format: 'recovered',
            lowS: true,
            prehash,
          })

          expect(signature).toEqual(expected)
          expect(
            engine.verify(signature.slice(1), payload, publicKey, { prehash }),
          ).toBe(true)
          expect(signature[0]).toBeOneOf([0, 1])
        }
  })

  test('behavior: generates host entropy for hedged signing', async () => {
    const engine = await Secp256k1.engine()
    const payload = bytes(32)
    const publicKey = engine.getPublicKey(privateKey)
    const signatureA = engine.sign(payload, privateKey, {
      extraEntropy: true,
      prehash: false,
    })
    const signatureB = engine.sign(payload, privateKey, {
      extraEntropy: true,
      prehash: false,
    })

    expect(signatureA).not.toEqual(signatureB)
    expect(
      engine.verify(signatureA.slice(1), payload, publicKey, {
        prehash: false,
      }),
    ).toBe(true)
    expect(
      engine.verify(signatureB.slice(1), payload, publicKey, {
        prehash: false,
      }),
    ).toBe(true)
  })

  test('behavior: recovers the public key with both parities', async () => {
    const engine = await Secp256k1.engine()
    const publicKey = engine.getPublicKey(privateKey)
    const signatures = new Map<
      number,
      { payload: Uint8Array; signature: Uint8Array }
    >()

    for (let index = 0; signatures.size < 2; index++) {
      const payload = bytes(32, index)
      const signature = engine.sign(payload, privateKey, {
        extraEntropy: false,
        prehash: false,
      })
      signatures.set(signature[0]!, { payload, signature })
      if (index > 100)
        throw new Error('could not produce both recovery parities')
    }

    for (const { payload, signature } of signatures.values())
      expect(engine.recoverPublicKey(signature, payload)).toEqual(publicKey)
  })

  test('behavior: rejects high-S signatures', async () => {
    const engine = await Secp256k1.engine()
    const payload = bytes(32)
    const publicKey = engine.getPublicKey(privateKey)
    const signature = engine
      .sign(payload, privateKey, {
        extraEntropy: false,
        prehash: false,
      })
      .slice(1)
    const highS = signature.slice()
    highS.set(toBytes(curveOrder - toBigInt(signature.slice(32))), 32)

    expect(
      engine.verify(signature, payload, publicKey, { prehash: false }),
    ).toBe(true)
    expect(engine.verify(highS, payload, publicKey, { prehash: false })).toBe(
      false,
    )
  })

  test('behavior: matches large payload boundaries', async () => {
    const engine = await Secp256k1.engine()
    const payload = bytes(8193)
    const publicKey = engine.getPublicKey(privateKey)
    const truncatedSignature = secp256k1.sign(
      payload.slice(0, 32),
      privateKey,
      {
        extraEntropy: false,
        format: 'compact',
        lowS: true,
        prehash: false,
      },
    )

    expect(() =>
      engine.sign(payload, privateKey, {
        extraEntropy: false,
        prehash: false,
      }),
    ).toThrowError(
      'Secp256k1 unhashed payload must not exceed 8192 bytes, got 8193',
    )
    expect(
      engine.verify(new Uint8Array(64), payload, publicKey, {
        prehash: false,
      }),
    ).toBe(false)
    expect(
      secp256k1.verify(truncatedSignature, payload, publicKey, {
        lowS: true,
        prehash: false,
      }),
    ).toBe(false)
    expect(
      engine.verify(truncatedSignature, payload, publicKey, { prehash: false }),
    ).toBe(false)
    expect(() =>
      engine.recoverPublicKey(new Uint8Array(65), payload),
    ).toThrowError(
      'Secp256k1 unhashed payload must not exceed 8192 bytes, got 8193',
    )

    const signature = engine.sign(payload, privateKey, {
      extraEntropy: false,
      prehash: true,
    })
    expect(
      engine.verify(signature.slice(1), payload, publicKey, { prehash: true }),
    ).toBe(true)
  })

  test('behavior: rejects malformed keys and recovered signatures', async () => {
    const engine = await Secp256k1.engine()
    const publicKey = engine.getPublicKey(privateKey)
    const payload = bytes(32)

    for (const size of [0, 1, 31, 33, 64, 65]) {
      if (size !== 32) {
        expect(() => engine.getPublicKey(new Uint8Array(size))).toThrowError(
          `Secp256k1 private key must be 32 bytes, got ${size}`,
        )
        expect(() =>
          engine.sign(payload, new Uint8Array(size), {
            extraEntropy: false,
            prehash: false,
          }),
        ).toThrowError(`Secp256k1 private key must be 32 bytes, got ${size}`)
      }
      if (size !== 64)
        expect(() =>
          engine.verify(new Uint8Array(size), payload, publicKey, {
            prehash: false,
          }),
        ).toThrowError(`Secp256k1 signature must be 64 bytes, got ${size}`)
      if (size !== 65)
        expect(() =>
          engine.recoverPublicKey(new Uint8Array(size), payload),
        ).toThrowError(`Secp256k1 signature must be 65 bytes, got ${size}`)
    }

    for (const size of [0, 1, 32, 34, 64, 66])
      expect(() =>
        engine.getSharedSecret(privateKey, new Uint8Array(size)),
      ).toThrowError(`Secp256k1 public key must be 33 or 65 bytes, got ${size}`)

    const invalidPrivateKeys = [
      new Uint8Array(32),
      toBytes(curveOrder),
      toBytes(curveOrder + 1n),
    ]
    for (const value of invalidPrivateKeys) {
      expect(() => engine.getPublicKey(value)).toThrow(
        Secp256k1.InvalidInputError,
      )
      expect(() => engine.getSharedSecret(value, publicKey)).toThrow(
        Secp256k1.InvalidInputError,
      )
      expect(() =>
        engine.sign(payload, value, {
          extraEntropy: false,
          prehash: false,
        }),
      ).toThrow(Secp256k1.InvalidInputError)
    }

    for (const publicKeySize of [33, 65]) {
      const invalidPublicKey = new Uint8Array(publicKeySize)
      expect(() =>
        engine.getSharedSecret(privateKey, invalidPublicKey),
      ).toThrow(Secp256k1.InvalidInputError)
      expect(
        engine.verify(new Uint8Array(64), payload, invalidPublicKey, {
          prehash: false,
        }),
      ).toBe(false)
    }

    const invalidRecovery = new Uint8Array(65)
    invalidRecovery[0] = 2
    expect(() => engine.recoverPublicKey(invalidRecovery, payload)).toThrow(
      Secp256k1.InvalidInputError,
    )
    expect(() => engine.recoverPublicKey(new Uint8Array(65), payload)).toThrow(
      Secp256k1.InvalidInputError,
    )
    expect(
      engine.verify(new Uint8Array(64), payload, publicKey, {
        prehash: false,
      }),
    ).toBe(false)
  })

  test('behavior: preserves subviews, input ownership, and output ownership', async () => {
    const engine = await Secp256k1.engine()
    const key = offsetView(privateKey)
    const payload = offsetView(bytes(257))
    const publicKey = offsetView(engine.getPublicKey(key))
    const before = {
      key: key.slice(),
      payload: payload.slice(),
      publicKey: publicKey.slice(),
    }
    const signature = engine.sign(payload, key, {
      extraEntropy: false,
      prehash: false,
    })
    const outputs = [
      engine.getPublicKey(key),
      engine.getSharedSecret(key, publicKey),
      signature,
      engine.recoverPublicKey(signature, payload),
    ]
    const snapshots = outputs.map((output) => output.slice())

    engine.sign(new Uint8Array(1024 * 1024), key, {
      extraEntropy: false,
      prehash: true,
    })

    expect(outputs).toEqual(snapshots)
    expect({ key, payload, publicKey }).toEqual(before)
  })

  test('behavior: clears the shared staging region', async () => {
    const engine = await Secp256k1.engine()
    const payload = new Uint8Array(1024).fill(0xa5)
    const entropy = new Uint8Array(17).fill(0x5a)
    engine.sign(payload, privateKey, {
      extraEntropy: entropy,
      prehash: false,
    })

    const module = await secp256k1_internal.load()
    const size = payload.length + 32 + entropy.length + 65
    expect(
      module
        .view()
        .subarray(module.heapBase, module.heapBase + size)
        .every((byte) => byte === 0),
    ).toBe(true)
  })
})

function bytes(length: number, offset = length): Uint8Array {
  return Uint8Array.from({ length }, (_, index) => (index * 29 + offset) % 251)
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'hex'))
}

function offsetView(value: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(value.length + 4).fill(0xff)
  bytes.set(value, 2)
  return bytes.subarray(2, -2)
}

function toBigInt(value: Uint8Array): bigint {
  return BigInt(`0x${Buffer.from(value).toString('hex')}`)
}

function toBytes(value: bigint): Uint8Array {
  return fromHex(value.toString(16).padStart(64, '0'))
}
