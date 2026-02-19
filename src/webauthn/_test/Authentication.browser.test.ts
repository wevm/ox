import { describe, expect, test } from 'vitest'
import * as Bytes from '../../core/Bytes.js'
import * as Hash from '../../core/Hash.js'
import * as Hex from '../../core/Hex.js'
import * as P256 from '../../core/P256.js'
import {
  Authentication,
  Authenticator,
  Credential,
  Registration,
} from '../index.js'

const rpId = 'localhost'
const rpName = 'Ox Test'

describe('sign', () => {
  test('signs with credentialId', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const result = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    expect(result.metadata.authenticatorData).toBeTypeOf('string')
    expect(result.metadata.clientDataJSON).toBeTypeOf('string')
    expect(result.metadata.challengeIndex).toBeTypeOf('number')
    expect(result.metadata.typeIndex).toBeTypeOf('number')
    expect(result.metadata.userVerificationRequired).toBe(true)
    expect(result.signature.r).toBeTypeOf('bigint')
    expect(result.signature.s).toBeTypeOf('bigint')
    expect(result.raw).toBeDefined()
  })

  test('signs with credentialId array', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const result = await Authentication.sign({
      credentialId: [credential.id],
      challenge,
      rpId,
    })

    expect(result.signature.r).toBeTypeOf('bigint')
    expect(result.signature.s).toBeTypeOf('bigint')
  })

  test('signs with CredentialRequestOptions', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const options = Authentication.getOptions({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const result = await Authentication.sign(options)

    expect(result.signature.r).toBeTypeOf('bigint')
    expect(result.signature.s).toBeTypeOf('bigint')

    const verified = Authentication.verify({
      metadata: result.metadata,
      challenge,
      publicKey: credential.publicKey,
      signature: result.signature,
    })

    expect(verified).toBe(true)
  })
})

describe('sign + verify', () => {
  test('full ceremony', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
    })

    expect(verified).toBe(true)
  })

  test('verify with origin validation', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
      origin: window.location.origin,
    })

    expect(verified).toBe(true)
  })

  test('verify with origin array', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
      origin: ['https://other.com', window.location.origin],
    })

    expect(verified).toBe(true)
  })

  test('verify with rpId validation', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
      rpId,
    })

    expect(verified).toBe(true)
  })

  test('rejects wrong challenge', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge: Hex.random(32),
      publicKey: credential.publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })

  test('rejects wrong origin', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
      origin: 'https://evil.com',
    })

    expect(verified).toBe(false)
  })

  test('rejects wrong rpId', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
      rpId: 'evil.com',
    })

    expect(verified).toBe(false)
  })
})

describe('end-to-end: registration → authentication', () => {
  test('Registration.create → Registration.verify → Authentication.sign → Authentication.verify', async () => {
    const regChallenge = Hex.random(32)
    const credential = await Registration.create({
      name: `e2e-${Date.now()}`,
      challenge: regChallenge,
      rp: { id: rpId, name: rpName },
    })

    const regResult = Registration.verify({
      credential,
      challenge: regChallenge,
      origin: window.location.origin,
      rpId,
    })

    const authChallenge = Hex.random(32)
    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge: authChallenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge: authChallenge,
      publicKey: regResult.credential.publicKey,
      signature,
      origin: window.location.origin,
      rpId,
    })

    expect(verified).toBe(true)
  })

  test('multiple authentications with same credential', async () => {
    const { credential } = await createCredential()

    for (let i = 0; i < 3; i++) {
      const challenge = Hex.random(32)
      const { metadata, signature } = await Authentication.sign({
        credentialId: credential.id,
        challenge,
        rpId,
      })

      const verified = Authentication.verify({
        metadata,
        challenge,
        publicKey: credential.publicKey,
        signature,
      })

      expect(verified).toBe(true)
    }
  })
})

