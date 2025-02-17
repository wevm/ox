import { assertType, expectTypeOf, test } from 'vitest'

import type {
  ParseAbiParameters,
  ParseSignature,
  _ParseFunctionParametersAndStateMutability,
  _ParseTuple,
  _SplitNameOrModifier,
  _UnwrapNameOrModifier,
} from '../../../../internal/humanReadable/types/utils.js'

type OptionsWithModifier = { modifier: 'calldata'; structs: unknown }
type OptionsWithIndexed = { modifier: 'indexed'; structs: unknown }
type OptionsWithStructs = {
  structs: {
    Foo: [{ type: 'address'; name: 'bar' }]
  }
}

test('ParseSignature', () => {
  type Structs = {
    Baz: [{ type: 'address'; name: 'baz' }]
  }

  // Error
  assertType<ParseSignature<'error Foo()'>>({
    type: 'error',
    name: 'Foo',
    inputs: [],
  })
  assertType<ParseSignature<'error Foo(string)'>>({
    type: 'error',
    name: 'Foo',
    inputs: [{ type: 'string' }],
  })
  assertType<ParseSignature<'error Foo(string bar)'>>({
    type: 'error',
    name: 'Foo',
    inputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<ParseSignature<'error Foo(Baz bar)', Structs>>({
    type: 'error',
    name: 'Foo',
    inputs: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'address', name: 'baz' }],
      },
    ],
  })

  // Events
  assertType<ParseSignature<'event Foo()'>>({
    type: 'event',
    name: 'Foo',
    inputs: [],
  })
  assertType<ParseSignature<'event Foo(string)'>>({
    type: 'event',
    name: 'Foo',
    inputs: [{ type: 'string' }],
  })
  assertType<ParseSignature<'event Foo(string bar)'>>({
    type: 'event',
    name: 'Foo',
    inputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<ParseSignature<'event Foo(string indexed bar)'>>({
    type: 'event',
    name: 'Foo',
    inputs: [{ type: 'string', indexed: true, name: 'bar' }],
  })
  assertType<ParseSignature<'event Foo(Baz bar)', Structs>>({
    type: 'event',
    name: 'Foo',
    inputs: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'address', name: 'baz' }],
      },
    ],
  })
  assertType<ParseSignature<'event Foo((string) indexed bar)'>>({
    type: 'event',
    name: 'Foo',
    inputs: [
      {
        type: 'tuple',
        indexed: true,
        name: 'bar',
        components: [{ type: 'string' }],
      },
    ],
  })

  // Constructor
  assertType<ParseSignature<'constructor()'>>({
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [],
  })
  assertType<ParseSignature<'constructor() payable'>>({
    type: 'constructor',
    stateMutability: 'payable',
    inputs: [],
  })
  assertType<ParseSignature<'constructor(string)'>>({
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string' }],
  })
  assertType<ParseSignature<'constructor(string) payable'>>({
    type: 'constructor',
    stateMutability: 'payable',
    inputs: [{ type: 'string' }],
  })
  assertType<ParseSignature<'constructor(string foo)'>>({
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string', name: 'foo' }],
  })
  assertType<ParseSignature<'constructor(string foo)'>>({
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string', name: 'foo' }],
  })
  assertType<ParseSignature<'constructor((string) foo)'>>({
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'tuple', name: 'foo', components: [{ type: 'string' }] }],
  })

  // Fallback
  assertType<ParseSignature<'fallback() external'>>({
    type: 'fallback',
    stateMutability: 'nonpayable',
  })
  assertType<ParseSignature<'fallback() external payable'>>({
    type: 'fallback',
    stateMutability: 'payable',
  })

  // Receive
  assertType<ParseSignature<'receive() external payable'>>({
    type: 'receive',
    stateMutability: 'payable',
  })

  // Functions
  assertType<ParseSignature<'function foo()'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  })

  // inputs
  assertType<ParseSignature<'function foo(string)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string' }],
    outputs: [],
  })
  assertType<ParseSignature<'function foo(string bar)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string', name: 'bar' }],
    outputs: [],
  })
  assertType<ParseSignature<'function foo(Baz bar)', Structs>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'address', name: 'baz' }],
      },
    ],
    outputs: [],
  })
  assertType<ParseSignature<'function foo(string bar) view'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'view',
    inputs: [{ type: 'string', name: 'bar' }],
    outputs: [],
  })
  assertType<ParseSignature<'function foo(string bar) public payable'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'payable',
    inputs: [{ type: 'string', name: 'bar' }],
    outputs: [],
  })
  assertType<ParseSignature<'function foo(string calldata)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string' }],
    outputs: [],
  })

  assertType<ParseSignature<'function foo(string indexed)'>>({
    name: 'foo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'string',
        name: ['Error: "indexed" is a protected Solidity keyword.'],
      },
    ],
    outputs: [],
  })
  assertType<ParseSignature<'function foo(string indexed bar)'>>({
    name: 'foo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'string',
        name: ['Error: Identifier "indexed bar" cannot contain whitespace.'],
      },
    ],
    outputs: [],
  })

  // outputs
  assertType<ParseSignature<'function foo() returns (string)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ type: 'string' }],
  })
  assertType<ParseSignature<'function foo() returns (string bar)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<ParseSignature<'function foo() returns (Baz bar)', Structs>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'address', name: 'baz' }],
      },
    ],
  })
  assertType<ParseSignature<'function foo() view returns (string bar)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<
    ParseSignature<'function foo() public payable returns (string bar)'>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<
    ParseSignature<'function foo() public payable returns(string bar)'>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'payable',
    inputs: [],
    outputs: [{ type: 'string', name: 'bar' }],
  })

  // inputs and outputs
  assertType<ParseSignature<'function foo(string) returns (string)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string' }],
    outputs: [{ type: 'string' }],
  })
  assertType<ParseSignature<'function foo(string bar) returns (string bar)'>>({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string', name: 'bar' }],
    outputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<
    ParseSignature<'function foo(string foo) public payable returns(string bar)'>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'payable',
    inputs: [{ type: 'string', name: 'foo' }],
    outputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<
    ParseSignature<'function foo(Baz bar) returns (Baz bar)', Structs>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'address', name: 'baz' }],
      },
    ],
    outputs: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'address', name: 'baz' }],
      },
    ],
  })
  assertType<
    ParseSignature<'function foo(string bar) view returns (string bar)'>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'view',
    inputs: [{ type: 'string', name: 'bar' }],
    outputs: [{ type: 'string', name: 'bar' }],
  })
  assertType<
    ParseSignature<'function foo(string bar) public payable returns (string bar)'>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'payable',
    inputs: [{ type: 'string', name: 'bar' }],
    outputs: [{ type: 'string', name: 'bar' }],
  })

  assertType<
    ParseSignature<'function foo(((string)) calldata) returns (string, (string))'>
  >({
    type: 'function',
    name: 'foo',
    stateMutability: 'nonpayable',
    inputs: [
      {
        type: 'tuple',
        components: [{ type: 'tuple', components: [{ type: 'string' }] }],
      },
    ],
    outputs: [
      {
        type: 'string',
      },
      {
        type: 'tuple',
        components: [{ type: 'string' }],
      },
    ],
  })
})

