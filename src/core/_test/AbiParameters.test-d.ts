import { type AbiParameter, AbiParameters } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('formatAbiParameter', () => {
  expectTypeOf(
    AbiParameters.format([
      {
        type: 'tuple',
        components: [{ type: 'string' }],
      },
    ]),
  ).toEqualTypeOf<'(string)'>()

  const param = { type: 'address' }
  const param2: AbiParameter.AbiParameter = param

  expectTypeOf(AbiParameters.format([param])).toEqualTypeOf<string>()

  expectTypeOf(
    AbiParameters.format([param, param]),
  ).toEqualTypeOf<`${string}, ${string}`>()

  expectTypeOf(
    AbiParameters.format([param2, param2]),
  ).toEqualTypeOf<`${string}, ${string}`>()
})

test('AbiParameters.format.ReturnType', () => {
  // @ts-expect-error must have at least one parameter
  expectTypeOf<AbiParameters.format.ReturnType<[]>>().toEqualTypeOf<never>()

  // string
  expectTypeOf<
    AbiParameters.format.ReturnType<
      [
        {
          readonly type: 'address'
          readonly name: 'from'
        },
      ]
    >
  >().toEqualTypeOf<'address from'>()
  expectTypeOf<
    AbiParameters.format.ReturnType<
      [
        {
          readonly type: 'address'
          readonly name: 'from'
          readonly indexed: true
        },
      ]
    >
  >().toEqualTypeOf<'address indexed from'>()

  // Array
  expectTypeOf<
    AbiParameters.format.ReturnType<
      [
        {
          readonly type: 'tuple'
          readonly components: readonly [
            {
              readonly name: 'name'
              readonly type: 'string'
            },
          ]
        },
      ]
    >
  >().toEqualTypeOf<'(string name)'>()

  expectTypeOf<
    AbiParameters.format.ReturnType<
      [
        {
          readonly type: 'tuple'
          readonly components: readonly [
            {
              readonly type: 'string'
              readonly name: 'bar'
            },
          ]
          readonly name: 'foo'
        },
      ]
    >
  >().toEqualTypeOf<'(string bar) foo'>()
})
