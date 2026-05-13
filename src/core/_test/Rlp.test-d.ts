import { Bytes, type Hex, Rlp } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'
import type { RecursiveArray } from '../internal/types.js'

describe('Rlp.decode', () => {
  test('default', () => {
    expectTypeOf(Rlp.decode('0x', { as: 'Hex' })).toEqualTypeOf<
      RecursiveArray<Hex.Hex>
    >()
    expectTypeOf(
      Rlp.decode(Bytes.fromArray([]), { as: 'Bytes' }),
    ).toEqualTypeOf<RecursiveArray<Bytes.Bytes>>()
  })
})

describe('Rlp.encode', () => {
  test('default', () => {
    expectTypeOf(Rlp.encode('0x', { as: 'Hex' })).toEqualTypeOf<Hex.Hex>()
    expectTypeOf(
      Rlp.encode(Bytes.fromArray([]), { as: 'Bytes' }),
    ).toEqualTypeOf<Bytes.Bytes>()
  })
})
