import { Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()
  expectTypeOf(Rlp.toBytes(Bytes.fromArray([]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
})
