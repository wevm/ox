import { runInNewContext } from 'node:vm'
import { Bytes, Hex, WebAuthn } from 'ox'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vp/test'
import type * as Types from '../../webauthn/Types.js'

const challenge =
  '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'
const credentialId = 'AQID'
const input = Bytes.fromHex(
  '0x202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
)
const publicKey = Uint8Array.from([
  48, 89, 48, 19, 6, 7, 42, 134, 72, 206, 61, 2, 1, 6, 8, 42, 134, 72, 206, 61,
  3, 1, 7, 3, 66, 0, 4, 171, 137, 20, 0, 20, 15, 196, 248, 233, 65, 206, 15,
  249, 14, 65, 157, 233, 71, 10, 202, 202, 97, 59, 189, 113, 122, 71, 117, 67,
  80, 49, 167, 216, 132, 49, 142, 145, 159, 211, 179, 229, 166, 49, 216, 102,
  216, 163, 128, 180, 64, 99, 231, 15, 12, 56, 30, 225, 110, 6, 82, 247, 249,
  117, 84,
])

beforeAll(() => {
  vi.stubGlobal('window', {
    document: {
      title: 'Example',
    },
    location: {
      hostname: 'example.com',
    },
  })
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('createCredential', () => {
  test('default', async () => {
    let options: Types.CredentialCreationOptions | undefined
    const output = Uint8Array.from({ length: 32 }, (_, index) => index + 64)

    const result = await WebAuthn.createCredential({
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
      },
      challenge,
      createFn(options_) {
        options = options_
        return Promise.resolve(registrationCredential({ output }))
      },
      extensions: {
        credProps: true,
      },
      name: 'Example',
      prf: true,
      rp: {
        id: 'example.com',
        name: 'Example',
      },
    })

    expect({
      credentialId: result.id,
      prf: Hex.fromBytes(result.prf),
    }).toMatchInlineSnapshot(`
      {
        "credentialId": "AQID",
        "prf": "0x404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f",
      }
    `)
    expect(options?.publicKey?.authenticatorSelection).toMatchInlineSnapshot(`
      {
        "authenticatorAttachment": "platform",
        "residentKey": "required",
        "userVerification": "required",
      }
    `)
    expect(options?.publicKey?.extensions).toMatchInlineSnapshot(`
      {
        "credProps": true,
        "prf": {
          "eval": {
            "first": Uint8Array [
              111,
              120,
              46,
              119,
              101,
              98,
              97,
              117,
              116,
              104,
              110,
              46,
              112,
              114,
              102,
              46,
              118,
              49,
            ],
          },
        },
      }
    `)
    expect(options?.publicKey?.challenge).toMatchInlineSnapshot(`
      Uint8Array [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
      ]
    `)
    expect(result.prf).not.toBe(output)
  })

  test('behavior: custom input', async () => {
    let options: Types.CredentialCreationOptions | undefined
    const customInput = input.slice()

    await WebAuthn.createCredential({
      createFn(options_) {
        options = options_
        return Promise.resolve(
          registrationCredential({
            output: new Uint8Array(32),
          }),
        )
      },
      name: 'Example',
      prf: {
        input: customInput,
      },
    })

    const first = options?.publicKey?.extensions?.prf?.eval?.first
    expect(first).toEqual(input)
    expect(first).not.toBe(customInput)
    expect(options?.publicKey?.authenticatorSelection).toMatchObject({
      requireResidentKey: true,
      residentKey: 'required',
      userVerification: 'required',
    })
  })

  test('behavior: without PRF', async () => {
    let options: Types.CredentialCreationOptions | undefined
    const credential = await WebAuthn.createCredential({
      createFn(options_) {
        options = options_
        return Promise.resolve(registrationCredential({}))
      },
      name: 'Example',
    })

    expect(credential.id).toMatchInlineSnapshot(`"AQID"`)
    expect(options?.publicKey?.extensions).toBeUndefined()
  })

  test('behavior: follow-up assertion', async () => {
    let creationOptions: Types.CredentialCreationOptions | undefined
    let options: Types.CredentialRequestOptions | undefined
    const output = Uint8Array.from({ length: 32 }, (_, index) => index + 96)

    const result = await WebAuthn.createCredential({
      challenge,
      createFn(options_) {
        creationOptions = options_
        return Promise.resolve(
          registrationCredential({
            enabled: true,
          }),
        )
      },
      getFn(options_) {
        options = options_
        return Promise.resolve(authenticationCredential({ output }))
      },
      name: 'Example',
      prf: {
        input,
      },
      rp: {
        id: 'wallet.example.com',
        name: 'Example',
      },
      timeout: 30_000,
    })

    expect(Hex.fromBytes(result.prf)).toMatchInlineSnapshot(
      `"0x606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f"`,
    )
    expect(options?.publicKey).toMatchObject({
      allowCredentials: [
        {
          id: Uint8Array.from([1, 2, 3]),
          type: 'public-key',
        },
      ],
      extensions: {
        prf: {
          eval: {
            first: input,
          },
        },
      },
      rpId: 'wallet.example.com',
      timeout: 30_000,
      userVerification: 'required',
    })
    expect(creationOptions?.publicKey?.timeout).toBe(30_000)
    expect(options?.publicKey?.challenge).toHaveLength(32)
  })

  test('behavior: plain array output', async () => {
    const output = Array.from({ length: 32 }, (_, index) => index)
    const result = await WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(registrationCredential({ output }))
      },
      name: 'Example',
      prf: true,
    })

    expect(Hex.fromBytes(result.prf)).toMatchInlineSnapshot(
      `"0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"`,
    )
  })

  test('behavior: cross-realm ArrayBuffer output', async () => {
    const output = runInNewContext('new ArrayBuffer(32)') as ArrayBuffer
    const result = await WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(registrationCredential({ output }))
      },
      name: 'Example',
      prf: true,
    })

    expect(output).not.toBeInstanceOf(ArrayBuffer)
    expect(result.prf).toEqual(new Uint8Array(32))
  })

  test('behavior: `using` releases PRF output on scope exit', async () => {
    const output = Uint8Array.from({ length: 32 }, (_, index) => index + 64)
    const credential = await WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(registrationCredential({ output }))
      },
      name: 'Example',
      prf: true,
    })

    {
      using prf = credential.prf
      expect(prf.some((byte) => byte !== 0)).toBe(true)
    }
    expect(credential.prf.every((byte) => byte === 0)).toBe(true)
  })

  test('error: unsupported credential is retained', async () => {
    const promise = WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(
          registrationCredential({
            enabled: false,
          }),
        )
      },
      name: 'Example',
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.PrfNotSupportedError: The created credential does not support PRF evaluation.]`,
    )
    await expect(promise).rejects.toMatchObject({
      credential: {
        id: credentialId,
      },
    })
  })

  test('error: failed follow-up retains credential', async () => {
    const promise = WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(
          registrationCredential({
            enabled: true,
          }),
        )
      },
      getFn() {
        return Promise.resolve(null)
      },
      name: 'Example',
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`
      [WebAuthn.PrfEvaluationFailedError: Created a credential, but failed to evaluate its PRF.

      Details: Failed to request credential.]
    `)
    await expect(promise).rejects.toMatchObject({
      credential: {
        id: credentialId,
      },
    })
  })

  test('error: follow-up credential mismatch', async () => {
    const promise = WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(
          registrationCredential({
            enabled: true,
          }),
        )
      },
      getFn() {
        return Promise.resolve(
          authenticationCredential({
            id: 'different',
            output: new Uint8Array(32),
          }),
        )
      },
      name: 'Example',
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`
      [WebAuthn.PrfEvaluationFailedError: Created a credential, but failed to evaluate its PRF.

      Details: Expected credential "AQID", but received "different".]
    `)
    await expect(promise).rejects.toMatchObject({
      credential: {
        id: credentialId,
      },
    })
  })

  test('error: invalid output size', async () => {
    const promise = WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(
          registrationCredential({
            output: new Uint8Array(31),
          }),
        )
      },
      name: 'Example',
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidPrfOutputError: Expected a 32-byte PRF output, but received 31 bytes.]`,
    )
    await expect(promise).rejects.toMatchObject({
      credential: {
        id: credentialId,
      },
    })
  })

  test('error: extension result failure retains credential', async () => {
    const promise = WebAuthn.createCredential({
      createFn() {
        return Promise.resolve(
          registrationCredential({
            error: new Error('extension result unavailable'),
          }),
        )
      },
      name: 'Example',
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`
      [WebAuthn.PrfEvaluationFailedError: Created a credential, but failed to evaluate its PRF.

      Details: extension result unavailable]
    `)
    await expect(promise).rejects.toMatchObject({
      credential: {
        id: credentialId,
      },
    })
  })

  test('error: invalid plain array output', async () => {
    const output = Array.from({ length: 32 }, () => 0)
    output[31] = 256

    await expect(() =>
      WebAuthn.createCredential({
        createFn() {
          return Promise.resolve(registrationCredential({ output }))
        },
        name: 'Example',
        prf: true,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidPrfOutputError: Expected a 32-byte PRF output.]`,
    )
  })

  test('error: managed extension', async () => {
    await expect(() =>
      WebAuthn.createCredential({
        extensions: {
          prf: {
            eval: {
              first: input,
            },
          },
        } as never,
        name: 'Example',
        prf: true,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidExtensionError: The \`prf\` extension is managed by this function.]`,
    )
  })

  test('error: raw credential options', async () => {
    await expect(() =>
      WebAuthn.createCredential({
        name: 'Example',
        prf: true,
        publicKey: {},
      } as never),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidOptionsError: The \`publicKey\` option cannot be combined with managed PRF evaluation.]`,
    )
  })
})

