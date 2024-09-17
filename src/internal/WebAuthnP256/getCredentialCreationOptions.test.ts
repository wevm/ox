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
