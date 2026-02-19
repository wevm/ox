import { describe, expect, test } from 'vitest'
import * as Base64 from '../../core/Base64.js'
import * as Bytes from '../../core/Bytes.js'
import * as Cbor from '../../core/Cbor.js'
import * as Hash from '../../core/Hash.js'
import * as Hex from '../../core/Hex.js'
import * as P256 from '../../core/P256.js'
import * as Signature from '../../core/Signature.js'
import {
  Authentication,
  Authenticator,
  Credential,
  Registration,
} from '../index.js'

const rpId = 'localhost'
const rpName = 'Ox Test'

describe('create + verify', () => {
  test('full ceremony', async () => {
    const { credential, challenge } = await createCredential()

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
    expect(result.credential.publicKey.x).toBeTypeOf('bigint')
    expect(result.credential.publicKey.y).toBeTypeOf('bigint')
    expect(result.counter).toBeTypeOf('number')
    expect(result.userVerified).toBe(true)
  })

  test('verify returns derived id when credential.id omitted', async () => {
    const { credential, challenge } = await createCredential()

    const result = Registration.verify({
      credential: {
        attestationObject: credential.attestationObject,
        clientDataJSON: credential.clientDataJSON,
        raw: credential.raw,
      },
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBeTypeOf('string')
    expect(result.credential.id.length).toBeGreaterThan(0)
  })

  test('end-to-end: registration → authentication', async () => {
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
})

describe('serialize/deserialize round-trip', () => {
  test('options round-trip: getOptions → serialize → JSON → deserialize → create', async () => {
    const challenge = Hex.random(32)
    const options = Registration.getOptions({
      name: 'roundtrip-user',
      challenge,
      rp: { id: rpId, name: rpName },
    })
    const serialized = Registration.serializeOptions(options)
    const json = JSON.stringify(serialized)
    const deserialized = Registration.deserializeOptions(JSON.parse(json))

    const credential = await Registration.create({
      ...deserialized.publicKey!,
      name: 'roundtrip-user',
    })

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('credential round-trip: serialize → JSON → deserialize → verify', async () => {
    const { credential, challenge } = await createCredential()

    const serialized = Credential.serialize(credential)
    const json = JSON.stringify(serialized)
    const deserialized = Credential.deserialize(JSON.parse(json))

    const result = Registration.verify({
      credential: deserialized,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
    expect(result.credential.publicKey.x).toBe(credential.publicKey.x)
    expect(result.credential.publicKey.y).toBe(credential.publicKey.y)
  })
})

describe('attestation modes', () => {
  test('required attestation rejects fmt:none', () => {
    const { credential, challenge } = buildNoneCredential()

    expect(() =>
      Registration.verify({
        attestation: 'required',
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow(
      'Attestation format is "none" but attestation verification is required',
    )
  })

  test('attestation: none accepts fmt:none', async () => {
    const { credential, challenge } = await createCredential()

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('packed self-attestation verifies when attestation required', () => {
    const { credential, challenge } = buildPackedCredential()

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
      attestation: 'required',
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('packed with x5c is rejected', () => {
    const { credential, challenge } = buildPackedCredential()

    const attObj = decodeAttObj(credential)
    attObj.attStmt.x5c = [new Uint8Array([0xde, 0xad])]
    encodeAttObj(credential, attObj)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('x5c certificate chain is not supported')
  })
})

describe('behavior: BE/BS flag consistency', () => {
  test('rejects BS set without BE', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x55 })

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Backup state (BS) flag is set but backup eligibility (BE)')
  })

  test('accepts BE + BS both set', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x5d })

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.backedUp).toBe(true)
    expect(result.deviceType).toBe('multiDevice')
  })

  test('accepts BE set + BS not set', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x4d })

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.backedUp).toBe(false)
    expect(result.deviceType).toBe('singleDevice')
  })
})

describe('behavior: credential ID consistency', () => {
  test('rejects tampered credential.id', async () => {
    const { credential, challenge } = await createCredential()

    credential.id = 'tampered-credential-id'

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Credential ID mismatch')
  })

  test('rejects tampered credentialId in authData', () => {
    const { credential, challenge } = buildPackedCredential()

    const attObj = decodeAttObj(credential)
    const authData = new Uint8Array(attObj.authData)
    authData[55] = authData[55]! ^ 0xff
    attObj.authData = authData
    encodeAttObj(credential, attObj)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Credential ID mismatch')
  })
})

describe('behavior: required origin/rpId', () => {
  test('rejects wrong rpId', async () => {
    const { credential, challenge } = await createCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId: 'evil.com',
      }),
    ).toThrow('rpId hash mismatch')
  })

  test('rejects wrong origin', async () => {
    const { credential, challenge } = await createCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: 'https://evil.com',
        rpId,
      }),
    ).toThrow('Origin mismatch')
  })

  test('origin as array works when one matches', async () => {
    const { credential, challenge } = await createCredential()

    const result = Registration.verify({
      credential,
      challenge,
      origin: ['https://other.com', window.location.origin],
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('origin as array rejects when none match', async () => {
    const { credential, challenge } = await createCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: ['https://evil.com', 'https://also-evil.com'],
        rpId,
      }),
    ).toThrow('Origin mismatch')
  })
})

