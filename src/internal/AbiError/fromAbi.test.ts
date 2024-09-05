import { Abi, AbiError, AbiItem } from 'ox'
import { expect, test } from 'vitest'

import { seaportContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  expect(
    AbiError.fromAbi(seaportContractConfig.abi, {
      name: 'BadSignatureV',
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

test('behavior: prepare = false', () => {
  expect(
    AbiError.fromAbi(seaportContractConfig.abi, {
      name: 'BadSignatureV',
      prepare: false,
    }),
  ).toMatchInlineSnapshot(`
    {
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

test('behavior: selector as name', () => {
  const item = AbiError.fromAbi(seaportContractConfig.abi, {
    name: 'BadSignatureV',
  })
  const selector = AbiItem.getSelector(item)
  expect(
    AbiError.fromAbi(seaportContractConfig.abi, {
      name: selector,
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

test('error: no matching name', () => {
  expect(() =>
    AbiError.fromAbi(seaportContractConfig.abi, {
      // @ts-expect-error
      name: 'cancel',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemNotFoundError: ABI error with name "cancel" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('error: no matching name', () => {
  expect(() =>
    AbiError.fromAbi([] as readonly unknown[], {
      name: 'balanceOf',
      args: ['0x0000000000000000000000000000000000000000'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemNotFoundError: ABI item with name "balanceOf" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('error: no matching data', () => {
  expect(() =>
    AbiError.fromAbi([], {
      name: '0xdeadbeef',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemNotFoundError: ABI item with name "0xdeadbeef" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('behavior: overloads', () => {
  const abi = Abi.from([
    'error Bar()',
    'error Foo(bytes)',
    'error Foo(uint256)',
  ])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x83f034b8fbb90b149a989013c8445bbdc827e19a70ca29f1581ce2d7e736e494",
      "inputs": [
        {
          "type": "bytes",
        },
      ],
      "name": "Foo",
      "overloads": [
        {
          "inputs": [
            {
              "type": "uint256",
            },
          ],
          "name": "Foo",
          "type": "error",
        },
      ],
      "type": "error",
    }
  `)
})

test('behavior: overloads: no inputs', () => {
  const abi = Abi.from(['error Bar()', 'error Foo()', 'error Foo(uint256)'])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x86c07da3d144b633d2c7c53a4441b60f01a2defe3b85756267a1379e7611d9b7",
      "inputs": [],
      "name": "Foo",
      "type": "error",
    }
  `)
})

test('overloads: no args', () => {
  const abi = Abi.from(['error Bar()', 'error Foo(uint256)', 'error Foo()'])
  const item = AbiError.fromAbi(abi, {
    name: 'Foo',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x86c07da3d144b633d2c7c53a4441b60f01a2defe3b85756267a1379e7611d9b7",
      "inputs": [],
      "name": "Foo",
      "type": "error",
    }
  `)
})

test('behavior: overloads: different types', () => {
  const abi = Abi.from([
    'error Mint()',
    'error Mint(uint256)',
    'error Mint(string)',
  ])
  const item = AbiError.fromAbi(abi, {
    name: 'Mint',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x036e3b5270e8a6ff025d5daca1aa3e9d88c84ea3d8fd0e14000f18180d77291d",
      "inputs": [],
      "name": "Mint",
      "type": "error",
    }
  `)

  const item_2 = AbiError.fromAbi(abi, {
    name: 'Mint',
    args: [420n],
  })
  expect(item_2).toMatchInlineSnapshot(`
    {
      "hash": "0x7ee7d9f5fb8ccf9ecc8233240dd511f88985f308a021b2157404fc0ae4d35d42",
      "inputs": [
        {
          "type": "uint256",
        },
      ],
      "name": "Mint",
      "type": "error",
    }
  `)

  const item_3 = AbiError.fromAbi(abi, {
    name: 'Mint',
    args: ['foo'],
  })
  expect(item_3).toMatchInlineSnapshot(`
    {
      "hash": "0x11301b3e5d82fb0c73ddbc18c4520e7a24f559526f9ed6bfbc230b629ece03fb",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Mint",
      "type": "error",
    }
  `)
})

test('behavior: overloads: tuple', () => {
  const abi = Abi.from([
    'error Example(uint256 foo, (string a, string b, uint256 c) bar)',
    'error Example(uint256 foo, (string a, (string merp, string meep) b, address c) bar)',
  ])
  const item = AbiError.fromAbi(abi, {
    name: 'Example',
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
      "hash": "0xfe7998e6d8a3f1d36a6a46320d8846d4516983f37ea3003b72fd8ee72eb38e03",
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
      "name": "Example",
      "type": "error",
    }
  `)
})

test('behavior: overloads: ambiguious types', () => {
  expect(() =>
    AbiError.fromAbi(Abi.from(['error Foo(address)', 'error Foo(bytes20)']), {
      name: 'Foo',
      args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`error Foo(bytes20)\`, and
    \`address\` in \`error Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiError.fromAbi(
      Abi.from(['error Foo(string)', 'error Foo(uint)', 'error Foo(address)']),
      {
        name: 'Foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`address\` in \`error Foo(address)\`, and
    \`string\` in \`error Foo(string)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(
    AbiError.fromAbi(
      Abi.from(['error Foo(string)', 'error Foo(uint)', 'error Foo(address)']),
      {
        name: 'Foo',
        // 21 bytes (invalid address)
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251eee'],
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0x46150564e631d8e04393beeebc059a3831bb18dcae9e0eed6c9903bf18d635bc",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Foo",
      "type": "error",
    }
  `)

  expect(
    AbiError.fromAbi(
      Abi.from(['error Foo(string)', 'error Foo(uint)', 'error Foo(address)']),
      {
        name: 'Foo',
        // non-hex (invalid address)
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251z'],
      },
    ),
  ).toMatchInlineSnapshot(`
    {
      "hash": "0x46150564e631d8e04393beeebc059a3831bb18dcae9e0eed6c9903bf18d635bc",
      "inputs": [
        {
          "type": "string",
        },
      ],
      "name": "Foo",
      "type": "error",
    }
  `)

  expect(() =>
    AbiError.fromAbi(
      Abi.from(['error Foo(address)', 'error Foo(uint)', 'error Foo(string)']),
      {
        name: 'Foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`string\` in \`error Foo(string)\`, and
    \`address\` in \`error Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiError.fromAbi(
      Abi.from(['error Foo((address))', 'error Foo((bytes20))']),
      {
        name: 'Foo',
        args: [['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`error Foo((bytes20))\`, and
    \`address\` in \`error Foo((address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiError.fromAbi(
      Abi.from(['error Foo(string, (address))', 'error Foo(string, (bytes))']),
      {
        name: 'Foo',
        args: ['foo', ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e']],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItemAmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes\` in \`error Foo(string,(bytes))\`, and
    \`address\` in \`error Foo(string,(address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)
})
