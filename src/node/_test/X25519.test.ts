import * as fs from 'node:fs'
import { x25519 } from '@noble/curves/ed25519.js'
import { Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as X25519 from '../X25519.js'

type LowOrderVector = {
  name: string
  publicKey: string
}

const alicePrivateKey =
  '77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a'
const bobPrivateKey =
  '5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb'

const lowOrderPublicKeys = JSON.parse(
  fs.readFileSync(
    new URL('../../../test/vectors/x25519/low-order.json', import.meta.url),
    'utf8',
  ),
) as readonly LowOrderVector[]

describe('create', () => {
  test('behavior: exposes only the supported primitives', async () => {
    const engine = await X25519.create()

    expect(Object.keys(engine.X25519).sort()).toMatchInlineSnapshot(`
      [
        "getPublicKey",
        "getSharedSecret",
      ]
    `)
  })

  test('behavior: matches RFC 7748 key-agreement vectors', async () => {
    const engine = (await X25519.create()).X25519
    const alicePublicKey = engine.getPublicKey(fromHex(alicePrivateKey))
    const bobPublicKey = engine.getPublicKey(fromHex(bobPrivateKey))

    expect({
      alicePublicKey: Hex.fromBytes(alicePublicKey),
      bobPublicKey: Hex.fromBytes(bobPublicKey),
      sharedSecret: Hex.fromBytes(
        engine.getSharedSecret(fromHex(alicePrivateKey), bobPublicKey),
      ),
    }).toMatchInlineSnapshot(`
      {
        "alicePublicKey": "0x8520f0098930a754748b7ddcb43ef75a0dbf3a0d26381af4eba4a98eaa9b4e6a",
        "bobPublicKey": "0xde9edb7d7b7dc1b4d35b61c2ece435373f8343c85b78674dadfc7e146f882b4f",
        "sharedSecret": "0x4a5d9d5ba4ce2de1728e3bf480350f25e07e21c947d19e3376f09b3c1e161742",
      }
    `)
  })

  test('behavior: matches RFC 7748 arbitrary-point vectors', async () => {
    const engine = (await X25519.create()).X25519
    const vectors = [
      {
        privateKey:
          'a546e36bf0527c9d3b16154b82465edd62144c0ac1fc5a18506a2244ba449ac4',
        publicKey:
          'e6db6867583030db3594c1a424b15f7c726624ec26b3353b10a903a6d0ab1c4c',
      },
      {
        privateKey:
          '4b66e9d4d1b4673c5ad22691957d6af5c11b6421e0ea01d42ca4169e7918ba0d',
        publicKey:
          'e5210f12786811d3f4b7959d0538ae2c31dbe7106fc03c3efc4cd549c715a493',
      },
    ] as const

    expect(
      vectors.map(({ privateKey, publicKey }) =>
        Hex.fromBytes(
          engine.getSharedSecret(fromHex(privateKey), fromHex(publicKey)),
        ),
      ),
    ).toMatchInlineSnapshot(`
      [
        "0xc3da55379de9c6908e94ea4df28d084f32eccf03491c71f754b4075577a28552",
        "0x95cbde9476e8907d7aade45cb4b873f88b595a68799fa152e6f8f7647aac7957",
      ]
    `)
  })

  test('behavior: matches the default across private keys', async () => {
    const engine = (await X25519.create()).X25519
    const privateKeys = [
      fromHex(alicePrivateKey),
      fromHex(bobPrivateKey),
      new Uint8Array(32),
      new Uint8Array(32).fill(0xff),
      Uint8Array.from({ length: 32 }, (_, index) => index),
    ]

    for (const [index, privateKey] of privateKeys.entries()) {
      const peerPrivateKey = Uint8Array.from(
        { length: 32 },
        (_, offset) => (offset * 17 + index + 1) % 251,
      )
      const publicKey = x25519.getPublicKey(peerPrivateKey)
      expect(engine.getPublicKey(privateKey)).toEqual(
        x25519.getPublicKey(privateKey),
      )
      expect(engine.getSharedSecret(privateKey, publicKey)).toEqual(
        x25519.getSharedSecret(privateKey, publicKey),
      )
    }
  })

  test('behavior: masks the public u-coordinate high bit', async () => {
    const engine = (await X25519.create()).X25519
    const privateKey = fromHex(alicePrivateKey)
    const publicKey = x25519.getPublicKey(fromHex(bobPrivateKey))
    const highBitPublicKey = publicKey.slice()
    highBitPublicKey[31]! |= 0x80
    const expected = x25519.getSharedSecret(privateKey, publicKey)

    expect(x25519.getSharedSecret(privateKey, highBitPublicKey)).toEqual(
      expected,
    )
    expect(engine.getSharedSecret(privateKey, highBitPublicKey)).toEqual(
      expected,
    )
  })

  test('behavior: reduces noncanonical public u-coordinates', async () => {
    const engine = (await X25519.create()).X25519
    const privateKey = fromHex(alicePrivateKey)
    // 2^255 - 19 + 9 encodes the base point modulo the field prime.
    const publicKey = fromHex(`f6${'ff'.repeat(30)}7f`)
    const expected = x25519.getPublicKey(privateKey)

    expect(x25519.getSharedSecret(privateKey, publicKey)).toEqual(expected)
    expect(engine.getSharedSecret(privateKey, publicKey)).toEqual(expected)
  })

  test('behavior: rejects the complete published low-order set', async () => {
    const engine = (await X25519.create()).X25519
    const privateKey = fromHex(alicePrivateKey)

    expect(lowOrderPublicKeys).toHaveLength(7)
    for (const vector of lowOrderPublicKeys) {
      const publicKey = fromHex(vector.publicKey)
      const highBitPublicKey = publicKey.slice()
      highBitPublicKey[31]! |= 0x80

      for (const [name, value] of [
        ['published', publicKey],
        ['top-bit alias', highBitPublicKey],
      ] as const) {
        expect(
          () => x25519.getSharedSecret(privateKey, value),
          `${vector.name} (${name})`,
        ).toThrowError()
        expect(
          () => engine.getSharedSecret(privateKey, value),
          `${vector.name} (${name})`,
        ).toThrowError()
      }
    }
  })

  test('behavior: respects typed-array offsets without mutating inputs', async () => {
    const engine = (await X25519.create()).X25519
    const privateKey = offsetView(fromHex(alicePrivateKey))
    const publicKey = offsetView(x25519.getPublicKey(fromHex(bobPrivateKey)))
    const privateKeyBefore = privateKey.slice()
    const publicKeyBefore = publicKey.slice()

    expect(engine.getPublicKey(privateKey)).toEqual(
      x25519.getPublicKey(privateKey),
    )
    expect(engine.getSharedSecret(privateKey, publicKey)).toEqual(
      x25519.getSharedSecret(privateKey, publicKey),
    )
    expect({ privateKey, publicKey }).toEqual({
      privateKey: privateKeyBefore,
      publicKey: publicKeyBefore,
    })
  })

  test('behavior: rejects malformed key lengths', async () => {
    const engine = (await X25519.create()).X25519
    const privateKey = fromHex(alicePrivateKey)
    const publicKey = x25519.getPublicKey(fromHex(bobPrivateKey))

    for (const size of [0, 1, 31, 33, 64]) {
      expect(() => engine.getPublicKey(new Uint8Array(size))).toThrowError(
        `X25519 private key must be 32 bytes, got ${size}`,
      )
      expect(() =>
        engine.getSharedSecret(new Uint8Array(size), publicKey),
      ).toThrowError(`X25519 private key must be 32 bytes, got ${size}`)
      expect(() =>
        engine.getSharedSecret(privateKey, new Uint8Array(size)),
      ).toThrowError(`X25519 public key must be 32 bytes, got ${size}`)
    }
  })

  test('behavior: returns owned Uint8Array values', async () => {
    const engine = (await X25519.create()).X25519
    const privateKey = fromHex(alicePrivateKey)
    const publicKey = x25519.getPublicKey(fromHex(bobPrivateKey))
    const outputs = [
      engine.getPublicKey(privateKey),
      engine.getSharedSecret(privateKey, publicKey),
    ]

    expect(outputs.map((output) => output.constructor === Uint8Array))
      .toMatchInlineSnapshot(`
      [
        true,
        true,
      ]
    `)
    expect(
      engine.getPublicKey(privateKey) === engine.getPublicKey(privateKey),
    ).toMatchInlineSnapshot('false')
  })

  test('behavior: returns a fresh engine', async () => {
    const first = await X25519.create()
    const second = await X25519.create()

    expect(first === second).toMatchInlineSnapshot('false')
    expect(first.X25519 === second.X25519).toMatchInlineSnapshot('false')
  })
})

function fromHex(value: string): Uint8Array {
  return Hex.toBytes(`0x${value}`)
}

function offsetView(value: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(value.length + 4).fill(0xff)
  bytes.set(value, 2)
  return bytes.subarray(2, -2)
}
