import { type Bytes, Engine, Hash, type Hex } from 'ox'
import { describe, expect, test } from 'vp/test'

type Factory = {
  create(): Hash.Hasher
  digest(value: Hex.Hex | Bytes.Bytes): Bytes.Bytes
  digestSize: number
  name: string
}

const factories = [
  {
    create: () => Hash.createBlake3(),
    digest: (value) => Hash.blake3(value, { as: 'Bytes' }),
    digestSize: 32,
    name: 'createBlake3',
  },
  {
    create: () => Hash.createHmac256('0x6b6579'),
    digest: (value) => Hash.hmac256('0x6b6579', value, { as: 'Bytes' }),
    digestSize: 32,
    name: 'createHmac256',
  },
  {
    create: () => Hash.createKeccak256(),
    digest: (value) => Hash.keccak256(value, { as: 'Bytes' }),
    digestSize: 32,
    name: 'createKeccak256',
  },
  {
    create: () => Hash.createRipemd160(),
    digest: (value) => Hash.ripemd160(value, { as: 'Bytes' }),
    digestSize: 20,
    name: 'createRipemd160',
  },
  {
    create: () => Hash.createSha256(),
    digest: (value) => Hash.sha256(value, { as: 'Bytes' }),
    digestSize: 32,
    name: 'createSha256',
  },
] as const satisfies readonly Factory[]

describe('incremental', () => {
  test.each(factories)(
    '$name: chunked input matches the one-shot function',
    ({ create, digest }) => {
      const hash = create()
      hash.update('0xdead').update(Uint8Array.of(0xbe, 0xef))
      expect(hash.digest({ as: 'Bytes' })).toEqual(digest('0xdeadbeef'))
    },
  )

  test.each(factories)(
    '$name: empty input matches the one-shot function',
    ({ create, digest }) => {
      expect(create().digest({ as: 'Bytes' })).toEqual(digest('0x'))
    },
  )

  test.each(factories)(
    '$name: clone branches from the same prefix',
    ({ create, digest }) => {
      const first = create().update('0xdead')
      const second = first.clone()

      first.update('0xbeef')
      second.update('0xcafe')

      expect(first.digest({ as: 'Bytes' })).toEqual(digest('0xdeadbeef'))
      expect(second.digest({ as: 'Bytes' })).toEqual(digest('0xdeadcafe'))
    },
  )

  test.each(factories)(
    '$name: digestInto validates bounds without consuming the state',
    ({ create, digest, digestSize }) => {
      const hash = create().update('0xdeadbeef')

      expect(() =>
        hash.digestInto(new Uint8Array(digestSize - 1)),
      ).toThrowError(Hash.InvalidDigestSizeError)

      const output = new Uint8Array(digestSize + 2).fill(0xff)
      hash.digestInto(output)

      expect(output.slice(0, digestSize)).toEqual(digest('0xdeadbeef'))
      expect(output.slice(digestSize)).toEqual(Uint8Array.of(0xff, 0xff))
      expect(() => hash.update('0x')).toThrowError(Hash.HasherDestroyedError)
    },
  )

  test.each(factories)(
    '$name: digest consumes the state and destroy is idempotent',
    ({ create }) => {
      const hash = create()
      hash.digest()

      expect(() => hash.clone()).toThrowError(Hash.HasherDestroyedError)
      expect(() => hash.digest()).toThrowError(Hash.HasherDestroyedError)
      expect(() => hash.digestInto(new Uint8Array(32))).toThrowError(
        Hash.HasherDestroyedError,
      )
      expect(() => hash.update('0x')).toThrowError(Hash.HasherDestroyedError)
      expect(() => {
        hash.destroy()
        hash.destroy()
      }).not.toThrow()
    },
  )

  test.each(factories)(
    '$name: destroy consumes the state and is idempotent',
    ({ create }) => {
      const hash = create()
      hash.destroy()
      hash.destroy()

      expect(() => hash.clone()).toThrowError(Hash.HasherDestroyedError)
      expect(() => hash.digest()).toThrowError(Hash.HasherDestroyedError)
      expect(() => hash.update('0x')).toThrowError(Hash.HasherDestroyedError)
    },
  )

  test('behavior: independent states can be interleaved', () => {
    const first = Hash.createSha256().update('0xaa')
    const second = Hash.createSha256().update('0xbb')

    first.update('0xcc')
    second.update('0xdd')

    expect(first.digest()).toEqual(Hash.sha256('0xaacc'))
    expect(second.digest()).toEqual(Hash.sha256('0xbbdd'))
  })

  test('behavior: a state keeps the provider captured at creation', () => {
    Engine.set({ Hash: { createSha256: () => sentinelState(1) } })
    const first = Hash.createSha256()

    Engine.set({ Hash: { createSha256: () => sentinelState(2) } })

    expect(first.digest({ as: 'Bytes' })[0]).toMatchInlineSnapshot('1')
    expect(
      Hash.createSha256().digest({ as: 'Bytes' })[0],
    ).toMatchInlineSnapshot('2')
  })
})

