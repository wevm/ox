import { WebAuthnP256 } from 'ox'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'

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
              180, 64, 99, 231, 15, 12, 56, 30, 225, 110, 6, 82, 247, 249, 117,
              84,
            ]
          },
        },
      } as any)
    },
    name: 'Foo',
  })

  expect(credential).toMatchInlineSnapshot(`
    {
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
          "authenticatorAttachment": "platform",
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
        "extensions": undefined,
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
    [WebAuthnP256.CredentialCreationFailedError: Failed to create credential.

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
    [WebAuthnP256.CredentialCreationFailedError: Failed to create credential.

    Details: foo]
  `)
})