describe('behavior: trailing bytes after COSE key', () => {
  test('rejects trailing bytes when ED flag not set', () => {
    const { credential, challenge } = buildNoneCredential()

    const attObj = decodeAttObj(credential)
    const authData = attObj.authData
    const extended = new Uint8Array(authData.length + 4)
    extended.set(authData)
    extended.set([0xde, 0xad, 0xbe, 0xef], authData.length)
    extended[32] = extended[32]! & ~0x80
    attObj.authData = extended
    encodeAttObj(credential, attObj)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('unexpected trailing byte(s) after COSE key')
  })

  test('allows trailing bytes when ED flag is set', () => {
    const { credential, challenge } = buildNoneCredential()

    const attObj = decodeAttObj(credential)
    const authData = attObj.authData
    const extended = new Uint8Array(authData.length + 4)
    extended.set(authData)
    extended.set([0xde, 0xad, 0xbe, 0xef], authData.length)
    extended[32] = extended[32]! | 0x80
    attObj.authData = extended
    encodeAttObj(credential, attObj)

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })
})

describe('vulnerability: tampered clientDataJSON', () => {
  test('rejects wrong type (webauthn.get)', async () => {
    const { credential, challenge } = await createCredential()

    const json = JSON.parse(
      Bytes.toString(new Uint8Array(credential.clientDataJSON)),
    )
    json.type = 'webauthn.get'
    credential.clientDataJSON = Bytes.fromString(JSON.stringify(json))
      .buffer as ArrayBuffer

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Expected clientData.type "webauthn.create"')
  })

  test('rejects tampered origin in clientDataJSON', async () => {
    const { credential, challenge } = await createCredential()

    const json = JSON.parse(
      Bytes.toString(new Uint8Array(credential.clientDataJSON)),
    )
    json.origin = 'https://evil.com'
    credential.clientDataJSON = Bytes.fromString(JSON.stringify(json))
      .buffer as ArrayBuffer

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Origin mismatch')
  })

  test('rejects tampered challenge in clientDataJSON', async () => {
    const { credential, challenge } = await createCredential()

    const json = JSON.parse(
      Bytes.toString(new Uint8Array(credential.clientDataJSON)),
    )
    json.challenge = Base64.fromBytes(new Uint8Array(32), {
      url: true,
      pad: false,
    })
    credential.clientDataJSON = Bytes.fromString(JSON.stringify(json))
      .buffer as ArrayBuffer

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Challenge mismatch')
  })
})

describe('vulnerability: tampered authData flags', () => {
  test('rejects UP flag cleared', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x44 })

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('User presence flag not set')
  })

  test('rejects AT flag cleared', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x05 })

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Attested credential data flag not set')
  })

  test('rejects UV cleared when userVerification required', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x41 })

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
        userVerification: 'required',
      }),
    ).toThrow('User verification flag not set')
  })

  test('accepts UV cleared when userVerification discouraged', () => {
    const { credential, challenge } = buildPackedCredential({ flag: 0x41 })

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
      userVerification: 'discouraged',
    })

    expect(result.credential.id).toBe(credential.id)
    expect(result.userVerified).toBeUndefined()
  })
})

