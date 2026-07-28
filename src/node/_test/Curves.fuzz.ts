import { fc, test } from '@fast-check/vitest'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { p256 } from '@noble/curves/nist.js'
import { describe, expect } from 'vp/test'
import { numRuns } from '../../../test/fuzz/numRuns.js'
import * as Ed25519 from '../Ed25519.js'
import * as P256 from '../P256.js'
import * as X25519 from '../X25519.js'

const arbitraryBytes = fc.uint8Array({ maxLength: 512 })
const arbitraryKey = fc.uint8Array({ maxLength: 32, minLength: 32 })
const arbitraryP256PrivateKey = fc
  .tuple(
    fc.integer({ max: 0xfe, min: 1 }),
    fc.uint8Array({ maxLength: 31, minLength: 31 }),
  )
  .map(([first, rest]) => Uint8Array.of(first, ...rest))

describe('Ed25519', () => {
  test.prop({ payload: arbitraryBytes, privateKey: arbitraryKey }, { numRuns })(
    'matches the default for arbitrary offset views',
    async (options) => {
      const engine = (await Ed25519.create()).Ed25519
      const payload = offsetView(options.payload)
      const privateKey = offsetView(options.privateKey)

      expect(engine.getPublicKey(privateKey)).toEqual(
        ed25519.getPublicKey(privateKey),
      )
      expect(engine.sign(payload, privateKey)).toEqual(
        ed25519.sign(payload, privateKey),
      )
      expect(engine.toMontgomerySecret(privateKey)).toEqual(
        ed25519.utils.toMontgomerySecret(privateKey),
      )
    },
  )
})

describe('X25519', () => {
  test.prop(
    { privateKey: arbitraryKey, publicKeySeed: arbitraryKey },
    { numRuns },
  )('matches the default for arbitrary offset views', async (options) => {
    const engine = (await X25519.create()).X25519
    const privateKey = offsetView(options.privateKey)
    const publicKey = offsetView(x25519.getPublicKey(options.publicKeySeed))

    expect(engine.getPublicKey(privateKey)).toEqual(
      x25519.getPublicKey(privateKey),
    )
    expect(engine.getSharedSecret(privateKey, publicKey)).toEqual(
      x25519.getSharedSecret(privateKey, publicKey),
    )
  })
})

describe('P256', () => {
  test.prop({ privateKey: arbitraryP256PrivateKey }, { numRuns })(
    'matches the default for arbitrary offset views',
    async (options) => {
      const engine = (await P256.create()).P256
      const privateKey = offsetView(options.privateKey)

      expect(engine.getPublicKey(privateKey)).toEqual(
        p256.getPublicKey(privateKey, false),
      )
    },
  )
})

function offsetView(value: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(value.length + 4).fill(0xff)
  bytes.set(value, 2)
  return bytes.subarray(2, -2)
}
