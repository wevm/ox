import { Abi, AbiFunction } from 'ox'
import { expect, test } from 'vitest'

import { anvilMainnet } from '../../../test/anvil.js'
import { wagmiContractConfig } from '../../../test/constants/abis.js'

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
  const data = AbiFunction.encodeInput(item, [
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
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.NotFoundError: ABI function with name "Approval" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('error: no matching name', () => {
  expect(() =>
    AbiFunction.fromAbi([] as readonly unknown[], 'balanceOf', {
      args: ['0x0000000000000000000000000000000000000000'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.NotFoundError: ABI item with name "balanceOf" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('error: no matching data', () => {
  expect(() =>
    AbiFunction.fromAbi([], '0xdeadbeef'),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.NotFoundError: ABI item with name "0xdeadbeef" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
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
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
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
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
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
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
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
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
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
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)
})

test('behavior: network', async () => {
  const abi = Abi.from(wagmiContractConfig.abi)

  const totalSupplyItem = AbiFunction.fromAbi(abi, 'totalSupply')

  const totalSupply = await anvilMainnet
    .request({
      method: 'eth_call',
      params: [
        {
          data: AbiFunction.encodeInput(totalSupplyItem),
          to: wagmiContractConfig.address,
        },
      ],
    })
    .then((data) => AbiFunction.decodeOutput(totalSupplyItem, data))

  expect(totalSupply).toEqual(648n)
})
