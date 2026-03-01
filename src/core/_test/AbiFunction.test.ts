import { Abi, AbiFunction, AbiParameters } from 'ox'
import { describe, expect, test } from 'vitest'
import { erc20Abi, wagmiContractConfig } from '../../../test/constants/abis.js'
import { address } from '../../../test/constants/addresses.js'
import { anvilMainnet } from '../../../test/prool.js'

describe('decodeData', () => {
  test('default', () => {
    const abiItem = AbiFunction.fromAbi(erc20Abi, 'decimals')
    const data = AbiFunction.encodeData(abiItem)
    const input = AbiFunction.decodeData(abiItem, data)
    const input2 = AbiFunction.decodeData(erc20Abi, 'decimals', data)
    expect(input).toEqual(undefined)
    expect(input2).toEqual(undefined)
  })

  test('behavior: with data', () => {
    const abiItem = AbiFunction.fromAbi(erc20Abi, 'approve', {
      prepare: false,
    })
    const data = AbiFunction.encodeData(abiItem, [address.vitalik, 1n])
    const input = AbiFunction.decodeData(abiItem, data)
    const input2 = AbiFunction.decodeData(erc20Abi, 'approve', data)
    expect(input).toEqual([address.vitalik, 1n])
    expect(input2).toEqual([address.vitalik, 1n])
  })

  test('behavior: with overloads', () => {
    const abi = Abi.from([
      {
        inputs: [{ type: 'bytes' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ name: 'x', type: 'uint256' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ])
    const abiItem = AbiFunction.fromAbi(abi, 'balanceOf')
    expect(
      AbiFunction.decodeData(
        abiItem,
        '0x9cc7f7080000000000000000000000000000000000000000000000000000000000000001',
      ),
    ).toEqual([1n])
    expect(
      AbiFunction.decodeData(
        abiItem,
        '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
      ),
    ).toEqual(['0xdeadbeef'])
  })
})

describe('decodeResult', () => {
  test('default', () => {
    const abiItem = AbiFunction.from(
      'function test() returns (uint a, (uint x, string y) b)',
    )
    const args = [420n, { x: 420n, y: 'lol' }] as const
    const result = AbiFunction.decodeResult(
      abiItem,
      AbiParameters.encode(abiItem.outputs, args),
    )
    expect(result).toMatchInlineSnapshot(`
    [
      420n,
      {
        "x": 420n,
        "y": "lol",
      },
    ]
  `)
  })

  test('behavior: single output parameter', () => {
    const abiItem = AbiFunction.from('function test() returns (uint a)')
    const args = [420n] as const
    const result = AbiFunction.decodeResult(
      abiItem,
      AbiParameters.encode(abiItem.outputs, args),
    )
    expect(result).toMatchInlineSnapshot('420n')
  })

  test('behavior: no output parameter', () => {
    const abiItem = AbiFunction.from('function test()')
    const result = AbiFunction.decodeResult(abiItem, '0x')
    expect(result).toEqual(undefined)
  })

  test('options: as = Object', () => {
    const abiItem = AbiFunction.from(
      'function test() returns (uint a, (uint x, string y) b)',
    )
    const args = [420n, { x: 420n, y: 'lol' }] as const
    const result = AbiFunction.decodeResult(
      abiItem,
      AbiParameters.encode(abiItem.outputs, args),
      { as: 'Object' },
    )
    expect(result).toMatchInlineSnapshot(`
    {
      "a": 420n,
      "b": {
        "x": 420n,
        "y": "lol",
      },
    }
  `)
  })

  test('options: as = Object, behavior: single output parameter', () => {
    const abiItem = AbiFunction.from('function test() returns (uint a)')
    const args = [420n] as const
    const result = AbiFunction.decodeResult(
      abiItem,
      AbiParameters.encode(abiItem.outputs, args),
      { as: 'Object' },
    )
    expect(result).toMatchInlineSnapshot('420n')
  })

  test('options: as = Object, behavior: no output parameter', () => {
    const abiItem = AbiFunction.from('function test()')
    const result = AbiFunction.decodeResult(abiItem, '0x', {
      as: 'Object',
    })
    expect(result).toMatchInlineSnapshot('undefined')
  })
})

describe('encodeData', () => {
  test('default', () => {
    {
      const abiFunction = AbiFunction.fromAbi(erc20Abi, 'decimals')
      expect(AbiFunction.encodeData(abiFunction)).toEqual('0x313ce567')
    }

    AbiFunction.encodeData(erc20Abi, 'decimals')
  })

  test('behavior: abiFunction not prepared', () => {
    const abiFunction = AbiFunction.fromAbi(erc20Abi, 'decimals', {
      prepare: false,
    })
    expect(AbiFunction.encodeData(abiFunction)).toEqual('0x313ce567')
  })

  test('behavior: with data', () => {
    {
      const abiFunction = AbiFunction.fromAbi(erc20Abi, 'approve', {
        prepare: false,
      })
      expect(
        AbiFunction.encodeData(abiFunction, [address.vitalik, 1n]),
      ).toEqual(
        '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
      )
    }

    expect(
      AbiFunction.encodeData(erc20Abi, 'approve', [address.vitalik, 1n]),
    ).toEqual(
      '0x095ea7b3000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
    )
  })

  test('behavior: with overloads', () => {
    const abi = Abi.from([
      {
        inputs: [{ type: 'bytes' }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ name: 'x', type: 'uint256' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ])
    const abiFunction = AbiFunction.fromAbi(abi, 'balanceOf')
    expect(AbiFunction.encodeData(abiFunction, [1n])).toEqual(
      '0x9cc7f7080000000000000000000000000000000000000000000000000000000000000001',
    )
    expect(AbiFunction.encodeData(abiFunction, ['0xdeadbeef'])).toEqual(
      '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
    )

    expect(AbiFunction.encodeData(abi, 'balanceOf', [1n])).toEqual(
      '0x9cc7f7080000000000000000000000000000000000000000000000000000000000000001',
    )
    expect(AbiFunction.encodeData(abi, 'balanceOf', ['0xdeadbeef'])).toEqual(
      '0x7841536500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000004deadbeef00000000000000000000000000000000000000000000000000000000',
    )
  })
})

describe('encodeResult', () => {
  test('default', () => {
    const abiItem = AbiFunction.from(
      'function test() returns (uint a, (uint x, string y) b)',
    )
    const output = [420n, { x: 420n, y: 'lol' }] as const
    const result = AbiFunction.encodeResult(abiItem, output)
    expect(AbiFunction.decodeResult(abiItem, result)).toEqual(output)
    expect(result).toMatchInlineSnapshot(
      `"0x00000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000036c6f6c0000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('behavior: single param', () => {
    const abiItem = AbiFunction.from(
      'function test() returns ((uint x, string y) b)',
    )
    const output = { x: 420n, y: 'lol' } as const
    const result = AbiFunction.encodeResult(abiItem, output)
    expect(AbiFunction.decodeResult(abiItem, result)).toEqual(output)
    expect(result).toMatchInlineSnapshot(
      `"0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000036c6f6c0000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('options: as = Object', () => {
    const abiItem = AbiFunction.from(
      'function test() returns (uint a, (uint x, string y) b)',
    )
    const output = { a: 420n, b: { x: 420n, y: 'lol' } } as const
    const result = AbiFunction.encodeResult(abiItem, output, { as: 'Object' })
    expect(AbiFunction.decodeResult(abiItem, result, { as: 'Object' })).toEqual(
      output,
    )
    expect(result).toMatchInlineSnapshot(
      `"0x00000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000036c6f6c0000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('options: as = Object, behavior: single param', () => {
    const abiItem = AbiFunction.from(
      'function test() returns ((uint x, string y) b)',
    )
    const output = { x: 420n, y: 'lol' } as const
    const result = AbiFunction.encodeResult(abiItem, output, { as: 'Object' })
    expect(AbiFunction.decodeResult(abiItem, result, { as: 'Object' })).toEqual(
      output,
    )
    expect(result).toMatchInlineSnapshot(
      `"0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000036c6f6c0000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('behavior: overload with abi', () => {
    const abi = Abi.from([
      'function test() returns (uint a, (uint x, string y) b)',
    ])
    const output = [420n, { x: 420n, y: 'lol' }] as const

    // Test both overload patterns
    const abiItem = AbiFunction.fromAbi(abi, 'test')
    const result1 = AbiFunction.encodeResult(abiItem, output)
    const result2 = AbiFunction.encodeResult(abi, 'test', output)

    expect(result1).toEqual(result2)
    expect(AbiFunction.decodeResult(abi, 'test', result2)).toEqual(output)
    expect(result2).toMatchInlineSnapshot(
      `"0x00000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000036c6f6c0000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('behavior: overload with abi and options', () => {
    const abi = Abi.from([
      'function test() returns (uint a, (uint x, string y) b)',
    ])
    const output = { a: 420n, b: { x: 420n, y: 'lol' } } as const

    // Test both overload patterns with options
    const abiItem = AbiFunction.fromAbi(abi, 'test')
    const result1 = AbiFunction.encodeResult(abiItem, output, { as: 'Object' })
    const result2 = AbiFunction.encodeResult(abi, 'test', output, {
      as: 'Object',
    })

    expect(result1).toEqual(result2)
    expect(
      AbiFunction.decodeResult(abi, 'test', result2, { as: 'Object' }),
    ).toEqual(output)
    expect(result2).toMatchInlineSnapshot(
      `"0x00000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000036c6f6c0000000000000000000000000000000000000000000000000000000000"`,
    )
  })

  test('behavior: overload with erc20 abi', () => {
    const abiItem = AbiFunction.fromAbi(erc20Abi, 'totalSupply')
    const output = 69420n

    // Test both overload patterns
    const result1 = AbiFunction.encodeResult(abiItem, output)
    const result2 = AbiFunction.encodeResult(erc20Abi, 'totalSupply', output)

    expect(result1).toEqual(result2)
    expect(AbiFunction.decodeResult(erc20Abi, 'totalSupply', result2)).toEqual(
      output,
    )
    expect(result2).toMatchInlineSnapshot(
      `"0x0000000000000000000000000000000000000000000000000000000000010f2c"`,
    )
  })
})

describe('format', () => {
  test('default', () => {
    const approve = AbiFunction.from({
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
    })
    const formatted = AbiFunction.format(approve)
    expect(formatted).toMatchInlineSnapshot(
      `"function approve(address spender, uint256 amount) returns (bool)"`,
    )
  })
})

describe('from', () => {
  test('default', () => {
    {
      const abiItem = AbiFunction.from({
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
      })
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x095ea7b334ae44009aa867bfb386f5c3b4b443ac6f0ee573fa91c4608fbadfba",
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
      }
    `)
    }

    {
      const abiItem = AbiFunction.from(
        'function approve(address spender, uint256 amount) returns (bool)',
      )
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0x095ea7b334ae44009aa867bfb386f5c3b4b443ac6f0ee573fa91c4608fbadfba",
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
      }
    `)
    }

    {
      const abiItem = AbiFunction.from([
        'struct Foo { address owner; address spender; uint256 amount; }',
        'function approve(Foo foo) returns (bool)',
      ])
      expect(abiItem).toMatchInlineSnapshot(`
      {
        "hash": "0xe0ac316e47844d88260c3fd7bfe62c3348cee1a015524358c41abe32d0d91266",
        "inputs": [
          {
            "components": [
              {
                "name": "owner",
                "type": "address",
              },
              {
                "name": "spender",
                "type": "address",
              },
              {
                "name": "amount",
                "type": "uint256",
              },
            ],
            "name": "foo",
            "type": "tuple",
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
      }
    `)
    }
  })

  test('options: prepare', () => {
    const abiItem = AbiFunction.from(
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
      { prepare: false },
    )
    expect(abiItem).toMatchInlineSnapshot(`
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
    }
  `)
  })
})

describe('fromAbi', () => {
  test('default', () => {
    expect(
      AbiFunction.fromAbi(wagmiContractConfig.abi, 'balanceOf'),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0x70a08231b98ef4ca268c9cc3f6b4590e4bfec28280db06bb5d45e689f2a360be",
      "inputs": [
        {
          "name": "owner",
          "type": "address",
        },
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "",
          "type": "uint256",
        },
      ],
      "stateMutability": "view",
      "type": "function",
    }
  `)
  })

  test('behavior: prepare = false', () => {
    expect(
      AbiFunction.fromAbi(wagmiContractConfig.abi, 'balanceOf', {
        args: ['0x0000000000000000000000000000000000000000'],
        prepare: false,
      }),
    ).toMatchInlineSnapshot(`
    {
      "inputs": [
        {
          "name": "owner",
          "type": "address",
        },
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "",
          "type": "uint256",
        },
      ],
      "stateMutability": "view",
      "type": "function",
    }
  `)
  })

  test('behavior: data', () => {
    const item = AbiFunction.fromAbi(wagmiContractConfig.abi, 'approve')
    const data = AbiFunction.encodeData(item, [
      '0x0000000000000000000000000000000000000000',
      1n,
    ])
    expect(
      AbiFunction.fromAbi(wagmiContractConfig.abi, data),
    ).toMatchInlineSnapshot(`
      {
        "hash": "0x095ea7b334ae44009aa867bfb386f5c3b4b443ac6f0ee573fa91c4608fbadfba",
        "inputs": [
          {
            "name": "to",
            "type": "address",
          },
          {
            "name": "tokenId",
            "type": "uint256",
          },
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
      }
    `)
  })

  test('error: no matching name', () => {
    expect(() =>
      // @ts-expect-error
      AbiFunction.fromAbi(wagmiContractConfig.abi, 'Approval'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI function with name "Approval" not found.]`,
    )
  })

  test('error: no matching name', () => {
    expect(() =>
      AbiFunction.fromAbi([] as readonly unknown[], 'balanceOf', {
        args: ['0x0000000000000000000000000000000000000000'],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "balanceOf" not found.]`,
    )
  })

  test('error: no matching data', () => {
    expect(() =>
      AbiFunction.fromAbi([], '0xdeadbeef'),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "0xdeadbeef" not found.]`,
    )
  })

  test('behavior: overloads', () => {
    const abi = Abi.from([
      'function bar()',
      'function foo(bytes)',
      'function foo(uint256)',
    ])
    const item = AbiFunction.fromAbi(abi, 'foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x30c8d1da93067416f4fed4bc024d665b120d7271f9d1000c7632a48d39765324",
      "inputs": [
        {
          "type": "bytes",
        },
      ],
      "name": "foo",
      "outputs": [],
      "overloads": [
        {
          "inputs": [
            {
              "type": "uint256",
            },
          ],
          "name": "foo",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function",
        },
      ],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)
  })

  test('behavior: overloads: no inputs', () => {
    const abi = Abi.from([
      'function bar()',
      'function foo()',
      'function foo(uint256)',
    ])
    const item = AbiFunction.fromAbi(abi, 'foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xc2985578b8f3b75f7dc66a767be2a4ef7d7c2224896a1c86e92ccf30bae678b7",
      "inputs": [],
      "name": "foo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)
  })

  test('overloads: no args', () => {
    const abi = Abi.from([
      'function bar()',
      'function foo(uint256)',
      'function foo()',
    ])
    const item = AbiFunction.fromAbi(abi, 'foo')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xc2985578b8f3b75f7dc66a767be2a4ef7d7c2224896a1c86e92ccf30bae678b7",
      "inputs": [],
      "name": "foo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)
  })

  test('behavior: overloads: different lengths without abi order define effect', () => {
    const abi = wagmiContractConfig.abi.filter(
      (abi) => abi.type === 'function' && abi.name === 'safeTransferFrom',
    )
    const shortArgs = [
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      420n,
    ] as const
    const shortSnapshot = `
    {
      "hash": "0x42842e0eb38857a7775b4e7364b2775df7325074d088e7fb39590cd6281184ed",
      "inputs": [
        {
          "name": "from",
          "type": "address",
        },
        {
          "name": "to",
          "type": "address",
        },
        {
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `
    const longArgs = [
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      420n,
      '0x0000000000000000000000000000000000000000',
    ] as const
    const longSnapshot = `
    {
      "hash": "0xb88d4fde60196325a28bb7f99a2582e0b46de55b18761e960c14ad7a32099465",
      "inputs": [
        {
          "name": "from",
          "type": "address",
        },
        {
          "name": "to",
          "type": "address",
        },
        {
          "name": "tokenId",
          "type": "uint256",
        },
        {
          "name": "_data",
          "type": "bytes",
        },
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `
    expect(
      AbiFunction.fromAbi(abi, 'safeTransferFrom', {
        args: shortArgs,
      }),
    ).toMatchInlineSnapshot(shortSnapshot)
    expect(
      AbiFunction.fromAbi(abi.reverse(), 'safeTransferFrom', {
        args: shortArgs,
      }),
    ).toMatchInlineSnapshot(shortSnapshot)

    expect(
      AbiFunction.fromAbi(abi, 'safeTransferFrom', {
        args: longArgs,
      }),
    ).toMatchInlineSnapshot(longSnapshot)
    expect(
      AbiFunction.fromAbi(abi.reverse(), 'safeTransferFrom', {
        args: longArgs,
      }),
    ).toMatchInlineSnapshot(longSnapshot)
  })

  test('behavior: overloads: different types', () => {
    const abi = Abi.from([
      'function mint()',
      'function mint(uint256)',
      'function mint(string)',
    ])
    const item = AbiFunction.fromAbi(abi, 'mint')
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x1249c58b84ff771f36a0d1d2bf0b42e48832b1567c4213f113d3990903cea57d",
      "inputs": [],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)

    const item_2 = AbiFunction.fromAbi(abi, 'mint', {
      args: [420n],
    })
    expect(item_2).toMatchInlineSnapshot(`
    {
      "hash": "0xa0712d680358d64f694230b7cc0b277c73686bdf768385d55cd7c547d0ffd30e",
      "inputs": [
        {
          "type": "uint256",
        },
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)

    const item_3 = AbiFunction.fromAbi(abi, 'mint', {
      args: ['foo'],
    })
    expect(item_3).toMatchInlineSnapshot(`
    {
      "hash": "0xd85d3d2718c3cc9b33ff08eede5eea8b009f9d6e830a4fb9f651e3174175a5a1",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)
  })

  test('behavior: overloads: tuple', () => {
    const abi = Abi.from([
      'function foo(uint256 foo, (string a, string b, uint256 c) bar)',
      'function foo(uint256 foo, (string a, (string merp, string meep) b, address c) bar)',
    ])
    const item = AbiFunction.fromAbi(abi, 'foo', {
      args: [
        420n,
        {
          a: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
          b: { merp: 'test', meep: 'test' },
          c: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
        },
      ],
    })
    expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x7994c7de29322475e8941809c4c1405aef16daab07153633b8863148687cb0c5",
      "inputs": [
        {
          "name": "foo",
          "type": "uint256",
        },
        {
          "components": [
            {
              "name": "a",
              "type": "string",
            },
            {
              "components": [
                {
                  "name": "merp",
                  "type": "string",
                },
                {
                  "name": "meep",
                  "type": "string",
                },
              ],
              "name": "b",
              "type": "tuple",
            },
            {
              "name": "c",
              "type": "address",
            },
          ],
          "name": "bar",
          "type": "tuple",
        },
      ],
      "name": "foo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)
  })

  test('behavior: overloads: ambiguious types', () => {
    expect(() =>
      AbiFunction.fromAbi(
        Abi.from(['function foo(address)', 'function foo(bytes20)']),
        'foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`foo(bytes20)\`, and
    \`address\` in \`foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiFunction.fromAbi(
        Abi.from([
          'function foo(string)',
          'function foo(uint)',
          'function foo(address)',
        ]),
        'foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`address\` in \`foo(address)\`, and
    \`string\` in \`foo(string)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(
      AbiFunction.fromAbi(
        Abi.from([
          'function foo(string)',
          'function foo(uint)',
          'function foo(address)',
        ]),
        'foo',
        {
          // 21 bytes (invalid address)
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251eee'],
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0xf31a6969fc2f2e0b01964045ad21a28ad3ee38d276e1e6cf5b80124e63ba8190",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "foo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)

    expect(
      AbiFunction.fromAbi(
        Abi.from([
          'function foo(string)',
          'function foo(uint)',
          'function foo(address)',
        ]),
        'foo',
        {
          // non-hex (invalid address)
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251z'],
        },
      ),
    ).toMatchInlineSnapshot(`
    {
      "hash": "0xf31a6969fc2f2e0b01964045ad21a28ad3ee38d276e1e6cf5b80124e63ba8190",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "foo",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)

    expect(() =>
      AbiFunction.fromAbi(
        Abi.from([
          'function foo(address)',
          'function foo(uint)',
          'function foo(string)',
        ]),
        'foo',
        {
          args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`string\` in \`foo(string)\`, and
    \`address\` in \`foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiFunction.fromAbi(
        Abi.from(['function foo((address))', 'function foo((bytes20))']),
        'foo',
        {
          args: [['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`foo((bytes20))\`, and
    \`address\` in \`foo((address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)

    expect(() =>
      AbiFunction.fromAbi(
        Abi.from([
          'function foo(string, (address))',
          'function foo(string, (bytes))',
        ]),
        'foo',
        {
          args: ['foo', ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
        },
      ),
    ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes\` in \`foo(string,(bytes))\`, and
    \`address\` in \`foo(string,(address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.]
  `)
  })

  test('behavior: network', { timeout: 60_000 }, async () => {
    const abi = Abi.from(wagmiContractConfig.abi)

    const totalSupplyItem = AbiFunction.fromAbi(abi, 'totalSupply')

    const totalSupply = await anvilMainnet
      .request({
        method: 'eth_call',
        params: [
          {
            data: AbiFunction.encodeData(totalSupplyItem),
            to: wagmiContractConfig.address,
          },
        ],
      })
      .then((data) => AbiFunction.decodeResult(totalSupplyItem, data))

    expect(totalSupply).toEqual(648n)
  })
})

describe('getSelector', () => {
  test('creates function signature', () => {
    expect(
      AbiFunction.getSelector('_compound(uint256,uint256,uint256)'),
    ).toEqual('0xf4fbb312')
    expect(
      AbiFunction.getSelector(
        'function _compound(uint256 a, uint256 b, uint256 c)',
      ),
    ).toEqual('0xf4fbb312')
    expect(
      AbiFunction.getSelector('function ownerOf(uint256 tokenId)'),
    ).toEqual('0x6352211e')
    expect(AbiFunction.getSelector('ownerOf(uint256)')).toEqual('0x6352211e')
    expect(
      AbiFunction.getSelector('processInvestment(address,uint256,bool)'),
    ).toEqual('0xcf4b8f61')
    expect(
      AbiFunction.getSelector('processAccount(uint256 , address )'),
    ).toEqual('0x73933128')
    expect(AbiFunction.getSelector('claimed()')).toEqual('0xe834a834')
    expect(AbiFunction.getSelector('function claimed()')).toEqual('0xe834a834')
  })

  test('creates function signature from `AbiFunction`', () => {
    expect(
      AbiFunction.getSelector({
        name: '_compound',
        type: 'function',
        inputs: [
          { name: 'a', type: 'uint256' },
          { name: 'b', type: 'uint256' },
          { name: 'c', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual('0xf4fbb312')

    expect(
      AbiFunction.getSelector({
        name: '_compound',
        type: 'function',
        inputs: [
          { name: '', type: 'uint256' },
          { name: '', type: 'uint256' },
          { name: '', type: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual('0xf4fbb312')

    expect(
      AbiFunction.getSelector({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('0x6352211e')

    expect(
      AbiFunction.getSelector({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('0x6352211e')

    expect(
      AbiFunction.getSelector({
        name: 'processInvestment',
        type: 'function',
        inputs: [
          { name: '', type: 'address' },
          { name: '', type: 'uint256' },
          { name: '', type: 'bool' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual('0xcf4b8f61')

    expect(
      AbiFunction.getSelector({
        name: 'processAccount',
        type: 'function',
        inputs: [
          { name: '', type: 'uint256' },
          { name: '', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual('0x73933128')

    expect(
      AbiFunction.getSelector({
        name: 'claimed',
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('0xe834a834')

    expect(
      AbiFunction.getSelector({
        inputs: [
          {
            components: [
              {
                name: 'position',
                type: 'uint64',
              },
              {
                name: 'owner',
                type: 'address',
              },
              {
                name: 'color',
                type: 'uint8',
              },
              {
                name: 'life',
                type: 'uint8',
              },
            ],
            name: 'cells',
            type: 'tuple[]',
          },
        ],
        name: 'forceSimpleCells',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      }),
    ).toEqual('0xd703f50a')
  })
})

test('exports', () => {
  expect(Object.keys(AbiFunction)).toMatchInlineSnapshot(`
    [
      "decodeData",
      "decodeResult",
      "encodeData",
      "encodeResult",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})
