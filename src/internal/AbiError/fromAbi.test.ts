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
      "hash": "0xefc9afd358f1472682cf8cc82e1d3ae36be2538ed858a4a604119399d6f22b48",
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
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
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
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
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
      "hash": "0x34c73884fbbb790762253ae313e57da96c00670344647f0cb8d41ee92b9f1971",
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
      "hash": "0x07883703ed0e86588a40d76551c92f8a4b329e3bf19765e0e6749473c1a84665",
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
      "hash": "0xc5e1d731c47dbd6a8c38e6ee9137792904eae9d20174034d1dc9a5781a0f855b",
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
      "hash": "0x3cfe2f5f5794a704453504eac86b65a35f5912de763230232d0d593c5127e517",
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

    \`bytes20\` in \`Foo(bytes20)\`, and
    \`address\` in \`Foo(address)\`

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

    \`address\` in \`Foo(address)\`, and
    \`string\` in \`Foo(string)\`

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
      "hash": "0x9f0b7f1630bdb7d474466e2dfef0fb9dff65f7a50eec83935b68f77d0808f08a",
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
      "hash": "0x9f0b7f1630bdb7d474466e2dfef0fb9dff65f7a50eec83935b68f77d0808f08a",
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

    \`string\` in \`Foo(string)\`, and
    \`address\` in \`Foo(address)\`

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

    \`bytes20\` in \`Foo((bytes20))\`, and
    \`address\` in \`Foo((address))\`

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

    \`bytes\` in \`Foo(string,(bytes))\`, and
    \`address\` in \`Foo(string,(address))\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)
})
