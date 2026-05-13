import type { Signature } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('SignatureParts<true> matches Signature<true> structurally', () => {
  expectTypeOf<Signature.SignatureParts<true>>().toEqualTypeOf<
    Signature.Signature<true>
  >()
})

test('SignatureParts<false> matches Signature<false> structurally', () => {
  expectTypeOf<Signature.SignatureParts<false>>().toEqualTypeOf<
    Signature.Signature<false>
  >()
})

test('SignatureParts default matches Signature default', () => {
  expectTypeOf<Signature.SignatureParts>().toEqualTypeOf<Signature.Signature>()
})

test('toParts return is SignatureParts', () => {
  type Result = ReturnType<typeof Signature.toParts<true>>
  expectTypeOf<Result>().toEqualTypeOf<Signature.SignatureParts<true>>()
})

test('fromParts accepts SignatureParts and returns Signature', () => {
  type Param = Parameters<typeof Signature.fromParts<true>>[0]
  type Result = ReturnType<typeof Signature.fromParts<true>>
  expectTypeOf<Param>().toEqualTypeOf<Signature.SignatureParts<true>>()
  expectTypeOf<Result>().toEqualTypeOf<Signature.Signature<true>>()
})
