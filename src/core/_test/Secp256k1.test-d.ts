import { type Bytes, type Hex, Secp256k1 } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('fromPrf', () => {
  const prf =
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

  expectTypeOf(Secp256k1.fromPrf(prf)).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(Secp256k1.fromPrf(new Uint8Array(32))).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(Secp256k1.fromPrf(prf, { as: 'Hex' })).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    Secp256k1.fromPrf(prf, { as: 'Bytes' }),
  ).toEqualTypeOf<Bytes.Bytes>()
})

test('fromSeed', () => {
  const seed =
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

  expectTypeOf(Secp256k1.fromSeed(seed)).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(Secp256k1.fromSeed(new Uint8Array(32))).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(Secp256k1.fromSeed(seed, { as: 'Hex' })).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    Secp256k1.fromSeed(seed, { as: 'Bytes' }),
  ).toEqualTypeOf<Bytes.Bytes>()
})
