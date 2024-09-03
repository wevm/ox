import { Bytes, type Hex, Rlp, type Types } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.to('0x', 'Hex')).toEqualTypeOf<
    Types.RecursiveArray<Hex.Hex>
  >()
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<Types.RecursiveArray<Hex.Hex>>()

  expectTypeOf(Rlp.to(Bytes.from([]), 'Bytes')).toEqualTypeOf<
    Types.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.to(Bytes.from([1, 2, 3]), 'Bytes')).toEqualTypeOf<
    Types.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.toBytes(Bytes.from([]))).toEqualTypeOf<
    Types.RecursiveArray<Bytes.Bytes>
  >()
})
