import { type Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.from('0x')).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(Rlp.fromHex('0x')).toEqualTypeOf<Hex.Hex>()

  expectTypeOf(Rlp.from(Uint8Array.from([]))).toEqualTypeOf<Bytes.Bytes>()
  expectTypeOf(
    Rlp.from(Uint8Array.from([1, 2, 3])),
  ).toEqualTypeOf<Bytes.Bytes>()
  expectTypeOf(Rlp.fromBytes(Uint8Array.from([]))).toEqualTypeOf<Bytes.Bytes>()
})
