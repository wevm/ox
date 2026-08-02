import { Bytes, Hex, MlDsa44 } from 'ox'
import { expectTypeOf, test } from 'vp/test'

test('createKeyPair', () => {
  expectTypeOf(MlDsa44.createKeyPair()).toEqualTypeOf<{
    privateKey: Hex.Hex
    publicKey: Hex.Hex
  }>()
  expectTypeOf(MlDsa44.createKeyPair({ as: 'Bytes' })).toEqualTypeOf<{
    privateKey: Bytes.Bytes
    publicKey: Bytes.Bytes
  }>()
})

test('fromPrf', () => {
  const prf =
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

  expectTypeOf(MlDsa44.fromPrf(prf)).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(MlDsa44.fromPrf(new Uint8Array(32))).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(MlDsa44.fromPrf(prf, { as: 'Hex' })).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(MlDsa44.fromPrf(prf, { as: 'Bytes' })).toEqualTypeOf<
    Bytes.Bytes & Disposable
  >()
})

test('getPublicKey', () => {
  expectTypeOf(
    MlDsa44.getPublicKey({ privateKey: '0x' }),
  ).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    MlDsa44.getPublicKey({ privateKey: '0x', as: 'Bytes' }),
  ).toEqualTypeOf<Bytes.Bytes>()
})

test('randomPrivateKey', () => {
  expectTypeOf(MlDsa44.randomPrivateKey()).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    MlDsa44.randomPrivateKey({ as: 'Bytes' }),
  ).toEqualTypeOf<Bytes.Bytes>()
})

test('sign', () => {
  expectTypeOf(
    MlDsa44.sign({ payload: '0x', privateKey: '0x' }),
  ).toEqualTypeOf<Hex.Hex>()
  expectTypeOf(
    MlDsa44.sign({ payload: '0x', privateKey: '0x', as: 'Bytes' }),
  ).toEqualTypeOf<Bytes.Bytes>()
})

test('verify', () => {
  expectTypeOf(
    MlDsa44.verify({ payload: '0x', publicKey: '0x', signature: '0x' }),
  ).toEqualTypeOf<boolean>()
})
