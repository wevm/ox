import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as X25519 from '../X25519.js'

type Created = Awaited<ReturnType<typeof X25519.create>>

test('return type exposes only implemented X25519 primitives', () => {
  expectTypeOf<Created['X25519']['getPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.Ecdh['getPublicKey']>
  >()
  expectTypeOf<Created['X25519']['getSharedSecret']>().toEqualTypeOf<
    NonNullable<Engine.Ecdh['getSharedSecret']>
  >()
  expectTypeOf<Created['X25519']>().not.toHaveProperty('randomSecretKey')
})
