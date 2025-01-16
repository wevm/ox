import { assertType, expectTypeOf, test } from 'vitest'

import type {
  ParseAbiParameter,
  SplitParameters,
  _ValidateAbiParameter,
} from '../../internal/abiParameter.js'

type OptionsWithModifier = { modifier: 'calldata'; structs: unknown }
type OptionsWithIndexed = { modifier: 'indexed'; structs: unknown }
type OptionsWithStructs = {
  structs: {
    Foo: [{ type: 'address'; name: 'bar' }]
  }
}

test('ParseAbiParameter', () => {
  // `${Type} ${Modifier} ${Name}` format
  assertType<ParseAbiParameter<'string calldata foo', OptionsWithModifier>>({
    type: 'string',
    name: 'foo',
  })
  assertType<ParseAbiParameter<'string indexed foo', OptionsWithIndexed>>({
    type: 'string',
    indexed: true,
    name: 'foo',
  })
  assertType<
    ParseAbiParameter<
      'Foo calldata foo',
      OptionsWithModifier & OptionsWithStructs
    >
  >({
    type: 'tuple',
    name: 'foo',
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<
    ParseAbiParameter<
      'Foo indexed foo',
      OptionsWithIndexed & OptionsWithStructs
    >
  >({
    type: 'tuple',
    indexed: true,
    name: 'foo',
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<
    ParseAbiParameter<
      'Foo[][1] indexed foo',
      OptionsWithIndexed & OptionsWithStructs
    >
  >({
    name: 'foo',
    type: 'tuple[][1]',
    indexed: true,
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<
    ParseAbiParameter<
      'Foo[][1] calldata foo',
      OptionsWithModifier & OptionsWithStructs
    >
  >({
    name: 'foo',
    type: 'tuple[][1]',
    components: [{ type: 'address', name: 'bar' }],
  })

  // `${Type} ${NameOrModifier}` format
  assertType<ParseAbiParameter<'string foo'>>({
    type: 'string',
    name: 'foo',
  })
  assertType<ParseAbiParameter<'string indexed'>>({
    type: 'string',
    name: ['Error: "indexed" is a protected Solidity keyword.'],
  })
  assertType<ParseAbiParameter<'string calldata', OptionsWithModifier>>({
    type: 'string',
  })
  assertType<ParseAbiParameter<'string indexed', OptionsWithIndexed>>({
    type: 'string',
    indexed: true,
  })
  assertType<
    ParseAbiParameter<'Foo calldata', OptionsWithModifier & OptionsWithStructs>
  >({
    type: 'tuple',
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<
    ParseAbiParameter<'Foo indexed', OptionsWithIndexed & OptionsWithStructs>
  >({
    type: 'tuple',
    indexed: true,
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<ParseAbiParameter<'Foo[][1] foo', OptionsWithStructs>>({
    name: 'foo',
    type: 'tuple[][1]',
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<ParseAbiParameter<'(address bar)[1] foo', OptionsWithStructs>>({
    name: 'foo',
    type: 'tuple[1]',
    components: [{ type: 'address', name: 'bar' }],
  })

  // `${Type}` format
  assertType<ParseAbiParameter<'string'>>({
    type: 'string',
  })
  assertType<ParseAbiParameter<'Foo', OptionsWithStructs>>({
    type: 'tuple',
    components: [{ type: 'address', name: 'bar' }],
  })
  assertType<ParseAbiParameter<'Foo[][1]', OptionsWithStructs>>({
    type: 'tuple[][1]',
    components: [{ type: 'address', name: 'bar' }],
  })

  // tuple format
  assertType<ParseAbiParameter<'(string)'>>({
    type: 'tuple',
    components: [{ type: 'string' }],
  })
  assertType<ParseAbiParameter<'(string, string)'>>({
    type: 'tuple',
    components: [{ type: 'string' }, { type: 'string' }],
  })
  assertType<ParseAbiParameter<'(string, (string))'>>({
    type: 'tuple',
    components: [
      { type: 'string' },
      { type: 'tuple', components: [{ type: 'string' }] },
    ],
  })

  assertType<ParseAbiParameter<'((((string baz) bar)[1] foo) boo)'>>({
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

  assertType<ParseAbiParameter<'address alias'>>({
    type: 'address',
    name: ['Error: "alias" is a protected Solidity keyword.'],
  })
  // assertType<ParseAbiParameter<'Foo foo'>>({
  //   type: ['Error: Type "Foo" is not a valid ABI type.'],
  //   name: 'foo',
  // })

  assertType<ParseAbiParameter<'int'>>({ type: 'int256' })
  assertType<ParseAbiParameter<'uint'>>({ type: 'uint256' })
  assertType<ParseAbiParameter<'uint[]'>>({ type: 'uint256[]' })
  assertType<ParseAbiParameter<'uint[10][]'>>({ type: 'uint256[10][]' })
})

test('SplitParameters', () => {
  expectTypeOf<SplitParameters<''>>().toEqualTypeOf<[]>()
  expectTypeOf<SplitParameters<'string'>>().toEqualTypeOf<['string']>()
  expectTypeOf<SplitParameters<'string, string'>>().toEqualTypeOf<
    ['string', 'string']
  >()
  expectTypeOf<SplitParameters<'string indexed foo'>>().toEqualTypeOf<
    ['string indexed foo']
  >()
  expectTypeOf<SplitParameters<'string foo, string bar'>>().toEqualTypeOf<
    ['string foo', 'string bar']
  >()
  expectTypeOf<
    SplitParameters<'address owner, (bool loading, (string[][] names) cats)[] dog, uint tokenId'>
  >().toEqualTypeOf<
    [
      'address owner',
      '(bool loading, (string[][] names) cats)[] dog',
      'uint tokenId',
    ]
  >()

  expectTypeOf<SplitParameters<'((string)'>>().toEqualTypeOf<
    [
      'Error: Unbalanced parentheses. "((string)" has too many opening parentheses.',
    ]
  >()
  expectTypeOf<SplitParameters<'((((string))'>>().toEqualTypeOf<
    [
      'Error: Unbalanced parentheses. "((((string))" has too many opening parentheses.',
    ]
  >()
  expectTypeOf<SplitParameters<'(string))'>>().toEqualTypeOf<
    [
      'Error: Unbalanced parentheses. "(string)" has too many closing parentheses.',
    ]
  >()
  expectTypeOf<SplitParameters<'(string))))'>>().toEqualTypeOf<
    [
      'Error: Unbalanced parentheses. "(string)" has too many closing parentheses.',
    ]
  >()
})

test('_ValidateAbiParameter', () => {
  expectTypeOf<_ValidateAbiParameter<{ type: 'string' }>>().toEqualTypeOf<{
    type: 'string'
  }>()
  expectTypeOf<
    _ValidateAbiParameter<{ type: 'string'; name: 'foo' }>
  >().toEqualTypeOf<{
    type: 'string'
    name: 'foo'
  }>()

  expectTypeOf<_ValidateAbiParameter<{ type: 'int' }>>().toEqualTypeOf<{
    readonly type: 'int256'
  }>()
  expectTypeOf<_ValidateAbiParameter<{ type: 'uint' }>>().toEqualTypeOf<{
    readonly type: 'uint256'
  }>()
  expectTypeOf<_ValidateAbiParameter<{ type: 'uint[]' }>>().toEqualTypeOf<{
    readonly type: 'uint256[]'
  }>()
  expectTypeOf<_ValidateAbiParameter<{ type: 'uint[10][]' }>>().toEqualTypeOf<{
    readonly type: 'uint256[10][]'
  }>()

  // expectTypeOf<
  //   _ValidateAbiParameter<{ type: 'string'; name: 'f0!' }>
  // >().toEqualTypeOf<{
  //   type: 'string'
  //   readonly name: ['Error: "f0!" contains invalid character.']
  // }>()
  // expectTypeOf<
  //   _ValidateAbiParameter<{ type: 'string'; name: 'alias' }>
  // >().toEqualTypeOf<{
  //   type: 'string'
  //   readonly name: ['Error: "alias" is a protected Solidity keyword.']
  // }>()
  // expectTypeOf<
  //   _ValidateAbiParameter<{ type: 'Bar'; name: 'foo' }>
  // >().toEqualTypeOf<{
  //   readonly type: ['Error: Type "Bar" is not a valid ABI type.']
  //   name: 'foo'
  // }>()
})
