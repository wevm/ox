import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as Ed25519 from '../Ed25519.js'

type Created = Awaited<ReturnType<typeof Ed25519.create>>

test('return type exposes only implemented Ed25519 primitives', () => {
  expectTypeOf<Created['Ed25519']['getPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['getPublicKey']>
  >()
  expectTypeOf<Created['Ed25519']['sign']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['sign']>
  >()
  expectTypeOf<Created['Ed25519']['toMontgomerySecret']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['toMontgomerySecret']>
  >()
  expectTypeOf<Created['Ed25519']['verify']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['verify']>
  >()
  expectTypeOf<Created['Ed25519']>().not.toHaveProperty('randomSecretKey')
  expectTypeOf<Created['Ed25519']>().not.toHaveProperty('toMontgomery')
})