test('ParseAbiParameters', () => {
  expectTypeOf<ParseAbiParameters<[]>>().toEqualTypeOf<readonly []>()
  expectTypeOf<ParseAbiParameters<['']>>().toEqualTypeOf<readonly []>()
  expectTypeOf<ParseAbiParameters<['string']>>().toEqualTypeOf<
    readonly [{ readonly type: 'string' }]
  >()
  expectTypeOf<
    ParseAbiParameters<['string', 'string']> extends readonly [
      { readonly type: 'string' },
      { readonly type: 'string' },
    ]
      ? true
      : false
  >().toEqualTypeOf<true>()
})

test('_ParseFunctionParametersAndStateMutability', () => {
  expectTypeOf<
    _ParseFunctionParametersAndStateMutability<'function foo()'>
  >().toEqualTypeOf<{
    Inputs: ''
    StateMutability: 'nonpayable'
  }>()

  expectTypeOf<
    _ParseFunctionParametersAndStateMutability<'function foo(string bar)'>
  >().toEqualTypeOf<{
    Inputs: 'string bar'
    StateMutability: 'nonpayable'
  }>()

  expectTypeOf<
    _ParseFunctionParametersAndStateMutability<'function foo() view'>
  >().toEqualTypeOf<{
    Inputs: ''
    StateMutability: 'view'
  }>()

  expectTypeOf<
    _ParseFunctionParametersAndStateMutability<'function foo(string bar) view'>
  >().toEqualTypeOf<{
    Inputs: 'string bar'
    StateMutability: 'view'
  }>()

  expectTypeOf<
    _ParseFunctionParametersAndStateMutability<'function foo(string bar, uint256) external view'>
  >().toEqualTypeOf<{
    Inputs: 'string bar, uint256'
    StateMutability: 'view'
  }>()

  expectTypeOf<
    _ParseFunctionParametersAndStateMutability<'function stepChanges((uint256 characterID, uint64 newPosition, uint24 xp, uint24 epoch, uint8 hp, (int32 x, int32 y, uint8 hp, uint8 kind)[5] monsters, (uint8 monsterIndexPlus1, uint8 attackCardsUsed1, uint8 attackCardsUsed2, uint8 defenseCardsUsed1, uint8 defenseCardsUsed2) battle) stateChanges, uint256 action, bool revetOnInvalidMoves) pure returns ((uint256 characterID, uint64 newPosition, uint24 xp, uint24 epoch, uint8 hp, (int32 x, int32 y, uint8 hp, uint8 kind)[5] monsters, (uint8 monsterIndexPlus1, uint8 attackCardsUsed1, uint8 attackCardsUsed2, uint8 defenseCardsUsed1, uint8 defenseCardsUsed2) battle))'>
  >().toEqualTypeOf<{
    Inputs: '(uint256 characterID, uint64 newPosition, uint24 xp, uint24 epoch, uint8 hp, (int32 x, int32 y, uint8 hp, uint8 kind)[5] monsters, (uint8 monsterIndexPlus1, uint8 attackCardsUsed1, uint8 attackCardsUsed2, uint8 defenseCardsUsed1, uint8 defenseCardsUsed2) battle) stateChanges, uint256 action, bool revetOnInvalidMoves'
    StateMutability: 'pure'
  }>()
})

