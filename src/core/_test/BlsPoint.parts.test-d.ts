import type { BlsPoint } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('G1Parts matches G1 structurally', () => {
  expectTypeOf<BlsPoint.G1Parts>().toEqualTypeOf<BlsPoint.G1>()
})

test('G2Parts matches G2 structurally', () => {
  expectTypeOf<BlsPoint.G2Parts>().toEqualTypeOf<BlsPoint.G2>()
})

test('toParts narrows G1 to G1Parts', () => {
  type Result = ReturnType<typeof BlsPoint.toParts<BlsPoint.G1>>
  expectTypeOf<Result>().toEqualTypeOf<BlsPoint.G1Parts>()
})

test('toParts narrows G2 to G2Parts', () => {
  type Result = ReturnType<typeof BlsPoint.toParts<BlsPoint.G2>>
  expectTypeOf<Result>().toEqualTypeOf<BlsPoint.G2Parts>()
})

test("fromParts(parts, 'G1') returns G1", () => {
  type Result = ReturnType<typeof BlsPoint.fromParts<'G1'>>
  expectTypeOf<Result>().toEqualTypeOf<BlsPoint.G1>()
})

test("fromParts(parts, 'G2') returns G2", () => {
  type Result = ReturnType<typeof BlsPoint.fromParts<'G2'>>
  expectTypeOf<Result>().toEqualTypeOf<BlsPoint.G2>()
})
