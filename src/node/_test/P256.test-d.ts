import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as NodeP256 from '../P256.js'

type Created = Awaited<ReturnType<typeof NodeP256.create>>

test('public-key derivation is present', () => {
  expectTypeOf<Created['P256']['getPublicKey']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Created['P256']>().not.toHaveProperty('getSharedSecret')
  expectTypeOf<Created['P256']>().not.toHaveProperty('randomSecretKey')
  expectTypeOf<Created['P256']>().not.toHaveProperty('recoverPublicKey')
  expectTypeOf<Created['P256']>().not.toHaveProperty('sign')
  expectTypeOf<Created['P256']>().not.toHaveProperty('verify')
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
