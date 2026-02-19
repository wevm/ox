import { P256, PublicKey, Signature, WebAuthnP256, WebCryptoP256 } from 'ox'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

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

describe('createCredential', () => {
  test('default', async () => {
    let options: CredentialCreationOptions | undefined

    const credential = await WebAuthnP256.createCredential({
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
      WebAuthnP256.createCredential({
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
      WebAuthnP256.createCredential({
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
    const credential = await WebAuthnP256.createCredential({
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
      WebAuthnP256.verify({
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

describe('getAuthenticatorData', () => {
  test('default', () => {
    const authenticatorData = WebAuthnP256.getAuthenticatorData({
      rpId: 'example.com',
    })
    expect(authenticatorData).toMatchInlineSnapshot(
      `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce19470500000000"`,
    )
  })

  test('options: signCount', () => {
    const authenticatorData = WebAuthnP256.getAuthenticatorData({
      rpId: 'example.com',
      signCount: 420,
    })
    expect(authenticatorData).toMatchInlineSnapshot(
      `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194705000001a4"`,
    )
  })

  test('options: flag', () => {
    const authenticatorData = WebAuthnP256.getAuthenticatorData({
      rpId: 'example.com',
      flag: 1,
      signCount: 420,
    })
    expect(authenticatorData).toMatchInlineSnapshot(
      `"0xa379a6f6eeafb9a55e378c118034e2751e682fab9f2d30ab13d2125586ce194701000001a4"`,
    )
  })
})

describe('getClientDataJSON', () => {
  test('default', () => {
    const clientDataJSON = WebAuthnP256.getClientDataJSON({
      challenge: '0xdeadbeef',
      origin: 'https://example.com',
    })
    expect(clientDataJSON).toMatchInlineSnapshot(
      `"{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":false}"`,
    )
  })

  test('options: crossOrigin', () => {
    const clientDataJSON = WebAuthnP256.getClientDataJSON({
      challenge: '0xdeadbeef',
      origin: 'https://example.com',
      crossOrigin: true,
    })
    expect(clientDataJSON).toMatchInlineSnapshot(
      `"{"type":"webauthn.get","challenge":"3q2-7w","origin":"https://example.com","crossOrigin":true}"`,
    )
  })
})

describe('getCredentialCreationOptions', () => {
  test('default', () => {
    expect(
      WebAuthnP256.getCredentialCreationOptions({
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
      WebAuthnP256.getCredentialCreationOptions({
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
      WebAuthnP256.getCredentialCreationOptions({
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

describe('getCredentialRequestOptions', () => {
  test('default', () => {
    expect(
      WebAuthnP256.getCredentialRequestOptions({
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
      WebAuthnP256.getCredentialRequestOptions({
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

describe('getSignPayload', () => {
  test('default', () => {
    const payload = WebAuthnP256.getSignPayload({
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

  test('behavior: P256.sign + WebAuthnP256.verify', async () => {
    const { privateKey, publicKey } = P256.createKeyPair()

    const challenge =
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf' as const

    const { metadata, payload } = WebAuthnP256.getSignPayload({
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
      WebAuthnP256.verify({
        challenge,
        publicKey,
        signature,
        metadata,
      }),
    ).toBeTruthy()
  })

  test('behavior: WebCryptoP256.sign + WebAuthnP256.verify', async () => {
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

    const { metadata, payload } = WebAuthnP256.getSignPayload(data)

    const signature = await WebCryptoP256.sign({
      payload,
      privateKey,
    })

    expect(
      WebAuthnP256.verify({
        challenge,
        publicKey,
        signature,
        metadata,
      }),
    ).toBeTruthy()
  })

  test('behavior: WebAuthnP256.sign + P256.verify', () => {
    // Note: Public Key and Signature generated from WebAuthn Authenticator from examples/webauthn-p256.
    const publicKey = PublicKey.from({
      prefix: 4,
      x: 60047643624523853691583342123967083322395535713181616683944672258158697774181n,
      y: 49933766055617994255091849813611851260866104136309220262372066694430479376066n,
    })
    const signature = Signature.from({
      r: 51728839035173161960794416403819635570146754182185755610208554815692624617179n,
      s: 42284206126603545568097288331895750698887263268526215297009386324761546383756n,
    })

    const { payload } = WebAuthnP256.getSignPayload({
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
    const payload = WebAuthnP256.getSignPayload({
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
    const payload = WebAuthnP256.getSignPayload({
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
    const payload = WebAuthnP256.getSignPayload({
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

    const signature = await WebAuthnP256.sign({
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
      WebAuthnP256.sign({
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
      WebAuthnP256.sign({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      challengeIndex: 23,
      clientDataJSON:
        '{"type":"webauthn.create","challenge":"9jEFijuhEWrM4SOW-tChJbUEHEP44VcjcJ-Bqo1fTM8","origin":"http://localhost:5173","crossOrigin":false}',
      typeIndex: 1,
      userVerificationRequired: true,
    } as const

    expect(
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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
      WebAuthnP256.verify({
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

    // Should extract challenge automatically and fail validation
    expect(
      WebAuthnP256.verify({
        metadata,
        challenge:
          '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
        publicKey,
        signature,
      }),
    ).toBeFalsy()
  })
})

test('exports', () => {
  expect(Object.keys(WebAuthnP256)).toMatchInlineSnapshot(`
    [
      "createChallenge",
      "createCredential",
      "getAuthenticatorData",
      "getClientDataJSON",
      "getAttestationObject",
      "getCredentialCreationOptions",
      "getCredentialRequestOptions",
      "getSignPayload",
      "sign",
      "verify",
    ]
  `)
})
