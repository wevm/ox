import type { Hex, Signature } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('Signature is a serialized Hex.Hex string', () => {
  expectTypeOf<Signature.Signature>().toEqualTypeOf<Hex.Hex>()
  expectTypeOf<Signature.Signature<true>>().toEqualTypeOf<Hex.Hex>()
  expectTypeOf<Signature.Signature<false>>().toEqualTypeOf<Hex.Hex>()
})

test('Parts<true> is the structured object form', () => {
  expectTypeOf<Signature.Parts<true>>().toEqualTypeOf<{
    r: bigint
    s: bigint
    yParity: number
  }>()
})

test('Parts<false> makes yParity optional', () => {
  expectTypeOf<Signature.Parts<false>>().toEqualTypeOf<{
    r: bigint
    s: bigint
    yParity?: number | undefined
  }>()
})

test('toParts return is Parts', () => {
  type Result = ReturnType<typeof Signature.toParts<true>>
  expectTypeOf<Result>().toEqualTypeOf<Signature.Parts<true>>()
})

test('fromParts accepts Parts and returns Signature', () => {
  type Param = Parameters<typeof Signature.fromParts<true>>[0]
  type Result = ReturnType<typeof Signature.fromParts<true>>
  expectTypeOf<Param>().toEqualTypeOf<Signature.Parts<true>>()
  expectTypeOf<Result>().toEqualTypeOf<Signature.Signature<true>>()
})