describe('blake3', () => {
  test('default', () => {
    expect(Hash.blake3('0x')).toMatchInlineSnapshot(
      `"0xaf1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262"`,
    )

    expect(Hash.blake3(new Uint8Array())).toMatchInlineSnapshot(`
      Uint8Array [
        175,
        19,
        73,
        185,
        245,
        249,
        161,
        166,
        160,
        64,
        77,
        234,
        54,
        220,
        201,
        73,
        155,
        203,
        37,
        201,
        173,
        193,
        18,
        183,
        204,
        154,
        147,
        202,
        228,
        31,
        50,
        98,
      ]
    `)
  })

  test('as: Hex', () => {
    expect(Hash.blake3(new Uint8Array(), { as: 'Hex' })).toMatchInlineSnapshot(
      `"0xaf1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262"`,
    )
  })

  test('as: Bytes', () => {
    expect(Hash.blake3('0x', { as: 'Bytes' })).toMatchInlineSnapshot(`
      Uint8Array [
        175,
        19,
        73,
        185,
        245,
        249,
        161,
        166,
        160,
        64,
        77,
        234,
        54,
        220,
        201,
        73,
        155,
        203,
        37,
        201,
        173,
        193,
        18,
        183,
        204,
        154,
        147,
        202,
        228,
        31,
        50,
        98,
      ]
    `)
  })

  test('behavior: routes through the installed engine', () => {
    Engine.set({ Hash: { blake3: () => new Uint8Array(32).fill(1) } })

    expect(Hash.blake3('0x')).toMatchInlineSnapshot(
      `"0x0101010101010101010101010101010101010101010101010101010101010101"`,
    )
  })
})

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
    expect(Hash.hmac256('0x6b6579', '0x48656c6c6f', { as: 'Bytes' }))
      .toMatchInlineSnapshot(`
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
        '0xgggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg',
      ),
    ).toBeFalsy()
    expect(
      Hash.validate(
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72f',
      ),
    ).toBeFalsy()
    expect(
      Hash.validate(
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe0',
      ),
    ).toBeFalsy()
    expect(
      Hash.validate(
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      ),
    ).toBeTruthy()
  })
})

function sentinelState(byte: number): Engine.HashState {
  let active = true

  const assertActive = () => {
    if (!active) throw new Error('destroyed')
  }

  return {
    clone: () => {
      assertActive()
      return sentinelState(byte)
    },
    destroy: () => {
      active = false
    },
    digestInto: (output) => {
      assertActive()
      active = false
      output.fill(byte, 0, 32)
    },
    update: () => {
      assertActive()
    },
  }
}

test('exports', () => {
  expect(Object.keys(Hash)).toMatchInlineSnapshot(`
    [
      "createBlake3",
      "createHmac256",
      "createKeccak256",
      "createRipemd160",
      "createSha256",
      "blake3",
      "keccak256",
      "hmac256",
      "ripemd160",
      "sha256",
      "validate",
      "HasherDestroyedError",
      "InvalidDigestSizeError",
    ]
  `)
})
