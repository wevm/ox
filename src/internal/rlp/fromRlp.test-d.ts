import { type Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.decode('0x')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()
  expectTypeOf(Rlp.toHex('0x')).toEqualTypeOf<Rlp.RecursiveArray<Hex.Hex>>()

  expectTypeOf(Rlp.decode(Uint8Array.from([]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.decode(Uint8Array.from([1, 2, 3]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
  expectTypeOf(Rlp.toBytes(Uint8Array.from([]))).toEqualTypeOf<
    Rlp.RecursiveArray<Bytes.Bytes>
  >()
})
