import * as fs from 'node:fs'
import { describe, expect, test } from 'vp/test'
import * as Ed25519 from '../Ed25519.js'

type Zip215Vector = {
  sig_bytes: string
  valid_legacy: boolean
  valid_zip215: boolean
  vk_bytes: string
}

const zip215 = JSON.parse(
  fs.readFileSync(
    new URL('../../../test/vectors/ed25519/zip215.json', import.meta.url),
    'utf8',
  ),
) as readonly Zip215Vector[]

const rfc8032 = [
  {
    message: '',
    publicKey:
      'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
    seed: '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
    signature:
      'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b',
  },
  {
    message: '72',
    publicKey:
      '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c',
    seed: '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
    signature:
      '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
  },
] as const

describe('create', () => {
  test('vectors: matches RFC 8032 key, signature, and verification cases', async () => {
    const engine = (await Ed25519.create()).Ed25519

    for (const vector of rfc8032) {
      const seed = fromHex(vector.seed)
      const message = fromHex(vector.message)
      const publicKey = fromHex(vector.publicKey)
      const signature = fromHex(vector.signature)

      expect(engine.getPublicKey(seed)).toEqual(publicKey)
      expect(engine.sign(message, seed)).toEqual(signature)
      expect(engine.verify(signature, message, publicKey)).toBe(true)
    }
  })

  test('vectors: matches all 196 ZIP-215 compliance cases', async () => {
    const engine = (await Ed25519.create()).Ed25519
    const message = new TextEncoder().encode('Zcash')

    expect(zip215).toHaveLength(196)
    for (const vector of zip215)
      expect(
        engine.verify(
          fromHex(vector.sig_bytes),
          message,
          fromHex(vector.vk_bytes),
        ),
        JSON.stringify(vector),
      ).toBe(vector.valid_zip215)
  })
})

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(Buffer.from(value, 'hex'))
}
