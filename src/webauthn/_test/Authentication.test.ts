import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import * as P256 from '../../core/P256.js'
import * as PublicKey from '../../core/PublicKey.js'
import * as Signature from '../../core/Signature.js'
import * as WebCryptoP256 from '../../core/WebCryptoP256.js'
import { Authentication } from '../index.js'

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

describe('getOptions', () => {
  test('default', () => {
    expect(
      Authentication.getOptions({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        rpId: 'foo',
      }),
    ).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "challenge": Uint8Array [
            246,
            49,
            5,
            138,
            59,
            161,
            17,
            106,
            204,
            225,
            35,
            150,
            250,
            208,
            161,
            37,
            181,
            4,
            28,
            67,
            248,
            225,
            87,
            35,
            112,
            159,
            129,
            170,
            141,
            95,
            76,
            207,
          ],
          "rpId": "foo",
          "userVerification": "required",
        },
      }
    `)
  })

  test('options: credentialId', () => {
    expect(
      Authentication.getOptions({
        credentialId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        rpId: 'foo',
      }),
    ).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "allowCredentials": [
            {
              "id": Uint8Array [
                155,
                95,
                155,
                48,
                251,
                128,
                170,
                149,
                161,
                11,
                17,
                217,
                65,
                148,
                211,
                233,
                239,
                165,
                72,
                249,
                237,
                65,
                184,
                119,
                162,
                146,
                40,
                25,
                238,
                224,
                225,
                11,
              ],
              "type": "public-key",
            },
          ],
          "challenge": Uint8Array [
            246,
            49,
            5,
            138,
            59,
            161,
            17,
            106,
            204,
            225,
            35,
            150,
            250,
            208,
            161,
            37,
            181,
            4,
            28,
            67,
            248,
            225,
            87,
            35,
            112,
            159,
            129,
            170,
            141,
            95,
            76,
            207,
          ],
          "rpId": "foo",
          "userVerification": "required",
        },
      }
    `)
  })
})

describe('serializeOptions', () => {
  test('default', () => {
    const options = Authentication.getOptions({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      rpId: 'foo',
    })
    const serialized = Authentication.serializeOptions(options)

    expect(typeof serialized.publicKey!.challenge).toBe('string')
    expect(serialized).toMatchInlineSnapshot(`
      {
        "publicKey": {
          "challenge": "0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf",
          "rpId": "foo",
          "userVerification": "required",
        },
      }
    `)
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })

  test('with allowCredentials', () => {
    const options = Authentication.getOptions({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      credentialId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      rpId: 'foo',
    })
    const serialized = Authentication.serializeOptions(options)

    expect(typeof serialized.publicKey!.allowCredentials![0]!.id).toBe('string')
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })

  test('empty publicKey', () => {
    const serialized = Authentication.serializeOptions({})
    expect(serialized).toEqual({})
  })
})

describe('deserializeOptions', () => {
  test('default', () => {
    const options = Authentication.getOptions({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      rpId: 'foo',
    })
    const serialized = Authentication.serializeOptions(options)
    const deserialized = Authentication.deserializeOptions(serialized)

    expect(deserialized.publicKey!.challenge).toBeInstanceOf(Uint8Array)
    expect(deserialized.publicKey!.challenge).toEqual(
      options.publicKey!.challenge,
    )
    expect(deserialized.publicKey!.rpId).toBe(options.publicKey!.rpId)
  })

  test('with allowCredentials', () => {
    const options = Authentication.getOptions({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      credentialId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      rpId: 'foo',
    })
    const serialized = Authentication.serializeOptions(options)
    const deserialized = Authentication.deserializeOptions(serialized)

    expect(deserialized.publicKey!.allowCredentials![0]!.id).toBeInstanceOf(
      Uint8Array,
    )
    expect(deserialized.publicKey!.allowCredentials![0]!.id).toEqual(
      options.publicKey!.allowCredentials![0]!.id,
    )
  })

  test('empty publicKey', () => {
    const deserialized = Authentication.deserializeOptions({})
    expect(deserialized).toEqual({})
  })

  test('JSON round-trip', () => {
    const options = Authentication.getOptions({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      credentialId: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      rpId: 'foo',
    })
    const serialized = Authentication.serializeOptions(options)
    const json = JSON.stringify(serialized)
    const parsed = JSON.parse(json)
    const deserialized = Authentication.deserializeOptions(parsed)

    expect(deserialized.publicKey!.challenge).toEqual(
      options.publicKey!.challenge,
    )
    expect(deserialized.publicKey!.allowCredentials![0]!.id).toEqual(
      options.publicKey!.allowCredentials![0]!.id,
    )
  })
})

