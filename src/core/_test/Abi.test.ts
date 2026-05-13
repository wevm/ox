import { Abi, AbiEvent, AbiFunction, AbiItem, AbiParameters } from 'ox'
import { describe, expect, expectTypeOf, test } from 'vitest'

describe('format', () => {
  test('default', () => {
    const abi = Abi.from([
      {
        type: 'function',
        name: 'approve',
        stateMutability: 'nonpayable',
        inputs: [
          {
            name: 'spender',
            type: 'address',
          },
          {
            name: 'amount',
            type: 'uint256',
          },
        ],
        outputs: [{ type: 'bool' }],
      },
    ])
    const formatted = Abi.format(abi)
    expect(formatted).toMatchInlineSnapshot(`
      [
        "function approve(address spender, uint256 amount) returns (bool)",
      ]
    `)
    expectTypeOf(formatted).toEqualTypeOf<
      readonly [
        'function approve(address spender, uint256 amount) returns (bool)',
      ]
    >()
  })
})

describe('from', () => {
  test('default', () => {
    {
      const abi = Abi.from([
        {
          type: 'function',
          name: 'approve',
          stateMutability: 'nonpayable',
          inputs: [
            {
              name: 'spender',
              type: 'address',
            },
            {
              name: 'amount',
              type: 'uint256',
            },
          ],
          outputs: [{ type: 'bool' }],
        },
      ])
      expect(abi).toMatchInlineSnapshot(`
      [
        {
          "inputs": [
            {
              "name": "spender",
              "type": "address",
            },
            {
              "name": "amount",
              "type": "uint256",
            },
          ],
          "name": "approve",
          "outputs": [
            {
              "type": "bool",
            },
          ],
          "stateMutability": "nonpayable",
          "type": "function",
        },
      ]
    `)
    }

    {
      const abi = Abi.from([
        'function approve(address spender, uint256 amount) returns (bool)',
      ])
      expect(abi).toMatchInlineSnapshot(`
      [
        {
          "inputs": [
            {
              "name": "spender",
              "type": "address",
            },
            {
              "name": "amount",
              "type": "uint256",
            },
          ],
          "name": "approve",
          "outputs": [
            {
              "type": "bool",
            },
          ],
          "stateMutability": "nonpayable",
          "type": "function",
        },
      ]
    `)
    }
  })
})

