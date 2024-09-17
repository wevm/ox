import { WebAuthnP256 } from 'ox'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { parseAsn1Signature } from './sign.js'

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
  let options: CredentialRequestOptions | undefined

  const signature = await WebAuthnP256.sign({
    getFn(options_) {
      options = options_
      return Promise.resolve({
        id: 'm1-bMPuAqpWhCxHZQZTT6e-lSPntQbh3opIoGe7g4Qs',
        response: {
          authenticatorData: [
            73, 150, 13, 229, 136, 14, 140, 104, 116, 52, 23, 15, 100, 118, 96,
            91, 143, 228, 174, 185, 162, 134, 50, 199, 153, 92, 243, 186, 131,
            29, 151, 99, 5, 0, 0, 0, 0,
          ],
          clientDataJSON: [
            123, 34, 116, 121, 112, 101, 34, 58, 34, 119, 101, 98, 97, 117, 116,
            104, 110, 46, 103, 101, 116, 34, 44, 34, 99, 104, 97, 108, 108, 101,
            110, 103, 101, 34, 58, 34, 57, 106, 69, 70, 105, 106, 117, 104, 69,
            87, 114, 77, 52, 83, 79, 87, 45, 116, 67, 104, 74, 98, 85, 69, 72,
            69, 80, 52, 52, 86, 99, 106, 99, 74, 45, 66, 113, 111, 49, 102, 84,
            77, 56, 34, 44, 34, 111, 114, 105, 103, 105, 110, 34, 58, 34, 104,
            116, 116, 112, 58, 47, 47, 108, 111, 99, 97, 108, 104, 111, 115,
            116, 58, 53, 49, 55, 51, 34, 44, 34, 99, 114, 111, 115, 115, 79,
            114, 105, 103, 105, 110, 34, 58, 102, 97, 108, 115, 101, 125,
          ],
          signature: [
            48, 70, 2, 33, 0, 146, 61, 150, 57, 188, 182, 119, 250, 23, 162,
            103, 56, 232, 200, 162, 77, 88, 37, 145, 151, 40, 59, 42, 63, 46,
            225, 53, 221, 74, 128, 13, 165, 2, 33, 0, 128, 39, 38, 71, 180, 153,
            30, 232, 243, 94, 159, 66, 42, 246, 56, 195, 195, 139, 40, 163, 26,
            34, 125, 244, 171, 166, 7, 178, 169, 246, 142, 198,
          ],
        },
      } as any)
    },
    payload:
      '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
  })

  expect(signature).toMatchInlineSnapshot(`
    {
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
      payload:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    }),
  ).rejects.toMatchInlineSnapshot(`
    [WebAuthnP256.CredentialRequestFailedError: Failed to request credential.

    Details: Failed to request credential.]
  `)
})

test('error: thrown', async () => {
  await expect(() =>
    WebAuthnP256.sign({
      getFn() {
        return Promise.reject(new Error('foo'))
      },
      payload:
        '0xf631058a3ba1116acce12396fad0a125b5041c43f8e15723709f81aa8d5f4ccf',
    }),
  ).rejects.toMatchInlineSnapshot(`
    [WebAuthnP256.CredentialRequestFailedError: Failed to request credential.

    Details: foo]
  `)
})

describe('parseAsn1Signature', async () => {
  test('default', () => {
    expect(
      parseAsn1Signature(
        Uint8Array.from([
          48, 69, 2, 32, 79, 143, 120, 60, 220, 10, 231, 9, 139, 135, 253, 127,
          83, 116, 115, 205, 118, 246, 89, 29, 96, 202, 184, 63, 37, 136, 20,
          131, 182, 97, 162, 16, 2, 33, 0, 213, 132, 172, 110, 131, 68, 95, 21,
          118, 171, 90, 245, 129, 169, 178, 169, 44, 109, 209, 251, 203, 218,
          104, 37, 2, 27, 173, 4, 177, 61, 186, 224,
        ]),
      ),
    ).toMatchInlineSnapshot(`
      {
        "r": 35986204018672957728395218940873521012646365972380067971240184219792503317008n,
        "s": 19215038569779943364234032201025635803957624357958766919682621127866659990129n,
      }
    `)
  })

  test('behavior: s > n / 2', () => {
    expect(
      parseAsn1Signature(
        Uint8Array.from([
          48, 68, 2, 32, 98, 40, 12, 62, 68, 211, 20, 235, 70, 207, 44, 165,
          119, 160, 68, 103, 87, 46, 221, 175, 187, 129, 65, 55, 114, 64, 101,
          55, 252, 203, 175, 63, 2, 32, 84, 75, 185, 8, 46, 139, 199, 154, 24,
          141, 112, 99, 242, 10, 70, 208, 40, 120, 126, 131, 61, 58, 105, 70,
          84, 72, 9, 4, 235, 225, 80, 169,
        ]),
      ),
    ).toMatchInlineSnapshot(`
      {
        "r": 44397417543472166098350829765965835025873424521627678609018726680423553543999n,
        "s": 38128069854508352487650813297276660089883323342114816967244811337934223528105n,
      }
    `)
  })
})
