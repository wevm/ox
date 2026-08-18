import { type Bytes, type Hex, P256 } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('fromSeed', () => {
  const seed =
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

  expectTypeOf(P256.fromSeed(seed)).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(P256.fromSeed(new Uint8Array(32))).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(P256.fromSeed(seed, { as: 'Hex' })).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    P256.fromSeed(seed, { as: 'Bytes' }),
  ).toEqualTypeOf<Bytes.Bytes>()
})
