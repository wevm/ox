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
