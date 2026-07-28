import type { Engine } from 'ox'
import { expectTypeOf, test } from 'vp/test'
import * as NodeX25519 from '../X25519.js'

type Created = Awaited<ReturnType<typeof NodeX25519.create>>

test('every implemented primitive is present', () => {
  expectTypeOf<Created['X25519']['getPublicKey']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Created['X25519']['getSharedSecret']>().toEqualTypeOf<
    (privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Created['X25519']>().not.toHaveProperty('randomSecretKey')
})

test('the result is still an engine', () => {
  expectTypeOf<Created>().toExtend<Engine.Engine>()
})
