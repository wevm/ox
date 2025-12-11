import { Bytes, Hex, Signature, Solidity, TxEnvelopeEip1559 } from 'ox'
import { describe, expect, test } from 'vitest'

describe('assert', () => {
  test('default', () => {
    expect(() =>
      Signature.assert({ r: undefined, s: '0x', yParity: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.MissingPropertiesError: Signature \`{"s":"0x","yParity":0}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.]`,
    )

    expect(() =>
      Signature.assert({ r: '0x', s: undefined, yParity: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.MissingPropertiesError: Signature \`{"r":"0x","yParity":0}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.]`,
    )

    expect(() =>
      Signature.assert({ r: '0x', s: '0x', yParity: 69 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.InvalidYParityError: Value \`69\` is an invalid y-parity value. Y-parity must be 0 or 1.]`,
    )

    expect(() =>
      Signature.assert({ r: '0x', s: '0x' }, { recovered: true }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.MissingPropertiesError: Signature \`{"r":"0x","s":"0x"}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.]`,
    )

    expect(() =>
      Signature.assert({
        r: Hex.fromNumber(Solidity.maxUint256 + 1n),
        s: '0x',
        yParity: 0,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.InvalidRError: Value \`0x10000000000000000000000000000000000000000000000000000000000000000\` is an invalid r value. r must be a positive integer less than 2^256.]`,
    )

    expect(() =>
      Signature.assert({
        r: '0x',
        s: Hex.fromNumber(Solidity.maxUint256 + 1n),
        yParity: 0,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Signature.InvalidSError: Value \`0x10000000000000000000000000000000000000000000000000000000000000000\` is an invalid s value. s must be a positive integer less than 2^256.]`,
    )
  })
})

describe('fromHex', () => {
  test('default', () => {
    expect(
      Signature.fromHex(
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c',
      ),
    ).toEqual({
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      yParity: 1,
    })

    expect(
      Signature.fromHex(
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81b',
      ),
    ).toEqual({
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      yParity: 0,
    })

    expect(
      Signature.fromHex(
        '0x602381e57b70f1ada20bd56a806291cfc5cb5088f00f0e791510fd8b8cf05cc40dea7b983e0c7d204f3dc511b1f19a2787a5c82cd72f3bd38da58f10969907841b',
      ),
    ).toEqual({
      r: '0x602381e57b70f1ada20bd56a806291cfc5cb5088f00f0e791510fd8b8cf05cc4',
      s: '0x0dea7b983e0c7d204f3dc511b1f19a2787a5c82cd72f3bd38da58f1096990784',
      yParity: 0,
    })

    expect(
      Signature.fromHex(
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      ),
    ).toMatchInlineSnapshot(`
    {
      "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
      "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
    }
  `)
  })

  test('error: invalid signature', async () => {
    expect(() =>
      Signature.fromHex('0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      `
    [Signature.InvalidSerializedSizeError: Value \`0xdeadbeef\` is an invalid signature size.

    Expected: 64 bytes or 65 bytes.
    Received 4 bytes.]
  `,
    )
  })

  test('error: invalid yParity', async () => {
    expect(() =>
      Signature.fromHex(
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81d',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Signature.InvalidYParityError: Value `29` is an invalid y-parity value. Y-parity must be 0 or 1.]',
    )
    expect(() =>
      Signature.fromHex(
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db802',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Signature.InvalidYParityError: Value `2` is an invalid y-parity value. Y-parity must be 0 or 1.]',
    )
    expect(() =>
      Signature.fromHex(
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81a',
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Signature.InvalidYParityError: Value `26` is an invalid y-parity value. Y-parity must be 0 or 1.]',
    )
  })
})

describe('fromBytes', () => {
  test('default', () => {
    expect(
      Signature.fromBytes(
        Bytes.fromHex(
          '0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf15fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b00',
        ),
      ),
    ).toEqual({
      r: '0xa461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf1',
      s: '0x5fe57c96f9175d6cd4daad4663763baa7e78836e067d0163e9a2ccf2ff753f5b',
      yParity: 0,
    })

    expect(
      Signature.fromBytes(
        Bytes.fromHex(
          '0xc4d8bcda762d35ea79d9542b23200f46c2c1899db15bf929bbacaf609581db0831538374a01206517edd934e474212a0f1e2d62e9a01cd64f1cf94ea2e09884901',
        ),
      ),
    ).toEqual({
      r: '0xc4d8bcda762d35ea79d9542b23200f46c2c1899db15bf929bbacaf609581db08',
      s: '0x31538374a01206517edd934e474212a0f1e2d62e9a01cd64f1cf94ea2e098849',
      yParity: 1,
    })
  })
})

describe('extract', () => {
  test('default', () => {
    const signature = Signature.from({
      r: '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
      s: '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
      yParity: 0,
    })
    const envelope = TxEnvelopeEip1559.from({
      chainId: 1,
      gas: 69420n,
      ...signature,
    })
    expect(Signature.extract(envelope)).toEqual(signature)
  })

  test('behavior: rpc', () => {
    const signature = {
      r: '0x73b39769ff4a36515c8fca546550a3fdafebbf37fa9e22be2d92b44653ade7bf',
      s: '0x354c756a1aa3346e9b3ea5423ac99acfc005e9cce2cd698e14d792f43fa15a23',
      yParity: '0x0',
    } as const
    const envelope = TxEnvelopeEip1559.from({
      chainId: 1,
      gas: 69420n,
    })
    expect(Signature.extract({ ...envelope, ...signature })).toEqual(
      Signature.from(signature),
    )
  })
})

describe('from', () => {
  test('default', () => {
    const signature = {
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      yParity: 1,
    } as const
    expect(Signature.from(signature)).toMatchInlineSnapshot(`
    {
      "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
      "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
      "yParity": 1,
    }
  `)

    expect(Signature.from(Signature.toHex(signature))).toEqual(signature)
    expect(Signature.from(Signature.toBytes(signature))).toEqual(signature)
  })

  test('behavior: unrecovered', () => {
    const signature = {
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    } as const
    expect(Signature.from(signature)).toMatchInlineSnapshot(`
    {
      "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
      "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
    }
  `)

    expect(Signature.from(Signature.toHex(signature))).toEqual(signature)
    expect(Signature.from(Signature.toBytes(signature))).toEqual(signature)
  })

  test('behavior: legacy', () => {
    const signature = {
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      v: 27,
    } as const
    expect(Signature.from(signature)).toMatchInlineSnapshot(`
    {
      "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
      "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
      "yParity": 0,
    }
  `)
  })

  test('behavior: rpc', () => {
    expect(
      Signature.from({
        r: '0x1',
        s: '0x2',
        yParity: '0x0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x1",
        "s": "0x2",
        "yParity": 0,
      }
    `)

    expect(
      Signature.from({
        r: '0x1',
        s: '0x2',
        v: '0x0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x1",
        "s": "0x2",
        "yParity": 0,
      }
    `)

    expect(
      Signature.from({
        r: '0x1',
        s: '0x2',
        v: '0x1b',
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x1",
        "s": "0x2",
        "yParity": 0,
      }
    `)
  })

  test('error: invalid sig', () => {
    const signature = {
      r: Hex.fromNumber(Solidity.maxUint256 + 1n),
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      yParity: 1,
    } as const
    expect(() => Signature.from(signature)).toThrowErrorMatchingInlineSnapshot(
      `[Signature.InvalidRError: Value \`0x10000000000000000000000000000000000000000000000000000000000000000\` is an invalid r value. r must be a positive integer less than 2^256.]`,
    )
  })
})

describe('fromDerHex', () => {
  test('default', () => {
    expect(
      Signature.fromDerHex(
        '0x304402206e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf02204a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      ),
    ).toMatchInlineSnapshot(
      `
    {
      "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
      "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
    }
  `,
    )
  })
})

describe('fromDerBytes', () => {
  test('default', () => {
    const signature = Signature.from({
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    })
    const signature_der = Signature.toDerBytes(signature)
    expect(Signature.fromDerBytes(signature_der)).toEqual(signature)
  })
})

describe('fromRpc', () => {
  test('default', () => {
    expect(
      Signature.fromRpc({
        r: '0x1',
        s: '0x2',
        yParity: '0x0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x1",
        "s": "0x2",
        "yParity": 0,
      }
    `)

    expect(
      Signature.fromRpc({
        r: '0x1',
        s: '0x2',
        v: '0x0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x1",
        "s": "0x2",
        "yParity": 0,
      }
    `)

    expect(
      Signature.fromRpc({
        r: '0x1',
        s: '0x2',
        v: '0x1b',
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x1",
        "s": "0x2",
        "yParity": 0,
      }
    `)
  })

  test('error: missing yParity and v', () => {
    expect(() =>
      Signature.fromRpc({
        r: '0x1',
        s: '0x2',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Signature.InvalidYParityError: Value `undefined` is an invalid y-parity value. Y-parity must be 0 or 1.]',
    )
  })
})

describe('fromTuple', () => {
  test('default', () => {
    expect(
      Signature.fromTuple([
        '0x01',
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      ]),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
        "s": "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
        "yParity": 1,
      }
    `)

    expect(Signature.fromTuple(['0x', '0x', '0x'])).toMatchInlineSnapshot(`
      {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000000",
        "yParity": 0,
      }
    `)
  })

  test('error: invalid sig', () => {
    expect(() =>
      Signature.fromTuple([
        '0x01',
        '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf88',
        '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      ]),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Hex.SizeExceedsPaddingSizeError: Hex size (\`33\`) exceeds padding size (\`32\`).]`,
    )
  })
})

describe('serialize', () => {
  test('default', () => {
    expect(
      Signature.toHex({
        r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
        yParity: 1,
      }),
    ).toMatchInlineSnapshot(
      `"0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81c"`,
    )

    expect(
      Signature.toHex({
        r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
        yParity: 0,
      }),
    ).toMatchInlineSnapshot(
      `"0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db81b"`,
    )

    expect(
      Signature.toHex({
        r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
      }),
    ).toMatchInlineSnapshot(
      `"0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8"`,
    )
  })
})

describe('toBytes', () => {
  test('args: as (bytes)', () => {
    expect(
      Signature.toBytes({
        r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
        yParity: 1,
      }),
    ).toMatchInlineSnapshot(
      `
    Uint8Array [
      110,
      16,
      10,
      53,
      46,
      198,
      173,
      27,
      112,
      128,
      34,
      144,
      225,
      138,
      238,
      209,
      144,
      112,
      73,
      115,
      87,
      15,
      59,
      142,
      212,
      44,
      185,
      128,
      142,
      46,
      166,
      191,
      74,
      144,
      162,
      41,
      162,
      68,
      73,
      91,
      65,
      137,
      9,
      135,
      128,
      111,
      203,
      210,
      213,
      210,
      63,
      192,
      219,
      229,
      245,
      37,
      108,
      38,
      19,
      192,
      57,
      215,
      109,
      184,
      28,
    ]
  `,
    )
  })
})

describe('toDerHex', () => {
  test('default', () => {
    const signature = Signature.from({
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    })
    expect(Signature.toDerHex(signature)).toMatchInlineSnapshot(
      `"0x304402206e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf02204a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8"`,
    )
  })
})

describe('toDerBytes', () => {
  test('options: as: bytes', () => {
    const signature = Signature.from({
      r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
      s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
    })
    expect(Signature.toDerBytes(signature)).toMatchInlineSnapshot(
      `
    Uint8Array [
      48,
      68,
      2,
      32,
      110,
      16,
      10,
      53,
      46,
      198,
      173,
      27,
      112,
      128,
      34,
      144,
      225,
      138,
      238,
      209,
      144,
      112,
      73,
      115,
      87,
      15,
      59,
      142,
      212,
      44,
      185,
      128,
      142,
      46,
      166,
      191,
      2,
      32,
      74,
      144,
      162,
      41,
      162,
      68,
      73,
      91,
      65,
      137,
      9,
      135,
      128,
      111,
      203,
      210,
      213,
      210,
      63,
      192,
      219,
      229,
      245,
      37,
      108,
      38,
      19,
      192,
      57,
      215,
      109,
      184,
    ]
  `,
    )
  })
})

describe('toLegacy', () => {
  test('default', () => {
    expect(
      Signature.fromLegacy({ r: '0x01', s: '0x02', v: 28 }),
    ).toMatchInlineSnapshot(`
    {
      "r": "0x01",
      "s": "0x02",
      "yParity": 1,
    }
  `)

    expect(
      Signature.fromLegacy({ r: '0x01', s: '0x02', v: 27 }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x01",
        "s": "0x02",
        "yParity": 0,
      }
    `)

    expect(
      Signature.fromLegacy({ r: '0x01', s: '0x02', v: 35 }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x01",
        "s": "0x02",
        "yParity": 0,
      }
    `)

    expect(() =>
      Signature.fromLegacy({ r: '0x01', s: '0x02', v: 30 }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[Signature.InvalidVError: Value `30` is an invalid v value. v must be 27, 28 or >=35.]',
    )
  })
})

describe('toRpc', () => {
  test('default', () => {
    expect(
      Signature.toRpc({
        r: '0x01',
        s: '0x02',
        yParity: 0,
      }),
    ).toMatchInlineSnapshot(`
      {
        "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
        "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
        "yParity": "0x0",
      }
    `)
  })
})

describe('toTuple', () => {
  test('default', () => {
    expect(
      Signature.toTuple({
        r: '0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf',
        s: '0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8',
        yParity: 1,
      }),
    ).toMatchInlineSnapshot(`
    [
      "0x01",
      "0x6e100a352ec6ad1b70802290e18aeed190704973570f3b8ed42cb9808e2ea6bf",
      "0x4a90a229a244495b41890987806fcbd2d5d23fc0dbe5f5256c2613c039d76db8",
    ]
  `)

    expect(
      Signature.toTuple({
        r: '0x',
        s: '0x',
        yParity: 0,
      }),
    ).toMatchInlineSnapshot(`
    [
      "0x",
      "0x",
      "0x",
    ]
  `)
  })
})

describe('validate', () => {
  test('default', () => {
    expect(
      Signature.validate({
        r: '0x0000000000000000000000000000000000000000000000000000000000000000',
        s: '0x0000000000000000000000000000000000000000000000000000000000000000',
        yParity: 0,
      }),
    ).toBe(true)
    expect(
      Signature.validate({
        r: '0x',
        s: '0x',
        yParity: -1,
      }),
    ).toBe(false)
  })
})

describe('vToYParity', () => {
  test('default', () => {
    expect(Signature.vToYParity(0)).toBe(0)
    expect(Signature.vToYParity(1)).toBe(1)
    expect(Signature.vToYParity(27)).toBe(0)
    expect(Signature.vToYParity(28)).toBe(1)
    expect(Signature.vToYParity(35)).toBe(0)
    expect(Signature.vToYParity(36)).toBe(1)
    expect(() => Signature.vToYParity(34)).toThrow(
      'Value `34` is an invalid v value.',
    )
    expect(() => Signature.vToYParity(-1)).toThrow(
      'Value `-1` is an invalid v value.',
    )
  })
})

describe('yParityToV', () => {
  test('default', () => {
    expect(Signature.yParityToV(0)).toBe(27)
    expect(Signature.yParityToV(1)).toBe(28)
    expect(() => Signature.yParityToV(27)).toThrow(
      'Value `27` is an invalid y-parity value. Y-parity must be 0 or 1.',
    )
    expect(() => Signature.vToYParity(-1)).toThrow(
      'Value `-1` is an invalid v value.',
    )
  })
})

test('exports', () => {
  expect(Object.keys(Signature)).toMatchInlineSnapshot(`
    [
      "assert",
      "fromBytes",
      "fromHex",
      "extract",
      "from",
      "fromDerBytes",
      "fromDerHex",
      "fromLegacy",
      "fromRpc",
      "fromTuple",
      "toBytes",
      "toHex",
      "toDerBytes",
      "toDerHex",
      "toLegacy",
      "toRpc",
      "toTuple",
      "validate",
      "vToYParity",
      "yParityToV",
      "InvalidSerializedSizeError",
      "MissingPropertiesError",
      "InvalidRError",
      "InvalidSError",
      "InvalidYParityError",
      "InvalidVError",
    ]
  `)
})
