import { p256 } from '@noble/curves/nist.js'
import { Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as P256 from '../P256.js'

const order = 'ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'

describe('engine', () => {
  test('behavior: exposes only public-key derivation', async () => {
    const engine = await P256.engine()

    expect(Object.keys(engine)).toMatchInlineSnapshot(`
      [
        "getPublicKey",
      ]
    `)
  })

  test('behavior: matches the SEC 2 generator vector', async () => {
    const engine = await P256.engine()
    const privateKey = new Uint8Array(32)
    privateKey[31] = 1

    expect(
      Hex.fromBytes(engine.getPublicKey(privateKey)),
    ).toMatchInlineSnapshot(
      `"0x046b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"`,
    )
  })

  test('behavior: matches the default across valid scalars', async () => {
    const engine = await P256.engine()
    const privateKeys = [
      `${'00'.repeat(31)}01`,
      `${'00'.repeat(31)}02`,
      '7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      'dde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5',
      'ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632550',
    ]

    for (const privateKey of privateKeys) {
      const bytes = fromHex(privateKey)
      expect(engine.getPublicKey(bytes)).toEqual(
        p256.getPublicKey(bytes, false),
      )
    }
  })

  test('behavior: respects typed-array offsets without mutating inputs', async () => {
    const engine = await P256.engine()
    const privateKey = offsetView(
      fromHex(
        'dde57ae9b9ed6f76fa5358c24d5ca2057ebc1ece18b7273121450a29c96ec8e5',
      ),
    )
    const before = privateKey.slice()

    expect(engine.getPublicKey(privateKey)).toEqual(
      p256.getPublicKey(privateKey, false),
    )
    expect(privateKey).toEqual(before)
  })

  test('behavior: rejects malformed and out-of-range private keys', async () => {
    const engine = await P256.engine()

    for (const size of [0, 1, 31, 33, 64])
      expect(() => engine.getPublicKey(new Uint8Array(size))).toThrowError(
        `P256 private key must be 32 bytes, got ${size}`,
      )

    expect(() => engine.getPublicKey(new Uint8Array(32))).toThrowError()
    expect(() => engine.getPublicKey(fromHex(order))).toThrowError()
  })

  test('behavior: returns owned Uint8Array values', async () => {
    const engine = await P256.engine()
    const privateKey = fromHex(`${'00'.repeat(31)}01`)
    const first = engine.getPublicKey(privateKey)
    const second = engine.getPublicKey(privateKey)

    expect(first.constructor === Uint8Array).toMatchInlineSnapshot('true')
    expect(first === second).toMatchInlineSnapshot('false')
  })

  test('behavior: returns a fresh engine', async () => {
    const first = await P256.engine()
    const second = await P256.engine()

    expect(first === second).toMatchInlineSnapshot('false')
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
