import { bench, describe } from 'vitest'
import * as Bytes from '../core/Bytes.js'
import * as Hash from '../core/Hash.js'
import * as P256 from '../core/P256.js'
import * as Signature from '../core/Signature.js'
import * as Authentication from './Authentication.js'
import * as Authenticator from './Authenticator.js'

// Bench-only window stub. Set before module-level fixture construction so
// helpers that read `window.location.hostname` do not throw at import time.
;(globalThis as { window?: unknown }).window ??= {
  location: { hostname: 'example.com' },
  document: { title: 'Example' },
}

const challenge =
  '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf'

const { publicKey, privateKey } = P256.createKeyPair()

const authenticatorData = Authenticator.getAuthenticatorData({
  rpId: 'example.com',
  signCount: 0,
})

const clientDataJSON = Authenticator.getClientDataJSON({
  challenge,
  origin: 'https://example.com',
})
const clientDataJSONBytes = Bytes.fromString(clientDataJSON)

// Build a signed payload for verify benches
const clientDataJSONHash = Hash.sha256(clientDataJSONBytes, { as: 'Bytes' })
const payloadBytes = Bytes.concat(
  Bytes.fromHex(authenticatorData),
  clientDataJSONHash,
)
const signature = P256.sign({
  hash: true,
  payload: payloadBytes,
  privateKey,
})
const signatureParts = Signature.toParts<false>(signature)
// Minimal ASN.1 DER encoding of the ECDSA signature for the sign-mock response.
const derSignature = (() => {
  const toDer = (n: bigint) => {
    let h = n.toString(16)
    if (h.length % 2) h = `0${h}`
    let bytes = Bytes.fromHex(`0x${h}`)
    if (bytes[0]! & 0x80) bytes = Bytes.concat(new Uint8Array([0]), bytes)
    return bytes
  }
  const rB = toDer(signatureParts.r)
  const sB = toDer(signatureParts.s)
  const rTlv = Bytes.concat(new Uint8Array([0x02, rB.length]), rB)
  const sTlv = Bytes.concat(new Uint8Array([0x02, sB.length]), sB)
  const inner = Bytes.concat(rTlv, sTlv)
  return Bytes.concat(new Uint8Array([0x30, inner.length]), inner)
})()

const signMockResponse = {
  id: 'creds',
  response: {
    authenticatorData: Bytes.fromHex(authenticatorData),
    clientDataJSON: clientDataJSONBytes,
    signature: derSignature,
  },
} as never

describe('Authentication.sign (mock)', () => {
  bench('default', async () => {
    await Authentication.sign({
      getFn: () => Promise.resolve(signMockResponse),
      challenge,
    })
  })
})

const signResponse = await Authentication.sign({
  getFn: () => Promise.resolve(signMockResponse),
  challenge,
})

describe('Authentication.verify', () => {
  bench('default', () => {
    Authentication.verify({
      challenge,
      metadata: signResponse.metadata,
      origin: 'https://example.com',
      publicKey,
      rpId: 'example.com',
      signature: signResponse.signature,
    })
  })
})
