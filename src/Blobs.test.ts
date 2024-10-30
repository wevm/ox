import { Blobs, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'
import { blobData, kzg } from '../test/kzg.js'

describe('commitmentsToVersionedHashes', () => {
  test('from hex', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })

    expect(
      Blobs.commitmentsToVersionedHashes(commitments),
    ).toMatchInlineSnapshot(
      `
    [
      "0x012580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4",
      "0x01243c18a024c835cce144b3b6b0eb878b7820c7c7b7d9feff80080d76519c45",
    ]
  `,
    )

    expect(
      Blobs.commitmentsToVersionedHashes(commitments, { as: 'Bytes' }),
    ).toMatchInlineSnapshot(
      `
    [
      Uint8Array [
        1,
        37,
        128,
        183,
        104,
        60,
        20,
        204,
        117,
        64,
        190,
        48,
        85,
        135,
        176,
        238,
        196,
        231,
        236,
        115,
        144,
        148,
        33,
        60,
        160,
        128,
        226,
        82,
        108,
        146,
        55,
        196,
      ],
      Uint8Array [
        1,
        36,
        60,
        24,
        160,
        36,
        200,
        53,
        204,
        225,
        68,
        179,
        182,
        176,
        235,
        135,
        139,
        120,
        32,
        199,
        199,
        183,
        217,
        254,
        255,
        128,
        8,
        13,
        118,
        81,
        156,
        69,
      ],
    ]
  `,
    )
  })

  test('args: version', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })

    expect(
      Blobs.commitmentsToVersionedHashes(commitments, { version: 2 }),
    ).toMatchInlineSnapshot(`
    [
      "0x022580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4",
      "0x02243c18a024c835cce144b3b6b0eb878b7820c7c7b7d9feff80080d76519c45",
    ]
  `)
  })

  test('args: as', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })

    expect(
      Blobs.commitmentsToVersionedHashes(commitments, {
        as: 'Bytes',
        version: 2,
      }),
    ).toMatchInlineSnapshot(`
    [
      Uint8Array [
        2,
        37,
        128,
        183,
        104,
        60,
        20,
        204,
        117,
        64,
        190,
        48,
        85,
        135,
        176,
        238,
        196,
        231,
        236,
        115,
        144,
        148,
        33,
        60,
        160,
        128,
        226,
        82,
        108,
        146,
        55,
        196,
      ],
      Uint8Array [
        2,
        36,
        60,
        24,
        160,
        36,
        200,
        53,
        204,
        225,
        68,
        179,
        182,
        176,
        235,
        135,
        139,
        120,
        32,
        199,
        199,
        183,
        217,
        254,
        255,
        128,
        8,
        13,
        118,
        81,
        156,
        69,
      ],
    ]
  `)
  })
})

