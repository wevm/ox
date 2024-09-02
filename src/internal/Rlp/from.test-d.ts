import { Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.from('0x', 'Hex')).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(Rlp.fromHex('0x')).toEqualTypeOf<Hex.Hex>()

  expectTypeOf(Rlp.from(Bytes.from([]), 'Bytes')).toEqualTypeOf<Bytes.Bytes>()
  expectTypeOf(
    Rlp.from(Bytes.from([1, 2, 3]), 'Bytes'),
  ).toEqualTypeOf<Bytes.Bytes>()
  expectTypeOf(Rlp.fromBytes(Bytes.from([]))).toEqualTypeOf<Bytes.Bytes>()
})