describe('serialize/deserialize round-trip', () => {
  test('options round-trip: getOptions → serialize → JSON → deserialize → sign', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const options = Authentication.getOptions({
      credentialId: credential.id,
      challenge,
      rpId,
    })
    const serialized = Authentication.serializeOptions(options)
    const json = JSON.stringify(serialized)
    const deserialized = Authentication.deserializeOptions(JSON.parse(json))

    const { metadata, signature } = await Authentication.sign(deserialized)

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
    })

    expect(verified).toBe(true)
  })

  test('response round-trip: serializeResponse → JSON → deserializeResponse → verify', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const response = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    const serialized = Authentication.serializeResponse(response)
    const json = JSON.stringify(serialized)
    const deserialized = Authentication.deserializeResponse(JSON.parse(json))

    const verified = Authentication.verify({
      ...deserialized,
      challenge,
      publicKey: credential.publicKey,
    })

    expect(verified).toBe(true)
  })

  test('credential serialize → deserialize → authenticate', async () => {
    const { credential } = await createCredential()

    const serialized = Credential.serialize(credential)
    const json = JSON.stringify(serialized)
    const deserialized = Credential.deserialize(JSON.parse(json))

    const challenge = Hex.random(32)
    const { metadata, signature } = await Authentication.sign({
      credentialId: deserialized.id,
      challenge,
      rpId,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: deserialized.publicKey,
      signature,
    })

    expect(verified).toBe(true)
  })
})

describe('behavior: type validation', () => {
  test('rejects webauthn.create type in authentication', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      type: 'webauthn.create',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })
})

describe('behavior: BE/BS flag consistency', () => {
  test('rejects BS set without BE', () => {
    // flag 0x15 = UP (0x01) + UV (0x04) + BS (0x10) but no BE (0x08)
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      flag: 0x15,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })

  test('accepts BE + BS both set', () => {
    // flag 0x1d = UP (0x01) + UV (0x04) + BE (0x08) + BS (0x10)
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      flag: 0x1d,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(true)
  })

  test('accepts BE set + BS not set', () => {
    // flag 0x0d = UP (0x01) + UV (0x04) + BE (0x08)
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      flag: 0x0d,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(true)
  })
})

describe('behavior: UP flag', () => {
  test('rejects when UP flag is not set', () => {
    // flag 0x04 = UV only, no UP
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      flag: 0x04,
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })
})

describe('behavior: UV flag', () => {
  test('rejects when UV not set but userVerificationRequired is true', () => {
    // flag 0x01 = UP only, no UV
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      flag: 0x01,
      userVerification: 'required',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })

  test('accepts when UV not set and userVerificationRequired is false', () => {
    // flag 0x01 = UP only
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      flag: 0x01,
      userVerification: 'preferred',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(true)
  })
})

describe('behavior: authenticatorData length', () => {
  test('rejects authenticatorData shorter than 37 bytes', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata()

    metadata.authenticatorData = Hex.fromBytes(new Uint8Array(36))

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })
})

describe('behavior: origin validation', () => {
  test('rejects wrong origin when origin is provided', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      origin: 'https://legitimate.com',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
      origin: 'https://evil.com',
    })

    expect(verified).toBe(false)
  })

  test('accepts matching origin from array', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      origin: 'https://app.example.com',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
      origin: ['https://other.com', 'https://app.example.com'],
    })

    expect(verified).toBe(true)
  })

  test('rejects when origin not in array', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      origin: 'https://evil.com',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
      origin: ['https://app.example.com', 'https://other.com'],
    })

    expect(verified).toBe(false)
  })
})

describe('behavior: rpId validation', () => {
  test('rejects wrong rpId', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      rpId: 'legitimate.com',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
      rpId: 'evil.com',
    })

    expect(verified).toBe(false)
  })

  test('accepts matching rpId', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata({
      rpId: 'example.com',
    })

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
      rpId: 'example.com',
    })

    expect(verified).toBe(true)
  })
})

