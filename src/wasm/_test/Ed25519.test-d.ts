import { expectTypeOf, test } from 'vp/test'
import type * as Engine from '../../core/Engine.js'
import * as core_Ed25519 from '../../core/Ed25519.js'
import * as Ed25519 from '../Ed25519.js'

type Slot = Awaited<ReturnType<typeof Ed25519.engine>>

test('return type exposes only implemented Ed25519 primitives', () => {
  expectTypeOf<Slot['getPublicKey']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['getPublicKey']>
  >()
  expectTypeOf<Slot['sign']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['sign']>
  >()
  expectTypeOf<Slot['toMontgomerySecret']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['toMontgomerySecret']>
  >()
  expectTypeOf<Slot['verify']>().toEqualTypeOf<
    NonNullable<Engine.Eddsa['verify']>
  >()
  expectTypeOf<Slot>().not.toHaveProperty('randomSecretKey')
  expectTypeOf<Slot>().not.toHaveProperty('toMontgomery')
})

test('the WASM namespace exposes the public Ed25519 API', () => {
  expectTypeOf(Ed25519.getPublicKey).toEqualTypeOf(core_Ed25519.getPublicKey)
  expectTypeOf<typeof Ed25519>().not.toHaveProperty('create')
})
