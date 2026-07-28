import * as fs from 'node:fs'
import { x25519 } from '@noble/curves/ed25519.js'
import { describe, expect, test } from 'vp/test'
import * as X25519 from '../X25519.js'
import * as crypto25519 from '../internal/crypto25519.js'
import { wasmBase64 } from '../internal/crypto25519.wasm.js'
import * as internal from '../internal/instantiate.js'
import * as x25519_internal from '../internal/x25519.js'
import { x25519LowOrder } from './fixtures.js'

const alicePrivateKey = fromHex(
  '77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a',
)
const bobPrivateKey = fromHex(
  '5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb',
)

describe('engine', () => {
  test('vectors: matches RFC 7748 key agreement', async () => {
    const engine = await X25519.engine()
    const alicePublicKey = engine.getPublicKey(alicePrivateKey)
    const bobPublicKey = engine.getPublicKey(bobPrivateKey)

    expect(toHex(alicePublicKey)).toMatchInlineSnapshot(
      `"8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a"`,
    )
    expect(toHex(bobPublicKey)).toMatchInlineSnapshot(
      `"de9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f"`,
    )
    expect(
      toHex(engine.getSharedSecret(alicePrivateKey, bobPublicKey)),
    ).toMatchInlineSnapshot(
      `"4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742"`,
    )
  })

  test('vectors: matches RFC 7748 arbitrary-point cases', async () => {
    const engine = await X25519.engine()
    const vectors = [
      [
        'a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4',
        'e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c',
        'c3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552',
      ],
      [
        '4b66e9d4d1b4673c5ad22691957d6af5c11b6421e0ea01d42ca4169e7918ba0d',
        'e5210f12786811d3f4b7959d0538ae2c31dbe7106fc03c3efc4cd549c715a493',
        '95cbde9476e8907d7aade45cb4b873f88b595a68799fa152e6f8f7647aac7957',
      ],
    ] as const

    for (const [privateKey, publicKey, expected] of vectors)
      expect(
        toHex(engine.getSharedSecret(fromHex(privateKey), fromHex(publicKey))),
      ).toBe(expected)
  })

  test('vectors: matches RFC 7748 iterated cases', async () => {
    const engine = await X25519.engine()
    let privateKey = Uint8Array.of(9, ...new Uint8Array(31))
    let publicKey = privateKey
    const expected = new Map([
      [1, '422c8e7a6227d7bca1350b3e2bb7279f7897b87bb6854b783c60e80311ae3079'],
      [
        1000,
        '684cf59ba83309552800ef566f2f4d3c1c3887c49360e3875f2eb94d99532c51',
      ],
    ])

    for (let iteration = 1; iteration <= 1000; iteration++) {
      const previousPrivateKey = privateKey
      privateKey = engine.getSharedSecret(privateKey, publicKey)
      publicKey = previousPrivateKey
      if (expected.has(iteration))
        expect(toHex(privateKey), `iteration ${iteration}`).toBe(
          expected.get(iteration),
        )
    }
  })

  test('behavior: accepts masked and noncanonical u-coordinates', async () => {
    const engine = await X25519.engine()
    const publicKey = x25519.getPublicKey(bobPrivateKey)
    const masked = publicKey.slice()
    masked[31]! |= 0x80
    const noncanonicalBasePoint = fromHex(`f6${'ff'.repeat(30)}7f`)

    expect(engine.getSharedSecret(alicePrivateKey, masked)).toEqual(
      engine.getSharedSecret(alicePrivateKey, publicKey),
    )
    expect(
      engine.getSharedSecret(alicePrivateKey, noncanonicalBasePoint),
    ).toEqual(engine.getPublicKey(alicePrivateKey))
  })

  test('behavior: rejects low-order and malformed public keys', async () => {
    const engine = await X25519.engine()

    expect(x25519LowOrder).toEqual(
      JSON.parse(
        fs.readFileSync(
          new URL(
            '../../../test/vectors/x25519/low-order.json',
            import.meta.url,
          ),
          'utf8',
        ),
      ),
    )
    expect(x25519LowOrder).toHaveLength(7)
    for (const vector of x25519LowOrder) {
      const publicKey = fromHex(vector.publicKey)
      const highBitAlias = publicKey.slice()
      highBitAlias[31]! |= 0x80
      for (const value of [publicKey, highBitAlias])
        expect(() =>
          engine.getSharedSecret(alicePrivateKey, value),
        ).toThrowError(`invalid private or public key received`)
    }

    for (const size of [0, 1, 31, 33, 64]) {
      expect(() => engine.getPublicKey(new Uint8Array(size))).toThrowError(
        `X25519 private key must be 32 bytes, got ${size}`,
      )
      expect(() =>
        engine.getSharedSecret(alicePrivateKey, new Uint8Array(size)),
      ).toThrowError(`X25519 public key must be 32 bytes, got ${size}`)
    }
  })

  test('behavior: respects subviews, ownership, and cleanup', async () => {
    const engine = await X25519.engine()
    const privateKey = offsetView(alicePrivateKey)
    const publicKey = offsetView(x25519.getPublicKey(bobPrivateKey))
    const before = {
      privateKey: privateKey.slice(),
      publicKey: publicKey.slice(),
    }
    const sharedSecret = engine.getSharedSecret(privateKey, publicKey)
    const snapshot = sharedSecret.slice()

    engine.getPublicKey(new Uint8Array(32).fill(0xa5))
    expect(sharedSecret).toEqual(snapshot)
    expect({ privateKey, publicKey }).toEqual(before)

    const module = await crypto25519.load()
    expect(
      module
        .view()
        .subarray(module.heapBase, module.heapBase + 96)
        .every((byte) => byte === 0),
    ).toBe(true)
  })

  test('behavior: clears both keys and the shared secret after a late trap', async () => {
    const module = await internal.instantiate<crypto25519.Exports>(wasmBase64)
    const publicKey = x25519.getPublicKey(bobPrivateKey)
    const exports: crypto25519.Exports = {
      ...module.exports,
      x25519_get_shared_secret(...parameters) {
        module.exports.x25519_get_shared_secret(...parameters)
        throw new WebAssembly.RuntimeError('forced late trap')
      },
    }

    expect(() =>
      x25519_internal.getSharedSecret(
        { ...module, exports },
        alicePrivateKey,
        publicKey,
      ),
    ).toThrow(WebAssembly.RuntimeError)
    expect(
      module
        .view()
        .subarray(module.heapBase, module.heapBase + 96)
        .every((byte) => byte === 0),
    ).toBe(true)
  })
})

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'hex'))
}

function offsetView(value: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(value.length + 4).fill(0xff)
  bytes.set(value, 2)
  return bytes.subarray(2, -2)
}

function toHex(value: Uint8Array): string {
  return Buffer.from(value).toString('hex')
}