describe('vulnerability: tampered rpIdHash', () => {
  test('rejects authData with wrong rpIdHash', () => {
    const { credential, challenge } = buildPackedCredential()

    const attObj = decodeAttObj(credential)
    const authData = new Uint8Array(attObj.authData)
    const evilHash = Hash.sha256(Hex.fromString('evil.com'), { as: 'Bytes' })
    authData.set(evilHash, 0)
    attObj.authData = authData
    encodeAttObj(credential, attObj)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('rpId hash mismatch')
  })
})

describe('vulnerability: credIdLen bounds', () => {
  test('rejects credIdLen exceeding authData length', () => {
    const { credential, challenge } = buildPackedCredential()

    const attObj = decodeAttObj(credential)
    const authData = new Uint8Array(attObj.authData)
    authData[53] = 0xff
    authData[54] = 0xff
    attObj.authData = authData
    encodeAttObj(credential, attObj)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('credIdLen exceeds authData bounds')
  })

  test('rejects truncated authData', () => {
    const { credential, challenge } = buildPackedCredential()

    const attObj = decodeAttObj(credential)
    attObj.authData = attObj.authData.slice(0, 40)
    encodeAttObj(credential, attObj)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('authData too short for attested credential data')
  })
})

describe('vulnerability: replay attacks', () => {
  test('replay possible with fmt:none (documented risk)', async () => {
    const challengeA = Hex.random(32)
    const challengeB = Hex.random(32)

    const { credential } = await createCredential(challengeA)

    const json = JSON.parse(
      Bytes.toString(new Uint8Array(credential.clientDataJSON)),
    )
    json.challenge = Base64.fromHex(challengeB, { url: true, pad: false })
    credential.clientDataJSON = Bytes.fromString(JSON.stringify(json))
      .buffer as ArrayBuffer

    const result = Registration.verify({
      credential,
      challenge: challengeB,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBeDefined()
  })

  test('replay fails with packed self-attestation', () => {
    const challengeA = Hex.random(32)
    const challengeB = Hex.random(32)

    const { credential } = buildPackedCredential({ challenge: challengeA })

    const json = JSON.parse(
      Bytes.toString(new Uint8Array(credential.clientDataJSON)),
    )
    json.challenge = Base64.fromHex(challengeB, { url: true, pad: false })
    credential.clientDataJSON = Bytes.fromString(JSON.stringify(json))
      .buffer as ArrayBuffer

    expect(() =>
      Registration.verify({
        credential,
        challenge: challengeB,
        origin: window.location.origin,
        rpId,
        attestation: 'required',
      }),
    ).toThrow('Attestation signature verification failed')
  })
})

describe('vulnerability: cross-origin', () => {
  test('crossOrigin: true in clientDataJSON still passes if origin matches', async () => {
    const { credential, challenge } = await createCredential()

    const json = JSON.parse(
      Bytes.toString(new Uint8Array(credential.clientDataJSON)),
    )
    json.crossOrigin = true
    credential.clientDataJSON = Bytes.fromString(JSON.stringify(json))
      .buffer as ArrayBuffer

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })
})

describe('challenge formats', () => {
  test('challenge as Uint8Array', async () => {
    const challenge = Hex.random(32)
    const { credential } = await createCredential(challenge)

    const result = Registration.verify({
      credential,
      challenge: Hex.toBytes(challenge),
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('challenge as Hex string', async () => {
    const challenge = Hex.random(32)
    const { credential } = await createCredential(challenge)

    const result = Registration.verify({
      credential,
      challenge,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('challenge as validator function', async () => {
    const challenge = Hex.random(32)
    const { credential } = await createCredential(challenge)

    const expectedB64 = Base64.fromHex(challenge, { url: true, pad: false })

    const result = Registration.verify({
      credential,
      challenge: (c) => c === expectedB64,
      origin: window.location.origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('challenge validator returning false rejects', async () => {
    const { credential } = await createCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge: () => false,
        origin: window.location.origin,
        rpId,
      }),
    ).toThrow('Challenge mismatch')
  })
})

function decodeAttObj(credential: Credential.Credential) {
  const bytes = new Uint8Array(credential.attestationObject)
  return Cbor.decode<{
    authData: Uint8Array
    attStmt: Record<string, unknown>
    fmt: string
  }>(bytes)
}

function encodeAttObj(
  credential: Credential.Credential,
  attObj: {
    authData: Uint8Array
    attStmt: Record<string, unknown>
    fmt: string
  },
) {
  const hex = Cbor.encode({
    fmt: attObj.fmt,
    attStmt: attObj.attStmt,
    authData: attObj.authData,
  })
  credential.attestationObject = Hex.toBytes(hex).buffer as ArrayBuffer
}

async function createCredential(challenge?: Hex.Hex) {
  const ch = challenge ?? Hex.random(32)
  const credential = await Registration.create({
    name: `user-${Date.now()}`,
    challenge: ch,
    rp: { id: rpId, name: rpName },
  })
  return { credential, challenge: ch }
}

function buildPackedCredential(options?: {
  challenge?: Hex.Hex
  flag?: number
}) {
  const challenge = options?.challenge ?? Hex.random(32)
  const flag = options?.flag ?? 0x45

  const { privateKey, publicKey } = P256.createKeyPair()
  const credentialId = crypto.getRandomValues(new Uint8Array(20))

  const authData = Authenticator.getAuthenticatorData({
    rpId,
    flag,
    credential: { id: credentialId, publicKey },
  })

  const clientDataJSON = Bytes.fromString(
    JSON.stringify({
      type: 'webauthn.create',
      challenge: Base64.fromHex(challenge, { url: true, pad: false }),
      origin: window.location.origin,
      crossOrigin: false,
    }),
  )

  const clientDataHash = Hash.sha256(clientDataJSON, { as: 'Bytes' })
  const verificationData = Bytes.concat(Hex.toBytes(authData), clientDataHash)
  const sig = P256.sign({
    payload: verificationData,
    privateKey,
    hash: true,
  })

  const attestationObject = Hex.toBytes(
    Authenticator.getAttestationObject({
      authData,
      fmt: 'packed',
      attStmt: { alg: -7, sig: Signature.toDerBytes(sig) },
    }),
  )

  const id = Base64.fromBytes(credentialId, { url: true, pad: false })
  const credential: Credential.Credential = {
    id,
    publicKey,
    attestationObject: attestationObject.buffer as ArrayBuffer,
    clientDataJSON: clientDataJSON.buffer as ArrayBuffer,
    raw: {
      authenticatorAttachment: null,
      getClientExtensionResults: () => ({}),
      id,
      rawId: credentialId.buffer as ArrayBuffer,
      response: {
        attestationObject: attestationObject.buffer,
        clientDataJSON: clientDataJSON.buffer,
      } as never,
      type: 'public-key',
    },
  }

  return { credential, challenge, publicKey, privateKey }
}

function buildNoneCredential(flagOverride?: number) {
  const challenge = Hex.random(32)
  const flag = flagOverride ?? 0x45
  const { publicKey } = P256.createKeyPair()
  const credentialId = crypto.getRandomValues(new Uint8Array(20))

  const authData = Authenticator.getAuthenticatorData({
    rpId,
    flag,
    credential: { id: credentialId, publicKey },
  })
  const clientDataJSON = Bytes.fromString(
    JSON.stringify({
      type: 'webauthn.create',
      challenge: Base64.fromHex(challenge, { url: true, pad: false }),
      origin: window.location.origin,
      crossOrigin: false,
    }),
  )
  const attestationObject = Hex.toBytes(
    Authenticator.getAttestationObject({ authData, fmt: 'none' }),
  )
  const id = Base64.fromBytes(credentialId, { url: true, pad: false })
  const credential: Credential.Credential = {
    id,
    publicKey,
    attestationObject: attestationObject.buffer as ArrayBuffer,
    clientDataJSON: clientDataJSON.buffer as ArrayBuffer,
    raw: {
      authenticatorAttachment: null,
      getClientExtensionResults: () => ({}),
      id,
      rawId: credentialId.buffer as ArrayBuffer,
      response: {
        attestationObject: attestationObject.buffer,
        clientDataJSON: clientDataJSON.buffer,
      } as never,
      type: 'public-key',
    },
  }
  return { credential, challenge }
}