describe('getCredential', () => {
  test('default', async () => {
    let options: Types.CredentialRequestOptions | undefined
    const output = Uint8Array.from({ length: 32 }, (_, index) => index + 128)

    const result = await WebAuthn.getCredential({
      challenge,
      credentialId,
      extensions: {
        appid: 'https://example.com',
      },
      getFn(options_) {
        options = options_
        return Promise.resolve(authenticationCredential({ output }))
      },
      prf: true,
      rpId: 'example.com',
    })

    expect({
      id: result.id,
      prf: Hex.fromBytes(result.prf),
    }).toMatchInlineSnapshot(`
      {
        "id": "AQID",
        "prf": "0x808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f",
      }
    `)
    expect(options?.publicKey?.extensions).toMatchInlineSnapshot(`
      {
        "appid": "https://example.com",
        "prf": {
          "eval": {
            "first": Uint8Array [
              111,
              120,
              46,
              119,
              101,
              98,
              97,
              117,
              116,
              104,
              110,
              46,
              112,
              114,
              102,
              46,
              118,
              49,
            ],
          },
        },
      }
    `)
    expect(options?.publicKey?.userVerification).toMatchInlineSnapshot(
      `"required"`,
    )
    expect(result.prf).not.toBe(output)
  })

  test('behavior: custom input', async () => {
    let options: Types.CredentialRequestOptions | undefined
    const customInput = input.slice()

    await WebAuthn.getCredential({
      getFn(options_) {
        options = options_
        return Promise.resolve(
          authenticationCredential({
            output: new Uint8Array(32),
          }),
        )
      },
      prf: {
        input: customInput,
      },
    })

    const first = options?.publicKey?.extensions?.prf?.eval?.first
    expect(first).toEqual(input)
    expect(first).not.toBe(customInput)
  })

  test('behavior: does not parse the assertion signature', async () => {
    const result = await WebAuthn.getCredential({
      getFn() {
        return Promise.resolve({
          ...authenticationCredential({
            output: new Uint8Array(32),
          }),
          response: {},
        } as Types.PublicKeyCredential)
      },
      prf: true,
    })

    expect(result.id).toMatchInlineSnapshot(`"AQID"`)
  })

  test('behavior: `using` releases PRF output on scope exit', async () => {
    const output = Uint8Array.from({ length: 32 }, (_, index) => index + 128)
    const result = await WebAuthn.getCredential({
      getFn() {
        return Promise.resolve(authenticationCredential({ output }))
      },
      prf: true,
    })

    {
      using prf = result.prf
      expect(prf.some((byte) => byte !== 0)).toBe(true)
    }
    expect(result.prf.every((byte) => byte === 0)).toBe(true)
  })

  test('error: failed credential request', async () => {
    await expect(() =>
      WebAuthn.getCredential({
        getFn() {
          return Promise.resolve(null)
        },
        prf: true,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.GetCredentialFailedError: Failed to request credential.]`,
    )
  })

  test('error: unavailable output retains response', async () => {
    const promise = WebAuthn.getCredential({
      getFn() {
        return Promise.resolve(
          authenticationCredential({
            enabled: true,
          }),
        )
      },
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.PrfUnavailableError: The credential did not return a PRF output.]`,
    )
    await expect(promise).rejects.toMatchObject({
      response: {
        id: credentialId,
      },
    })
  })

  test('error: invalid output size', async () => {
    const promise = WebAuthn.getCredential({
      getFn() {
        return Promise.resolve(
          authenticationCredential({
            output: new Uint8Array(33),
          }),
        )
      },
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidPrfOutputError: Expected a 32-byte PRF output, but received 33 bytes.]`,
    )
    await expect(promise).rejects.toMatchObject({
      response: {
        id: credentialId,
      },
    })
  })

  test('error: extension result failure retains response', async () => {
    const promise = WebAuthn.getCredential({
      getFn() {
        return Promise.resolve(
          authenticationCredential({
            error: new Error('extension result unavailable'),
          }),
        )
      },
      prf: true,
    })

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`
      [WebAuthn.PrfEvaluationFailedError: Failed to evaluate the credential PRF.

      Details: extension result unavailable]
    `)
    await expect(promise).rejects.toMatchObject({
      response: {
        id: credentialId,
      },
    })
  })

  test('error: managed extension', async () => {
    await expect(() =>
      WebAuthn.getCredential({
        extensions: {
          prf: {
            eval: {
              first: input,
            },
          },
        } as never,
        prf: true,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidExtensionError: The \`prf\` extension is managed by this function.]`,
    )
  })

  test('error: raw credential options', async () => {
    await expect(() =>
      WebAuthn.getCredential({
        prf: true,
        publicKey: {},
      } as never),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[WebAuthn.InvalidOptionsError: The \`publicKey\` option cannot be combined with managed PRF evaluation.]`,
    )
  })
})

function authenticationCredential({
  enabled,
  error,
  id = credentialId,
  output,
}: {
  enabled?: boolean | undefined
  error?: Error | undefined
  id?: string | undefined
  output?: ArrayLike<number> | Types.BufferSource | undefined
}) {
  const authenticatorData = new Uint8Array(37)
  const clientDataJSON = Bytes.fromString(
    '{"type":"webauthn.get","challenge":"AA","origin":"https://example.com"}',
  )
  const signature = Uint8Array.from([48, 6, 2, 1, 1, 2, 1, 1])
  return {
    authenticatorAttachment: null,
    getClientExtensionResults() {
      if (error) throw error
      if (output)
        return {
          prf: {
            enabled,
            results: {
              first: output,
            },
          },
        }
      return {
        prf: {
          enabled,
        },
      }
    },
    id,
    rawId: new ArrayBuffer(0),
    response: {
      authenticatorData: toArrayBuffer(authenticatorData),
      clientDataJSON: toArrayBuffer(clientDataJSON),
      signature: toArrayBuffer(signature),
    },
    type: 'public-key',
  } as Types.PublicKeyCredential
}

function registrationCredential({
  enabled,
  error,
  output,
}: {
  enabled?: boolean | undefined
  error?: Error | undefined
  output?: ArrayLike<number> | Types.BufferSource | undefined
}) {
  return {
    authenticatorAttachment: null,
    getClientExtensionResults() {
      if (error) throw error
      if (output)
        return {
          prf: {
            enabled,
            results: {
              first: output,
            },
          },
        }
      return {
        prf: {
          enabled,
        },
      }
    },
    id: credentialId,
    rawId: new ArrayBuffer(0),
    response: {
      attestationObject: new ArrayBuffer(0),
      clientDataJSON: new ArrayBuffer(0),
      getAuthenticatorData() {
        return new ArrayBuffer(0)
      },
      getPublicKey() {
        return toArrayBuffer(publicKey)
      },
      getPublicKeyAlgorithm() {
        return -7
      },
      getTransports() {
        return []
      },
    },
    type: 'public-key',
  } as Types.PublicKeyCredential
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}
