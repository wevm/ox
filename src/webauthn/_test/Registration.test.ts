import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import * as Base64 from '../../core/Base64.js'
import * as Bytes from '../../core/Bytes.js'
import * as Hash from '../../core/Hash.js'
import * as Hex from '../../core/Hex.js'
import * as P256 from '../../core/P256.js'
import * as Signature from '../../core/Signature.js'
import {
  Authentication,
  Authenticator,
  Registration,
  type Types,
} from '../index.js'

beforeAll(() => {
  vi.stubGlobal('window', {
    location: {
      hostname: 'https://example.com',
    },
    document: {
      title: 'My Website',
    },
  })
})
afterAll(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  test('default', async () => {
    let options: CredentialCreationOptions | undefined

    const credential = await Registration.create({
      createFn(options_) {
        options = options_
        return Promise.resolve({
          id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
          response: {
            getPublicKey() {
              return [
                48, 89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134,
                72, 206, 61, 3, 1, 7, 3, 66, 0, 4, 171, 137, 20, 0, 20, 15, 196,
                248, 233, 65, 206, 15, 249, 14, 65, 157, 233, 71, 10, 202, 202,
                97, 59, 189, 113, 122, 71, 117, 67, 80, 49, 167, 216, 132, 49,
                142, 145, 159, 211, 179, 229, 166, 49, 216, 102, 216, 163, 128,
                180, 64, 99, 231, 15, 12, 56, 30, 225, 110, 6, 82, 247, 249,
                117, 84,
              ]
            },
          },
        } as any)
      },
      name: 'Foo',
    })

    expect(credential).toMatchInlineSnapshot(`
      {
        "attestationObject": undefined,
        "clientDataJSON": undefined,
        "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
        "publicKey": {
          "prefix": 4,
          "x": 77587693192652859874025541476425832478302972220661277688017673393936226333095n,
          "y": 97933141135755737384413290261786792525004108403409931527059712582886746584404n,
        },
        "raw": {
          "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
          "response": {
            "getPublicKey": [Function],
          },
        },
      }
    `)
    expect(options).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "attestation": "none",
          "authenticatorSelection": {
            "requireResidentKey": false,
            "residentKey": "preferred",
            "userVerification": "required",
          },
          "challenge": Uint8Array [
            105,
            171,
            180,
            181,
            160,
            222,
            75,
            198,
            42,
            42,
            32,
            31,
            141,
            37,
            186,
            233,
          ],
          "pubKeyCredParams": [
            {
              "alg": -7,
              "type": "public-key",
            },
          ],
          "rp": {
            "id": "https://example.com",
            "name": "My Website",
          },
          "user": {
            "displayName": "Foo",
            "id": Uint8Array [
              182,
              8,
              199,
              66,
              131,
              243,
              52,
              225,
              240,
              71,
              219,
              191,
              29,
              170,
              36,
              7,
              212,
              29,
              70,
              137,
              172,
              166,
              124,
              66,
              39,
              150,
              249,
              54,
              172,
              206,
              22,
              183,
            ],
            "name": "Foo",
          },
        },
      }
    `)
  })

  test('error: null credential', async () => {
    await expect(() =>
      Registration.create({
        createFn() {
          return Promise.resolve(null)
        },
        name: 'Foo',
      }),
    ).rejects.toMatchInlineSnapshot(`
      [Registration.CreateFailedError: Failed to create credential.

      Details: Failed to create credential.]
    `)
  })

  test('error: thrown', async () => {
    await expect(() =>
      Registration.create({
        createFn() {
          return Promise.reject(new Error('foo'))
        },
        name: 'Foo',
      }),
    ).rejects.toMatchInlineSnapshot(`
      [Registration.CreateFailedError: Failed to create credential.

      Details: foo]
    `)
  })

  test('behavior: firefox workaround', async () => {
    const credential = await Registration.create({
      createFn(_options) {
        return Promise.resolve({
          id: 'DxRcX5C6BRQ-q-CO7XEFwrnmKlk',
          response: {
            attestationObject: new Uint8Array([
              163, 99, 102, 109, 116, 100, 110, 111, 110, 101, 103, 97, 116,
              116, 83, 116, 109, 116, 160, 104, 97, 117, 116, 104, 68, 97, 116,
              97, 88, 152, 73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15,
              100, 118, 96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92,
              243, 186, 131, 29, 151, 99, 93, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 15, 20, 92, 95, 144, 186, 5, 20,
              62, 171, 224, 142, 237, 113, 5, 194, 185, 230, 42, 89, 165, 1, 2,
              3, 38, 32, 1, 33, 88, 32, 98, 163, 23, 104, 212, 79, 94, 255, 34,
              47, 141, 112, 196, 203, 97, 171, 210, 132, 11, 39, 214, 23, 167,
              254, 141, 17, 183, 45, 213, 232, 111, 193, 34, 88, 32, 102, 17,
              186, 227, 241, 226, 205, 56, 228, 5, 21, 55, 118, 167, 220, 182,
              153, 91, 130, 84, 161, 65, 110, 173, 16, 42, 9, 108, 176, 216, 6,
              24,
            ]),
            getPublicKey() {
              throw new Error('Permission denied to access object')
            },
          },
        } as any)
      },
      name: 'Example',
    })

    const publicKey = credential.publicKey
    expect(publicKey).toMatchInlineSnapshot(`
      {
        "prefix": 4,
        "x": 44614816799078269475358047303051634413161263247311473071495733982312972971969n,
        "y": 46167236825796363714760407637183215339795593866991122305568923653847108814360n,
      }
    `)

    expect(
      Authentication.verify({
        metadata: {
          authenticatorData:
            '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631d00000000',
          clientDataJSON:
            '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173"}',
          challengeIndex: 23,
          typeIndex: 1,
          userVerificationRequired: true,
        },
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature: {
          r: 113791849669138837781667788757552147501372344687388971338283671717487200515057n,
          s: 5390836038580862917709632535460377625750500964730124261384576347991859205326n,
        },
      }),
    ).toBeTruthy()
  })
})

describe('getOptions', () => {
  test('default', () => {
    expect(
      Registration.getOptions({
        name: 'Foo',
      }),
    ).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "attestation": "none",
          "authenticatorSelection": {
            "requireResidentKey": false,
            "residentKey": "preferred",
            "userVerification": "required",
          },
          "challenge": Uint8Array [
            105,
            171,
            180,
            181,
            160,
            222,
            75,
            198,
            42,
            42,
            32,
            31,
            141,
            37,
            186,
            233,
          ],
          "pubKeyCredParams": [
            {
              "alg": -7,
              "type": "public-key",
            },
          ],
          "rp": {
            "id": "https://example.com",
            "name": "My Website",
          },
          "user": {
            "displayName": "Foo",
            "id": Uint8Array [
              182,
              8,
              199,
              66,
              131,
              243,
              52,
              225,
              240,
              71,
              219,
              191,
              29,
              170,
              36,
              7,
              212,
              29,
              70,
              137,
              172,
              166,
              124,
              66,
              39,
              150,
              249,
              54,
              172,
              206,
              22,
              183,
            ],
            "name": "Foo",
          },
        },
      }
    `)
  })

  test('args: excludeCredentialIds', () => {
    expect(
      Registration.getOptions({
        excludeCredentialIds: ['pzpQZRhXUkboj-b_srH0X42XJS7Ai2ZXd6-9lnFULig'],
        name: 'Foo',
      }),
    ).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "attestation": "none",
          "authenticatorSelection": {
            "requireResidentKey": false,
            "residentKey": "preferred",
            "userVerification": "required",
          },
          "challenge": Uint8Array [
            105,
            171,
            180,
            181,
            160,
            222,
            75,
            198,
            42,
            42,
            32,
            31,
            141,
            37,
            186,
            233,
          ],
          "excludeCredentials": [
            {
              "id": Uint8Array [
                167,
                58,
                80,
                101,
                24,
                87,
                82,
                70,
                232,
                143,
                230,
                255,
                178,
                177,
                244,
                95,
                141,
                151,
                37,
                46,
                192,
                139,
                102,
                87,
                119,
                175,
                189,
                150,
                113,
                84,
                46,
                40,
              ],
              "type": "public-key",
            },
          ],
          "pubKeyCredParams": [
            {
              "alg": -7,
              "type": "public-key",
            },
          ],
          "rp": {
            "id": "https://example.com",
            "name": "My Website",
          },
          "user": {
            "displayName": "Foo",
            "id": Uint8Array [
              182,
              8,
              199,
              66,
              131,
              243,
              52,
              225,
              240,
              71,
              219,
              191,
              29,
              170,
              36,
              7,
              212,
              29,
              70,
              137,
              172,
              166,
              124,
              66,
              39,
              150,
              249,
              54,
              172,
              206,
              22,
              183,
            ],
            "name": "Foo",
          },
        },
      }
    `)
  })

  test('args: user', () => {
    expect(
      Registration.getOptions({
        user: {
          name: 'Foo',
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "attestation": "none",
          "authenticatorSelection": {
            "requireResidentKey": false,
            "residentKey": "preferred",
            "userVerification": "required",
          },
          "challenge": Uint8Array [
            105,
            171,
            180,
            181,
            160,
            222,
            75,
            198,
            42,
            42,
            32,
            31,
            141,
            37,
            186,
            233,
          ],
          "pubKeyCredParams": [
            {
              "alg": -7,
              "type": "public-key",
            },
          ],
          "rp": {
            "id": "https://example.com",
            "name": "My Website",
          },
          "user": {
            "displayName": "Foo",
            "id": Uint8Array [
              182,
              8,
              199,
              66,
              131,
              243,
              52,
              225,
              240,
              71,
              219,
              191,
              29,
              170,
              36,
              7,
              212,
              29,
              70,
              137,
              172,
              166,
              124,
              66,
              39,
              150,
              249,
              54,
              172,
              206,
              22,
              183,
            ],
            "name": "Foo",
          },
        },
      }
    `)
  })
})

