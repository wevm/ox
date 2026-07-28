import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as NodeEd25519 from '../Ed25519.js'

type Created = Awaited<ReturnType<typeof NodeEd25519.create>>

test('every implemented primitive is present', () => {
  expectTypeOf<Created['Ed25519']['getPublicKey']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Ed25519']['sign']>().toEqualTypeOf<
    (payload: Uint8Array, privateKey: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['Ed25519']['toMontgomerySecret']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Created['Ed25519']>().not.toHaveProperty('randomSecretKey')
  expectTypeOf<Created['Ed25519']>().not.toHaveProperty('toMontgomery')
  expectTypeOf<Created['Ed25519']>().not.toHaveProperty('verify')
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
