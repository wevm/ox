import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_X25519 from '../../core/X25519.js'
import * as NodeX25519 from '../X25519.js'

type Slot = Awaited<ReturnType<typeof NodeX25519.engine>>

test('every implemented primitive is present', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    (privateKey: Uint8Array) => Uint8Array
  >()
  expectTypeOf<Slot['getSharedSecret']>().toEqualTypeOf<
    (privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array
  >()
})

test('unsupported primitives are absent', () => {
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
})

test('the result is the raw slot', () => {
  expectTypeOf<{ X25519: Slot }>().toExtend<Engine.Engine>()
})

test('the Node namespace exposes the public X25519 API', () => {
  expectTypeOf(NodeX25519.getPublicKey).toEqualTypeOf(core_X25519.getPublicKey)
  expectTypeOf<typeof NodeX25519>().not.toHaveProperty('create')
})