describe('commitmentToVersionedHash', () => {
  test('default', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })

    expect(
      Blobs.commitmentToVersionedHash(commitments[0]!),
    ).toMatchInlineSnapshot(
      `"0x012580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4"`,
    )
    expect(
      Blobs.commitmentToVersionedHash(commitments[1]!, {
        as: 'Bytes',
      }),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      1,
      36,
      60,
      24,
      160,
      36,
      200,
      53,
      204,
      225,
      68,
      179,
      182,
      176,
      235,
      135,
      139,
      120,
      32,
      199,
      199,
      183,
      217,
      254,
      255,
      128,
      8,
      13,
      118,
      81,
      156,
      69,
    ]
  `,
    )

    expect(
      Blobs.commitmentToVersionedHash(commitments[0]!, {
        version: 69,
      }),
    ).toMatchInlineSnapshot(
      `"0x452580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4"`,
    )
    expect(
      Blobs.commitmentToVersionedHash(commitments[1]!, {
        as: 'Bytes',
        version: 69,
      }),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      69,
      36,
      60,
      24,
      160,
      36,
      200,
      53,
      204,
      225,
      68,
      179,
      182,
      176,
      235,
      135,
      139,
      120,
      32,
      199,
      199,
      183,
      217,
      254,
      255,
      128,
      8,
      13,
      118,
      81,
      156,
      69,
    ]
  `,
    )
  })

  test('args: version', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })

    expect(
      Blobs.commitmentToVersionedHash(commitments[0]!, {
        version: 69,
      }),
    ).toMatchInlineSnapshot(
      `"0x452580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4"`,
    )
  })

  test('args: as', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })

    expect(
      Blobs.commitmentToVersionedHash(commitments[0]!, {
        version: 69,
        as: 'Bytes',
      }),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      69,
      37,
      128,
      183,
      104,
      60,
      20,
      204,
      117,
      64,
      190,
      48,
      85,
      135,
      176,
      238,
      196,
      231,
      236,
      115,
      144,
      148,
      33,
      60,
      160,
      128,
      226,
      82,
      108,
      146,
      55,
      196,
    ]
  `,
    )
  })
})

describe('from', () => {
  test('default', () => {
    {
      const data = Hex.fromString(blobData)
      const blobs = Blobs.from(data)
      expect(Blobs.toHex(blobs)).toEqual(data)
    }

    {
      const data = Bytes.fromString(blobData)
      const blobs = Blobs.from(data)
      expect(Blobs.toBytes(blobs)).toEqual(data)
    }
  })

  test('error: empty blob data', () => {
    expect(() =>
      Blobs.from(Hex.fromString('')),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Blobs.EmptyBlobError: Blob data must not be empty.]',
    )
  })

  test('error: blob data too big', () => {
    expect(() =>
      Blobs.from(Hex.fromString('we are all gonna make it'.repeat(100000))),
    ).toThrowErrorMatchingInlineSnapshot(`
    [Blobs.BlobSizeTooLargeError: Blob size is too large.

    Max: 761855 bytes
    Given: 2400000 bytes]
  `)
  })
})

describe('sidecarsToVersionedHashes', () => {
  test('default', () => {
    {
      const blobs = Blobs.from('0xdeadbeef')
      const sidecars = Blobs.toSidecars(blobs, { kzg })
      expect(Blobs.sidecarsToVersionedHashes(sidecars)).toMatchInlineSnapshot(`
        [
          "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
        ]
      `)
    }

    {
      const blobs = Blobs.from('0xdeadbeef', { as: 'Bytes' })
      const sidecars = Blobs.toSidecars(blobs, { kzg })
      expect(Blobs.sidecarsToVersionedHashes(sidecars)).toMatchInlineSnapshot(`
        [
          Uint8Array [
            1,
            162,
            71,
            9,
            211,
            153,
            126,
            139,
            33,
            127,
            229,
            70,
            10,
            239,
            16,
            238,
            81,
            85,
            19,
            206,
            186,
            3,
            98,
            191,
            45,
            2,
            163,
            186,
            115,
            215,
            203,
            9,
          ],
        ]
      `)
    }
  })

  test('args: as', () => {
    {
      const blobs = Blobs.from('0xdeadbeef')
      const sidecars = Blobs.toSidecars(blobs, { kzg })
      expect(
        Blobs.sidecarsToVersionedHashes(sidecars, {
          as: 'Bytes',
        }),
      ).toMatchInlineSnapshot(`
      [
        Uint8Array [
          1,
          162,
          71,
          9,
          211,
          153,
          126,
          139,
          33,
          127,
          229,
          70,
          10,
          239,
          16,
          238,
          81,
          85,
          19,
          206,
          186,
          3,
          98,
          191,
          45,
          2,
          163,
          186,
          115,
          215,
          203,
          9,
        ],
      ]
    `)
    }

    {
      const blobs = Blobs.from('0xdeadbeef', { as: 'Bytes' })
      const sidecars = Blobs.toSidecars(blobs, { kzg })
      expect(
        Blobs.sidecarsToVersionedHashes(sidecars, {
          as: 'Hex',
        }),
      ).toMatchInlineSnapshot(`
        [
          "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
        ]
      `)
    }
  })
})

describe('to', () => {
  test('default', () => {
    const data = Hex.fromString('we are all gonna make it'.repeat(5))
    const blobs = Blobs.from(data)
    expect(Blobs.to(blobs)).toEqual(data)
    expect(Blobs.toHex(blobs)).toEqual(data)
    expect(Blobs.toBytes(blobs)).toEqual(Bytes.fromHex(data))
  })

  test('large', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    expect(Blobs.to(blobs, 'Hex')).toEqual(Hex.fromString(blobData))
  })

  test('https://github.com/wevm/viem/issues/1986', () => {
    const data = new Uint8Array([1, 2, 128, 3, 4, 5, 6, 7, 8, 9, 10])
    const blobs = Blobs.from(data)
    expect(Blobs.to(blobs, 'Bytes')).toEqual(data)
  })
})

describe('toCommitments', () => {
  test('from hex', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })
    expect(commitments).toMatchInlineSnapshot(`
    [
      "0x93fd6807e033db6b24db5485814f79a98c7e241432e95c2e327042f821f24f4a59315cf4e881205f472e99835729977a",
      "0xaa9da85a334c2935e670bd44e9b734481fc5ab72859c76f741008a92c2836932af9e60697b6319f3454a141154fcd583",
    ]
  `)
  })

  test('to hex', () => {
    const blobs = Blobs.from(Bytes.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg, as: 'Hex' })
    expect(commitments).toMatchInlineSnapshot(`
    [
      "0x93fd6807e033db6b24db5485814f79a98c7e241432e95c2e327042f821f24f4a59315cf4e881205f472e99835729977a",
      "0xaa9da85a334c2935e670bd44e9b734481fc5ab72859c76f741008a92c2836932af9e60697b6319f3454a141154fcd583",
    ]
  `)
  })

  test('from bytes', () => {
    const blobs = Blobs.from(Bytes.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })
    expect(commitments).toMatchInlineSnapshot(`
    [
      Uint8Array [
        147,
        253,
        104,
        7,
        224,
        51,
        219,
        107,
        36,
        219,
        84,
        133,
        129,
        79,
        121,
        169,
        140,
        126,
        36,
        20,
        50,
        233,
        92,
        46,
        50,
        112,
        66,
        248,
        33,
        242,
        79,
        74,
        89,
        49,
        92,
        244,
        232,
        129,
        32,
        95,
        71,
        46,
        153,
        131,
        87,
        41,
        151,
        122,
      ],
      Uint8Array [
        170,
        157,
        168,
        90,
        51,
        76,
        41,
        53,
        230,
        112,
        189,
        68,
        233,
        183,
        52,
        72,
        31,
        197,
        171,
        114,
        133,
        156,
        118,
        247,
        65,
        0,
        138,
        146,
        194,
        131,
        105,
        50,
        175,
        158,
        96,
        105,
        123,
        99,
        25,
        243,
        69,
        74,
        20,
        17,
        84,
        252,
        213,
        131,
      ],
    ]
  `)
  })

  test('to bytes', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg, as: 'Bytes' })
    expect(commitments).toMatchInlineSnapshot(`
    [
      Uint8Array [
        147,
        253,
        104,
        7,
        224,
        51,
        219,
        107,
        36,
        219,
        84,
        133,
        129,
        79,
        121,
        169,
        140,
        126,
        36,
        20,
        50,
        233,
        92,
        46,
        50,
        112,
        66,
        248,
        33,
        242,
        79,
        74,
        89,
        49,
        92,
        244,
        232,
        129,
        32,
        95,
        71,
        46,
        153,
        131,
        87,
        41,
        151,
        122,
      ],
      Uint8Array [
        170,
        157,
        168,
        90,
        51,
        76,
        41,
        53,
        230,
        112,
        189,
        68,
        233,
        183,
        52,
        72,
        31,
        197,
        171,
        114,
        133,
        156,
        118,
        247,
        65,
        0,
        138,
        146,
        194,
        131,
        105,
        50,
        175,
        158,
        96,
        105,
        123,
        99,
        25,
        243,
        69,
        74,
        20,
        17,
        84,
        252,
        213,
        131,
      ],
    ]
  `)
  })
})

describe('toProofs', () => {
  test('default', () => {
    const blobs = Blobs.from(Hex.fromString(blobData))
    const commitments = Blobs.toCommitments(blobs, { kzg })
    expect(Blobs.toProofs(blobs, { commitments, kzg })).toMatchInlineSnapshot(`
    [
      "0x91a6c5d19e50b1b85ae2ef07477160381babf00f0906f5219ce09dee2e00d7d347cb0586d90b491637cdb1715e62d152",
      "0xa660592b94033f9c5f7987005fa5d1f84435585ddaaf4b3adc0a198b983f2ae007db73b90067a96ec214b24d7b9820b9",
    ]
  `)
    expect(
      Blobs.toProofs(blobs, { commitments, kzg, as: 'Bytes' }),
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
    const blobs = Blobs.from(Bytes.fromString(blobData))
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
    const blobs = Blobs.from(Bytes.fromString(blobData))
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
})

describe('toSidecars', () => {
  test('default', () => {
    {
      const data = Hex.fromString(blobData)
      const blobs = Blobs.from(data)
      const sidecars = Blobs.toSidecars(blobs, {
        kzg,
      })
      const blobs_ = sidecars.map(({ blob }) => blob)
      expect(Blobs.toHex(blobs_)).toEqual(data)
    }

    {
      const data = Bytes.fromString(blobData)
      const blobs = Blobs.from(data)
      const sidecars = Blobs.toSidecars(blobs, {
        kzg,
      })
      const blobs_ = sidecars.map(({ blob }) => blob)
      expect(Blobs.toBytes(blobs_)).toEqual(data)
    }
  })

  test('args: blobs, commitments, proofs', () => {
    const data = Hex.fromString(blobData)
    const blobs = Blobs.from(data)
    const commitments = Blobs.toCommitments(blobs, { kzg })
    const proofs = Blobs.toProofs(blobs, { commitments, kzg })
    const sidecars = Blobs.toSidecars(blobs, {
      commitments,
      proofs,
    })
    const sidecarBlobs = sidecars.map(({ blob }) => blob)
    expect(Blobs.toHex(sidecarBlobs)).toEqual(data)
    expect(
      sidecars.map(({ commitment, proof }) => ({
        commitment,
        proof,
      })),
    ).toMatchInlineSnapshot(`
    [
      {
        "commitment": "0x93fd6807e033db6b24db5485814f79a98c7e241432e95c2e327042f821f24f4a59315cf4e881205f472e99835729977a",
        "proof": "0x91a6c5d19e50b1b85ae2ef07477160381babf00f0906f5219ce09dee2e00d7d347cb0586d90b491637cdb1715e62d152",
      },
      {
        "commitment": "0xaa9da85a334c2935e670bd44e9b734481fc5ab72859c76f741008a92c2836932af9e60697b6319f3454a141154fcd583",
        "proof": "0xa660592b94033f9c5f7987005fa5d1f84435585ddaaf4b3adc0a198b983f2ae007db73b90067a96ec214b24d7b9820b9",
      },
    ]
  `)
  })
})

describe('toVersionedHashes', () => {
  test('default', () => {
    {
      const blobs = Blobs.from(Hex.fromString(blobData))
      const versionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
      expect(versionedHashes).toMatchInlineSnapshot(`
    [
      "0x012580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4",
      "0x01243c18a024c835cce144b3b6b0eb878b7820c7c7b7d9feff80080d76519c45",
    ]
  `)
    }

    {
      const blobs = Blobs.from(Bytes.fromString(blobData))
      const versionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
      expect(versionedHashes).toMatchInlineSnapshot(`
      [
        Uint8Array [
          1,
          37,
          128,
          183,
          104,
          60,
          20,
          204,
          117,
          64,
          190,
          48,
          85,
          135,
          176,
          238,
          196,
          231,
          236,
          115,
          144,
          148,
          33,
          60,
          160,
          128,
          226,
          82,
          108,
          146,
          55,
          196,
        ],
        Uint8Array [
          1,
          36,
          60,
          24,
          160,
          36,
          200,
          53,
          204,
          225,
          68,
          179,
          182,
          176,
          235,
          135,
          139,
          120,
          32,
          199,
          199,
          183,
          217,
          254,
          255,
          128,
          8,
          13,
          118,
          81,
          156,
          69,
        ],
      ]
    `)
    }
  })

  test('options: as', () => {
    {
      const blobs = Blobs.from(Hex.fromString(blobData))
      const versionedHashes = Blobs.toVersionedHashes(blobs, {
        as: 'Bytes',
        kzg,
      })
      expect(versionedHashes).toMatchInlineSnapshot(`
      [
        Uint8Array [
          1,
          37,
          128,
          183,
          104,
          60,
          20,
          204,
          117,
          64,
          190,
          48,
          85,
          135,
          176,
          238,
          196,
          231,
          236,
          115,
          144,
          148,
          33,
          60,
          160,
          128,
          226,
          82,
          108,
          146,
          55,
          196,
        ],
        Uint8Array [
          1,
          36,
          60,
          24,
          160,
          36,
          200,
          53,
          204,
          225,
          68,
          179,
          182,
          176,
          235,
          135,
          139,
          120,
          32,
          199,
          199,
          183,
          217,
          254,
          255,
          128,
          8,
          13,
          118,
          81,
          156,
          69,
        ],
      ]
    `)
    }

    {
      const blobs = Blobs.from(Bytes.fromString(blobData))
      const versionedHashes = Blobs.toVersionedHashes(blobs, { as: 'Hex', kzg })
      expect(versionedHashes).toMatchInlineSnapshot(`
      [
        "0x012580b7683c14cc7540be305587b0eec4e7ec739094213ca080e2526c9237c4",
        "0x01243c18a024c835cce144b3b6b0eb878b7820c7c7b7d9feff80080d76519c45",
      ]
    `)
    }
  })
})

test('exports', () => {
  expect(Object.keys(Blobs)).toMatchInlineSnapshot(`
    [
      "bytesPerFieldElement",
      "fieldElementsPerBlob",
      "bytesPerBlob",
      "maxBytesPerTransaction",
      "commitmentsToVersionedHashes",
      "commitmentToVersionedHash",
      "from",
      "sidecarsToVersionedHashes",
      "to",
      "toHex",
      "toBytes",
      "toCommitments",
      "toProofs",
      "toSidecars",
      "toVersionedHashes",
      "BlobSizeTooLargeError",
      "EmptyBlobError",
      "EmptyBlobVersionedHashesError",
      "InvalidVersionedHashSizeError",
      "InvalidVersionedHashVersionError",
    ]
  `)
})