describe('getSignPayload', () => {
  test('default', () => {
    const payload = Authentication.getSignPayload({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      origin: 'http://localhost:5173',
      rpId: 'localhost',
      extraClientData: {
        other_keys_can_be_added_here:
          'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
      },
    })
    expect(payload).toMatchInlineSnapshot(
      `
    {
      "metadata": {
        "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763050000000045086dcb06a5f234db625bcdc94e657f86b76b6fd3eb9c30543eabc1e577a4b0",
    }
  `,
    )
  })

  test('behavior: P256.sign + Authentication.verify', async () => {
    const { privateKey, publicKey } = P256.createKeyPair()

    const challenge =
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf' as const

    const { metadata, payload } = Authentication.getSignPayload({
      challenge,
      origin: 'http://localhost:5173',
      rpId: 'localhost',
      extraClientData: {
        other_keys_can_be_added_here:
          'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
      },
    })

    const signature = P256.sign({
      hash: true,
      payload,
      privateKey,
    })

    expect(
      Authentication.verify({
        challenge,
        publicKey,
        signature,
        metadata,
      }),
    ).toBeTruthy()
  })

  test('behavior: WebCryptoP256.sign + Authentication.verify', async () => {
    const keyPair = await WebCryptoP256.createKeyPair()
    const { privateKey, publicKey } = keyPair

    const challenge =
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf' as const

    const data = {
      challenge,
      origin: 'http://localhost:5173',
      rpId: 'localhost',
      extraClientData: {
        other_keys_can_be_added_here:
          'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
      },
    } as const

    const { metadata, payload } = Authentication.getSignPayload(data)

    const signature = await WebCryptoP256.sign({
      payload,
      privateKey,
    })

    expect(
      Authentication.verify({
        challenge,
        publicKey,
        signature,
        metadata,
      }),
    ).toBeTruthy()
  })

  test('behavior: Authentication.sign + P256.verify', () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 60047643624523853691583342123967083322395535713181616683944672258158697774181n,
      y: 49933766055617994255091849813611851260866104136309220262372066694430479376066n,
    })
    const signature = Signature.from({
      r: 51728839035173161960794416403819635570146754182185755610208554815692624617179n,
      s: 42284206126603545568097288331895750698887263268526215297009386324761546383756n,
    })

    const { payload } = Authentication.getSignPayload({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      origin: 'http://localhost:5173',
      rpId: 'localhost',
      extraClientData: {
        other_keys_can_be_added_here:
          'do not compare clientDataJSON against a template. See https://goo.gl/yabPex',
      },
    })

    expect(
      P256.verify({
        hash: true,
        publicKey,
        payload,
        signature,
      }),
    ).toBeTruthy()
  })

  test('options: crossOrigin', () => {
    const payload = Authentication.getSignPayload({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      origin: 'http://localhost:5173',
      rpId: 'foo',
      crossOrigin: true,
    })

    expect(payload).toMatchInlineSnapshot(
      `
    {
      "metadata": {
        "authenticatorData": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae0500000000",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":true}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae05000000000b0ba56d14f4fe7d5eae0a9ec8c1a0605b83b7173722c0cc7fbd6ec2567407e5",
    }
  `,
    )
  })

  test('options: flag', () => {
    const payload = Authentication.getSignPayload({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      origin: 'http://localhost:5173',
      rpId: 'foo',
      crossOrigin: true,
      flag: 4,
    })

    expect(payload).toMatchInlineSnapshot(
      `
    {
      "metadata": {
        "authenticatorData": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae0400000000",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":true}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae04000000000b0ba56d14f4fe7d5eae0a9ec8c1a0605b83b7173722c0cc7fbd6ec2567407e5",
    }
  `,
    )
  })

  test('options: signCount', () => {
    const payload = Authentication.getSignPayload({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      origin: 'http://localhost:5173',
      rpId: 'foo',
      crossOrigin: true,
      signCount: 69,
    })

    expect(payload).toMatchInlineSnapshot(
      `
    {
      "metadata": {
        "authenticatorData": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae0500000045",
        "challengeIndex": 23,
        "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":true}",
        "typeIndex": 1,
        "userVerificationRequired": true,
      },
      "payload": "0x2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae05000000450b0ba56d14f4fe7d5eae0a9ec8c1a0605b83b7173722c0cc7fbd6ec2567407e5",
    }
  `,
    )
  })
})

