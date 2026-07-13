import { expect, test } from 'vp/test'

import { parseAbiItem } from './parseAbiItem.js'

test('parseAbiItem', () => {
  // @ts-expect-error invalid signature type
  expect(() => parseAbiItem('')).toThrowErrorMatchingInlineSnapshot(
    `[Abi.UnknownSignatureError: Unknown signature.]`,
  )
  // @ts-expect-error invalid signature type
  expect(() => parseAbiItem([])).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiItem.InvalidAbiItemError: Failed to parse ABI item.

    Details: parseAbiItem([])
    See: https://oxlib.sh/api/AbiItem/from]
  `,
  )
  expect(() =>
    parseAbiItem(['struct Foo { string name; }']),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [AbiItem.InvalidAbiItemError: Failed to parse ABI item.

    Details: parseAbiItem([
      "struct Foo { string name; }"
    ])
    See: https://oxlib.sh/api/AbiItem/from]
  `,
  )
})

test.each([
  {
    signature: ['function foo(string)'],
    expected: {
      type: 'function',
      name: 'foo',
      inputs: [{ type: 'string' }],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  },
  {
    signature: [
      'event Foo(address indexed from, address indexed to, uint256 amount)',
    ],
    expected: {
      type: 'event',
      name: 'Foo',
      inputs: [
        { type: 'address', name: 'from', indexed: true },
        { type: 'address', name: 'to', indexed: true },
        { type: 'uint256', name: 'amount' },
      ],
    },
  },
  {
    signature: ['fallback() external'],
    expected: {
      type: 'fallback',
      stateMutability: 'nonpayable',
    },
  },
  {
    signature: ['fallback() external payable'],
    expected: {
      type: 'fallback',
      stateMutability: 'payable',
    },
  },
])('parseAbiItem($signature)', ({ signature, expected }) => {
  expect(parseAbiItem(signature)).toEqual(expected)
})

test.each([
  {
    signature: ['struct Foo { string bar; }', 'function foo(Foo)'],
    expected: {
      type: 'function',
      name: 'foo',
      inputs: [
        { type: 'tuple', components: [{ name: 'bar', type: 'string' }] },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
  },
])('parseAbiItem($signature)', ({ signature, expected }) => {
  expect(parseAbiItem(signature)).toEqual(expected)
})

test('nested tuples', () => {
  const formattedAbiItem =
    'function stepChanges((uint256 characterID, uint64 newPosition, uint24 xp, uint24 epoch, uint8 hp, (int32 x, int32 y, uint8 hp, uint8 kind)[5] monsters, (uint8 monsterIndexPlus1, uint8 attackCardsUsed1, uint8 attackCardsUsed2, uint8 defenseCardsUsed1, uint8 defenseCardsUsed2) battle) stateChanges, uint256 action, bool revetOnInvalidMoves) pure returns ((uint256 characterID, uint64 newPosition, uint24 xp, uint24 epoch, uint8 hp, (int32 x, int32 y, uint8 hp, uint8 kind)[5] monsters, (uint8 monsterIndexPlus1, uint8 attackCardsUsed1, uint8 attackCardsUsed2, uint8 defenseCardsUsed1, uint8 defenseCardsUsed2) battle))'
  expect(parseAbiItem(formattedAbiItem)).toMatchInlineSnapshot(
    `
    {
      "inputs": [
        {
          "components": [
            {
              "name": "characterID",
              "type": "uint256",
            },
            {
              "name": "newPosition",
              "type": "uint64",
            },
            {
              "name": "xp",
              "type": "uint24",
            },
            {
              "name": "epoch",
              "type": "uint24",
            },
            {
              "name": "hp",
              "type": "uint8",
            },
            {
              "components": [
                {
                  "name": "x",
                  "type": "int32",
                },
                {
                  "name": "y",
                  "type": "int32",
                },
                {
                  "name": "hp",
                  "type": "uint8",
                },
                {
                  "name": "kind",
                  "type": "uint8",
                },
              ],
              "name": "monsters",
              "type": "tuple[5]",
            },
            {
              "components": [
                {
                  "name": "monsterIndexPlus1",
                  "type": "uint8",
                },
                {
                  "name": "attackCardsUsed1",
                  "type": "uint8",
                },
                {
                  "name": "attackCardsUsed2",
                  "type": "uint8",
                },
                {
                  "name": "defenseCardsUsed1",
                  "type": "uint8",
                },
                {
                  "name": "defenseCardsUsed2",
                  "type": "uint8",
                },
              ],
              "name": "battle",
              "type": "tuple",
            },
          ],
          "name": "stateChanges",
          "type": "tuple",
        },
        {
          "name": "action",
          "type": "uint256",
        },
        {
          "name": "revetOnInvalidMoves",
          "type": "bool",
        },
      ],
      "name": "stepChanges",
      "outputs": [
        {
          "components": [
            {
              "name": "characterID",
              "type": "uint256",
            },
            {
              "name": "newPosition",
              "type": "uint64",
            },
            {
              "name": "xp",
              "type": "uint24",
            },
            {
              "name": "epoch",
              "type": "uint24",
            },
            {
              "name": "hp",
              "type": "uint8",
            },
            {
              "components": [
                {
                  "name": "x",
                  "type": "int32",
                },
                {
                  "name": "y",
                  "type": "int32",
                },
                {
                  "name": "hp",
                  "type": "uint8",
                },
                {
                  "name": "kind",
                  "type": "uint8",
                },
              ],
              "name": "monsters",
              "type": "tuple[5]",
            },
            {
              "components": [
                {
                  "name": "monsterIndexPlus1",
                  "type": "uint8",
                },
                {
                  "name": "attackCardsUsed1",
                  "type": "uint8",
                },
                {
                  "name": "attackCardsUsed2",
                  "type": "uint8",
                },
                {
                  "name": "defenseCardsUsed1",
                  "type": "uint8",
                },
                {
                  "name": "defenseCardsUsed2",
                  "type": "uint8",
                },
              ],
              "name": "battle",
              "type": "tuple",
            },
          ],
          "type": "tuple",
        },
      ],
      "stateMutability": "pure",
      "type": "function",
    }
  `,
  )
})
