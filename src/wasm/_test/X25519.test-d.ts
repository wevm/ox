import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_X25519 from '../../core/X25519.js'
import * as X25519 from '../X25519.js'

type Slot = Awaited<ReturnType<typeof X25519.engine>>

test('return type exposes only implemented X25519 primitives', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.Ecdh['getPublicKey']>
  >()
  expectTypeOf<Slot['getSharedSecret']>().toEqualTypeOf<
    NonNullable<Engine.Ecdh['getSharedSecret']>
  >()
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
})

test('the WASM namespace exposes the public X25519 API', () => {
  expectTypeOf(X25519.getPublicKey).toEqualTypeOf(core_X25519.getPublicKey)
  expectTypeOf<typeof X25519>().not.toHaveProperty('create')
})
