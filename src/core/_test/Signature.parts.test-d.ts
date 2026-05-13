import type { Signature } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('Parts<true> matches Signature<true> structurally', () => {
  expectTypeOf<Signature.Parts<true>>().toEqualTypeOf<
    Signature.Signature<true>
  >()
})

test('Parts<false> matches Signature<false> structurally', () => {
  expectTypeOf<Signature.Parts<false>>().toEqualTypeOf<
    Signature.Signature<false>
  >()
})

test('Parts default matches Signature default', () => {
  expectTypeOf<Signature.Parts>().toEqualTypeOf<Signature.Signature>()
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
