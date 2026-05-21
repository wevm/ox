import { bench, describe } from 'vp/test'
import * as Base64 from '../core/Base64.js'
import * as Bytes from '../core/Bytes.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import * as P256 from '../core/P256.js'
import * as Signature from '../core/Signature.js'
import * as Authenticator from './Authenticator.js'
import * as Registration from './Registration.js'

// Bench-only window stub. Set before module-level fixture construction so
// helpers that read `window.location.hostname` do not throw at import time.
;(globalThis as { window?: unknown }).window ??= {
  location: { hostname: 'example.com' },
  document: { title: 'Example' },
}

const challenge =
  '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf'
const origin = 'https://example.com'
const rpId = 'example.com'

const { privateKey, publicKey } = P256.createKeyPair()
const credentialId = new Uint8Array(20).fill(42)

const authData = Authenticator.getAuthenticatorData({
  rpId,
  flag: 0x45, // UP + UV + AT
  credential: { id: credentialId, publicKey },
})

const clientDataJSONBytes = Bytes.fromString(
  JSON.stringify({
    type: 'webauthn.create',
    challenge: Base64.fromHex(challenge, { url: true, pad: false }),
    origin,
    crossOrigin: false,
  }),
)

const clientDataHash = Hash.sha256(clientDataJSONBytes, { as: 'Bytes' })
const verificationData = Bytes.concat(Hex.toBytes(authData), clientDataHash)
const sig = P256.sign({ payload: verificationData, privateKey, hash: true })
const attStmt = { alg: -7, sig: Signature.toDerBytes(sig) }

const attestationObjectBytes = Hex.toBytes(
  Authenticator.getAttestationObject({ authData, fmt: 'packed', attStmt }),
)

const credential = await Registration.create({
  createFn: () =>
    Promise.resolve({
      id: Base64.fromBytes(credentialId, { url: true, pad: false }),
      type: 'public-key',
      authenticatorAttachment: 'platform',
      rawId: credentialId.buffer,
      response: {
        clientDataJSON: clientDataJSONBytes.buffer,
        attestationObject: attestationObjectBytes.buffer,
        getPublicKey() {
          // Force fallback through attestationObject so we don't need a real
          // browser-supplied SPKI for the bench fixture.
          throw new Error('Permission denied to access object')
        },
      },
      getClientExtensionResults: () => ({}),
    } as never),
  name: 'Example',
  challenge,
  rp: { id: rpId, name: 'Bench' },
})

describe('Registration.verify (packed)', () => {
  bench('default', () => {
    Registration.verify({
      credential,
      challenge,
      origin,
      rpId,
      attestation: 'required',
    })
  })
})

describe('Registration.verify (none)', () => {
  // Build a minimal attestation with `fmt: 'none'` so we exercise the COSE
  // decode path without the additional attestation signature verify.
  const noneAttestationObject = Hex.toBytes(
    Authenticator.getAttestationObject({ authData, fmt: 'none' }),
  )

  const noneCredential = {
    attestationObject: noneAttestationObject.buffer as ArrayBuffer,
    clientDataJSON: clientDataJSONBytes.buffer as ArrayBuffer,
    id: Base64.fromBytes(credentialId, { url: true, pad: false }),
    publicKey,
    raw: credential.raw,
  }

  bench('default', () => {
    Registration.verify({
      credential: noneCredential,
      challenge,
      origin,
      rpId,
    })
  })
})