test('_ParseTuple', () => {
  // basic tuples
  assertType<_ParseTuple<'(string)'>>({
    type: 'tuple',
    components: [{ type: 'string' }],
  })
  assertType<_ParseTuple<'(string, string)'>>({
    type: 'tuple',
    components: [{ type: 'string' }, { type: 'string' }],
  })
  assertType<_ParseTuple<'((string, string), string)'>>({
    type: 'tuple',
    components: [
      { type: 'tuple', components: [{ type: 'string' }, { type: 'string' }] },
      { type: 'string' },
    ],
  })
  assertType<_ParseTuple<'((string))'>>({
    type: 'tuple',
    components: [{ type: 'tuple', components: [{ type: 'string' }] }],
  })
  assertType<_ParseTuple<'(((string)))'>>({
    type: 'tuple',
    components: [
      {
        type: 'tuple',
        components: [{ type: 'tuple', components: [{ type: 'string' }] }],
      },
    ],
  })
  assertType<_ParseTuple<'(string calldata)'>>({
    type: 'tuple',
    components: [
      {
        type: 'string',
        name: ['Error: "calldata" is a protected Solidity keyword.'],
      },
    ],
  })
  assertType<_ParseTuple<'(Foo)', OptionsWithStructs>>({
    type: 'tuple',
    components: [
      { type: 'tuple', components: [{ type: 'address', name: 'bar' }] },
    ],
  })

  // named tuple params
  assertType<_ParseTuple<'(string foo)'>>({
    type: 'tuple',
    components: [{ type: 'string', name: 'foo' }],
  })
  assertType<_ParseTuple<'(string bar) foo'>>({
    name: 'foo',
    type: 'tuple',
    components: [{ type: 'string', name: 'bar' }],
  })
  assertType<_ParseTuple<'((string bar) foo)'>>({
    type: 'tuple',
    components: [
      {
        type: 'tuple',
        name: 'foo',
        components: [{ type: 'string', name: 'bar' }],
      },
    ],
  })
  assertType<_ParseTuple<'(Foo) foo', OptionsWithStructs>>({
    type: 'tuple',
    name: 'foo',
    components: [
      { type: 'tuple', components: [{ type: 'address', name: 'bar' }] },
    ],
  })
  assertType<_ParseTuple<'((string)) calldata', OptionsWithModifier>>({
    type: 'tuple',
    components: [{ type: 'tuple', components: [{ type: 'string' }] }],
  })

  // mixed basic and named tuple params
  assertType<_ParseTuple<'(string, string foo)'>>({
    type: 'tuple',
    components: [{ type: 'string' }, { type: 'string', name: 'foo' }],
  })
  assertType<_ParseTuple<'(string, string bar) foo'>>({
    name: 'foo',
    type: 'tuple',
    components: [{ type: 'string' }, { type: 'string', name: 'bar' }],
  })
  assertType<
    _ParseTuple<'(string baz, string bar) indexed foo', OptionsWithIndexed>
  >({
    name: 'foo',
    type: 'tuple',
    components: [
      { type: 'string', name: 'baz' },
      { type: 'string', name: 'bar' },
    ],
    indexed: true,
  })

  // inline tuples of tuples
  assertType<_ParseTuple<'(string)[]'>>({
    type: 'tuple[]',
    components: [{ type: 'string' }],
  })
  assertType<_ParseTuple<'(string, string)[]'>>({
    type: 'tuple[]',
    components: [{ type: 'string' }, { type: 'string' }],
  })
  assertType<_ParseTuple<'((string))[]'>>({
    type: 'tuple[]',
    components: [{ type: 'tuple', components: [{ type: 'string' }] }],
  })
  assertType<_ParseTuple<'((string)[])[]'>>({
    type: 'tuple[]',
    components: [
      {
        type: 'tuple[]',
        components: [{ type: 'string' }],
      },
    ],
  })

  // inline tuples of tuples with name and/or modifier attached
  assertType<_ParseTuple<'(string)[] foo'>>({
    type: 'tuple[]',
    name: 'foo',
    components: [{ type: 'string' }],
  })
  assertType<_ParseTuple<'(string, string bar)[] foo'>>({
    type: 'tuple[]',
    name: 'foo',
    components: [{ type: 'string' }, { type: 'string', name: 'bar' }],
  })
  assertType<_ParseTuple<'((string baz) bar)[] foo'>>({
    type: 'tuple[]',
    name: 'foo',
    components: [
      {
        type: 'tuple',
        name: 'bar',
        components: [{ type: 'string', name: 'baz' }],
      },
    ],
  })
  assertType<
    _ParseTuple<
      '((string)[])[] indexed foo',
      OptionsWithIndexed & OptionsWithStructs
    >
  >({
    type: 'tuple[]',
    name: 'foo',
    indexed: true,
    components: [
      {
        type: 'tuple[]',
        components: [{ type: 'string' }],
      },
    ],
  })
  assertType<_ParseTuple<'((string) foo)[]'>>({
    type: 'tuple[]',
    components: [
      { type: 'tuple', name: 'foo', components: [{ type: 'string' }] },
    ],
  })
  assertType<_ParseTuple<'(string) indexed bar', OptionsWithIndexed>>({
    type: 'tuple',
    name: 'bar',
    indexed: true,
    components: [{ type: 'string' }],
  })

  assertType<_ParseTuple<'((((string))) bar)'>>({
    type: 'tuple',
    components: [
      {
        name: 'bar',
        type: 'tuple',
        components: [
          {
            type: 'tuple',
            components: [
              {
                type: 'tuple',
                components: [{ type: 'string' }],
              },
            ],
          },
        ],
      },
    ],
  })
  assertType<_ParseTuple<'(((string) baz) bar) foo'>>({
    type: 'tuple',
    name: 'foo',
    components: [
      {
        name: 'bar',
        type: 'tuple',
        components: [
          {
            name: 'baz',
            type: 'tuple',
            components: [{ type: 'string' }],
          },
        ],
      },
    ],
  })
  assertType<_ParseTuple<'((((string) baz)) bar) foo'>>({
    type: 'tuple',
    name: 'foo',
    components: [
      {
        name: 'bar',
        type: 'tuple',
        components: [
          {
            type: 'tuple',
            components: [
              {
                name: 'baz',
                type: 'tuple',
                components: [{ type: 'string' }],
              },
            ],
          },
        ],
      },
    ],
  })

  // Modifiers not converted inside tuples
  assertType<_ParseTuple<'(string indexed)[] foo', OptionsWithIndexed>>({
    type: 'tuple[]',
    name: 'foo',
    components: [
      {
        type: 'string',
        name: ['Error: "indexed" is a protected Solidity keyword.'],
      },
    ],
  })

  assertType<_ParseTuple<'((((string baz) bar)[1] foo) boo)'>>({
    type: 'tuple',
    components: [
      {
        type: 'tuple',
        components: [
          {
            type: 'tuple[1]',
            components: [
              {
                type: 'tuple',
                components: [
                  {
                    type: 'string',
                    name: 'baz',
                  },
                ],
                name: 'bar',
              },
            ],
            name: 'foo',
          },
        ],
        name: 'boo',
      },
    ],
  })
  assertType<_ParseTuple<'(((string baz) bar)[1] foo) boo'>>({
    type: 'tuple',
    components: [
      {
        type: 'tuple[1]',
        components: [
          {
            type: 'tuple',
            components: [
              {
                type: 'string',
                name: 'baz',
              },
            ],
            name: 'bar',
          },
        ],
        name: 'foo',
      },
    ],
    name: 'boo',
  })
})

test('_SplitNameOrModifier', () => {
  expectTypeOf<_SplitNameOrModifier<'foo'>>().toEqualTypeOf<{
    readonly name: 'foo'
  }>()
  expectTypeOf<
    _SplitNameOrModifier<'indexed foo', { modifier: 'indexed' }>
  >().toEqualTypeOf<{
    readonly name: 'foo'
    readonly indexed: true
  }>()
  expectTypeOf<
    _SplitNameOrModifier<'calldata foo', { modifier: 'calldata' }>
  >().toEqualTypeOf<{
    readonly name: 'foo'
  }>()
})

test('_UnwrapNameOrModifier', () => {
  expectTypeOf<_UnwrapNameOrModifier<'bar) foo'>>().toEqualTypeOf<{
    End: 'bar'
    nameOrModifier: 'foo'
  }>()
  expectTypeOf<_UnwrapNameOrModifier<'baz) bar) foo'>>().toEqualTypeOf<{
    End: 'baz) bar'
    nameOrModifier: 'foo'
  }>()
  expectTypeOf<_UnwrapNameOrModifier<'string) calldata foo'>>().toEqualTypeOf<{
    End: 'string'
    nameOrModifier: 'calldata foo'
  }>()
})
