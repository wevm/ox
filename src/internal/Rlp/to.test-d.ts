import { Bytes, type Hex, Rlp, type Types } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<Types.RecursiveArray<Hex.Hex>>()
  expectTypeOf(Rlp.toBytes(Bytes.fromArray([]))).toEqualTypeOf<
    Types.RecursiveArray<Bytes.Bytes>
  >()
})
