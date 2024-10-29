import { Bytes, type Hex, Rlp } from 'ox'
import { expectTypeOf, test } from 'vitest'

test('default', () => {
  expectTypeOf(Rlp.fromHex('0x')).toEqualTypeOf<Hex>()
  expectTypeOf(Rlp.fromBytes(Bytes.fromArray([]))).toEqualTypeOf<Bytes.Bytes>()
})