describe('sign', () => {
  test('default', async () => {
    let options: CredentialRequestOptions | undefined

    const signature = await Authentication.sign({
      getFn(options_) {
        options = options_
        return Promise.resolve({
          id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
          response: {
            authenticatorData: [
              73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118,
              96, 91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186,
              131, 29, 151, 99, 5, 0, 0, 0, 0,
            ],
            clientDataJSON: [
              123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117,
              116, 104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108,
              108, 101, 110, 103, 101, 34, 58, 34, 57, 106, 69, 70, 105, 106,
              117, 104, 69, 87, 114, 77, 52, 83, 79, 87, 45, 116, 67, 104, 74,
              98, 85, 69, 72, 69, 80, 52, 52, 86, 99, 106, 99, 74, 45, 66, 113,
              111, 49, 102, 84, 77, 56, 34, 44, 34, 111, 114, 105, 103, 105,
              110, 34, 58, 34, 104, 116, 116, 112, 58, 47, 47, 108, 111, 99, 97,
              108, 104, 111, 115, 116, 58, 53, 49, 55, 51, 34, 44, 34, 99, 114,
              111, 115, 115, 79, 114, 105, 103, 105, 110, 34, 58, 102, 97, 108,
              115, 101, 125,
            ],
            signature: [
              48, 70, 2, 33, 0, 146, 61, 150, 57, 188, 182, 119, 250, 23, 162,
              103, 56, 232, 200, 162, 77, 88, 37, 145, 151, 40, 59, 42, 63, 46,
              225, 53, 221, 74, 128, 13, 165, 2, 33, 0, 128, 39, 38, 71, 180,
              153, 30, 232, 243, 94, 159, 66, 42, 246, 56, 195, 195, 139, 40,
              163, 26, 34, 125, 244, 171, 166, 7, 178, 169, 246, 142, 198,
            ],
          },
        } as any)
      },
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    })

    expect(signature).toMatchInlineSnapshot(`
      {
        "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
        "metadata": {
          "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
          "challengeIndex": 23,
          "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}",
          "typeIndex": 1,
          "userVerificationRequired": true,
        },
        "raw": {
          "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
          "response": {
            "authenticatorData": [
              73,
              150,
              13,
              229,
              136,
              14,
              140,
              104,
              116,
              52,
              23,
              15,
              100,
              118,
              96,
              91,
              143,
              228,
              174,
              185,
              162,
              134,
              50,
              199,
              153,
              92,
              243,
              186,
              131,
              29,
              151,
              99,
              5,
              0,
              0,
              0,
              0,
            ],
            "clientDataJSON": [
              123,
              34,
              116,
              121,
              112,
              101,
              34,
              58,
              34,
              119,
              101,
              98,
              97,
              117,
              116,
              104,
              110,
              46,
              103,
              101,
              116,
              34,
              44,
              34,
              99,
              104,
              97,
              108,
              108,
              101,
              110,
              103,
              101,
              34,
              58,
              34,
              57,
              106,
              69,
              70,
              105,
              106,
              117,
              104,
              69,
              87,
              114,
              77,
              52,
              83,
              79,
              87,
              45,
              116,
              67,
              104,
              74,
              98,
              85,
              69,
              72,
              69,
              80,
              52,
              52,
              86,
              99,
              106,
              99,
              74,
              45,
              66,
              113,
              111,
              49,
              102,
              84,
              77,
              56,
              34,
              44,
              34,
              111,
              114,
              105,
              103,
              105,
              110,
              34,
              58,
              34,
              104,
              116,
              116,
              112,
              58,
              47,
              47,
              108,
              111,
              99,
              97,
              108,
              104,
              111,
              115,
              116,
              58,
              53,
              49,
              55,
              51,
              34,
              44,
              34,
              99,
              114,
              111,
              115,
              115,
              79,
              114,
              105,
              103,
              105,
              110,
              34,
              58,
              102,
              97,
              108,
              115,
              101,
              125,
            ],
            "signature": [
              48,
              70,
              2,
              33,
              0,
              146,
              61,
              150,
              57,
              188,
              182,
              119,
              250,
              23,
              162,
              103,
              56,
              232,
              200,
              162,
              77,
              88,
              37,
              145,
              151,
              40,
              59,
              42,
              63,
              46,
              225,
              53,
              221,
              74,
              128,
              13,
              165,
              2,
              33,
              0,
              128,
              39,
              38,
              71,
              180,
              153,
              30,
              232,
              243,
              94,
              159,
              66,
              42,
              246,
              56,
              195,
              195,
              139,
              40,
              163,
              26,
              34,
              125,
              244,
              171,
              166,
              7,
              178,
              169,
              246,
              142,
              198,
            ],
          },
        },
        "signature": {
          "r": 66146490382651126845293572181789601948468603642860880862207775049723590741413n,
          "s": 57826873356635199932884692124441746552975787926982721375689326118223204882059n,
        },
      }
    `)
    expect(options).toMatchInlineSnapshot(`
    {
      "publicKey": {
        "challenge": Uint8Array [
          246,
          49,
          5,
          138,
          59,
          161,
          17,
          106,
          204,
          225,
          35,
          150,
          250,
          208,
          161,
          37,
          181,
          4,
          28,
          67,
          248,
          225,
          87,
          35,
          112,
          159,
          129,
          170,
          141,
          95,
          76,
          207,
        ],
        "rpId": "https://example.com",
        "userVerification": "required",
      },
    }
  `)
  })

  test('error: null credential', async () => {
    await expect(() =>
      Authentication.sign({
        getFn() {
          return Promise.resolve(null)
        },
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      }),
    ).rejects.toMatchInlineSnapshot(`
    [Authentication.SignFailedError: Failed to request credential.

    Details: Failed to request credential.]
  `)
  })

  test('error: thrown', async () => {
    await expect(() =>
      Authentication.sign({
        getFn() {
          return Promise.reject(new Error('foo'))
        },
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      }),
    ).rejects.toMatchInlineSnapshot(`
    [Authentication.SignFailedError: Failed to request credential.

    Details: foo]
  `)
  })
})

