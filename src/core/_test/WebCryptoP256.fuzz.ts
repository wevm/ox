import { fc, test } from '@fast-check/vitest'
import { p256 } from '@noble/curves/p256'
import { Hex, P256, PublicKey, WebCryptoP256 } from 'ox'
import { describe, expect } from 'vitest'
import { arbitraryHex } from '../../../test/fuzz/arbitraries/bytes.js'
import { numRuns } from '../../../test/fuzz/numRuns.js'

const n = p256.CURVE.n

const keyPair = await WebCryptoP256.createKeyPair()

const privateKey = fc
  .bigInt({ min: 1n, max: n - 1n })
  .map((key) => Hex.fromNumber(key, { size: 32 }))

// Ways to damage a valid low-S signature, each of which must fail the same
// way in WebCrypto and noble.
const damage = fc.constantFrom(
  'none',
  'r+1',
  's+1',
  'high-s',
  'r=0',
  's=0',
  'r=n',
  'r+2^256',
  's+2^256',
  'r=2^256',
  'payload',
)

function damaged(
  signature: { r: bigint; s: bigint },
  kind: string,
): { r: bigint; s: bigint } {
  const { r, s } = signature
  switch (kind) {
    case 'r+1':
      return { r: r + 1n, s }
    case 's+1':
      return { r, s: s + 1n }
    case 'high-s':
      return { r, s: n - s }
    case 'r=0':
      return { r: 0n, s }
    case 's=0':
      return { r, s: 0n }
    case 'r=n':
      return { r: n, s }
    case 'r+2^256':
      return { r: r + 2n ** 256n, s }
    case 's+2^256':
      return { r, s: s + 2n ** 256n }
    case 'r=2^256':
      return { r: 2n ** 256n, s }
    default:
      return { r, s }
  }
}

/** noble's verdict on a SHA-256 prehashed payload, as WebCrypto hashes it. */
function nobleVerify(
  signature: { r: bigint; s: bigint },
  payload: Hex.Hex,
  publicKey: PublicKey.PublicKey,
) {
  return p256.verify(
    signature,
    Hex.toBytes(payload),
    PublicKey.toHex(publicKey).slice(2),
    { lowS: true, prehash: true },
  )
}

describe('WebCryptoP256.verify', () => {
  test.prop({ privateKey, payload: arbitraryHex(64), damage }, { numRuns })(
    'agrees with noble on valid and damaged signatures, without throwing',
    async ({ privateKey, payload, damage }) => {
      const publicKey = P256.getPublicKey({ privateKey })
      const signature = damaged(
        P256.sign({ payload, privateKey, hash: true, extraEntropy: false }),
        damage,
      )
      const signed =
        damage === 'payload' ? Hex.concat(payload, '0x01') : payload

      const verified = await WebCryptoP256.verify({
        payload: signed,
        publicKey,
        signature,
      })
      expect(verified).toBe(nobleVerify(signature, signed, publicKey))
      expect(verified).toBe(damage === 'none')
    },
  )

  test.prop({ payload: arbitraryHex(64) }, { numRuns })(
    'sign writes low-S signatures that WebCrypto and noble both accept',
    async ({ payload }) => {
      const signature = await WebCryptoP256.sign({
        payload,
        privateKey: keyPair.privateKey,
      })
      expect(signature.s <= n / 2n).toBe(true)
      expect(
        await WebCryptoP256.verify({
          payload,
          publicKey: keyPair.publicKey,
          signature,
        }),
      ).toBe(true)
      expect(nobleVerify(signature, payload, keyPair.publicKey)).toBe(true)
    },
  )
})
