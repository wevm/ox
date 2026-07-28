import { type Bytes, Hash, type Hex } from 'ox'
import { describe, expectTypeOf, test } from 'vp/test'

describe('blake3', () => {
  test('default', () => {
    expectTypeOf(Hash.blake3('0x')).toEqualTypeOf<Hex.Hex>()
    expectTypeOf(Hash.blake3(new Uint8Array())).toEqualTypeOf<Bytes.Bytes>()
  })

  test('as', () => {
    expectTypeOf(
      Hash.blake3('0x', { as: 'Bytes' }),
    ).toEqualTypeOf<Bytes.Bytes>()
    expectTypeOf(
      Hash.blake3(new Uint8Array(), { as: 'Hex' }),
    ).toEqualTypeOf<Hex.Hex>()
  })
})
