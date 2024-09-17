import { WebAuthnP256 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    WebAuthnP256.getCredentialRequestOptions({
      payload:
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
      payload:
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
