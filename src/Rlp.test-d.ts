import { Bytes, type Hex, Rlp } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'
import type { RecursiveArray } from './internal/types.js'

describe('Rlp.to', () => {
  test('default', () => {
    expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<RecursiveArray<Hex.Hex>>()
    expectTypeOf(Rlp.toBytes(Bytes.fromArray([]))).toEqualTypeOf<
      RecursiveArray<Bytes.Bytes>
    >()
  })
})

describe('Rlp.from', () => {
  test('default', () => {
    expectTypeOf(Rlp.fromHex('0x')).toEqualTypeOf<Hex.Hex>()
    expectTypeOf(
      Rlp.fromBytes(Bytes.fromArray([])),
    ).toEqualTypeOf<Bytes.Bytes>()
  })
})
