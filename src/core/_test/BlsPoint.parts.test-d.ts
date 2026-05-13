import type { BlsPoint } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('G1 is a branded G1Hex string', () => {
  expectTypeOf<BlsPoint.G1>().toEqualTypeOf<BlsPoint.G1Hex>()
})

test('G2 is a branded G2Hex string', () => {
  expectTypeOf<BlsPoint.G2>().toEqualTypeOf<BlsPoint.G2Hex>()
})

test('G1Parts is the structured projective form on Fp', () => {
  expectTypeOf<BlsPoint.G1Parts>().toEqualTypeOf<BlsPoint.BlsPoint<bigint>>()
})

test('G2Parts is the structured projective form on Fp2', () => {
  expectTypeOf<BlsPoint.G2Parts>().toEqualTypeOf<
    BlsPoint.BlsPoint<BlsPoint.Fp2>
  >()
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
