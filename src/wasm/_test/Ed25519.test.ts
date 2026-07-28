import { ed25519 } from '@noble/curves/ed25519.js'
import { describe, expect, test } from 'vp/test'
import * as Ed25519 from '../Ed25519.js'
import * as crypto25519 from '../internal/crypto25519.js'
import { wasmBase64 } from '../internal/crypto25519.wasm.js'
import * as ed25519_internal from '../internal/ed25519.js'
import * as internal from '../internal/instantiate.js'

const privateKey = fromHex(
  '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
)

describe('engine', () => {
  test('behavior: exposes only semantics-compatible primitives', async () => {
    const engine = await Ed25519.engine()

    expect(Object.keys(engine).sort()).toMatchInlineSnapshot(`
      [
        "getPublicKey",
        "sign",
        "toMontgomerySecret",
        "verify",
      ]
    `)
  })

  test('behavior: signs and verifies boundary-sized messages', async () => {
    const engine = await Ed25519.engine()

    for (const size of [0, 1, 31, 32, 63, 64, 65, 127, 128, 129, 1024]) {
      const payload = Uint8Array.from(
        { length: size },
        (_, index) => (index * 29 + size) % 251,
      )
      const signature = engine.sign(payload, privateKey)
      const publicKey = engine.getPublicKey(privateKey)

      expect(signature).toEqual(ed25519.sign(payload, privateKey))
      expect(engine.verify(signature, payload, publicKey)).toBe(true)
      expect(
        engine.verify(signature, Uint8Array.of(...payload, 1), publicKey),
      ).toBe(false)
    }
  })

  test('behavior: matches private-key conversion', async () => {
    const engine = await Ed25519.engine()

    expect(engine.toMontgomerySecret(privateKey)).toEqual(
      ed25519.utils.toMontgomerySecret(privateKey),
    )
  })

  test('behavior: respects subviews and leaves inputs immutable', async () => {
    const engine = await Ed25519.engine()
    const key = offsetView(privateKey)
    const payload = offsetView(new Uint8Array(257).fill(0xa5))
    const keyBefore = key.slice()
    const payloadBefore = payload.slice()
    const publicKey = offsetView(engine.getPublicKey(key))
    const signature = offsetView(engine.sign(payload, key))
    const publicKeyBefore = publicKey.slice()
    const signatureBefore = signature.slice()

    expect(engine.getPublicKey(key)).toEqual(ed25519.getPublicKey(key))
    expect(engine.verify(signature, payload, publicKey)).toBe(true)
    expect(engine.toMontgomerySecret(key)).toEqual(
      ed25519.utils.toMontgomerySecret(key),
    )
    expect({ key, payload, publicKey, signature }).toEqual({
      key: keyBefore,
      payload: payloadBefore,
      publicKey: publicKeyBefore,
      signature: signatureBefore,
    })
  })

  test('behavior: rejects malformed key and signature lengths', async () => {
    const engine = await Ed25519.engine()
    const publicKey = engine.getPublicKey(privateKey)

    for (const size of [0, 1, 31, 33, 63, 64]) {
      if (size !== 32) {
        expect(() => engine.getPublicKey(new Uint8Array(size))).toThrowError(
          `Ed25519 private key must be 32 bytes, got ${size}`,
        )
        expect(() =>
          engine.sign(new Uint8Array(), new Uint8Array(size)),
        ).toThrowError(`Ed25519 private key must be 32 bytes, got ${size}`)
      }
      if (size !== 64)
        expect(() =>
          engine.verify(new Uint8Array(size), new Uint8Array(), publicKey),
        ).toThrowError(`Ed25519 signature must be 64 bytes, got ${size}`)
    }

    expect(() =>
      engine.verify(new Uint8Array(64), new Uint8Array(), new Uint8Array(31)),
    ).toThrowError('Ed25519 public key must be 32 bytes, got 31')
  })

  test('behavior: outputs are owned across calls and memory growth', async () => {
    const engine = await Ed25519.engine()
    const publicKey = engine.getPublicKey(privateKey)
    const signature = engine.sign(new Uint8Array(), privateKey)
    const snapshots = [publicKey.slice(), signature.slice()]

    engine.sign(new Uint8Array(1024 * 1024).fill(0x5a), privateKey)

    expect([publicKey, signature]).toEqual(snapshots)
    expect(engine.getPublicKey(privateKey) === publicKey).toBe(false)
  })

  test('behavior: clears the shared staging region', async () => {
    const engine = await Ed25519.engine()
    const payload = new Uint8Array(1024).fill(0xa5)
    engine.sign(payload, privateKey)

    const module = await crypto25519.load()
    const size = 32 + payload.length + 64
    expect(
      module
        .view()
        .subarray(module.heapBase, module.heapBase + size)
        .every((byte) => byte === 0),
    ).toBe(true)
  })

  test('behavior: clears the complete region after a late trap', async () => {
    const module = await internal.instantiate<crypto25519.Exports>(wasmBase64)
    const payload = new Uint8Array(1024).fill(0xa5)
    const exports: crypto25519.Exports = {
      ...module.exports,
      ed25519_sign(...parameters) {
        module.exports.ed25519_sign(...parameters)
        throw new WebAssembly.RuntimeError('forced late trap')
      },
    }

    expect(() =>
      ed25519_internal.sign({ ...module, exports }, payload, privateKey),
    ).toThrow(WebAssembly.RuntimeError)
    expect(
      module
        .view()
        .subarray(module.heapBase, module.heapBase + 32 + payload.length + 64)
        .every((byte) => byte === 0),
    ).toBe(true)
  })

  test('behavior: rejects a workspace beyond wasm32 without growing', async () => {
    const module = await internal.instantiate<crypto25519.Exports>(wasmBase64)
    const memory = module.view().length

    expect(() => module.reserve(0x1_0000_0000)).toThrow(internal.MemoryError)
    expect(module.view()).toHaveLength(memory)
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
