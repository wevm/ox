import { Blobs, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'
import { blobData, kzg } from '../../../test/kzg.js'

test('default', () => {
  const blobs = Blobs.from(Hex.from(blobData))
  const commitments = Blobs.toCommitments(blobs, { kzg })
  expect(Blobs.toProofs(blobs, { commitments, kzg })).toMatchInlineSnapshot(`
    [
      "0x91a6c5d19e50b1b85ae2ef07477160381babf00f0906f5219ce09dee2e00d7d347cb0586d90b491637cdb1715e62d152",
      "0xa660592b94033f9c5f7987005fa5d1f84435585ddaaf4b3adc0a198b983f2ae007db73b90067a96ec214b24d7b9820b9",
    ]
  `)
  expect(
    Blobs.toProofs(blobs, { commitments, kzg, as: 'bytes' }),
  ).toMatchInlineSnapshot(`
    [
      Uint8Array [
        145,
        166,
        197,
        209,
        158,
        80,
        177,
        184,
        90,
        226,
        239,
        7,
        71,
        113,
        96,
        56,
        27,
        171,
        240,
        15,
        9,
        6,
        245,
        33,
        156,
        224,
        157,
        238,
        46,
        0,
        215,
        211,
        71,
        203,
        5,
        134,
        217,
        11,
        73,
        22,
        55,
        205,
        177,
        113,
        94,
        98,
        209,
        82,
      ],
      Uint8Array [
        166,
        96,
        89,
        43,
        148,
        3,
        63,
        156,
        95,
        121,
        135,
        0,
        95,
        165,
        209,
        248,
        68,
        53,
        88,
        93,
        218,
        175,
        75,
        58,
        220,
        10,
        25,
        139,
        152,
        63,
        42,
        224,
        7,
        219,
        115,
        185,
        0,
        103,
        169,
        110,
        194,
        20,
        178,
        77,
        123,
        152,
        32,
        185,
      ],
    ]
  `)
})

test('behavior: blobs as bytes', () => {
  const blobs = Blobs.from(Bytes.from(blobData))
  const commitments = Blobs.toCommitments(blobs, { kzg })
  expect(Blobs.toProofs(blobs, { commitments, kzg })).toMatchInlineSnapshot(`
    [
      Uint8Array [
        145,
        166,
        197,
        209,
        158,
        80,
        177,
        184,
        90,
        226,
        239,
        7,
        71,
        113,
        96,
        56,
        27,
        171,
        240,
        15,
        9,
        6,
        245,
        33,
        156,
        224,
        157,
        238,
        46,
        0,
        215,
        211,
        71,
        203,
        5,
        134,
        217,
        11,
        73,
        22,
        55,
        205,
        177,
        113,
        94,
        98,
        209,
        82,
      ],
      Uint8Array [
        166,
        96,
        89,
        43,
        148,
        3,
        63,
        156,
        95,
        121,
        135,
        0,
        95,
        165,
        209,
        248,
        68,
        53,
        88,
        93,
        218,
        175,
        75,
        58,
        220,
        10,
        25,
        139,
        152,
        63,
        42,
        224,
        7,
        219,
        115,
        185,
        0,
        103,
        169,
        110,
        194,
        20,
        178,
        77,
        123,
        152,
        32,
        185,
      ],
    ]
  `)
})

test('options: commitments (bytes)', () => {
  const blobs = Blobs.from(Bytes.from(blobData))
  const commitments = Blobs.toCommitments(blobs, { kzg })
  expect(Blobs.toProofs(blobs, { commitments, kzg })).toMatchInlineSnapshot(`
    [
      Uint8Array [
        145,
        166,
        197,
        209,
        158,
        80,
        177,
        184,
        90,
        226,
        239,
        7,
        71,
        113,
        96,
        56,
        27,
        171,
        240,
        15,
        9,
        6,
        245,
        33,
        156,
        224,
        157,
        238,
        46,
        0,
        215,
        211,
        71,
        203,
        5,
        134,
        217,
        11,
        73,
        22,
        55,
        205,
        177,
        113,
        94,
        98,
        209,
        82,
      ],
      Uint8Array [
        166,
        96,
        89,
        43,
        148,
        3,
        63,
        156,
        95,
        121,
        135,
        0,
        95,
        165,
        209,
        248,
        68,
        53,
        88,
        93,
        218,
        175,
        75,
        58,
        220,
        10,
        25,
        139,
        152,
        63,
        42,
        224,
        7,
        219,
        115,
        185,
        0,
        103,
        169,
        110,
        194,
        20,
        178,
        77,
        123,
        152,
        32,
        185,
      ],
    ]
  `)
})