describe('serializeOptions', () => {
  test('default', () => {
    const options = Registration.getOptions({ name: 'Foo' })
    const serialized = Registration.serializeOptions(options)

    expect(typeof serialized.publicKey!.challenge).toBe('string')
    expect(typeof serialized.publicKey!.user.id).toBe('string')
    expect(serialized).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "attestation": "none",
          "authenticatorSelection": {
            "requireResidentKey": false,
            "residentKey": "preferred",
            "userVerification": "required",
          },
          "challenge": "0x69abb4b5a0de4bc62a2a201f8d25bae9",
          "pubKeyCredParams": [
            {
              "alg": -7,
              "type": "public-key",
            },
          ],
          "rp": {
            "id": "https://example.com",
            "name": "My Website",
          },
          "user": {
            "displayName": "Foo",
            "id": "tgjHQoPzNOHwR9u_HaokB9QdRomspnxCJ5b5NqzOFrc",
            "name": "Foo",
          },
        },
      }
    `)
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })

  test('with excludeCredentials', () => {
    const options = Registration.getOptions({
      name: 'Foo',
      excludeCredentialIds: ['pzpQZRhXUkboj-b_srH0X42XJS7Ai2ZXd6-9lnFULig'],
    })
    const serialized = Registration.serializeOptions(options)

    expect(typeof serialized.publicKey!.excludeCredentials![0]!.id).toBe(
      'string',
    )
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })

  test('with extensions (prf)', () => {
    const options: Types.CredentialCreationOptions = {
      publicKey: {
        challenge: new Uint8Array([1, 2, 3]),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        rp: { id: 'test', name: 'Test' },
        user: {
          id: new Uint8Array([4, 5, 6]),
          name: 'Test',
          displayName: 'Test',
        },
        extensions: {
          prf: {
            eval: {
              first: new Uint8Array([7, 8, 9]),
            },
          },
        },
      },
    }
    const serialized = Registration.serializeOptions(options)

    expect(typeof serialized.publicKey!.extensions!.prf!.eval.first).toBe(
      'string',
    )
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })

  test('empty publicKey', () => {
    const serialized = Registration.serializeOptions({})
    expect(serialized).toEqual({})
  })
})

describe('deserializeOptions', () => {
  test('default', () => {
    const options = Registration.getOptions({ name: 'Foo' })
    const serialized = Registration.serializeOptions(options)
    const deserialized = Registration.deserializeOptions(serialized)

    expect(deserialized.publicKey!.challenge).toBeInstanceOf(Uint8Array)
    expect(deserialized.publicKey!.user.id).toBeInstanceOf(Uint8Array)
    expect(deserialized.publicKey!.challenge).toEqual(
      options.publicKey!.challenge,
    )
    expect(deserialized.publicKey!.user.id).toEqual(options.publicKey!.user.id)
    expect(deserialized.publicKey!.user.name).toBe(options.publicKey!.user.name)
    expect(deserialized.publicKey!.rp).toEqual(options.publicKey!.rp)
  })

  test('with excludeCredentials', () => {
    const options = Registration.getOptions({
      name: 'Foo',
      excludeCredentialIds: ['pzpQZRhXUkboj-b_srH0X42XJS7Ai2ZXd6-9lnFULig'],
    })
    const serialized = Registration.serializeOptions(options)
    const deserialized = Registration.deserializeOptions(serialized)

    expect(deserialized.publicKey!.excludeCredentials![0]!.id).toBeInstanceOf(
      Uint8Array,
    )
    expect(deserialized.publicKey!.excludeCredentials![0]!.id).toEqual(
      options.publicKey!.excludeCredentials![0]!.id,
    )
  })

  test('with extensions (prf)', () => {
    const options: Types.CredentialCreationOptions = {
      publicKey: {
        challenge: new Uint8Array([1, 2, 3]),
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        rp: { id: 'test', name: 'Test' },
        user: {
          id: new Uint8Array([4, 5, 6]),
          name: 'Test',
          displayName: 'Test',
        },
        extensions: {
          prf: {
            eval: {
              first: new Uint8Array([7, 8, 9]),
            },
          },
        },
      },
    }
    const serialized = Registration.serializeOptions(options)
    const deserialized = Registration.deserializeOptions(serialized)

    expect(deserialized.publicKey!.extensions!.prf!.eval.first).toBeInstanceOf(
      Uint8Array,
    )
    expect(deserialized.publicKey!.extensions!.prf!.eval.first).toEqual(
      new Uint8Array([7, 8, 9]),
    )
  })

  test('empty publicKey', () => {
    const deserialized = Registration.deserializeOptions({})
    expect(deserialized).toEqual({})
  })

  test('JSON round-trip', () => {
    const options = Registration.getOptions({
      name: 'Foo',
      excludeCredentialIds: ['pzpQZRhXUkboj-b_srH0X42XJS7Ai2ZXd6-9lnFULig'],
    })
    const serialized = Registration.serializeOptions(options)
    const json = JSON.stringify(serialized)
    const parsed = JSON.parse(json)
    const deserialized = Registration.deserializeOptions(parsed)

    expect(deserialized.publicKey!.challenge).toEqual(
      options.publicKey!.challenge,
    )
    expect(deserialized.publicKey!.user.id).toEqual(options.publicKey!.user.id)
  })
})

describe('verify', () => {
  async function mockCreateCredential(options?: {
    challenge?: `0x${string}`
    origin?: string
    rpId?: string
    flag?: number
    fmt?: 'none' | 'packed'
  }) {
    const challenge = options?.challenge ?? '0xdeadbeef'
    const origin = options?.origin ?? 'https://example.com'
    const rpId = options?.rpId ?? 'example.com'
    const flag = options?.flag ?? 0x45 // UP + UV + AT
    const fmt = options?.fmt ?? 'packed'

    const { privateKey, publicKey } = P256.createKeyPair()
    const credentialId = new Uint8Array(20).fill(42)

    const authData = Authenticator.getAuthenticatorData({
      rpId,
      flag,
      credential: { id: credentialId, publicKey },
    })

    const clientDataJSON = Bytes.fromString(
      JSON.stringify({
        type: 'webauthn.create',
        challenge: Base64.fromHex(challenge, { url: true, pad: false }),
        origin,
        crossOrigin: false,
      }),
    )

    const attStmt: Record<string, unknown> = {}
    if (fmt === 'packed') {
      const clientDataHash = Hash.sha256(clientDataJSON, { as: 'Bytes' })
      const verificationData = Bytes.concat(
        Hex.toBytes(authData),
        clientDataHash,
      )
      const sig = P256.sign({
        payload: verificationData,
        privateKey,
        hash: true,
      })
      attStmt.alg = -7
      attStmt.sig = Signature.toDerBytes(sig)
    }

    const attestationObject = Hex.toBytes(
      Authenticator.getAttestationObject({ authData, fmt, attStmt }),
    )

    const credential = await Registration.create({
      createFn: () =>
        Promise.resolve({
          id: Base64.fromBytes(credentialId, { url: true, pad: false }),
          type: 'public-key',
          authenticatorAttachment: 'platform',
          rawId: credentialId.buffer,
          response: {
            clientDataJSON: clientDataJSON.buffer,
            attestationObject: attestationObject.buffer,
            getPublicKey() {
              throw new Error('Permission denied to access object')
            },
          },
          getClientExtensionResults: () => ({}),
        } as any),
      name: 'Example',
      challenge,
      rp: { id: rpId, name: 'Test' },
    })

    return { challenge, credential, origin, rpId }
  }

  test('default', async () => {
    const { challenge, credential, origin, rpId } = await mockCreateCredential()

    const result = Registration.verify({
      credential,
      challenge,
      origin,
      rpId,
    })

    expect(result.credential).toEqual(credential)
    expect(result.counter).toBe(0)
    expect(result.userVerified).toBe(true)
  })

  test('options: challenge as Uint8Array', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential()

    const result = Registration.verify({
      credential,
      challenge: Hex.toBytes(challenge),
      origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('options: challenge as function', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential()

    const result = Registration.verify({
      credential,
      challenge: (c) =>
        c ===
        Base64.fromBytes(Hex.toBytes(challenge), { url: true, pad: false }),
      origin,
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('options: origin as array', async () => {
    const { credential, challenge, rpId } = await mockCreateCredential()

    const result = Registration.verify({
      credential,
      challenge,
      origin: ['https://other.com', 'https://example.com'],
      rpId,
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('options: userVerification = discouraged', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential({
      flag: 0x41,
    }) // UP + AT, no UV

    const result = Registration.verify({
      credential,
      challenge,
      origin,
      rpId,
      userVerification: 'discouraged',
    })

    expect(result.credential.id).toBe(credential.id)
    expect(result.userVerified).toBeUndefined()
  })

  test('error: wrong type', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential()

    const tamperedClientDataJSON = JSON.stringify({
      type: 'webauthn.get',
      challenge: Base64.fromHex(challenge, { url: true, pad: false }),
      origin,
    })
    credential.clientDataJSON = new TextEncoder().encode(tamperedClientDataJSON)
      .buffer as ArrayBuffer

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin,
        rpId,
      }),
    ).toThrow('Expected clientData.type "webauthn.create"')
  })

  test('error: challenge mismatch', async () => {
    const { credential, origin, rpId } = await mockCreateCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge: '0xbadbadbad',
        origin,
        rpId,
      }),
    ).toThrow('Challenge mismatch')
  })

  test('error: origin mismatch', async () => {
    const { credential, challenge, rpId } = await mockCreateCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin: 'https://evil.com',
        rpId,
      }),
    ).toThrow('Origin mismatch')
  })

  test('error: rpId mismatch', async () => {
    const { credential, challenge, origin } = await mockCreateCredential()

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin,
        rpId: 'evil.com',
      }),
    ).toThrow('rpId hash mismatch')
  })

  test('error: user verification required but not set', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential({
      flag: 0x41,
    }) // UP + AT, no UV

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin,
        rpId,
      }),
    ).toThrow('User verification flag not set')
  })

  test('options: attestation = none', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential({
      fmt: 'none',
    })

    const result = Registration.verify({
      credential,
      challenge,
      origin,
      rpId,
      attestation: 'none',
    })

    expect(result.credential.id).toBe(credential.id)
  })

  test('error: BS flag set without BE flag', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential({
      flag: 0x55,
    }) // UP + UV + AT + BS (without BE)

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin,
        rpId,
        attestation: 'none',
      }),
    ).toThrow('Backup state (BS) flag is set but backup eligibility (BE)')
  })

  test('error: credential ID mismatch', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential()

    // Tamper with the credential ID
    credential.id = 'tampered-id-that-does-not-match'

    expect(() =>
      Registration.verify({
        credential,
        challenge,
        origin,
        rpId,
      }),
    ).toThrow('Credential ID mismatch')
  })

  test('error: fmt none rejected when attestation is required', async () => {
    const { credential, challenge, origin, rpId } = await mockCreateCredential({
      fmt: 'none',
    })

    expect(() =>
      Registration.verify({
        attestation: 'required',
        credential,
        challenge,
        origin,
        rpId,
      }),
    ).toThrow(
      'Attestation format is "none" but attestation verification is required',
    )
  })

  test('serializeResponse → deserializeResponse round-trip', async () => {
    const { credential, challenge, origin, rpId } =
      await mockCreateCredential()

    const response = Registration.verify({
      credential,
      challenge,
      origin,
      rpId,
    })

    const serialized = Registration.serializeResponse(response)

    expect(typeof serialized.credential.attestationObject).toBe('string')
    expect(typeof serialized.credential.clientDataJSON).toBe('string')
    expect(typeof serialized.credential.publicKey).toBe('string')
    expect(serialized.credential.id).toBe(credential.id)
    expect(serialized.counter).toBe(0)
    expect(serialized.userVerified).toBe(true)

    const json = JSON.stringify(serialized)
    const deserialized = Registration.deserializeResponse(JSON.parse(json))

    expect(deserialized.credential.id).toBe(credential.id)
    expect(deserialized.credential.publicKey.x).toBe(
      credential.publicKey.x,
    )
    expect(deserialized.credential.publicKey.y).toBe(
      credential.publicKey.y,
    )
    expect(deserialized.counter).toBe(response.counter)
    expect(deserialized.userVerified).toBe(response.userVerified)
  })
})