describe('serializeResponse', () => {
  test('default', () => {
    const response: Authentication.Response = {
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      metadata: {
        authenticatorData:
          '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
        challengeIndex: 23,
        clientDataJSON:
          '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
        typeIndex: 1,
        userVerificationRequired: true,
      },
      signature: Signature.from({
        r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
        s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
      }),
      raw: {
        id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        type: 'public-key',
        authenticatorAttachment: null,
        rawId: new Uint8Array([1, 2, 3, 4]).buffer as ArrayBuffer,
        response: {
          clientDataJSON: new Uint8Array([5, 6, 7, 8]).buffer as ArrayBuffer,
        } as any,
        getClientExtensionResults: () => ({}),
      },
    }

    const serialized = Authentication.serializeResponse(response)

    expect(serialized).toMatchInlineSnapshot(`
      {
        "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
        "metadata": {
          "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
          "challengeIndex": 23,
          "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}",
          "typeIndex": 1,
          "userVerificationRequired": true,
        },
        "raw": {
          "authenticatorAttachment": null,
          "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
          "rawId": "AQIDBA",
          "response": {
            "clientDataJSON": "BQYHCA",
          },
          "type": "public-key",
        },
        "signature": "0x16d6f4bd3231c71c5e58927b9cf2ee701df03b52e3db71efc03d1139122f854f67f32a4fcb17b07ab9b7755b61e999b99139074fc8e1aa6d33d25beccbb2fbd4",
      }
    `)
    expect(() => JSON.stringify(serialized)).not.toThrow()
  })
})

