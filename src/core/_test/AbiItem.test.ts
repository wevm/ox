import {
  Abi,
  AbiEvent,
  AbiFunction,
  AbiItem,
  AbiParameters,
  Bytes,
  type Hex,
} from 'ox'
import { describe, expect, test } from 'vitest'
import { seaportAbi } from '../../../test/abis/json.js'
import {
  seaportContractConfig,
  wagmiContractConfig,
} from '../../../test/constants/abis.js'
import {
  getAmbiguousTypes,
  isArgOfType,
  normalizeSignature,
} from '../internal/abiItem.js'

describe('format', () => {
  test('default', () => {
    const result = AbiItem.format(seaportAbi[1])
    expect(result).toMatchInlineSnapshot(
      '"function cancel((address offerer, address zone, (uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount)[] offer, (uint8 itemType, address token, uint256 identifierOrCriteria, uint256 startAmount, uint256 endAmount, address recipient)[] consideration, uint8 orderType, uint256 startTime, uint256 endTime, bytes32 zoneHash, uint256 salt, bytes32 conduitKey, uint256 counter)[] orders) returns (bool cancelled)"',
    )
  })

  test.each([
    {
      abiItem: {
        type: 'function',
        name: 'foo',
        inputs: [{ type: 'string' }],
        outputs: [],
        stateMutability: 'nonpayable',
      } as const,
      expected: 'function foo(string)',
    },
    {
      abiItem: {
        type: 'event',
        name: 'Foo',
        inputs: [
          { type: 'address', name: 'from', indexed: true },
          { type: 'address', name: 'to', indexed: true },
          { type: 'uint256', name: 'amount' },
        ],
      } as const,
      expected:
        'event Foo(address indexed from, address indexed to, uint256 amount)',
    },
    {
      abiItem: {
        type: 'constructor',
        stateMutability: 'nonpayable',
        inputs: [{ type: 'string' }],
      } as const,
      expected: 'constructor(string)',
    },
    {
      abiItem: {
        type: 'constructor',
        stateMutability: 'payable',
        inputs: [{ type: 'string' }],
      } as const,
      expected: 'constructor(string) payable',
    },
    {
      abiItem: {
        type: 'fallback',
        stateMutability: 'nonpayable',
      } as const,
      expected: 'fallback() external',
    },
    {
      abiItem: {
        type: 'fallback',
        stateMutability: 'payable',
      } as const,
      expected: 'fallback() external payable',
    },
    {
      abiItem: {
        type: 'receive',
        stateMutability: 'payable',
      } as const,
      expected: 'receive() external payable',
    },
    {
      abiItem: {
        type: 'function',
        name: 'initWormhole',
        inputs: [
          {
            type: 'tuple[]',
            name: 'configs',
            components: [
              {
                type: 'uint256',
                name: 'chainId',
              },
              {
                type: 'uint16',
                name: 'wormholeChainId',
              },
            ],
          },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      } as const,
      expected:
        'function initWormhole((uint256 chainId, uint16 wormholeChainId)[] configs)',
    },
  ])('AbiItem.format($expected)', ({ abiItem, expected }) => {
    expect(AbiItem.format(abiItem)).toEqual(expected)
  })
})

describe('from', () => {
  test('default', () => {
    {
      const abiItem = AbiItem.from({
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
      const abiItem = AbiItem.from(
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
      const abiItem = AbiItem.from([
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
    const abiItem = AbiItem.from(
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
      AbiItem.fromAbi(wagmiContractConfig.abi, 'balanceOf'),
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
      AbiItem.fromAbi(wagmiContractConfig.abi, 'balanceOf', {
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

  describe('behavior: data', () => {
    test('function', () => {
      const item = AbiItem.fromAbi(wagmiContractConfig.abi, 'approve')
      const data = AbiFunction.encodeData(item, [
        '0x0000000000000000000000000000000000000000',
        1n,
      ])
      expect(
        AbiItem.fromAbi(wagmiContractConfig.abi, data),
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

    test('event', () => {
      const hash = AbiItem.getSignatureHash(
        AbiItem.fromAbi(seaportContractConfig.abi, 'CounterIncremented'),
      )
      expect(
        AbiItem.fromAbi(seaportContractConfig.abi, hash),
      ).toMatchInlineSnapshot(`
        {
          "anonymous": false,
          "hash": "0x721c20121297512b72821b97f5326877ea8ecf4bb9948fea5bfcb6453074d37f",
          "inputs": [
            {
              "indexed": false,
              "name": "newCounter",
              "type": "uint256",
            },
            {
              "indexed": true,
              "name": "offerer",
              "type": "address",
            },
          ],
          "name": "CounterIncremented",
          "type": "event",
        }
      `)
    })

    test('error', () => {
      const selector = AbiItem.getSelector(
        AbiItem.fromAbi(seaportContractConfig.abi, 'BadSignatureV'),
      )
      expect(
        AbiItem.fromAbi(seaportContractConfig.abi, selector),
      ).toMatchInlineSnapshot(`
        {
          "hash": "0x1f003d0ab3c21a082e88d5c936eb366321476aa1508b9238066e9f135aa38772",
          "inputs": [
            {
              "name": "v",
              "type": "uint8",
            },
          ],
          "name": "BadSignatureV",
          "type": "error",
        }
      `)
    })
  })

  test('no matching name', () => {
    expect(() =>
      AbiItem.fromAbi([] as readonly unknown[], 'balanceOf', {
        args: ['0x0000000000000000000000000000000000000000'],
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[AbiItem.NotFoundError: ABI item with name "balanceOf" not found.]`,
    )
  })

  test('no matching data', () => {
    expect(() =>
      AbiItem.fromAbi([], '0xdeadbeef'),
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
    const item = AbiItem.fromAbi(abi, 'foo')
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
    const item = AbiItem.fromAbi(abi, 'foo')
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
    const item = AbiItem.fromAbi(abi, 'foo')
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
      AbiItem.fromAbi(abi, 'safeTransferFrom', {
        args: shortArgs,
      }),
    ).toMatchInlineSnapshot(shortSnapshot)
    expect(
      AbiItem.fromAbi(abi.reverse(), 'safeTransferFrom', {
        args: shortArgs,
      }),
    ).toMatchInlineSnapshot(shortSnapshot)

    expect(
      AbiItem.fromAbi(abi, 'safeTransferFrom', {
        args: longArgs,
      }),
    ).toMatchInlineSnapshot(longSnapshot)
    expect(
      AbiItem.fromAbi(abi.reverse(), 'safeTransferFrom', {
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
    const item = AbiItem.fromAbi(abi, 'mint')
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

    const item_2 = AbiItem.fromAbi(abi, 'mint', {
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

    const item_3 = AbiItem.fromAbi(abi, 'mint', {
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
    const item = AbiItem.fromAbi(abi, 'foo', {
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
      AbiItem.fromAbi(
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
      AbiItem.fromAbi(
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
      AbiItem.fromAbi(
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
      AbiItem.fromAbi(
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
      AbiItem.fromAbi(
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
      AbiItem.fromAbi(
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
      AbiItem.fromAbi(
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

  describe('getAmbiguousTypes', () => {
    test('string/address', () => {
      expect(
        getAmbiguousTypes(
          AbiParameters.from('string'),
          AbiParameters.from('address'),
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f2522'],
        ),
      ).toMatchInlineSnapshot(`
        [
          "string",
          "address",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('string'),
          AbiParameters.from('address'),
          // 21 bytes (invalid address)
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f252223'],
        ),
      ).toBeUndefined()

      expect(
        getAmbiguousTypes(
          AbiParameters.from('(string)'),
          AbiParameters.from('(address)'),
          [['0xA0Cf798816D4b9b9866b5330EEa46a18382f2522']],
        ),
      ).toMatchInlineSnapshot(`
        [
          "string",
          "address",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('(address)'),
          AbiParameters.from('(string)'),
          [['0xA0Cf798816D4b9b9866b5330EEa46a18382f2522']],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "string",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('uint, (string, (string))'),
          AbiParameters.from('uint, (string, (address))'),
          [69420n, ['lol', ['0xA0Cf798816D4b9b9866b5330EEa46a18382f2522']]],
        ),
      ).toMatchInlineSnapshot(`
        [
          "string",
          "address",
        ]
      `)
    })

    test('bytes/address', () => {
      expect(
        getAmbiguousTypes(
          AbiParameters.from('address'),
          AbiParameters.from('bytes20'),
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "bytes20",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('bytes20'),
          AbiParameters.from('address'),
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        ),
      ).toMatchInlineSnapshot(`
        [
          "bytes20",
          "address",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('address'),
          AbiParameters.from('bytes'),
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "bytes",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('bytes'),
          AbiParameters.from('address'),
          // 21 bytes (invalid address)
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251eee'],
        ),
      ).toBeUndefined()

      expect(
        getAmbiguousTypes(
          AbiParameters.from('bytes'),
          AbiParameters.from('address'),
          ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
        ),
      ).toMatchInlineSnapshot(`
        [
          "bytes",
          "address",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('(address)'),
          AbiParameters.from('(bytes20)'),
          [['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "bytes20",
        ]
      `)

      expect(
        getAmbiguousTypes(
          AbiParameters.from('uint256, (address)'),
          AbiParameters.from('uint128, (bytes20)'),
          [69420n, ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "bytes20",
        ]
      `)
      expect(
        getAmbiguousTypes(
          AbiParameters.from('uint256, (string, (address))'),
          AbiParameters.from('uint128, (string, (bytes20))'),
          [69420n, ['foo', ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']]],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "bytes20",
        ]
      `)
      expect(
        getAmbiguousTypes(
          AbiParameters.from('uint256, (string, (address, bytes))'),
          AbiParameters.from('uint128, (string, (bytes20, address))'),
          [
            123n,
            [
              'foo',
              [
                '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
                '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
              ],
            ],
          ],
        ),
      ).toMatchInlineSnapshot(`
        [
          "address",
          "bytes20",
        ]
      `)
    })
  })

  describe.each([
    // array
    { arg: ['foo'], abiParameter: { type: 'string[]' }, expected: true },
    { arg: ['foo'], abiParameter: { type: 'string[1]' }, expected: true },
    { arg: [['foo']], abiParameter: { type: 'string[][]' }, expected: true },
    { arg: [['foo']], abiParameter: { type: 'string[][1]' }, expected: true },
    {
      arg: [1n],
      abiParameter: { type: 'uint256[]' },
      expected: true,
    },
    {
      arg: [{ foo: 1n, bar: [{ baz: 1n }] }],
      abiParameter: {
        type: 'tuple[]',
        components: [
          { name: 'foo', type: 'uint256' },
          {
            name: 'bar',
            type: 'tuple[]',
            components: [{ name: 'baz', type: 'uint256' }],
          },
        ],
      },
      expected: true,
    },
    { arg: ['foo'], abiParameter: { type: 'string[test]' }, expected: false },
    { arg: [1], abiParameter: { type: 'uint69[]' }, expected: false },
    // address
    {
      arg: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
      abiParameter: { type: 'address' },
      expected: true,
    },
    {
      arg: 'A0Cf798816D4b9b9866b5330EEa46a18382f251e',
      abiParameter: { type: 'address' },
      expected: false,
    },
    { arg: 'test', abiParameter: { type: 'address' }, expected: false },
    // bool
    { arg: true, abiParameter: { type: 'bool' }, expected: true },
    { arg: false, abiParameter: { type: 'bool' }, expected: true },
    { arg: 'true', abiParameter: { type: 'bool' }, expected: false },
    // bytes
    { arg: 'foo', abiParameter: { type: 'bytes' }, expected: true },
    { arg: 'foo', abiParameter: { type: 'bytes32' }, expected: true },
    {
      arg: Bytes.fromString('foo'),
      abiParameter: { type: 'bytes' },
      expected: true,
    },
    { arg: 1, abiParameter: { type: 'bytes32' }, expected: false },
    // function
    { arg: 'foo', abiParameter: { type: 'function' }, expected: true },
    { arg: 1, abiParameter: { type: 'function' }, expected: false },
    // int
    { arg: 1, abiParameter: { type: 'int' }, expected: true },
    { arg: 1n, abiParameter: { type: 'int' }, expected: true },
    { arg: 1n, abiParameter: { type: 'int' }, expected: true },
    { arg: 1, abiParameter: { type: 'uint' }, expected: true },
    { arg: 1n, abiParameter: { type: 'uint' }, expected: true },
    { arg: 1n, abiParameter: { type: 'uint' }, expected: true },
    { arg: 1, abiParameter: { type: 'int256' }, expected: true },
    { arg: 1, abiParameter: { type: 'uint256' }, expected: true },
    { arg: 1, abiParameter: { type: 'int69' }, expected: false },
    { arg: 1, abiParameter: { type: 'uint69' }, expected: false },
    // string
    { arg: 'foo', abiParameter: { type: 'string' }, expected: true },
    { arg: 1, abiParameter: { type: 'string' }, expected: false },
    // tuple
    {
      arg: { bar: 1, baz: 'test' },
      abiParameter: {
        name: 'foo',
        type: 'tuple',
        components: [
          { name: 'bar', type: 'uint256' },
          { name: 'baz', type: 'string' },
        ],
      },
      expected: true,
    },
    {
      arg: [1, 'test'],
      abiParameter: {
        name: 'foo',
        type: 'tuple',
        components: [
          { name: 'bar', type: 'uint256' },
          { name: 'baz', type: 'string' },
        ],
      },
      expected: true,
    },
    {
      arg: { bar: ['test'] },
      abiParameter: {
        name: 'foo',
        type: 'tuple',
        components: [
          {
            name: 'bar',
            type: 'tuple',
            components: [{ name: 'baz', type: 'string' }],
          },
        ],
      },
      expected: true,
    },
    {
      arg: {},
      abiParameter: {
        name: 'foo',
        type: 'tuple',
        components: [
          { name: 'bar', type: 'uint256' },
          { name: 'baz', type: 'uint256' },
        ],
      },
      expected: false,
    },
  ] as {
    arg: unknown
    abiParameter: AbiParameters.Parameter
    expected: boolean
  }[])(
    'isArgOfType($arg, $abiParameter)',
    ({ arg, abiParameter, expected }) => {
      test(`isArgOfType: returns ${expected}`, () => {
        expect(isArgOfType(arg, abiParameter)).toEqual(expected)
      })
    },
  )
})

describe('getSelector', () => {
  test('creates function signature', () => {
    expect(AbiItem.getSelector('_compound(uint256,uint256,uint256)')).toEqual(
      '0xf4fbb312',
    )
    expect(
      AbiItem.getSelector(
        'function _compound(uint256 a, uint256 b, uint256 c)',
      ),
    ).toEqual('0xf4fbb312')
    expect(AbiItem.getSelector('function ownerOf(uint256 tokenId)')).toEqual(
      '0x6352211e',
    )
    expect(AbiItem.getSelector('ownerOf(uint256)')).toEqual('0x6352211e')
    expect(
      AbiItem.getSelector('processInvestment(address,uint256,bool)'),
    ).toEqual('0xcf4b8f61')
    expect(AbiItem.getSelector('processAccount(uint256 , address )')).toEqual(
      '0x73933128',
    )
    expect(AbiItem.getSelector('claimed()')).toEqual('0xe834a834')
    expect(AbiItem.getSelector('function claimed()')).toEqual('0xe834a834')
  })

  test('creates function signature from `AbiFunction`', () => {
    expect(
      AbiItem.getSelector({
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
      AbiItem.getSelector({
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
      AbiItem.getSelector({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('0x6352211e')

    expect(
      AbiItem.getSelector({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('0x6352211e')

    expect(
      AbiItem.getSelector({
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
      AbiItem.getSelector({
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
      AbiItem.getSelector({
        name: 'claimed',
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('0xe834a834')

    expect(
      AbiItem.getSelector({
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

describe('getSignature', () => {
  test('creates function signature', () => {
    expect(AbiItem.getSignature('_compound(uint256,uint256,uint256)')).toEqual(
      '_compound(uint256,uint256,uint256)',
    )
    expect(
      AbiItem.getSignature(
        'function _compound(uint256 a, uint256 b, uint256 c)',
      ),
    ).toEqual('_compound(uint256,uint256,uint256)')
    expect(AbiItem.getSignature('function ownerOf(uint256 tokenId)')).toEqual(
      'ownerOf(uint256)',
    )
    expect(AbiItem.getSignature('ownerOf(uint256)')).toEqual('ownerOf(uint256)')
    expect(
      AbiItem.getSignature('processInvestment(address,uint256,bool)'),
    ).toEqual('processInvestment(address,uint256,bool)')
    expect(AbiItem.getSignature('processAccount(uint256 , address)')).toEqual(
      'processAccount(uint256,address)',
    )
    expect(AbiItem.getSignature('claimed()')).toEqual('claimed()')
    expect(AbiItem.getSignature('function claimed()')).toEqual('claimed()')
  })

  test('creates function signature from `AbiFunction`', () => {
    expect(
      AbiItem.getSignature({
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
    ).toEqual('_compound(uint256,uint256,uint256)')

    expect(
      AbiItem.getSignature({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('ownerOf(uint256)')

    expect(
      AbiItem.getSignature({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: '', type: 'uint256' }],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('ownerOf(uint256)')

    expect(
      AbiItem.getSignature({
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
    ).toEqual('processInvestment(address,uint256,bool)')

    expect(
      AbiItem.getSignature({
        name: 'processAccount',
        type: 'function',
        inputs: [
          { name: '', type: 'uint256' },
          { name: '', type: 'address' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual('processAccount(uint256,address)')

    expect(
      AbiItem.getSignature({
        name: 'claimed',
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'view',
      }),
    ).toEqual('claimed()')

    expect(
      AbiItem.getSignature({
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
    ).toEqual('forceSimpleCells((uint64,address,uint8,uint8)[])')

    expect(
      AbiItem.getSignature({
        inputs: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
          { name: 'editionSize', type: 'uint64' },
          { name: 'royaltyBPS', type: 'uint16' },
          {
            name: 'fundsRecipient',
            type: 'address',
          },
          { name: 'defaultAdmin', type: 'address' },
          {
            components: [
              {
                name: 'publicSalePrice',
                type: 'uint104',
              },
              {
                name: 'maxSalePurchasePerAddress',
                type: 'uint32',
              },
              { name: 'publicSaleStart', type: 'uint64' },
              { name: 'publicSaleEnd', type: 'uint64' },
              { name: 'presaleStart', type: 'uint64' },
              { name: 'presaleEnd', type: 'uint64' },
              {
                name: 'presaleMerkleRoot',
                type: 'bytes32',
              },
            ],

            name: 'saleConfig',
            type: 'tuple',
          },
          { name: 'description', type: 'string' },
          { name: 'animationURI', type: 'string' },
          { name: 'imageURI', type: 'string' },
        ],
        name: 'createEdition',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function',
      }),
    ).toEqual(
      'createEdition(string,string,uint64,uint16,address,address,(uint104,uint32,uint64,uint64,uint64,uint64,bytes32),string,string,string)',
    )

    expect(
      AbiItem.getSignature({
        inputs: [
          {
            name: 't',
            type: 'address',
          },
          {
            name: 'ah',
            type: 'address',
          },
          {
            name: '_owner',
            type: 'address',
          },
          {
            components: [
              {
                name: 'maxBid',
                type: 'uint256',
              },
              {
                name: 'minBid',
                type: 'uint256',
              },
              {
                name: 'bidWindow',
                type: 'uint256',
              },
              {
                name: 'tip',
                type: 'uint256',
              },
              {
                name: 'receiver',
                type: 'address',
              },
            ],

            name: 'cfg',
            type: 'tuple',
          },
        ],
        name: 'clone',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'payable',
        type: 'function',
      }),
    ).toEqual(
      'clone(address,address,address,(uint256,uint256,uint256,uint256,address))',
    )

    expect(
      AbiItem.getSignature({
        inputs: [
          { name: 'payer', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'tokenAmount', type: 'uint256' },
          { name: 'tokenAddress', type: 'address' },
          { name: 'startTime', type: 'uint256' },
          { name: 'stopTime', type: 'uint256' },
          { name: 'nonce', type: 'uint8' },
        ],
        name: 'createStream',
        outputs: [{ name: 'stream', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function',
      }),
    ).toEqual(
      'createStream(address,address,uint256,address,uint256,uint256,uint8)',
    )
  })

  test('creates event signature', () => {
    expect(
      AbiItem.getSignature('Transfer(address,address,uint256)'),
    ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')
    expect(
      AbiItem.getSignature(
        'Transfer(address indexed from, address indexed to, uint256 amount)',
      ),
    ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')
    expect(
      AbiItem.getSignature(
        'event Transfer(address indexed from, address indexed to, uint256 amount)',
      ),
    ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')
    expect(AbiItem.getSignature('drawNumber()')).toMatchInlineSnapshot(
      '"drawNumber()"',
    )
    expect(AbiItem.getSignature('drawNumber( )')).toMatchInlineSnapshot(
      '"drawNumber()"',
    )
    expect(
      AbiItem.getSignature(
        'ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)',
      ),
    ).toMatchInlineSnapshot(
      '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
    )
    expect(
      AbiItem.getSignature(
        'ProcessedAccountDividendTracker(uint256 indexed foo, uint256 indexed bar, uint256 baz, uint256 a, bool b, uint256 c, address d)',
      ),
    ).toMatchInlineSnapshot(
      '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
    )
    expect(
      AbiItem.getSignature('BlackListMultipleAddresses(address[], bool)'),
    ).toMatchInlineSnapshot('"BlackListMultipleAddresses(address[],bool)"')
    expect(AbiItem.getSignature('checkBatch(bytes)')).toMatchInlineSnapshot(
      '"checkBatch(bytes)"',
    )
    expect(
      AbiItem.getSignature(
        'Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      ),
    ).toMatchInlineSnapshot('"Approval(address,address,uint256)"')
    expect(
      AbiItem.getSignature(
        'ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
      ),
    ).toMatchInlineSnapshot('"ApprovalForAll(address,address,bool)"')
  })

  test('creates event signature for `AbiEvent`', () => {
    expect(
      AbiItem.getSignature({
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'address', type: 'address', indexed: true },
          { name: 'address', type: 'address', indexed: true },
          { name: 'uint256', type: 'uint256', indexed: false },
        ],
      }),
    ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')

    expect(
      AbiItem.getSignature({
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
        ],
      }),
    ).toMatchInlineSnapshot('"Transfer(address,address,uint256)"')

    expect(
      AbiItem.getSignature({
        name: 'drawNumber',
        type: 'event',
        inputs: [],
      }),
    ).toMatchInlineSnapshot('"drawNumber()"')

    expect(
      AbiItem.getSignature({
        name: 'drawNumber',
        type: 'event',
        inputs: [],
      }),
    ).toMatchInlineSnapshot('"drawNumber()"')

    expect(
      AbiItem.getSignature({
        name: 'ProcessedAccountDividendTracker',
        type: 'event',
        inputs: [
          { name: 'uint256', type: 'uint256', indexed: false },
          { name: 'uint256', type: 'uint256', indexed: false },
          { name: 'uint256', type: 'uint256', indexed: false },
          { name: 'uint256', type: 'uint256', indexed: false },
          { name: 'bool', type: 'bool', indexed: false },
          { name: 'uint256', type: 'uint256', indexed: false },
          { name: 'address', type: 'address', indexed: false },
        ],
      }),
    ).toMatchInlineSnapshot(
      '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
    )

    expect(
      AbiItem.getSignature({
        name: 'ProcessedAccountDividendTracker',
        type: 'event',
        inputs: [
          { name: 'foo', type: 'uint256', indexed: true },
          { name: 'bar', type: 'uint256', indexed: true },
          { name: 'baz', type: 'uint256', indexed: false },
          { name: 'a', type: 'uint256', indexed: false },
          { name: 'b', type: 'bool', indexed: false },
          { name: 'c', type: 'uint256', indexed: false },
          { name: 'd', type: 'address', indexed: false },
        ],
      }),
    ).toMatchInlineSnapshot(
      '"ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)"',
    )

    expect(
      AbiItem.getSignature({
        name: 'BlackListMultipleAddresses',
        type: 'event',
        inputs: [
          { name: 'addresses', type: 'address[]', indexed: false },
          { name: 'isBlackListed', type: 'bool', indexed: false },
        ],
      }),
    ).toMatchInlineSnapshot('"BlackListMultipleAddresses(address[],bool)"')

    expect(
      AbiItem.getSignature({
        name: 'checkBatch',
        type: 'event',
        inputs: [{ name: '', type: 'bytes', indexed: false }],
      }),
    ).toMatchInlineSnapshot('"checkBatch(bytes)"')

    expect(
      AbiItem.getSignature({
        name: 'Approval',
        type: 'event',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'approved', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true },
        ],
      }),
    ).toMatchInlineSnapshot('"Approval(address,address,uint256)"')

    expect(
      AbiItem.getSignature({
        name: 'ApprovalForAll',
        type: 'event',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'operator', type: 'address', indexed: true },
          { name: 'approved', type: 'bool', indexed: false },
        ],
      }),
    ).toMatchInlineSnapshot('"ApprovalForAll(address,address,bool)"')

    expect(
      AbiItem.getSignature({
        anonymous: false,
        inputs: [
          {
            indexed: false,

            name: 'smolRecipeId',
            type: 'uint256',
          },
          {
            components: [
              {
                components: [
                  {
                    name: 'background',
                    type: 'uint24',
                  },
                  { name: 'body', type: 'uint24' },
                  { name: 'clothes', type: 'uint24' },
                  { name: 'mouth', type: 'uint24' },
                  { name: 'glasses', type: 'uint24' },
                  { name: 'hat', type: 'uint24' },
                  { name: 'hair', type: 'uint24' },
                  { name: 'skin', type: 'uint24' },
                  { name: 'gender', type: 'uint8' },
                  { name: 'headSize', type: 'uint8' },
                ],

                name: 'smol',
                type: 'tuple',
              },
              { name: 'exists', type: 'bool' },
              {
                name: 'smolInputAmount',
                type: 'uint8',
              },
            ],
            indexed: false,

            name: 'smolData',
            type: 'tuple',
          },
        ],
        name: 'SmolRecipeAdded',
        type: 'event',
      }),
    ).toMatchInlineSnapshot(
      '"SmolRecipeAdded(uint256,((uint24,uint24,uint24,uint24,uint24,uint24,uint24,uint24,uint8,uint8),bool,uint8))"',
    )
  })

  describe('normalizeSignature', () => {
    test('foo()', () => {
      expect(normalizeSignature('foo()')).toBe('foo()')
    })

    test('bar(uint foo)', () => {
      expect(normalizeSignature('bar(uint foo)')).toBe('bar(uint)')
    })

    test('processAccount(uint256 , address )', () => {
      expect(normalizeSignature('processAccount(uint256 , address )')).toBe(
        'processAccount(uint256,address)',
      )
    })

    test('function bar()', () => {
      expect(normalizeSignature('function bar()')).toBe('bar()')
    })

    test('function bar()', () => {
      expect(normalizeSignature('function  bar( )')).toBe('bar()')
    })

    test('event Bar()', () => {
      expect(normalizeSignature('event Bar()')).toBe('Bar()')
    })

    test('function bar(uint foo)', () => {
      expect(normalizeSignature('function bar(uint foo)')).toBe('bar(uint)')
    })

    test('function bar(uint foo, address baz)', () => {
      expect(normalizeSignature('function bar(uint foo, address baz)')).toBe(
        'bar(uint,address)',
      )
    })

    test('event Barry(uint foo)', () => {
      expect(normalizeSignature('event Barry(uint foo)')).toBe('Barry(uint)')
    })

    test('Barry(uint indexed foo)', () => {
      expect(normalizeSignature('Barry(uint indexed foo)')).toBe('Barry(uint)')
    })

    test('event Barry(uint indexed foo)', () => {
      expect(normalizeSignature('event Barry(uint indexed foo)')).toBe(
        'Barry(uint)',
      )
    })

    test('function _compound(uint256 a, uint256 b, uint256 c)', () => {
      expect(
        normalizeSignature(
          'function _compound(uint256 a, uint256 b, uint256 c)',
        ),
      ).toBe('_compound(uint256,uint256,uint256)')
    })

    test('bar(uint foo, (uint baz))', () => {
      expect(normalizeSignature('bar(uint foo, (uint baz))')).toBe(
        'bar(uint,(uint))',
      )
    })

    test('bar(uint foo, (uint baz, bool x))', () => {
      expect(normalizeSignature('bar(uint foo, (uint baz, bool x))')).toBe(
        'bar(uint,(uint,bool))',
      )
    })

    test('bar(uint foo, (uint baz, bool x) foo)', () => {
      expect(normalizeSignature('bar(uint foo, (uint baz, bool x) foo)')).toBe(
        'bar(uint,(uint,bool))',
      )
    })

    test('bar(uint[] foo, (uint baz, bool x))', () => {
      expect(normalizeSignature('bar(uint[] foo, (uint baz, bool x))')).toBe(
        'bar(uint[],(uint,bool))',
      )
    })

    test('bar(uint[] foo, (uint baz, bool x)[])', () => {
      expect(normalizeSignature('bar(uint[] foo, (uint baz, bool x)[])')).toBe(
        'bar(uint[],(uint,bool)[])',
      )
    })

    test('foo(uint bar)', () => {
      expect(normalizeSignature('foo(uint bar) payable returns (uint)')).toBe(
        'foo(uint)',
      )
    })

    test('function submitBlocksWithCallbacks(bool isDataCompressed, bytes calldata data, ((uint16,(uint16,uint16,uint16,bytes)[])[], address[])  calldata config)', () => {
      expect(
        normalizeSignature(
          'function submitBlocksWithCallbacks(bool isDataCompressed, bytes calldata data, ((uint16,(uint16,uint16,uint16,bytes)[])[], address[])  calldata config)',
        ),
      ).toBe(
        'submitBlocksWithCallbacks(bool,bytes,((uint16,(uint16,uint16,uint16,bytes)[])[],address[]))',
      )
    })

    test('function createEdition(string name, string symbol, uint64 editionSize, uint16 royaltyBPS, address fundsRecipient, address defaultAdmin, (uint104 publicSalePrice, uint32 maxSalePurchasePerAddress, uint64 publicSaleStart, uint64 publicSaleEnd, uint64 presaleStart, uint64 presaleEnd, bytes32 presaleMerkleRoot) saleConfig, string description, string animationURI, string imageURI) returns (address)', () => {
      expect(
        normalizeSignature(
          'function createEdition(string name, string symbol, uint64 editionSize, uint16 royaltyBPS, address fundsRecipient, address defaultAdmin, (uint104 publicSalePrice, uint32 maxSalePurchasePerAddress, uint64 publicSaleStart, uint64 publicSaleEnd, uint64 presaleStart, uint64 presaleEnd, bytes32 presaleMerkleRoot) saleConfig, string description, string animationURI, string imageURI) returns (address)',
        ),
      ).toBe(
        'createEdition(string,string,uint64,uint16,address,address,(uint104,uint32,uint64,uint64,uint64,uint64,bytes32),string,string,string)',
      )
    })

    test('trim spaces', () => {
      expect(
        normalizeSignature(
          'function  createEdition(string  name,string symbol,   uint64 editionSize  , uint16   royaltyBPS,     address     fundsRecipient,   address    defaultAdmin, ( uint104   publicSalePrice  ,   uint32 maxSalePurchasePerAddress, uint64 publicSaleStart,   uint64 publicSaleEnd, uint64 presaleStart, uint64 presaleEnd, bytes32 presaleMerkleRoot) saleConfig , string description, string animationURI, string imageURI ) returns (address)',
        ),
      ).toBe(
        'createEdition(string,string,uint64,uint16,address,address,(uint104,uint32,uint64,uint64,uint64,uint64,bytes32),string,string,string)',
      )
    })

    test('error: invalid signatures', () => {
      expect(() =>
        normalizeSignature('bar'),
      ).toThrowErrorMatchingInlineSnapshot(
        '[BaseError: Unable to normalize signature.]',
      )

      expect(() =>
        normalizeSignature('bar(uint foo'),
      ).toThrowErrorMatchingInlineSnapshot(
        '[BaseError: Unable to normalize signature.]',
      )

      expect(() =>
        normalizeSignature('baruint foo)'),
      ).toThrowErrorMatchingInlineSnapshot(
        '[BaseError: Unable to normalize signature.]',
      )

      expect(() =>
        normalizeSignature('bar(uint foo, (uint baz)'),
      ).toThrowErrorMatchingInlineSnapshot(
        '[BaseError: Unable to normalize signature.]',
      )
    })
  })
})

describe('getSignatureHash', () => {
  test('hashes functions', () => {
    expect(AbiItem.getSignatureHash('function ownerOf(uint256)')).toEqual(
      '0x6352211e6566aa027e75ac9dbf2423197fbd9b82b9d981a3ab367d355866aa1c',
    )
    expect(
      AbiItem.getSignatureHash('Transfer(address,address,uint256)'),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )
    expect(
      AbiItem.getSignatureHash(
        'Transfer(address indexed from, address indexed to, uint256 amount)',
      ),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )
    expect(
      AbiItem.getSignatureHash(
        'event Transfer(address indexed from, address indexed to, uint256 amount)',
      ),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )
    expect(AbiItem.getSignatureHash('drawNumber()')).toEqual(
      '0xd80ffb20d597d029eb14b9def3d14da7e6d862943d830906185b1b0b576d8f26',
    )
    expect(AbiItem.getSignatureHash('drawNumber( )')).toEqual(
      '0xd80ffb20d597d029eb14b9def3d14da7e6d862943d830906185b1b0b576d8f26',
    )
    expect(
      AbiItem.getSignatureHash(
        'ProcessedAccountDividendTracker(uint256,uint256,uint256,uint256,bool,uint256,address)',
      ),
    ).toEqual(
      '0x4a73985b7c9415b88fbbfbb5e2fb377c08586d96f5c42646ecef7e3717587f6a',
    )
    expect(
      AbiItem.getSignatureHash(
        'ProcessedAccountDividendTracker(uint256 indexed foo, uint256 indexed bar, uint256 baz, uint256 a, bool b, uint256 c, address d)',
      ),
    ).toEqual(
      '0x4a73985b7c9415b88fbbfbb5e2fb377c08586d96f5c42646ecef7e3717587f6a',
    )
    expect(
      AbiItem.getSignatureHash('BlackListMultipleAddresses(address[], bool)'),
    ).toEqual(
      '0x170cd84eddb1952bf41adcce9be0e44b66ff38f07cddda1cf64d32708742bd2d',
    )
    expect(AbiItem.getSignatureHash('checkBatch(bytes)')).toEqual(
      '0x9b6f373667d9cf576e3a17e6aa047c5d864fcb7f41836b11613215db446698d8',
    )
    expect(
      AbiItem.getSignatureHash(
        'Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      ),
    ).toBe('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925')
    expect(
      AbiItem.getSignatureHash(
        'ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
      ),
    ).toBe('0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31')
    expect(AbiItem.getSignatureHash('function balanceOf(address owner)')).toBe(
      '0x70a08231b98ef4ca268c9cc3f6b4590e4bfec28280db06bb5d45e689f2a360be',
    )
    expect(AbiItem.getSignatureHash('function ownerOf(uint256 tokenId)')).toBe(
      '0x6352211e6566aa027e75ac9dbf2423197fbd9b82b9d981a3ab367d355866aa1c',
    )
  })

  test('hashes `AbiFunction`', () => {
    expect(
      AbiItem.getSignatureHash({
        name: 'drawNumber',
        type: 'function',
        inputs: [],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual(
      '0xd80ffb20d597d029eb14b9def3d14da7e6d862943d830906185b1b0b576d8f26',
    )

    expect(
      AbiItem.getSignatureHash({
        name: 'BlackListMultipleAddresses',
        type: 'function',
        inputs: [
          { name: 'address[]', type: 'address[]' },
          { name: 'bool', type: 'bool' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual(
      '0x170cd84eddb1952bf41adcce9be0e44b66ff38f07cddda1cf64d32708742bd2d',
    )

    expect(
      AbiItem.getSignatureHash({
        name: 'checkBatch',
        type: 'function',
        inputs: [{ name: 'bytes', type: 'bytes' }],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toEqual(
      '0x9b6f373667d9cf576e3a17e6aa047c5d864fcb7f41836b11613215db446698d8',
    )

    expect(
      AbiItem.getSignatureHash({
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toBe('0x70a08231b98ef4ca268c9cc3f6b4590e4bfec28280db06bb5d45e689f2a360be')

    expect(
      AbiItem.getSignatureHash({
        name: 'ownerOf',
        type: 'function',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
      }),
    ).toBe('0x6352211e6566aa027e75ac9dbf2423197fbd9b82b9d981a3ab367d355866aa1c')
  })

  test('hashes `AbiEvent`', () => {
    expect(
      AbiItem.getSignatureHash({
        name: 'Transfer',
        type: 'event',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'amount', type: 'uint256', indexed: false },
        ],
      }),
    ).toEqual(
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    )

    expect(
      AbiItem.getSignatureHash({
        name: 'ProcessedAccountDividendTracker',
        type: 'event',
        inputs: [
          { name: 'lastProcessedIndex', type: 'uint256', indexed: false },
          { name: 'iterationsUntilProcessed', type: 'uint256', indexed: false },
          { name: 'withdrawableDividends', type: 'uint256', indexed: false },
          { name: 'totalDividends', type: 'uint256', indexed: false },
          { name: 'process', type: 'bool', indexed: false },
          { name: 'gas', type: 'uint256', indexed: false },
          { name: 'rewardsToken', type: 'address', indexed: false },
        ],
      }),
    ).toEqual(
      '0x4a73985b7c9415b88fbbfbb5e2fb377c08586d96f5c42646ecef7e3717587f6a',
    )

    expect(
      AbiItem.getSignatureHash({
        name: 'Approval',
        type: 'event',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'approved', type: 'address', indexed: true },
          { name: 'tokenId', type: 'uint256', indexed: true },
        ],
      }),
    ).toBe('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925')

    expect(
      AbiItem.getSignatureHash({
        name: 'ApprovalForAll',
        type: 'event',
        inputs: [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'operator', type: 'address', indexed: true },
          { name: 'approved', type: 'bool', indexed: false },
        ],
      }),
    ).toBe('0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31')

    expect(
      AbiItem.getSignatureHash({
        name: 'BlackListMultipleAddresses',
        type: 'event',
        inputs: [
          { name: 'addresses', type: 'address[]', indexed: false },
          { name: 'isBlackListed', type: 'bool', indexed: false },
        ],
      }),
    ).toEqual(
      '0x170cd84eddb1952bf41adcce9be0e44b66ff38f07cddda1cf64d32708742bd2d',
    )
  })

  test('behavior: abi item contains hash', () => {
    const event = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 amount)',
    )
    expect(AbiItem.getSignatureHash(event)).toEqual(
      (event as unknown as { hash: Hex.Hex }).hash,
    )
  })
})

test('exports', () => {
  expect(Object.keys(AbiItem)).toMatchInlineSnapshot(`
    [
      "format",
      "from",
      "fromAbi",
      "getSelector",
      "getSignature",
      "getSignatureHash",
      "AmbiguityError",
      "NotFoundError",
      "InvalidSelectorSizeError",
    ]
  `)
})