describe('from: prepare', () => {
  test('attaches `hash` to every item when prepare = true', () => {
    const abi = Abi.from(
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'event Transfer(address indexed from, address indexed to, uint256 amount)',
      ],
      { prepare: true },
    )
    for (const item of abi) {
      expect((item as { hash?: string }).hash).toMatch(/^0x[0-9a-f]{64}$/)
    }
  })

  test('default leaves `hash` off (back-compat)', () => {
    const abi = Abi.from([
      'function approve(address spender, uint256 amount) returns (bool)',
    ])
    expect((abi[0] as { hash?: string }).hash).toBeUndefined()
  })

  test('parity: encode/decode produces identical results with prepare = true', () => {
    const values = [
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
      420n,
      true,
      'wagmi',
    ] as const
    const abiPrepared = Abi.from(
      ['function foo(address a, uint256 b, bool c, string d)'],
      { prepare: true },
    )
    const abiPlain = Abi.from([
      'function foo(address a, uint256 b, bool c, string d)',
    ])
    const itemPrepared = abiPrepared[0] as AbiFunction.AbiFunction
    const itemPlain = abiPlain[0] as AbiFunction.AbiFunction
    const encodedPrepared = AbiParameters.encode(itemPrepared.inputs, values)
    const encodedPlain = AbiParameters.encode(itemPlain.inputs, values)
    expect(encodedPrepared).toEqual(encodedPlain)
    expect(AbiParameters.decode(itemPrepared.inputs, encodedPrepared)).toEqual(
      AbiParameters.decode(itemPlain.inputs, encodedPlain),
    )
  })

  test('parity: tuple/array decode with prepare = true', () => {
    const abiPrepared = Abi.from(
      [
        'function transfer((address to, uint256[] amounts) data) returns (bool)',
      ],
      { prepare: true },
    )
    const abiPlain = Abi.from([
      'function transfer((address to, uint256[] amounts) data) returns (bool)',
    ])
    const value = [
      {
        to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        amounts: [1n, 2n, 3n],
      },
    ] as const
    const itemPrepared = abiPrepared[0] as AbiFunction.AbiFunction
    const itemPlain = abiPlain[0] as AbiFunction.AbiFunction
    const encodedPrepared = AbiParameters.encode(itemPrepared.inputs, value)
    const encodedPlain = AbiParameters.encode(itemPlain.inputs, value)
    expect(encodedPrepared).toEqual(encodedPlain)
    expect(AbiParameters.decode(itemPrepared.inputs, encodedPrepared)).toEqual(
      AbiParameters.decode(itemPlain.inputs, encodedPlain),
    )
  })

  test('parity: fully-static array uses Infinity recursive read limit without behavior change', () => {
    const abiPrepared = Abi.from(['function foo(uint256[3] xs)'], {
      prepare: true,
    })
    const abiPlain = Abi.from(['function foo(uint256[3] xs)'])
    const value = [[1n, 2n, 3n]] as const
    const itemPrepared = abiPrepared[0] as AbiFunction.AbiFunction
    const itemPlain = abiPlain[0] as AbiFunction.AbiFunction
    const encoded = AbiParameters.encode(itemPlain.inputs, value)
    const decodedPrepared = AbiParameters.decode(itemPrepared.inputs, encoded)
    const decodedPlain = AbiParameters.decode(itemPlain.inputs, encoded)
    expect(decodedPrepared).toEqual(decodedPlain)
  })

  test('preflight: minStaticHeadSize rejects undersized input on prepared params', () => {
    const abi = Abi.from(['function foo(uint256, uint256, uint256)'], {
      prepare: true,
    })
    const item = abi[0] as AbiFunction.AbiFunction
    // 32 bytes is enough for one slot, but 3 uint256 require 96.
    const data = `0x${'00'.repeat(32)}` as const
    expect(() =>
      AbiParameters.decode(item.inputs, data),
    ).toThrowErrorMatchingInlineSnapshot(`
      [AbiParameters.DataSizeTooSmallError: Data size of 32 bytes is too small for given parameters.

      Params: (uint256, uint256, uint256)
      Data:   0x0000000000000000000000000000000000000000000000000000000000000000 (32 bytes)]
    `)
  })

  test('preserves `_meta` as a non-enumerable property', () => {
    const abi = Abi.from(['function foo(uint256 a)'], { prepare: true })
    const input = (abi[0] as AbiFunction.AbiFunction).inputs[0]!
    expect(Object.keys(input)).not.toContain('_meta')
    expect((input as { _meta?: unknown })._meta).toBeDefined()
  })

  test('AbiItem.fromAbi memoizes selector lookups across calls', () => {
    const abi = Abi.from([
      'function foo(uint256)',
      'function bar(address)',
      'function baz(string)',
    ])
    const a = AbiItem.fromAbi(abi, AbiItem.getSelector(abi[0]!))
    const b = AbiItem.fromAbi(abi, AbiItem.getSelector(abi[0]!))
    expect((a as AbiFunction.AbiFunction).name).toBe('foo')
    expect((b as AbiFunction.AbiFunction).name).toBe('foo')
  })

  test('AbiEvent.encode caches no-arg topics array', () => {
    const event = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 amount)',
    )
    const a = AbiEvent.encode(event)
    const b = AbiEvent.encode(event)
    expect(a.topics).toBe(b.topics)
  })
})

test('exports', () => {
  expect(Object.keys(Abi)).toMatchInlineSnapshot(`
    [
      "format",
      "from",
    ]
  `)
})
