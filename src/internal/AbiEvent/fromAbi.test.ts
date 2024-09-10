import { Abi, AbiEvent } from 'ox'
import { expect, test } from 'vitest'

import { wagmiContractConfig } from '../../../test/constants/abis.js'

test('default', () => {
  expect(
    AbiEvent.fromAbi(wagmiContractConfig.abi, {
      name: 'Approval',
    }),
  ).toMatchInlineSnapshot(`
    {
      "anonymous": false,
      "hash": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "approved",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "Approval",
      "type": "event",
    }
  `)
})

test('behavior: prepare = false', () => {
  expect(
    AbiEvent.fromAbi(wagmiContractConfig.abi, {
      name: 'Approval',
      prepare: false,
    }),
  ).toMatchInlineSnapshot(`
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "approved",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "Approval",
      "type": "event",
    }
  `)
})

test('behavior: name (hash)', () => {
  const item = AbiEvent.fromAbi(wagmiContractConfig.abi, {
    name: 'Approval',
  })
  expect(
    AbiEvent.fromAbi(wagmiContractConfig.abi, {
      name: AbiEvent.getSelector(item),
    }),
  ).toMatchInlineSnapshot(`
    {
      "anonymous": false,
      "hash": "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      "inputs": [
        {
          "indexed": true,
          "name": "owner",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "approved",
          "type": "address",
        },
        {
          "indexed": true,
          "name": "tokenId",
          "type": "uint256",
        },
      ],
      "name": "Approval",
      "type": "event",
    }
  `)
})

test('error: no matching name', () => {
  expect(() =>
    AbiEvent.fromAbi(wagmiContractConfig.abi, {
      // @ts-expect-error
      name: 'approve',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.NotFoundError: ABI event with name "approve" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('error: no matching name', () => {
  expect(() =>
    AbiEvent.fromAbi([] as readonly unknown[], {
      name: 'Approved',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.NotFoundError: ABI item with name "Approved" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('error: no matching data', () => {
  expect(() =>
    AbiEvent.fromAbi([], {
      name: '0xdeadbeef',
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.NotFoundError: ABI item with name "0xdeadbeef" not found.

    See: https://oxlib.sh/errors#abiitemnotfounderror]
  `)
})

test('behavior: overloads', () => {
  const abi = Abi.from([
    'event Bar()',
    'event Foo(address indexed)',
    'event Foo(uint256 indexed)',
  ])
  const item = AbiEvent.fromAbi(abi, {
    name: 'Foo',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xe773a60b784586770a963a70fa6ba2bdf31c462939b6ba36852ed45f5f722358",
      "inputs": [
        {
          "indexed": true,
          "type": "address",
        },
      ],
      "name": "Foo",
      "overloads": [
        {
          "inputs": [
            {
              "indexed": true,
              "type": "uint256",
            },
          ],
          "name": "Foo",
          "type": "event",
        },
      ],
      "type": "event",
    }
  `)
})

test('behavior: overloads: no inputs', () => {
  const abi = Abi.from(['event Bar()', 'event Foo()', 'event Foo(uint256)'])
  const item = AbiEvent.fromAbi(abi, {
    name: 'Foo',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
      "inputs": [],
      "name": "Foo",
      "type": "event",
    }
  `)
})

test('overloads: no args', () => {
  const abi = Abi.from(['event Bar()', 'event Foo(uint256)', 'event Foo()'])
  const item = AbiEvent.fromAbi(abi, {
    name: 'Foo',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0xbfb4ebcfff8f360b39de1de85df1edc256d63337b743120bf6e2e2144b973d38",
      "inputs": [],
      "name": "Foo",
      "type": "event",
    }
  `)
})

test('behavior: overloads: different types', () => {
  const abi = Abi.from([
    'event Mint()',
    'event Mint(uint256)',
    'event Mint(string)',
  ])
  const item = AbiEvent.fromAbi(abi, {
    name: 'Mint',
  })
  expect(item).toMatchInlineSnapshot(`
    {
      "hash": "0x34c73884fbbb790762253ae313e57da96c00670344647f0cb8d41ee92b9f1971",
      "inputs": [],
      "name": "Mint",
      "type": "event",
    }
  `)

  const item_2 = AbiEvent.fromAbi(abi, {
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
      "type": "event",
    }
  `)

  const item_3 = AbiEvent.fromAbi(abi, {
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
      "type": "event",
    }
  `)
})

test('behavior: overloads: ambiguious types', () => {
  expect(() =>
    AbiEvent.fromAbi(Abi.from(['event Foo(address)', 'event Foo(bytes20)']), {
      name: 'Foo',
      args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`bytes20\` in \`Foo(bytes20)\`, and
    \`address\` in \`Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(() =>
    AbiEvent.fromAbi(
      Abi.from(['event Foo(string)', 'event Foo(uint)', 'event Foo(address)']),
      {
        name: 'Foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`address\` in \`Foo(address)\`, and
    \`string\` in \`Foo(string)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)

  expect(
    AbiEvent.fromAbi(
      Abi.from(['event Foo(string)', 'event Foo(uint)', 'event Foo(address)']),
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
      "type": "event",
    }
  `)

  expect(
    AbiEvent.fromAbi(
      Abi.from(['event Foo(string)', 'event Foo(uint)', 'event Foo(address)']),
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
      "type": "event",
    }
  `)

  expect(() =>
    AbiEvent.fromAbi(
      Abi.from(['event Foo(address)', 'event Foo(uint)', 'event Foo(string)']),
      {
        name: 'Foo',
        args: ['0xA0Cf798816D4b9b9866b5330EEa46a18382f251e'],
      },
    ),
  ).toThrowErrorMatchingInlineSnapshot(`
    [AbiItem.AmbiguityError: Found ambiguous types in overloaded ABI Items.

    \`string\` in \`Foo(string)\`, and
    \`address\` in \`Foo(address)\`

    These types encode differently and cannot be distinguished at runtime.
    Remove one of the ambiguous items in the ABI.

    See: https://oxlib.sh/errors#abiitemambiguityerror]
  `)
})
