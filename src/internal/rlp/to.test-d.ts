import { Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.to('0x', 'Hex')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()

  expectTypeOf(Rlp.to(Bytes.from([]), 'Bytes')).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.to(Bytes.from([1, 2, 3]), 'Bytes')).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.toBytes(Bytes.from([]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
})
