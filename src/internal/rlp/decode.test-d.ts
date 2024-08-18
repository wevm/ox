import { Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.decode('0x')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()

  expectTypeOf(Rlp.decode(Bytes.from([]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.decode(Bytes.from([1, 2, 3]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.toBytes(Bytes.from([]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
})