describe('behavior: challenge validation', () => {
  test('rejects tampered challenge in clientDataJSON', () => {
    const { metadata, signature, publicKey } = buildSignedMetadata()

    const verified = Authentication.verify({
      metadata,
      challenge: Hex.random(32),
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })

  test('rejects missing challenge in clientDataJSON', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata()

    const clientData = JSON.parse(metadata.clientDataJSON)
    delete clientData.challenge
    metadata.clientDataJSON = JSON.stringify(clientData)

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })
})

describe('behavior: signature validation', () => {
  test('rejects signature from wrong key', () => {
    const { metadata, challenge } = buildSignedMetadata()

    const { publicKey: wrongPublicKey } = P256.createKeyPair()

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: wrongPublicKey,
      signature: P256.sign({
        payload: Bytes.fromHex('0xdeadbeef'),
        privateKey: P256.createKeyPair().privateKey,
        hash: true,
      }),
    })

    expect(verified).toBe(false)
  })

  test('rejects tampered authenticatorData (invalidates signature)', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    // Flip a byte in the authenticatorData
    const authDataBytes = Bytes.fromHex(metadata.authenticatorData)
    authDataBytes[33] = authDataBytes[33]! ^ 0xff
    metadata.authenticatorData = Hex.fromBytes(authDataBytes)

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })

  test('rejects tampered clientDataJSON (invalidates signature)', async () => {
    const { credential } = await createCredential()
    const challenge = Hex.random(32)

    const { metadata, signature } = await Authentication.sign({
      credentialId: credential.id,
      challenge,
      rpId,
    })

    // Inject extra field into clientDataJSON
    const clientData = JSON.parse(metadata.clientDataJSON)
    clientData.injected = 'evil'
    metadata.clientDataJSON = JSON.stringify(clientData)

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey: credential.publicKey,
      signature,
    })

    expect(verified).toBe(false)
  })

  test('rejects high-S signature (malleability)', () => {
    const { metadata, signature, publicKey, challenge } = buildSignedMetadata()

    const n =
      0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n
    const highS = { r: signature.r, s: n - signature.s }

    const verified = Authentication.verify({
      metadata,
      challenge,
      publicKey,
      signature: highS,
    })

    expect(verified).toBe(false)
  })
})

async function createCredential(challenge?: Hex.Hex) {
  const ch = challenge ?? Hex.random(32)
  const credential = await Registration.create({
    name: `user-${Date.now()}`,
    challenge: ch,
    rp: { id: rpId, name: rpName },
  })
  return { credential, challenge: ch }
}

/** Builds a synthetic authentication response signed with a known key pair. */
function buildSignedMetadata(options?: {
  challenge?: Hex.Hex
  flag?: number
  origin?: string
  rpId?: string
  userVerification?: 'required' | 'preferred' | 'discouraged'
  type?: 'webauthn.get' | 'webauthn.create'
}) {
  const challenge = options?.challenge ?? Hex.random(32)
  const flag = options?.flag ?? 0x05 // UP + UV
  const origin = options?.origin ?? window.location.origin
  const rp = options?.rpId ?? rpId
  const userVerification = options?.userVerification ?? 'required'
  const type = options?.type ?? 'webauthn.get'

  const { privateKey, publicKey } = P256.createKeyPair()

  const authenticatorData = Authenticator.getAuthenticatorData({
    rpId: rp,
    flag,
  })
  const clientDataJSON = Authenticator.getClientDataJSON({
    challenge,
    origin,
    type,
  })
  const clientDataJSONHash = Hash.sha256(Hex.fromString(clientDataJSON))
  const payload = Hex.concat(authenticatorData, clientDataJSONHash)

  const signature = P256.sign({ payload, privateKey, hash: true })

  const challengeIndex = clientDataJSON.indexOf('"challenge"')
  const typeIndex = clientDataJSON.indexOf('"type"')

  const metadata = {
    authenticatorData,
    clientDataJSON,
    challengeIndex,
    typeIndex,
    userVerificationRequired: userVerification === 'required',
  }

  return { metadata, signature, publicKey, challenge }
}
