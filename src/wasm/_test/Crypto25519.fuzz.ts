import { fc, test } from '@fast-check/vitest'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { mnemonicToSeedSync } from '@scure/bip39'
import { beforeAll, describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as Ed25519 from '../Ed25519.js'
import * as Mnemonic from '../Mnemonic.js'
import * as X25519 from '../X25519.js'
import { x25519LowOrder } from './fixtures.js'

let ed25519Engine: Ed25519.engine.ReturnType
let mnemonicEngine: Mnemonic.engine.ReturnType
let x25519Engine: X25519.engine.ReturnType

beforeAll(async () => {
  ed25519Engine = await Ed25519.engine()
  mnemonicEngine = await Mnemonic.engine()
  x25519Engine = await X25519.engine()
})

const arbitraryKey = fc.uint8Array({ maxLength: 32, minLength: 32 })
const arbitraryPayload = fc.oneof(
  fc.uint8Array({ maxLength: 512 }),
  fc
    .constantFrom(0, 1, 31, 32, 63, 64, 65, 127, 128, 129, 1024, 4096)
    .chain((size) => fc.uint8Array({ maxLength: size, minLength: size })),
)
const arbitraryWord = fc.oneof(
  fc
    .string({ maxLength: 16, minLength: 1 })
    .filter((value) => !value.normalize('NFKD').includes(' ')),
  fc.constantFrom('café', 'cafe\u0301', 'あおぞら', '㍍ガバヴァ'),
)
const arbitraryMnemonic = fc
  .tuple(
    fc.constantFrom(12, 15, 18, 21, 24),
    fc.array(arbitraryWord, { maxLength: 24, minLength: 24 }),
  )
  .map(([count, words]) => words.slice(0, count).join(' '))

describe('Ed25519', () => {
  test.prop(
    { payload: arbitraryPayload, privateKey: arbitraryKey },
    { numRuns },
  )('matches the default for arbitrary subviews', (options) => {
    const payload = offsetView(options.payload)
    const privateKey = offsetView(options.privateKey)
    const publicKey = ed25519Engine.getPublicKey(privateKey)
    const signature = ed25519Engine.sign(payload, privateKey)

    expect(publicKey).toEqual(ed25519.getPublicKey(privateKey))
    expect(signature).toEqual(ed25519.sign(payload, privateKey))
    expect(ed25519Engine.verify(signature, payload, publicKey)).toBe(true)
    expect(
      ed25519Engine.verify(signature, Uint8Array.of(...payload, 1), publicKey),
    ).toBe(false)
    expect(ed25519Engine.toMontgomerySecret(privateKey)).toEqual(
      ed25519.utils.toMontgomerySecret(privateKey),
    )
  })

  test.prop(
    {
      payload: arbitraryPayload,
      publicKey: arbitraryKey,
      signature: fc.uint8Array({ maxLength: 64, minLength: 64 }),
    },
    { numRuns },
  )('verification matches ZIP-215 for arbitrary encodings', (options) => {
    expect(
      ed25519Engine.verify(
        options.signature,
        options.payload,
        options.publicKey,
      ),
    ).toBe(
      ed25519.verify(options.signature, options.payload, options.publicKey),
    )
  })
})

describe('X25519', () => {
  test.prop(
    { privateKey: arbitraryKey, publicKeySeed: arbitraryKey },
    { numRuns },
  )('matches the default for arbitrary subviews', (options) => {
    const privateKey = offsetView(options.privateKey)
    const publicKey = offsetView(x25519.getPublicKey(options.publicKeySeed))

    expect(x25519Engine.getPublicKey(privateKey)).toEqual(
      x25519.getPublicKey(privateKey),
    )
    expect(x25519Engine.getSharedSecret(privateKey, publicKey)).toEqual(
      x25519.getSharedSecret(privateKey, publicKey),
    )
  })

  test.prop(
    {
      highBit: fc.boolean(),
      privateKey: arbitraryKey,
      vector: fc.constantFrom(...x25519LowOrder),
    },
    { numRuns },
  )(
    'rejects arbitrary private keys paired with low-order points',
    (options) => {
      const publicKey = fromHex(options.vector.publicKey)
      if (options.highBit) publicKey[31]! |= 0x80
      expect(() =>
        x25519Engine.getSharedSecret(options.privateKey, publicKey),
      ).toThrow()
    },
  )
})

describe('Mnemonic', () => {
  test.prop(
    {
      mnemonic: arbitraryMnemonic,
      passphrase: fc.string({ maxLength: 64 }),
    },
    { numRuns },
  )('matches the default for arbitrary normalized text', (options) => {
    expect(mnemonicEngine.toSeed(options.mnemonic, options.passphrase)).toEqual(
      mnemonicToSeedSync(options.mnemonic, options.passphrase),
    )
  })
})

describe('memory', () => {
  test.prop(
    {
      operations: fc.array(
        fc.record({
          payload: arbitraryPayload,
          privateKey: arbitraryKey,
          publicKeySeed: arbitraryKey,
        }),
        { maxLength: 8, minLength: 2 },
      ),
    },
    { numRuns },
  )(
    'interleaved providers remain isolated and outputs stay owned',
    (options) => {
      const held: Uint8Array[] = []
      const snapshots: Uint8Array[] = []

      for (const operation of options.operations) {
        const edPublicKey = ed25519Engine.getPublicKey(operation.privateKey)
        const signature = ed25519Engine.sign(
          operation.payload,
          operation.privateKey,
        )
        const xPublicKey = x25519.getPublicKey(operation.publicKeySeed)
        const sharedSecret = x25519Engine.getSharedSecret(
          operation.privateKey,
          xPublicKey,
        )
        expect(
          ed25519Engine.verify(signature, operation.payload, edPublicKey),
        ).toBe(true)
        expect(sharedSecret).toEqual(
          x25519.getSharedSecret(operation.privateKey, xPublicKey),
        )
        held.push(signature, sharedSecret)
        snapshots.push(signature.slice(), sharedSecret.slice())
      }

      expect(held).toEqual(snapshots)
    },
  )
})

function offsetView(value: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(value.length + 4).fill(0xff)
  bytes.set(value, 2)
  return bytes.subarray(2, -2)
}

function fromHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < bytes.length; index++)
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  return bytes
}