describe('deserializeResponse', () => {
  test('default', () => {
    const response: Authentication.Response = {
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      metadata: {
        authenticatorData:
          '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
        challengeIndex: 23,
        clientDataJSON:
          '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
        typeIndex: 1,
        userVerificationRequired: true,
      },
      signature: Signature.from({
        r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
        s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
      }),
      raw: {
        id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        type: 'public-key',
        authenticatorAttachment: null,
        rawId: new Uint8Array([1, 2, 3, 4]).buffer as ArrayBuffer,
        response: {
          clientDataJSON: new Uint8Array([5, 6, 7, 8]).buffer as ArrayBuffer,
        } as any,
        getClientExtensionResults: () => ({}),
      },
    }

    const serialized = Authentication.serializeResponse(response)
    const deserialized = Authentication.deserializeResponse(serialized)

    expect(deserialized).toMatchInlineSnapshot(`
      {
        "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
        "metadata": {
          "authenticatorData": "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
          "challengeIndex": 23,
          "clientDataJSON": "{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}",
          "typeIndex": 1,
          "userVerificationRequired": true,
        },
        "raw": {
          "authenticatorAttachment": null,
          "getClientExtensionResults": [Function],
          "id": "m1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs",
          "rawId": ArrayBuffer [
            1,
            2,
            3,
            4,
          ],
          "response": {
            "clientDataJSON": ArrayBuffer [
              5,
              6,
              7,
              8,
            ],
          },
          "type": "public-key",
        },
        "signature": {
          "r": 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
          "s": 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
        },
      }
    `)
  })

  test('JSON round-trip preserves verify', () => {
    const { metadata, payload } = Authentication.getSignPayload({
      challenge:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
      origin: 'http://localhost:5173',
      rpId: 'localhost',
    })

    const { privateKey, publicKey } = P256.createKeyPair()
    const sig = P256.sign({ hash: true, payload, privateKey })

    const response: Authentication.Response = {
      id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
      metadata,
      signature: sig,
      raw: {
        id: 'test-id',
        type: 'public-key',
        authenticatorAttachment: null,
        rawId: new ArrayBuffer(8),
        response: {
          clientDataJSON: new ArrayBuffer(16),
        } as any,
        getClientExtensionResults: () => ({}),
      },
    }

    const serialized = Authentication.serializeResponse(response)
    const json = JSON.stringify(serialized)
    const deserialized = Authentication.deserializeResponse(JSON.parse(json))

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature: deserialized.signature,
        metadata: deserialized.metadata,
      }),
    ).toBeTruthy()
  })
})

describe('verify', () => {
  test('default', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeTruthy()
  })

  test('default', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 92217130139243395344713469331864871617892993489147165241879962954542036045090n,
      s: 25785067610647358687769954197992440351568013796562547723755309225289815468181n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeTruthy()
  })

  test('behavior: invalid hash', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xa631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid signature', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963152n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xa631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: authenticator data too short', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963152n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d976305000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xa631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid flag', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 92217130139243395344713469331864871617892993489147165241879962954542036045090n,
      s: 25785067610647358687769954197992440351568013796562547723755309225289815468181n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630000010000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false,"other_keys_can_be_added_here":"do not compare clientDataJSON against a template. See https://goo.gl/yabPex"}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid flag', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630900000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid flag', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97631500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid type', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.create","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid challenge', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM9","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 2,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('behavior: invalid challenge match', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challene":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM9","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 2,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        metadata,
      }),
    ).toBeFalsy()
  })

  test('options: minimal metadata', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeTruthy()
  })

  test('options: challengeIndex omitted', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeTruthy()
  })

  test('options: typeIndex omitted', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeTruthy()
  })

  test('options: challengeIndex and typeIndex omitted', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeTruthy()
  })

  test('behavior: invalid challenge when challengeIndex omitted', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM9","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeFalsy()
  })

  test('options: origin (valid)', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        origin: 'http://localhost:5173',
      }),
    ).toBeTruthy()
  })

  test('options: origin (valid, array)', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        origin: ['https://example.com', 'http://localhost:5173'],
      }),
    ).toBeTruthy()
  })

  test('options: origin (invalid)', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        origin: 'https://evil.com',
      }),
    ).toBeFalsy()
  })

  test('options: rpId (valid)', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        rpId: 'localhost',
      }),
    ).toBeTruthy()
  })

  test('options: rpId (invalid)', async () => {
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 15325272481743543470187210372131079389379804084126119117911265853867256769440n,
      y: 74947999673872536163854436677160946007685903587557427331495653571111132132212n,
    })
    const signature = Signature.from({
      r: 10330677067519063752777069525326520293658884904426299601620960859195372963151n,
      s: 47017859265388077754498411591757867926785106410894171160067329762716841868244n,
    })
    const metadata = {
      authenticatorData:
        '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000',
      clientDataJSON:
        '{"type":"webauthn.get","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
    } as const

    expect(
      Authentication.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
        rpId: 'evil.com',
      }),
    ).toBeFalsy()
  })
})
