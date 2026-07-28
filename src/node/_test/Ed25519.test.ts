import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import { ed25519 } from '@noble/curves/ed25519.js'
import { Hex } from 'ox'
import { describe, expect, test } from 'vp/test'
import * as Ed25519 from '../Ed25519.js'

type Zip215Vector = {
  sig_bytes: string
  valid_legacy: boolean
  valid_zip215: boolean
  vk_bytes: string
}

const publicKeyPrefix = Buffer.from('302a300506032b6570032100', 'hex')
const zip215Text = fs.readFileSync(
  new URL('../../../test/vectors/ed25519/zip215.json', import.meta.url),
  'utf8',
)
const zip215 = JSON.parse(zip215Text) as readonly Zip215Vector[]

const vectors = [
  {
    payload: '',
    privateKey:
      '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
  },
  {
    payload: '72',
    privateKey:
      '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
  },
] as const

describe('engine', () => {
  test('behavior: exposes only primitives compatible with Ox semantics', async () => {
    const engine = await Ed25519.engine()

    // Node verification is deliberately absent because it does not implement
    // the ZIP-215 rules used by Ox's default verifier.
    expect(Object.keys(engine).sort()).toMatchInlineSnapshot(`
      [
        "getPublicKey",
        "sign",
        "toMontgomerySecret",
      ]
    `)
  })

  test('behavior: matches RFC 8032 test vectors', async () => {
    const engine = await Ed25519.engine()

    expect(
      vectors.map(({ payload, privateKey }) => ({
        publicKey: Hex.fromBytes(engine.getPublicKey(fromHex(privateKey))),
        signature: Hex.fromBytes(
          engine.sign(fromHex(payload), fromHex(privateKey)),
        ),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "publicKey": "0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
          "signature": "0xe5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
        },
        {
          "publicKey": "0x3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
          "signature": "0x92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00",
        },
      ]
    `)
  })

  test('behavior: omits verification that disagrees with ZIP-215', async () => {
    const engine = await Ed25519.engine()
    const digest = crypto
      .createHash('sha256')
      .update(zip215Text.trimEnd())
      .digest('hex')
    const message = new TextEncoder().encode('Zcash')
    let defaultAccepted = 0
    let nodeAccepted = 0

    for (const vector of zip215) {
      const publicKey = fromHex(vector.vk_bytes)
      const signature = fromHex(vector.sig_bytes)
      if (ed25519.verify(signature, message, publicKey)) defaultAccepted++
      if (nodeVerify(vector, message)) nodeAccepted++
    }

    expect({
      defaultAccepted,
      digest,
      legacyAccepted: zip215.filter((vector) => vector.valid_legacy).length,
      nodeDisagrees: nodeAccepted < defaultAccepted,
      vectors: zip215.length,
    }).toMatchInlineSnapshot(`
      {
        "defaultAccepted": 196,
        "digest": "b2716ff6e90fed207942f9d000a6c83cc5c133096a63f3b12104da91b5f771cb",
        "legacyAccepted": 3,
        "nodeDisagrees": true,
        "vectors": 196,
      }
    `)
    expect('verify' in engine).toMatchInlineSnapshot('false')
  })

  test('behavior: matches the default across messages and private keys', async () => {
    const engine = await Ed25519.engine()

    for (const [index, { privateKey }] of vectors.entries()) {
      const key = fromHex(privateKey)
      for (const size of [0, 1, 31, 32, 63, 64, 65, 255]) {
        const payload = Uint8Array.from(
          { length: size },
          (_, offset) => (offset * 29 + index) % 251,
        )
        expect(engine.sign(payload, key)).toEqual(ed25519.sign(payload, key))
      }
      expect(engine.getPublicKey(key)).toEqual(ed25519.getPublicKey(key))
      expect(engine.toMontgomerySecret(key)).toEqual(
        ed25519.utils.toMontgomerySecret(key),
      )
    }
  })

  test('behavior: respects typed-array offsets without mutating inputs', async () => {
    const engine = await Ed25519.engine()
    const privateKey = offsetView(fromHex(vectors[0].privateKey))
    const payload = offsetView(
      Uint8Array.from({ length: 65 }, (_, index) => (index * 17) % 251),
    )
    const privateKeyBefore = privateKey.slice()
    const payloadBefore = payload.slice()

    expect(engine.getPublicKey(privateKey)).toEqual(
      ed25519.getPublicKey(privateKey),
    )
    expect(engine.sign(payload, privateKey)).toEqual(
      ed25519.sign(payload, privateKey),
    )
    expect(engine.toMontgomerySecret(privateKey)).toEqual(
      ed25519.utils.toMontgomerySecret(privateKey),
    )
    expect({ payload, privateKey }).toEqual({
      payload: payloadBefore,
      privateKey: privateKeyBefore,
    })
  })

  test('behavior: rejects malformed private-key lengths', async () => {
    const engine = await Ed25519.engine()

    for (const size of [0, 1, 31, 33, 64]) {
      const privateKey = new Uint8Array(size)
      expect(() => engine.getPublicKey(privateKey)).toThrowError(
        `Ed25519 private key must be 32 bytes, got ${size}`,
      )
      expect(() => engine.sign(new Uint8Array(), privateKey)).toThrowError(
        `Ed25519 private key must be 32 bytes, got ${size}`,
      )
      expect(() => engine.toMontgomerySecret(privateKey)).toThrowError(
        `Ed25519 private key must be 32 bytes, got ${size}`,
      )
    }
  })

  test('behavior: returns owned Uint8Array values', async () => {
    const engine = await Ed25519.engine()
    const privateKey = fromHex(vectors[0].privateKey)
    const outputs = [
      engine.getPublicKey(privateKey),
      engine.sign(new Uint8Array(), privateKey),
      engine.toMontgomerySecret(privateKey),
    ]

    expect(outputs.map((output) => output.constructor === Uint8Array))
      .toMatchInlineSnapshot(`
      [
        true,
        true,
        true,
      ]
    `)
    expect(
      engine.getPublicKey(privateKey) === engine.getPublicKey(privateKey),
    ).toMatchInlineSnapshot('false')
  })

  test('behavior: returns a fresh engine', async () => {
    const first = await Ed25519.engine()
    const second = await Ed25519.engine()

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

function nodeVerify(vector: Zip215Vector, message: Uint8Array): boolean {
  try {
    const publicKey = crypto.createPublicKey({
      format: 'der',
      key: Buffer.concat([publicKeyPrefix, fromHex(vector.vk_bytes)]),
      type: 'spki',
    })
    return crypto.verify(null, message, publicKey, fromHex(vector.sig_bytes))
  } catch {
    return false
  }
}
