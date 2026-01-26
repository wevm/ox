import { Hash } from 'ox'
import { describe, expect, test } from 'vitest'

describe('hmac256', () => {
  test('default', () => {
    expect(
      Hash.hmac256(
        new Uint8Array([107, 101, 121]),
        new Uint8Array([72, 101, 108, 108, 111]),
      ),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        199,
        11,
        159,
        77,
        102,
        91,
        214,
        41,
        116,
        175,
        200,
        53,
        130,
        222,
        129,
        14,
        114,
        164,
        26,
        88,
        219,
        130,
        197,
        56,
        169,
        215,
        52,
        201,
        38,
        109,
        50,
        30,
      ]
    `)

    expect(Hash.hmac256('0x6b6579', '0x48656c6c6f')).toMatchInlineSnapshot(
      `"0xc70b9f4d665bd62974afc83582de810e72a41a58db82c538a9d734c9266d321e"`,
    )
  })

  test('as: Hex', () => {
    expect(
      Hash.hmac256(
        new Uint8Array([107, 101, 121]),
        new Uint8Array([72, 101, 108, 108, 111]),
        { as: 'Hex' },
      ),
    ).toMatchInlineSnapshot(
      `"0xc70b9f4d665bd62974afc83582de810e72a41a58db82c538a9d734c9266d321e"`,
    )
  })

  test('as: Bytes', () => {
    expect(
      Hash.hmac256('0x6b6579', '0x48656c6c6f', { as: 'Bytes' }),
    ).toMatchInlineSnapshot(`
      Uint8Array [
        199,
        11,
        159,
        77,
        102,
        91,
        214,
        41,
        116,
        175,
        200,
        53,
        130,
        222,
        129,
        14,
        114,
        164,
        26,
        88,
        219,
        130,
        197,
        56,
        169,
        215,
        52,
        201,
        38,
        109,
        50,
        30,
      ]
    `)
  })
})

describe('keccak256', () => {
  test('default', () => {
    expect(Hash.keccak256('0xdeadbeef')).toMatchInlineSnapshot(
      '"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1"',
    )

    expect(
      Hash.keccak256(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      62,
      162,
      241,
      208,
      171,
      243,
      252,
      102,
      207,
      41,
      238,
      187,
      112,
      203,
      212,
      231,
      254,
      118,
      46,
      248,
      160,
      155,
      204,
      6,
      200,
      237,
      246,
      65,
      35,
      10,
      254,
      192,
    ]
  `,
    )
  })

  test('as: Hex', () => {
    expect(Hash.keccak256('0xdeadbeef', { as: 'Hex' })).toMatchInlineSnapshot(
      `"0xd4fd4e189132273036449fc9e11198c739161b4c0116a9a2dccdfa1c492006f1"`,
    )

    expect(
      Hash.keccak256(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        { as: 'Hex' },
      ),
    ).toMatchInlineSnapshot(
      `"0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0"`,
    )
  })

  test('as: bytes', () => {
    expect(Hash.keccak256('0xdeadbeef', { as: 'Bytes' })).toMatchInlineSnapshot(
      `
    Uint8Array [
      212,
      253,
      78,
      24,
      145,
      50,
      39,
      48,
      54,
      68,
      159,
      201,
      225,
      17,
      152,
      199,
      57,
      22,
      27,
      76,
      1,
      22,
      169,
      162,
      220,
      205,
      250,
      28,
      73,
      32,
      6,
      241,
    ]
  `,
    )

    expect(
      Hash.keccak256(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        { as: 'Bytes' },
      ),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      62,
      162,
      241,
      208,
      171,
      243,
      252,
      102,
      207,
      41,
      238,
      187,
      112,
      203,
      212,
      231,
      254,
      118,
      46,
      248,
      160,
      155,
      204,
      6,
      200,
      237,
      246,
      65,
      35,
      10,
      254,
      192,
    ]
  `,
    )
  })
})

describe('ripemd160', () => {
  test('default', () => {
    expect(Hash.ripemd160('0xdeadbeef')).toMatchInlineSnapshot(
      `"0x226821c2f5423e11fe9af68bd285c249db2e4b5a"`,
    )

    expect(
      Hash.ripemd160(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot(`
    Uint8Array [
      132,
      118,
      238,
      70,
      49,
      185,
      179,
      10,
      194,
      117,
      75,
      14,
      224,
      196,
      126,
      22,
      29,
      63,
      114,
      76,
    ]
  `)
  })

  test('to bytes', () => {
    expect(Hash.ripemd160('0xdeadbeef', { as: 'Bytes' })).toMatchInlineSnapshot(
      `
    Uint8Array [
      34,
      104,
      33,
      194,
      245,
      66,
      62,
      17,
      254,
      154,
      246,
      139,
      210,
      133,
      194,
      73,
      219,
      46,
      75,
      90,
    ]
  `,
    )

    expect(
      Hash.ripemd160(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        { as: 'Bytes' },
      ),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      132,
      118,
      238,
      70,
      49,
      185,
      179,
      10,
      194,
      117,
      75,
      14,
      224,
      196,
      126,
      22,
      29,
      63,
      114,
      76,
    ]
  `,
    )
  })
})

describe('sha256', () => {
  test('default', () => {
    expect(Hash.sha256('0xdeadbeef')).toMatchInlineSnapshot(
      `"0x5f78c33274e43fa9de5659265c1d917e25c03722dcb0b8d27db8d5feaa813953"`,
    )

    expect(
      Hash.sha256(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
      ),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      127,
      131,
      177,
      101,
      127,
      241,
      252,
      83,
      185,
      45,
      193,
      129,
      72,
      161,
      214,
      93,
      252,
      45,
      75,
      31,
      163,
      214,
      119,
      40,
      74,
      221,
      210,
      0,
      18,
      109,
      144,
      105,
    ]
  `,
    )
  })

  test('to bytes', () => {
    expect(Hash.sha256('0xdeadbeef', { as: 'Bytes' })).toMatchInlineSnapshot(
      `
    Uint8Array [
      95,
      120,
      195,
      50,
      116,
      228,
      63,
      169,
      222,
      86,
      89,
      38,
      92,
      29,
      145,
      126,
      37,
      192,
      55,
      34,
      220,
      176,
      184,
      210,
      125,
      184,
      213,
      254,
      170,
      129,
      57,
      83,
    ]
  `,
    )

    expect(
      Hash.sha256(
        new Uint8Array([
          72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33,
        ]),
        { as: 'Bytes' },
      ),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      127,
      131,
      177,
      101,
      127,
      241,
      252,
      83,
      185,
      45,
      193,
      129,
      72,
      161,
      214,
      93,
      252,
      45,
      75,
      31,
      163,
      214,
      119,
      40,
      74,
      221,
      210,
      0,
      18,
      109,
      144,
      105,
    ]
  `,
    )
  })
})

describe('validate', () => {
  test('checks if hash is valid', () => {
    expect(
      Hash.validate('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toBeFalsy()
    expect(
      Hash.validate('0xa0cf798816d4b9b9866b5330eea46a18382f251e'),
    ).toBeFalsy()
    expect(
      Hash.validate('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az'),
    ).toBeFalsy()
    expect(
      Hash.validate('0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff'),
    ).toBeFalsy()
    expect(
      Hash.validate('a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac'),
    ).toBeFalsy()
    expect(
      Hash.validate(
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      ),
    ).toBeTruthy()
  })
})

test('exports', () => {
  expect(Object.keys(Hash)).toMatchInlineSnapshot(`
    [
      "keccak256",
      "hmac256",
      "ripemd160",
      "sha256",
      "validate",
    ]
  `)
})
