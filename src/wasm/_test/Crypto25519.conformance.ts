import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { mnemonicToSeedSync } from '@scure/bip39'
import { describe, expect, test } from 'vp/test'
import { vectors } from '../../../test/vectors/bip39/index.js'
import * as Ed25519 from '../Ed25519.js'
import * as Mnemonic from '../Mnemonic.js'
import * as X25519 from '../X25519.js'

describe('crypto25519 WASM', () => {
  test('behavior: Ed25519 works in this runtime', async () => {
    const engine = await Ed25519.engine()
    const privateKey = fromHex(
      '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
    )
    const payload = new TextEncoder().encode('browser conformance')
    const publicKey = engine.getPublicKey(privateKey)
    const signature = engine.sign(payload, privateKey)

    expect(publicKey).toEqual(ed25519.getPublicKey(privateKey))
    expect(signature).toEqual(ed25519.sign(payload, privateKey))
    expect(engine.verify(signature, payload, publicKey)).toBe(true)
  })

  test('behavior: X25519 works in this runtime', async () => {
    const engine = await X25519.engine()
    const privateKey = fromHex(
      '77076d0a7318a57d3c16c17251b26645df4c2f87ebc0992ab177fba51db92c2a',
    )
    const peerPrivateKey = fromHex(
      '5dab087e624a8a4b79e17f8b83800ee66f3bb1292618b6fd1c2f8b27ff88e0eb',
    )
    const publicKey = x25519.getPublicKey(peerPrivateKey)

    expect(engine.getPublicKey(privateKey)).toEqual(
      x25519.getPublicKey(privateKey),
    )
    expect(engine.getSharedSecret(privateKey, publicKey)).toEqual(
      x25519.getSharedSecret(privateKey, publicKey),
    )
  })

  test('behavior: Unicode BIP-39 works in this runtime', async () => {
    const engine = await Mnemonic.engine()
    const vector = vectors.japanese

    expect(engine.toSeed(vector.mnemonic, vector.passphrase)).toEqual(
      mnemonicToSeedSync(vector.mnemonic, vector.passphrase),
    )
  })
})

function fromHex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2)
  for (let index = 0; index < bytes.length; index++)
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  return bytes
}
