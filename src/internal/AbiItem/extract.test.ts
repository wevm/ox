import { Abi, AbiItem, AbiParameters, Bytes } from 'ox'
import { describe, expect, test } from 'vitest'

import {
  seaportContractConfig,
  wagmiContractConfig,
} from '../../../test/constants/abis.js'
import { getAmbiguousTypes, isArgOfType } from './extract.js'

test('default', () => {
  expect(
    AbiItem.extract(wagmiContractConfig.abi, {
      name: 'balanceOf',
      args: ['0x0000000000000000000000000000000000000000'],
    }),
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
    AbiItem.extract(wagmiContractConfig.abi, {
      name: 'balanceOf',
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

describe('behavior: data', () => {
  test('function', () => {
    const selector = AbiItem.getSelector(
      AbiItem.extract(seaportContractConfig.abi, {
        name: 'incrementCounter',
      }),
    )
    expect(
      AbiItem.extract(seaportContractConfig.abi, {
        data: selector,
      }),
    ).toMatchInlineSnapshot(`
      {
        "hash": "0x5b34b96640ffc060fd5d99738fe2797d588138844b804de5220f8ce43bf9a4ca",
        "inputs": [],
        "name": "incrementCounter",
        "outputs": [
          {
            "name": "newCounter",
            "type": "uint256",
          },
        ],
        "stateMutability": "nonpayable",
        "type": "function",
      }
    `)
  })

  test('event', () => {
    const hash = AbiItem.getSignatureHash(
      AbiItem.extract(seaportContractConfig.abi, {
        name: 'CounterIncremented',
      }),
    )
    expect(
      AbiItem.extract(seaportContractConfig.abi, {
        data: hash,
      }),
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
      AbiItem.extract(seaportContractConfig.abi, {
        name: 'BadSignatureV',
      }),
    )
    expect(
      AbiItem.extract(seaportContractConfig.abi, {
        data: selector,
      }),
    ).toMatchInlineSnapshot(`
      {
        "hash": "0xaa52af9ba76161953067fddc6a99eee9de4ef3377363fd1f54a2648771ce7104",
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
    AbiItem.extract([] as readonly unknown[], {
      name: 'balanceOf',
      args: ['0x0000000000000000000000000000000000000000'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemNotFoundError: ABI Item "balanceOf" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('no matching data', () => {
  expect(() =>
    AbiItem.extract([], {
      data: '0xdeadbeef',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemNotFoundError: ABI Item "0xdeadbeef" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('overloads: no inputs', () => {
  expect(
    AbiItem.extract(
      [
        {
          inputs: [],
          name: 'balanceOf',
          outputs: [{ name: 'x', type: 'uint256' }],
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
      ],
      {
        name: 'balanceOf',
        args: [],
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0x722713f7196651d0fe4592d1dc3ef527a8f2d47259e18fa8ec48288f351a83eb",
      "inputs": [],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "x",
          "type": "uint256",
        },
      ],
      "stateMutability": "view",
      "type": "function",
    }
  `)
})

test('overloads: no args', () => {
  expect(
    AbiItem.extract(
      [
        {
          inputs: [{ name: '', type: 'uint256' }],
          name: 'balanceOf',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
        {
          inputs: [],
          name: 'balanceOf',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      {
        name: 'balanceOf',
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0x722713f7196651d0fe4592d1dc3ef527a8f2d47259e18fa8ec48288f351a83eb",
      "inputs": [],
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

test('overload: different lengths without abi order define effect', () => {
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
    AbiItem.extract(abi, {
      name: 'safeTransferFrom',
      args: shortArgs,
    }),
  ).toMatchInlineSnapshot(shortSnapshot)
  expect(
    AbiItem.extract(abi.reverse(), {
      name: 'safeTransferFrom',
      args: shortArgs,
    }),
  ).toMatchInlineSnapshot(shortSnapshot)

  expect(
    AbiItem.extract(abi, {
      name: 'safeTransferFrom',
      args: longArgs,
    }),
  ).toMatchInlineSnapshot(longSnapshot)
  expect(
    AbiItem.extract(abi.reverse(), {
      name: 'safeTransferFrom',
      args: longArgs,
    }),
  ).toMatchInlineSnapshot(longSnapshot)
})

test('overload: different types', () => {
  const abi = [
    {
      inputs: [],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'uint256' }],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [{ name: 'tokenId', type: 'string' }],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  expect(
    AbiItem.extract(abi, {
      name: 'mint',
    }),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0x1249c58b84ff771f36a0d1d2bf0b42e48832b1567c4213f113d3990903cea57d",
      "inputs": [],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)

  expect(
    AbiItem.extract(abi, {
      name: 'mint',
      args: [420n],
    }),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0xa0712d680358d64f694230b7cc0b277c73686bdf768385d55cd7c547d0ffd30e",
      "inputs": [
        {
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "mint",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function",
    }
  `)

  expect(
    AbiItem.extract(abi, {
      name: 'mint',
      args: ['foo'],
    }),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0xd85d3d2718c3cc9b33ff08eede5eea8b009f9d6e830a4fb9f651e3174175a5a1",
      "inputs": [
        {
          "name": "tokenId",
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

test('overloads: tuple', () => {
  expect(
    AbiItem.extract(
      [
        {
          inputs: [
            { name: 'foo', type: 'uint256' },
            {
              name: 'bar',
              type: 'tuple',
              components: [
                { name: 'a', type: 'string' },
                {
                  name: 'b',
                  type: 'tuple',
                  components: [
                    { name: 'merp', type: 'string' },
                    { name: 'meep', type: 'string' },
                  ],
                },
                { name: 'c', type: 'uint256' },
              ],
            },
          ],
          name: 'foo',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
        {
          inputs: [
            { name: 'foo', type: 'uint256' },
            {
              name: 'bar',
              type: 'tuple',
              components: [
                { name: 'a', type: 'string' },
                {
                  name: 'b',
                  type: 'tuple',
                  components: [
                    { name: 'merp', type: 'string' },
                    { name: 'meep', type: 'string' },
                  ],
                },
                { name: 'c', type: 'address' },
              ],
            },
          ],
          name: 'foo',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      {
        name: 'foo',
        args: [
          420n,
          {
            a: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
            b: { merp: 'test', meep: 'test' },
            c: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
          },
        ],
      },
    ),
  ).toMatchInlineSnapshot(`
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

test('overloads: ambiguious types', () => {
  expect(() =>
    AbiItem.extract(
      Abi.from(['function foo(address)', 'function foo(bytes20)']),
      {
        name: 'foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`foo(bytes20)\`, and
    \`address\` in \`foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiItem.extract(
      Abi.from([
        'function foo(string)',
        'function foo(uint)',
        'function foo(address)',
      ]),
      {
        name: 'foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`address\` in \`foo(address)\`, and
    \`string\` in \`foo(string)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(
    AbiItem.extract(
      Abi.from([
        'function foo(string)',
        'function foo(uint)',
        'function foo(address)',
      ]),
      {
        name: 'foo',
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
    AbiItem.extract(
      Abi.from([
        'function foo(string)',
        'function foo(uint)',
        'function foo(address)',
      ]),
      {
        name: 'foo',
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
    AbiItem.extract(
      Abi.from([
        'function foo(address)',
        'function foo(uint)',
        'function foo(string)',
      ]),
      {
        name: 'foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`string\` in \`foo(string)\`, and
    \`address\` in \`foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiItem.extract(
      Abi.from(['function foo((address))', 'function foo((bytes20))']),
      {
        name: 'foo',
        args: [['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`foo((bytes20))\`, and
    \`address\` in \`foo((address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiItem.extract(
      Abi.from([
        'function foo(string, (address))',
        'function foo(string, (bytes))',
      ]),
      {
        name: 'foo',
        args: ['foo', ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes\` in \`foo(string,(bytes))\`, and
    \`address\` in \`foo(string,(address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
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
    arg: Bytes.from('foo'),
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
}[])('isArgOfType($arg, $abiParameter)', ({ arg, abiParameter, expected }) => {
  test(`isArgOfType: returns ${expected}`, () => {
    expect(isArgOfType(arg, abiParameter)).toEqual(expected)
  })
})
