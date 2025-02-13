import { AbiParameter } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('AbiParameter.from', () => {
  // @ts-expect-error empty array not allowed
  expectTypeOf(AbiParameter.from([])).toEqualTypeOf<never>()
  expectTypeOf(
    AbiParameter.from(['struct Foo { string name; }']),
  ).toEqualTypeOf<never>()

  expectTypeOf(AbiParameter.from('(string)')).toEqualTypeOf<{
    readonly type: 'tuple'
    readonly components: readonly [{ readonly type: 'string' }]
  }>()

  const param: string = 'address'
  expectTypeOf(
    AbiParameter.from(param),
  ).toEqualTypeOf<AbiParameter.AbiParameter>()
})

test('AbiParameter.from.ReturnType', () => {
  expectTypeOf<AbiParameter.from.ReturnType<''>>().toEqualTypeOf<never>()
  expectTypeOf<AbiParameter.from.ReturnType<[]>>().toEqualTypeOf<never>()
  expectTypeOf<
    AbiParameter.from.ReturnType<['struct Foo { string name; }']>
  >().toEqualTypeOf<never>()

  // string
  expectTypeOf<AbiParameter.from.ReturnType<'address from'>>().toEqualTypeOf<{
    readonly type: 'address'
    readonly name: 'from'
  }>()
  expectTypeOf<
    AbiParameter.from.ReturnType<'address indexed from'>
  >().toEqualTypeOf<{
    readonly type: 'address'
    readonly name: 'from'
    readonly indexed: true
  }>()
  expectTypeOf<
    AbiParameter.from.ReturnType<'address calldata foo'>
  >().toEqualTypeOf<{
    readonly type: 'address'
    readonly name: 'foo'
  }>()

  // Array
  type Result = AbiParameter.from.ReturnType<
    ['Foo', 'struct Foo { string name; }']
  >
  expectTypeOf<Result>().toEqualTypeOf<{
    readonly type: 'tuple'
    readonly components: readonly [
      {
        readonly name: 'name'
        readonly type: 'string'
      },
    ]
  }>()

  expectTypeOf<
    AbiParameter.from.ReturnType<'(string bar) foo'>
  >().toEqualTypeOf<{
    readonly type: 'tuple'
    readonly components: readonly [
      {
        readonly type: 'string'
        readonly name: 'bar'
      },
    ]
    readonly name: 'foo'
  }>()
})

test('AbiParameter.format', () => {
  expectTypeOf(
    AbiParameter.format({
      type: 'tuple',
      components: [{ type: 'string' }],
    }),
  ).toEqualTypeOf<'(string)'>()

  const param = { type: 'address' }
  const param2: AbiParameter.AbiParameter = param
  expectTypeOf(AbiParameter.format(param)).toEqualTypeOf<string>()
  expectTypeOf(AbiParameter.format(param2)).toEqualTypeOf<string>()
})

test('AbiParameter.format.ReturnType', () => {
  // string
  expectTypeOf<
    AbiParameter.format.ReturnType<{
      readonly type: 'address'
      readonly name: 'from'
    }>
  >().toEqualTypeOf<'address from'>()
  expectTypeOf<
    AbiParameter.format.ReturnType<{
      readonly type: 'address'
      readonly name: 'from'
      readonly indexed: true
    }>
  >().toEqualTypeOf<'address indexed from'>()
  expectTypeOf<
    AbiParameter.format.ReturnType<{
      readonly type: 'address'
      readonly name: ''
    }>
  >().toEqualTypeOf<'address'>()

  expectTypeOf<
    AbiParameter.format.ReturnType<{
      type: 'address'
      name: 'address'
    }>
  >().toEqualTypeOf<'address [Error: "address" is a protected Solidity keyword.]'>()

  expectTypeOf<
    AbiParameter.format.ReturnType<{
      type: 'address'
      name: '123'
    }>
  >().toEqualTypeOf<'address [Error: Identifier "123" cannot be a number string.]'>()

  // Array
  expectTypeOf<
    AbiParameter.format.ReturnType<{
      readonly type: 'tuple'
      readonly components: readonly [
        {
          readonly name: 'name'
          readonly type: 'string'
        },
      ]
    }>
  >().toEqualTypeOf<'(string name)'>()

  expectTypeOf<
    AbiParameter.format.ReturnType<{
      readonly type: 'tuple'
      readonly components: readonly [
        {
          readonly type: 'string'
          readonly name: 'bar'
        },
      ]
      readonly name: 'foo'
    }>
  >().toEqualTypeOf<'(string bar) foo'>()

  type Result = AbiParameter.format.ReturnType<{
    readonly components: [
      {
        readonly components: [
          {
            readonly type: 'string'
            readonly name: 'foo'
          },
        ]
        readonly type: 'tuple'
      },
    ]
    readonly type: 'tuple'
  }>
  expectTypeOf<Result>().toEqualTypeOf<'((string foo))'>()

  type Result2 = AbiParameter.format.ReturnType<{
    readonly components: [
      {
        readonly components: [
          {
            readonly components: [
              {
                readonly components: [
                  {
                    readonly type: 'string'
                  },
                ]
                readonly type: 'tuple'
              },
            ]
            readonly type: 'tuple'
          },
        ]
        readonly type: 'tuple'
      },
    ]
    readonly type: 'tuple'
  }>
  expectTypeOf<Result2>().toEqualTypeOf<'((((string))))'>()
})
